import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateDataSourceDto {
  @IsString()
  name: string;

  @IsString()
  host: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  database_name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
