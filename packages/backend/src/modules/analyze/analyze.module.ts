import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AnalyzeController } from './controllers/analyze.controller';
import { AiAggregateAnalysisWorker } from './jobs/ai.aggregate-analysis.worker';
import { AiSummarizeDocumentsWorker } from './jobs/ai.summarize-documents.worker';
import { ScrapperModule } from './modules/scraper/scrapper.module';
import { AnalysisProfilesRepository } from './repositories/analysis-profiles.repository';
import { ReportsRepository } from './repositories/reports.repository';

@Module({
  exports: [],
  imports: [
    BullModule.registerQueue({ name: 'ai.aggregate-analysis' }),
    BullModule.registerQueue({ name: 'ai.summarize-documents' }),
    ScrapperModule,
  ],
  providers: [
    AnalysisProfilesRepository,
    ReportsRepository,
    AiAggregateAnalysisWorker,
    AiSummarizeDocumentsWorker,

  ],
  controllers: [AnalyzeController],
})
export class AnalyzeModule {}
