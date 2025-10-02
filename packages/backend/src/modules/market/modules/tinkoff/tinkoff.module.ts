import { Module } from '@nestjs/common';
import { TinkoffApiService } from './tinkoff.service';

@Module({
  providers: [TinkoffApiService],
  exports: [TinkoffApiService],
})
export class TinkoffApiModule {}
