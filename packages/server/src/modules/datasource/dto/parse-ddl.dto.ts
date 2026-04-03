import { IsString } from 'class-validator';

export class ParseDdlDto {
  @IsString()
  ddl: string;
}
