import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateDataSourceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  database_name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
