import { IsString } from 'class-validator';

export class CreateTypeMappingDto {
  @IsString()
  source_type: string;

  @IsString()
  java_type: string;

  @IsString()
  ts_type: string;

  @IsString()
  jdbc_type: string;
}
