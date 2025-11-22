import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { TeacherCoursesService } from '../services/teacher-courses.service';
import { CreateCourseDto } from '../dto/course.dto';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class TeacherCoursesController {
  constructor(private readonly coursesService: TeacherCoursesService) {}

  @Get('courses')
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.coursesService.findAll(user.sub);
  }

  @Post('courses')
  async create(@Body() dto: CreateCourseDto, @CurrentUser() user: CurrentUserPayload) {
    return this.coursesService.create(dto, user.sub);
  }

  @Get('courses/:course_id/students')
  async findStudents(
    @Param('course_id') courseId: string,
    @Query('q') search: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.coursesService.findStudents(courseId, user.sub, search);
  }
}

