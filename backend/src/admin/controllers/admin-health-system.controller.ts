import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminHealthSystemService } from '../services/admin-health-system.service';

@Controller('admin/health-system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminHealthSystemController {
  constructor(private readonly healthSystemService: AdminHealthSystemService) {}

  @Post('students/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadStudents(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.healthSystemService.uploadStudents(file, user.sub);
  }

  @Get('students')
  async findAllStudents(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.healthSystemService.findAllStudents(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      search,
    );
  }
}

