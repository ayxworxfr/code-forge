import { Module } from '@nestjs/common';
import { TypeMappingController } from './type-mapping.controller';
import { TypeMappingService } from './type-mapping.service';

@Module({
  controllers: [TypeMappingController],
  providers: [TypeMappingService],
  exports: [TypeMappingService],
})
export class TypeMappingModule {}
