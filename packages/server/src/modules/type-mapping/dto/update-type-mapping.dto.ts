import { IsString, IsOptional } from 'class-validator';

export class UpdateTypeMappingDto {
  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsString()
  java_type?: string;

  @IsOptional()
  @IsString()
  ts_type?: string;

  @IsOptional()
  @IsString()
  jdbc_type?: string;
}
