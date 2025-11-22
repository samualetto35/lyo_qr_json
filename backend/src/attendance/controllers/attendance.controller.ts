import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { SubmitAttendanceDto } from '../dto/attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('session/validate-public')
  async validateSession(
    @Query('attendance_session_id') attendanceSessionId: string,
    @Query('qr_token') qrToken: string,
  ) {
    return this.attendanceService.validateSession(attendanceSessionId, qrToken);
  }

  @Post('submit')
  async submit(@Body() dto: SubmitAttendanceDto, @Req() req: Request) {
    return this.attendanceService.submitAttendance(dto, req);
  }
}

