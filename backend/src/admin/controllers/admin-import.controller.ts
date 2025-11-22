import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminImportService } from '../services/admin-import.service';
import { AssignCourseDto, SetImportModeDto } from '../dto/import.dto';

@Controller('admin/import/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminImportController {
  constructor(private readonly importService: AdminImportService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('course_id') courseId: string,
    @Body('import_mode') importMode: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.importService.uploadFile(file, user.sub, courseId, importMode);
  }

  @Get('batches')
  async findAllBatches(@Query('status') status?: string, @Query('course_id') courseId?: string) {
    return this.importService.findAllBatches({ status, course_id: courseId });
  }

  @Get('batches/:batch_id/preview')
  async getBatchPreview(@Param('batch_id') batchId: string) {
    return this.importService.getBatchPreview(batchId);
  }

  @Post('batches/:batch_id/assign-course')
  async assignCourse(
    @Param('batch_id') batchId: string,
    @Body() dto: AssignCourseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.importService.assignCourse(batchId, dto.course_id, user.sub);
  }

  @Post('batches/:batch_id/set-mode')
  async setMode(
    @Param('batch_id') batchId: string,
    @Body() dto: SetImportModeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.importService.setImportMode(batchId, dto.import_mode, user.sub);
  }

  @Post('batches/:batch_id/commit')
  async commit(@Param('batch_id') batchId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.importService.commitBatch(batchId, user.sub);
  }
}

