import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateMedicalReportDto {
  @IsString()
  student_id: string;

  @IsDateString()
  report_date: string;
}

export class GetReportsDto {
  @IsOptional()
  @IsString()
  student_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}

