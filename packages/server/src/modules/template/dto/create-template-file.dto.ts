import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateTemplateFileDto {
  @IsInt()
  group_id: number;

  @IsString()
  file_name: string;

  @IsString()
  output_path: string;

  @IsString()
  content: string;

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
