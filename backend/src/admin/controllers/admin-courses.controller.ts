import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminCoursesService } from '../services/admin-courses.service';
import { CreateCourseDto, UpdateCourseDto } from '../dto/course.dto';

@Controller('admin/courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCoursesController {
  constructor(private readonly coursesService: AdminCoursesService) {}

  @Get()
  async findAll(
    @Query('teacher_id') teacher_id?: string,
    @Query('is_active') is_active?: string,
    @Query('search') search?: string,
  ) {
    return this.coursesService.findAll({
      teacher_id,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      search,
    });
  }

  @Post()
  async create(@Body() dto: CreateCourseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.coursesService.create(dto, user.sub);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.coursesService.update(id, dto, user.sub);
  }
}

