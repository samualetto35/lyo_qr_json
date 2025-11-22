import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminStudentsService } from '../services/admin-students.service';
import { CreateStudentDto } from '../dto/student.dto';

@Controller('admin/courses/:course_id/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminStudentsController {
  constructor(private readonly studentsService: AdminStudentsService) {}

  @Get()
  async findAll(@Param('course_id') courseId: string, @Query('q') search?: string) {
    return this.studentsService.findByCourse(courseId, search);
  }

  @Post()
  async create(
    @Param('course_id') courseId: string,
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.studentsService.addStudentToCourse(courseId, dto, user.sub);
  }

  @Delete(':student_id_fk')
  async remove(
    @Param('course_id') courseId: string,
    @Param('student_id_fk') studentIdFk: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.studentsService.removeStudentFromCourse(courseId, studentIdFk, user.sub);
  }
}

@Controller('admin/courses/:course_id/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCourseAttendanceController {
  constructor(private readonly studentsService: AdminStudentsService) {}

  @Get()
  async getAttendance(@Param('course_id') courseId: string, @Query('q') search?: string) {
    return this.studentsService.findByCourseWithAttendance(courseId, search);
  }
}

