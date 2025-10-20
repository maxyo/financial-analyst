import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ProfileController } from './controllers/profile.controller';
import { ReportController } from './controllers/report.controller';
import { TasksController } from './controllers/tasks.controller';
import { TopicsController } from './controllers/topics.controller';
import { AiAggregateAnalysisWorker } from './jobs/ai.aggregate-analysis.worker';
import { LlmModule } from './modules/llm/llm.module';
import { DocumentsRepository } from './modules/scraper/repositories/documents.repository';
import { ScrapperModule } from './modules/scraper/scrapper.module';
import { AnalysisProfilesRepository } from './repositories/analysis-profiles.repository';
import { DocumentSourcesRepository } from './repositories/document-sources.repository';
import { ProfileExecutionsRepository } from './repositories/profile-executions.repository';
import { ReportsRepository } from './repositories/reports.repository';
import { TasksRepository } from './repositories/tasks.repository';
import { TopicsRepository } from './repositories/topics.repository';

@Module({
  exports: [],
  imports: [
    BullModule.registerQueue({ name: 'ai.aggregate-analysis' }),
    BullModule.registerQueue({ name: 'ai.summarize-documents' }),
    ScrapperModule,
    LlmModule,
  ],
  providers: [
    AnalysisProfilesRepository,
    ReportsRepository,
    DocumentSourcesRepository,
    DocumentsRepository,
    AiAggregateAnalysisWorker,
    ProfileExecutionsRepository,
    TasksRepository,
    TopicsRepository,
  ],
  controllers: [ProfileController, ReportController, TasksController, TopicsController],
})
export class AnalyzeModule {}
