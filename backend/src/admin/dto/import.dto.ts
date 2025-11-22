import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';

export enum ImportMode {
  ADD_ONLY = 'add_only',
  ADD_OR_UPDATE = 'add_or_update',
  SYNC_WITH_DEACTIVATION = 'sync_with_deactivation',
}

export class AssignCourseDto {
  @IsUUID()
  course_id: string;
}

export class SetImportModeDto {
  @IsEnum(ImportMode)
  import_mode: ImportMode;
}

