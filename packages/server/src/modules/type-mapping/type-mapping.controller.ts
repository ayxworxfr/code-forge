import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TypeMappingService } from './type-mapping.service';
import { CreateTypeMappingDto } from './dto/create-type-mapping.dto';
import { UpdateTypeMappingDto } from './dto/update-type-mapping.dto';

@Controller('type-mapping')
export class TypeMappingController {
  constructor(private readonly typeMappingService: TypeMappingService) {}

  @Get()
  findAll() {
    return this.typeMappingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.typeMappingService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTypeMappingDto) {
    return this.typeMappingService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTypeMappingDto) {
    return this.typeMappingService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    this.typeMappingService.remove(id);
    return { message: 'Type mapping deleted successfully' };
  }

  @Post('reset')
  reset() {
    this.typeMappingService.resetToDefault();
    return { message: 'Type mappings reset to default successfully' };
  }
}
