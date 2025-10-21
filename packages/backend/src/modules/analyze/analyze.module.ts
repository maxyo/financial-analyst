import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CollectionController } from './controllers/collection.controller';
import { DocumentsController } from './controllers/documents.controller';
import { ProfileController } from './controllers/profile.controller';
import { ReportController } from './controllers/report.controller';
import { ScrapersController } from './controllers/scrapers.controller';
import { TasksController } from './controllers/tasks.controller';
import { TopicsController } from './controllers/topics.controller';
import { AiAggregateAnalysisWorker } from './jobs/ai.aggregate-analysis.worker';
import { LlmModule } from './modules/llm/llm.module';
import { AnalysisProfilesRepository } from './repositories/analysis-profiles.repository';
import { CollectionsRepository } from './repositories/collections.repository';
import { DocumentSourcesRepository } from './repositories/document-sources.repository';
import { DocumentsRepository } from './repositories/documents.repository';
import { ProfileExecutionsRepository } from './repositories/profile-executions.repository';
import { ReportsRepository } from './repositories/reports.repository';
import { ScrapersRepository } from './repositories/scrapers.repository';
import { TasksRepository } from './repositories/tasks.repository';
import { TopicsRepository } from './repositories/topics.repository';
import { ScraperNestService } from './service/scraper.service';

@Module({
  exports: [],
  imports: [
    BullModule.registerQueue({ name: 'ai.aggregate-analysis' }),
    BullModule.registerQueue({ name: 'ai.summarize-documents' }),
    LlmModule,
    BullModule.registerQueue({ name: 'scrap.run' })
  ],
  providers: [
    AnalysisProfilesRepository,
    ReportsRepository,
    DocumentSourcesRepository,
    DocumentsRepository,
    ScraperNestService,
    CollectionsRepository,
    DocumentsRepository,
    ScrapersRepository,
    AiAggregateAnalysisWorker,
    ProfileExecutionsRepository,
    TasksRepository,
    TopicsRepository,
  ],
  controllers: [
    DocumentsController,
    ScrapersController,
    CollectionController,
    ProfileController,
    ReportController,
    TasksController,
    TopicsController,
  ],
})
export class AnalyzeModule {}
