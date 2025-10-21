import * as path from 'path';

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZodValidationPipe } from 'nestjs-zod';

import { HealthController } from './controllers/health.controller';
import { ZodSerializerInterceptor } from './dto/interceptor';
import { AnalyzeModule } from './modules/analyze/analyze.module';
import { CollectionEntity } from './modules/analyze/entities/collection.entity';
import { DocumentEntity } from './modules/analyze/entities/document.entity';
import { ProfileExecutionEntity } from './modules/analyze/entities/profile-execution.entity';
import { ProfileEntity } from './modules/analyze/entities/profile.entity';
import { ReportEntity } from './modules/analyze/entities/report/report.entity';
import { Scraper } from './modules/analyze/entities/scrapper.entity';
import { DocumentSourceEntity } from './modules/analyze/entities/source.entity';
import { TaskEntity } from './modules/analyze/entities/task.entity';
import { TopicEntity } from './modules/analyze/entities/topic.entity';

@Module({
  imports: [
    AnalyzeModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
      DocumentEntity,
      ProfileEntity,
      DocumentSourceEntity,
      ReportEntity,
      Scraper,
      TaskEntity,
      TopicEntity,
      CollectionEntity,
      ProfileExecutionEntity,
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
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
  exports: [],
})
export class AppModule {}
