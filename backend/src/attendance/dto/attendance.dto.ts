import { IsString, IsUUID, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GeoDto {
  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  accuracy_meters?: number;
}

export class SubmitAttendanceDto {
  @IsUUID()
  attendance_session_id: string;

  @IsString()
  qr_token: string;

  @IsString()
  student_id: string;

  @IsString()
  client_device_id: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoDto)
  geo?: GeoDto;
}

