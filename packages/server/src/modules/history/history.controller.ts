import { Controller, Get, Delete, Param, ParseIntPipe, Query } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  findAll(@Query('limit') limit?: number) {
    return this.historyService.findAll(limit || 100);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    this.historyService.remove(id);
    return { message: 'History deleted successfully' };
  }

  @Delete()
  clear() {
    this.historyService.clear();
    return { message: 'History cleared successfully' };
  }
}
