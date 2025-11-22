import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { TeacherAttendanceService } from '../services/teacher-attendance.service';
import { CreateAttendanceSessionDto, UpdateAttendanceRecordDto, AddStudentToSessionDto } from '../dto/attendance.dto';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class TeacherAttendanceController {
  constructor(private readonly attendanceService: TeacherAttendanceService) {}

  @Post('courses/:course_id/attendance-sessions')
  async createSession(
    @Param('course_id') courseId: string,
    @Body() dto: CreateAttendanceSessionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attendanceService.createSession(courseId, dto, user.sub);
  }

  @Post('attendance-sessions/:id/close')
  async closeSession(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.attendanceService.closeSession(id, user.sub);
  }

  @Get('attendance-sessions/:id')
  async getSessionDetails(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.attendanceService.getSessionDetails(id, user.sub);
  }

  @Get('courses/:course_id/attendance')
  async getCourseAttendance(
    @Param('course_id') courseId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('student_id') studentId?: string,
  ) {
    return this.attendanceService.getCourseAttendance(courseId, user.sub, {
      from_date: fromDate,
      to_date: toDate,
      student_id: studentId,
    });
  }

  @Patch('attendance-records/:id')
  async updateRecord(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceRecordDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attendanceService.updateAttendanceRecord(id, dto, user.sub);
  }

  @Post('attendance-sessions/:id/add-student')
  async addStudent(
    @Param('id') sessionId: string,
    @Body() dto: AddStudentToSessionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attendanceService.addStudentToSession(sessionId, dto, user.sub);
  }

  @Delete('attendance-records/:id')
  async removeStudent(
    @Param('id') recordId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attendanceService.removeStudentFromSession(recordId, user.sub);
  }

  @Get('attendance-sessions/:id/eligible-students')
  async getEligibleStudents(
    @Param('id') sessionId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attendanceService.getEligibleStudentsForSession(sessionId, user.sub);
  }
}

