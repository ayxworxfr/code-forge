import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { DataSourceModule } from './modules/datasource/datasource.module';
import { TemplateModule } from './modules/template/template.module';
import { TypeMappingModule } from './modules/type-mapping/type-mapping.module';
import { ConfigModule } from './modules/config/config.module';
import { GeneratorModule } from './modules/generator/generator.module';
import { HistoryModule } from './modules/history/history.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    DataSourceModule,
    TemplateModule,
    TypeMappingModule,
    GeneratorModule,
    HistoryModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
