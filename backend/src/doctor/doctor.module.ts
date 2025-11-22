import { Module } from '@nestjs/common';
import { DoctorController } from './controllers/doctor.controller';
import { DoctorService } from './services/doctor.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}

