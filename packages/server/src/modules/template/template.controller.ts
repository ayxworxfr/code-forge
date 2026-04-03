import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { CreateTemplateGroupDto } from './dto/create-template-group.dto';
import { UpdateTemplateGroupDto } from './dto/update-template-group.dto';
import { CreateTemplateFileDto } from './dto/create-template-file.dto';
import { UpdateTemplateFileDto } from './dto/update-template-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  // ==================== 模板组路由 ====================

  @Get('groups')
  findAllGroups() {
    return this.templateService.findAllGroups();
  }

  @Get('groups/:id')
  findOneGroup(@Param('id', ParseIntPipe) id: number) {
    return this.templateService.findOneGroup(id);
  }

  @Get('groups/:id/files')
  findGroupWithFiles(@Param('id', ParseIntPipe) id: number) {
    return this.templateService.findGroupWithFiles(id);
  }

  @Get('groups/:id/export')
  async exportGroup(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { fileName, buffer } = await this.templateService.exportGroupZip(id);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Post('groups')
  createGroup(@Body() dto: CreateTemplateGroupDto) {
    return this.templateService.createGroup(dto);
  }

  @Put('groups/:id')
  updateGroup(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTemplateGroupDto) {
    return this.templateService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  removeGroup(@Param('id', ParseIntPipe) id: number) {
    this.templateService.removeGroup(id);
    return { message: 'Template group deleted successfully' };
  }

  @Post('groups/:id/clone')
  cloneGroup(@Param('id', ParseIntPipe) id: number, @Body('name') name: string) {
    return this.templateService.cloneGroup(id, name);
  }

  @Post('builtins/reset')
  resetBuiltins() {
    return this.templateService.resetBuiltins();
  }

  @Post('groups/import')
  @UseInterceptors(FileInterceptor('file'))
  async importGroup(
    @UploadedFile() file: Express.Multer.File,
    @Body('groupName') groupName?: string,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Zip file is required');
    }
    return this.templateService.importGroupZip(file.buffer, groupName);
  }

  @Post('groups/import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewImportGroup(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Zip file is required');
    }
    return this.templateService.previewImportZip(file.buffer);
  }

  // ==================== 模板文件路由 ====================

  @Get('files/:id')
  findOneFile(@Param('id', ParseIntPipe) id: number) {
    return this.templateService.findOneFile(id);
  }

  @Post('files')
  createFile(@Body() dto: CreateTemplateFileDto) {
    return this.templateService.createFile(dto);
  }

  @Put('files/:id')
  updateFile(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTemplateFileDto) {
    return this.templateService.updateFile(id, dto);
  }

  @Delete('files/:id')
  removeFile(@Param('id', ParseIntPipe) id: number) {
    this.templateService.removeFile(id);
    return { message: 'Template file deleted successfully' };
  }

  @Put('files/order')
  updateFilesOrder(@Body() fileOrders: { id: number; sort_order: number }[]) {
    this.templateService.updateFilesOrder(fileOrders);
    return { message: 'File order updated successfully' };
  }
}
