import { Module } from '@nestjs/common';
import { MoexService } from './moex.service';

@Module({
  providers: [MoexService],
  exports: [MoexService],
})
export class MoexModule {}
