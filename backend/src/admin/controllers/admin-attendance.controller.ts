import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminAttendanceService } from '../services/admin-attendance.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAttendanceController {
  constructor(private readonly attendanceService: AdminAttendanceService) {}

  @Get('courses/:course_id/attendance')
  async getCourseAttendance(
    @Param('course_id') courseId: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('student_id') studentId?: string,
  ) {
    return this.attendanceService.getCourseAttendance(courseId, {
      from_date: fromDate,
      to_date: toDate,
      student_id: studentId,
    });
  }

  @Get('attendance-sessions')
  async getAllSessions(
    @Query('course_id') courseId?: string,
    @Query('teacher_id') teacherId?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('status') status?: string,
    @Query('sort_by') sortBy?: string,
    @Query('sort_order') sortOrder?: 'asc' | 'desc',
  ) {
    return this.attendanceService.getAllSessions({
      course_id: courseId,
      teacher_id: teacherId,
      from_date: fromDate,
      to_date: toDate,
      status,
      sort_by: sortBy,
      sort_order: sortOrder,
    });
  }

  @Patch('attendance-records/:id')
  async updateRecord(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('fraud_flag_reason') fraudFlagReason: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attendanceService.updateAttendanceRecord(id, status, fraudFlagReason, user.sub);
  }

  @Get('fraud-signals')
  async getFraudSignals(
    @Query('course_id') courseId?: string,
    @Query('teacher_id') teacherId?: string,
    @Query('signal_type') signalType?: string,
  ) {
    return this.attendanceService.getFraudSignals({
      course_id: courseId,
      teacher_id: teacherId,
      signal_type: signalType,
    });
  }

  @Get('teachers-list')
  async getTeachersList() {
    return this.attendanceService.getTeachersList();
  }

  @Get('courses-list')
  async getCoursesList() {
    return this.attendanceService.getCoursesList();
  }
}

