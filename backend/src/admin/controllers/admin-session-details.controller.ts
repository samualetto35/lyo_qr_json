import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminAttendanceService } from '../services/admin-attendance.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSessionDetailsController {
  constructor(private readonly attendanceService: AdminAttendanceService) {}

  @Get('session-details/:id')
  async getSessionDetails(
    @Param('id') sessionId: string,
    @Query('search') search?: string,
    @Query('status_filter') statusFilter?: string,
  ) {
    return this.attendanceService.getSessionDetails(sessionId, {
      search,
      status_filter: statusFilter,
    });
  }
}

