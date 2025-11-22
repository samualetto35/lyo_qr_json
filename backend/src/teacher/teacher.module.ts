import { Module } from '@nestjs/common';
import { TeacherController } from './controllers/teacher.controller';
import { TeacherCoursesController } from './controllers/teacher-courses.controller';
import { TeacherAttendanceController } from './controllers/teacher-attendance.controller';
import { TeacherService } from './services/teacher.service';
import { TeacherCoursesService } from './services/teacher-courses.service';
import { TeacherAttendanceService } from './services/teacher-attendance.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [TeacherController, TeacherCoursesController, TeacherAttendanceController],
  providers: [TeacherService, TeacherCoursesService, TeacherAttendanceService],
})
export class TeacherModule {}

