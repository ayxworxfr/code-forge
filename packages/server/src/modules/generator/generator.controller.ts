import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { GeneratorService } from './generator.service';

@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('preview')
  async preview(@Body() body: any) {
    return this.generatorService.preview(body);
  }

  @Post('generate')
  async generate(@Body() body: any, @Res() res: Response) {
    const stream = await this.generatorService.generate(body);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=generated-code.zip');

    stream.pipe(res);
  }
}
