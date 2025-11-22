import { IsString, IsOptional } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  student_id: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  program?: string;
}

