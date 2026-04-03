import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdateTemplateFileDto {
  @IsOptional()
  @IsInt()
  group_id?: number;

  @IsOptional()
  @IsString()
  file_name?: string;

  @IsOptional()
  @IsString()
  output_path?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
