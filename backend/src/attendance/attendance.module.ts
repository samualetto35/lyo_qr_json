import { Module } from '@nestjs/common';
import { AttendanceController } from './controllers/attendance.controller';
import { AttendanceService } from './services/attendance.service';
import { AttendanceAutoCloseService } from './services/attendance-auto-close.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceAutoCloseService],
})
export class AttendanceModule {}

