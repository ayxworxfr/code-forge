import { Controller, Get, Put, Body } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getAll() {
    return this.configService.getAll();
  }

  @Put()
  updateBatch(@Body() configs: Record<string, string>) {
    this.configService.updateBatch(configs);
    return { message: 'Config updated successfully' };
  }
}
