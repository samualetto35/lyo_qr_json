import { Module } from '@nestjs/common';
import { AdminTeachersController } from './controllers/admin-teachers.controller';
import { AdminCoursesController } from './controllers/admin-courses.controller';
import { AdminStudentsController, AdminCourseAttendanceController } from './controllers/admin-students.controller';
import { AdminAllStudentsController } from './controllers/admin-all-students.controller';
import { AdminImportController } from './controllers/admin-import.controller';
import { AdminAttendanceController } from './controllers/admin-attendance.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';
import { AdminSessionDetailsController } from './controllers/admin-session-details.controller';
import { AdminDoctorsController } from './controllers/admin-doctors.controller';
import { AdminHealthSystemController } from './controllers/admin-health-system.controller';
import { AdminTeachersService } from './services/admin-teachers.service';
import { AdminCoursesService } from './services/admin-courses.service';
import { AdminStudentsService } from './services/admin-students.service';
import { AdminImportService } from './services/admin-import.service';
import { AdminAttendanceService } from './services/admin-attendance.service';
import { AdminSettingsService } from './services/admin-settings.service';
import { AdminAuditService } from './services/admin-audit.service';
import { AdminDoctorsService } from './services/admin-doctors.service';
import { AdminHealthSystemService } from './services/admin-health-system.service';
import { AuditService } from './services/audit.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminTeachersController,
    AdminCoursesController,
    AdminStudentsController,
    AdminAllStudentsController,
    AdminImportController,
    AdminAttendanceController,
    AdminSettingsController,
    AdminAuditController,
    AdminSessionDetailsController,
    AdminCourseAttendanceController,
    AdminDoctorsController,
    AdminHealthSystemController,
  ],
  providers: [
    AdminTeachersService,
    AdminCoursesService,
    AdminStudentsService,
    AdminImportService,
    AdminAttendanceService,
    AdminSettingsService,
    AdminAuditService,
    AdminDoctorsService,
    AdminHealthSystemService,
    AuditService,
  ],
  exports: [AuditService],
})
export class AdminModule {}

