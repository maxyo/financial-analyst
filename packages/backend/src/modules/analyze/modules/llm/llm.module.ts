import { Module } from '@nestjs/common';

import { LlmService } from './services/llm.service';

@Module({
  exports: [LlmService],
  imports: [],
  providers: [LlmService],
  controllers: [],
})
export class LlmModule {}