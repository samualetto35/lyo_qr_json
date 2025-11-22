import { IsEmail, IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateDoctorDto {
  @IsEmail()
  email: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

