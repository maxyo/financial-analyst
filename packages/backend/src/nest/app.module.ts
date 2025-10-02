import * as path from 'path';

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';


import { AiController } from './controllers/ai.controller';
import { CandlesController } from './controllers/candles.controller';
import { DataSourcesController } from './controllers/data-sources.controller';
import { HealthController } from './controllers/health.controller';
import { JobsController } from './controllers/jobs.controller';
import { PositionsController } from './controllers/positions.controller';
import { ScraperController } from './controllers/scraper.controller';
import { SearchController } from './controllers/search.controller';
import { SummaryController } from './controllers/summary.controller';
import { TradesController } from './controllers/trades.controller';
import { UnderlyingController } from './controllers/underlying.controller';
import { WsBridgeService } from './controllers/websocket/ws-bridge.service';
import { AnalysisProfileSourceEntity } from './entities/analysis-profile-source.entity';
import { AnalysisProfileEntity } from './entities/analysis-profile.entity';
import { CandleEntity } from './entities/candle.entity';
import { DataSourceEntity } from './entities/data-source.entity';
import { DocumentSummaryEntity } from './entities/document-summary.entity';
import { DocumentEntity } from './entities/document.entity';
import { FundingRateEntity } from './entities/funding-rate.entity';
import { InstrumentEntity } from './entities/instrument.entity';
import { JobEntity } from './entities/job.entity';
import { ReportEntity } from './entities/report.entity';
import { TradePublicEntity } from './entities/trade-public.entity';
import { TradeUserEntity } from './entities/trade-user.entity';
import { JobsBullService } from './jobs/jobs-bull.service';
import { JobsWorker } from './jobs/jobs.worker';
import { MoexModule } from './modules/moex/moex.module';
import { TinkoffApiModule } from './modules/tinkoff/tinkoff.module';
import { InstrumentsRepository } from './repositories/instruments.repository';
import { TradesRepository } from './repositories/trades.repository';
import { AnalysisProfilesRepository } from './repositories/analysis-profiles.repository';
import { ReportsRepository } from './repositories/reports.repository';
import { CandlesNestService } from './services/candles.service';
import { FundingNestService } from './services/funding.service';
import { InstrumentNestService } from './services/instrument.service';
import { PositionsNestService } from './services/positions.service';
import { ScraperNestService } from './services/scraper.service';
import { SummaryNestService } from './services/summary.service';
import { TradesNestService } from './services/trades.service';

@Module({
  imports: [
    TinkoffApiModule,
    MoexModule,
    // TypeORM configuration (better-sqlite3)
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'trade.db');
        return {
          type: 'better-sqlite3' as const,
          database: dbPath,
          autoLoadEntities: true,
          synchronize: false,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature([
      InstrumentEntity,
      CandleEntity,
      DataSourceEntity,
      DocumentEntity,
      TradePublicEntity,
      TradeUserEntity,
      FundingRateEntity,
      JobEntity,
      AnalysisProfileEntity,
      AnalysisProfileSourceEntity,
      DocumentSummaryEntity,
      ReportEntity,
    ]),
    BullModule.forRootAsync({
      useFactory: () => {
        const url = process.env.REDIS_URL;
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const port = Number(process.env.REDIS_PORT || 6379);
        return {
          connection: url ? { url } : { host, port },
        } as any;
      },
    }),
    BullModule.registerQueue({ name: 'jobs' }),
  ],
  controllers: [
    HealthController,
    JobsController,
    SearchController,
    SummaryController,
    AiController,
    UnderlyingController,
    CandlesController,
    PositionsController,
    TradesController,
    ScraperController,
    DataSourcesController,
  ],
  providers: [
    JobsBullService,
    JobsWorker,
    CandlesNestService,
    SummaryNestService,
    TradesNestService,
    PositionsNestService,
    InstrumentNestService,
    FundingNestService,
    ScraperNestService,
    InstrumentsRepository,
    TradesRepository,
    AnalysisProfilesRepository,
    ReportsRepository,
    WsBridgeService,
  ],
  exports: [JobsBullService],
})
export class AppModule {}
