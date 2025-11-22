import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminStudentsService } from '../services/admin-students.service';

@Controller('admin/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAllStudentsController {
  constructor(private readonly studentsService: AdminStudentsService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('course_id') courseId?: string,
    @Query('sort_by') sortBy?: string,
    @Query('sort_order') sortOrder?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.studentsService.findAll({
      search,
      course_id: courseId,
      sort_by: sortBy,
      sort_order: sortOrder,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }
}

