import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as path from 'path';
import { JobsBullService } from './jobs/jobs-bull.service';
import { JobsWorker } from './jobs/jobs.worker';
import { HealthController } from './controllers/health.controller';
import { JobsController } from './controllers/jobs.controller';
import { SearchController } from './controllers/search.controller';
import { SummaryController } from './controllers/summary.controller';
import { AiController } from './controllers/ai.controller';
import { UnderlyingController } from './controllers/underlying.controller';
import { CandlesController } from './controllers/candles.controller';
import { PositionsController } from './controllers/positions.controller';
import { TradesController } from './controllers/trades.controller';
import { DataSourcesController } from './controllers/data-sources.controller';
import { CandlesNestService } from './services/candles.service';
import { SummaryNestService } from './services/summary.service';
import { TradesNestService } from './services/trades.service';
import { PositionsNestService } from './services/positions.service';
import { InstrumentNestService } from './services/instrument.service';
import { FundingNestService } from './services/funding.service';
import { InstrumentEntity } from './entities/instrument.entity';
import { InstrumentsRepository } from './repositories/instruments.repository';
import { TradesRepository } from './repositories/trades.repository';
import { CandleEntity } from './entities/candle.entity';
import { DataSourceEntity } from './entities/data-source.entity';
import { DocumentEntity } from './entities/document.entity';
import { TradePublicEntity } from './entities/trade-public.entity';
import { TradeUserEntity } from './entities/trade-user.entity';
import { FundingRateEntity } from './entities/funding-rate.entity';
import { JobEntity } from './entities/job.entity';
import { AnalysisProfileEntity } from './entities/analysis-profile.entity';
import { AnalysisProfileSourceEntity } from './entities/analysis-profile-source.entity';
import { DocumentSummaryEntity } from './entities/document-summary.entity';
import { ReportEntity } from './entities/report.entity';
import { setOrmDataSource } from '../repositories/typeormDataSource';
import { JobsProcessor } from '../modules/jobs/processor';
import { TinkoffApiModule } from './modules/tinkoff/tinkoff.module';

@Module({
  imports: [
    TinkoffApiModule,
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
    DataSourcesController,
  ],
  providers: [
    JobsBullService,
    JobsWorker,
    JobsProcessor,
    CandlesNestService,
    SummaryNestService,
    TradesNestService,
    PositionsNestService,
    InstrumentNestService,
    FundingNestService,
    InstrumentsRepository,
    TradesRepository,
    // Bridge Nest's DataSource into legacy repositories
    {
      provide: 'ORM_DATA_SOURCE_BRIDGE',
      inject: [DataSource],
      useFactory: (ds: DataSource) => {
        setOrmDataSource(ds);
        return true;
      },
    },
  ],
  exports: [JobsBullService],
})
export class AppModule {}
