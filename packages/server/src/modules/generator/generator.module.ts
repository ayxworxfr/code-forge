import { Module } from '@nestjs/common';
import { GeneratorController } from './generator.controller';
import { GeneratorService } from './generator.service';
import { DataSourceModule } from '../datasource/datasource.module';
import { TemplateModule } from '../template/template.module';
import { TypeMappingModule } from '../type-mapping/type-mapping.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [DataSourceModule, TemplateModule, TypeMappingModule, HistoryModule],
  controllers: [GeneratorController],
  providers: [GeneratorService],
})
export class GeneratorModule {}
