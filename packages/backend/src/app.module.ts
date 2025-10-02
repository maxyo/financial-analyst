import * as path from 'path';

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthController } from './controllers/health.controller';
import { JobsController } from './controllers/jobs.controller';
import { WsBridgeService } from './controllers/websocket/ws-bridge.service';
import { AnalyzeModule } from './modules/analyze/analyze.module';
import { ProfileEntity } from './modules/analyze/entities/profile.entity';
import { ReportEntity } from './modules/analyze/entities/report.entity';
import { DocumentSourceEntity } from './modules/analyze/entities/source.entity';
import { DocumentEntity } from './modules/analyze/modules/scraper/entities/document.entity';
import { CandleEntity } from './modules/market/entities/candle.entity';
import { FundingRateEntity } from './modules/market/entities/funding-rate.entity';
import { InstrumentEntity } from './modules/market/entities/instrument.entity';
import { TradePublicEntity } from './modules/market/entities/trade-public.entity';
import { TradeUserEntity } from './modules/market/entities/trade-user.entity';
import { MarketModule } from './modules/market/market.module';

@Module({
  imports: [
    MarketModule,
    AnalyzeModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbPath =
          process.env.DB_PATH ||
          path.resolve(process.cwd(), 'data', 'trade.db');
        return {
          type: 'better-sqlite3' as const,
          database: dbPath,
          autoLoadEntities: true,
          synchronize: true,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature([
      InstrumentEntity,
      CandleEntity,
      DocumentEntity,
      TradePublicEntity,
      TradeUserEntity,
      FundingRateEntity,
      ProfileEntity,
      DocumentSourceEntity,
      ReportEntity,
    ]),
    BullModule.forRootAsync({
      useFactory: () => {
        const url = process.env.REDIS_URL;
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const port = Number(process.env.REDIS_PORT || 6379);
        return {
          connection: url ? { url } : { host, port },
        };
      },
    }),
  ],
  controllers: [HealthController, JobsController],
  providers: [WsBridgeService],
  exports: [],
})
export class AppModule {}
