import { IsString, IsOptional, IsInt, Min, IsDateString } from 'class-validator';

export class CreateAttendanceSessionDto {
  @IsOptional()
  @IsString()
  session_name?: string;

  @IsOptional()
  @IsDateString()
  session_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;
}

export class UpdateAttendanceRecordDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  fraud_flag_reason?: string;
}

export class AddStudentToSessionDto {
  @IsString()
  student_id: string; // The internal DB student ID (UUID), not studentId value
}

export class GetCourseAttendanceQueryDto {
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @IsString()
  student_id?: string;
}

