import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { DataSourceService } from './datasource.service';
import { CreateDataSourceDto } from './dto/create-datasource.dto';
import { UpdateDataSourceDto } from './dto/update-datasource.dto';
import { ParseDdlDto } from './dto/parse-ddl.dto';

@Controller('datasource')
export class DataSourceController {
  constructor(private readonly dataSourceService: DataSourceService) {}

  @Get()
  findAll() {
    return this.dataSourceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dataSourceService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDataSourceDto) {
    return this.dataSourceService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDataSourceDto) {
    return this.dataSourceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    this.dataSourceService.remove(id);
    return { message: 'DataSource deleted successfully' };
  }

  @Post('test/:id')
  testConnection(@Param('id', ParseIntPipe) id: number) {
    return this.dataSourceService.testConnection(id);
  }

  @Post('test')
  testConnectionByConfig(@Body() dto: CreateDataSourceDto) {
    return this.dataSourceService.testConnectionByConfig(dto);
  }

  @Get(':id/tables')
  getTables(@Param('id', ParseIntPipe) id: number) {
    return this.dataSourceService.getTables(id);
  }

  @Get(':id/tables/:tableName')
  getTableDetail(@Param('id', ParseIntPipe) id: number, @Param('tableName') tableName: string) {
    return this.dataSourceService.getTableDetail(id, tableName);
  }

  @Post('parse-ddl')
  parseDdl(@Body() dto: ParseDdlDto) {
    return this.dataSourceService.parseDdlTables(dto.ddl);
  }
}
