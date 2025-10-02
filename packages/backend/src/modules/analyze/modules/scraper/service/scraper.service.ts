import { createHash, randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { Job } from "bullmq";

import { Scraper } from '../entities/scrapper.entity';
import { DocumentsRepository } from '../repositories/documents.repository';
import { ScrapersRepository } from '../repositories/scrapers.repository';
import { ScrapedItem, ScraperType } from '../types';
import { apiScraper } from './strategies/api.scraper';
import { htmlScraper } from './strategies/html.scrapper';

import AsyncIterator = NodeJS.AsyncIterator;

import { Processor, WorkerHost } from '@nestjs/bullmq';

export interface ScrapingResult {
  items: number;
  inserted: number;
  skipped: number;
  failed: number;
  meta?: Record<string, unknown>;
}

const SCRAPERS = {
  [ScraperType.API]: apiScraper,
  [ScraperType.HTML]: htmlScraper,
} as const;

@Injectable()
@Processor('scrap.*')
export class ScraperNestService extends WorkerHost {
  logger = new Logger(ScraperNestService.name);
  constructor(
    private readonly documents: DocumentsRepository,
    private readonly scrapers: ScrapersRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const data: any = job.data || {};
    const scraperId: string | undefined = String(
      data.scraperId || data.scraper_id || data.id || ''
    ).trim() || undefined;
    if (!scraperId) {
      throw new Error('scraperId is required');
    }
    const scr = await this.scrapers.findOne({ where: { id: scraperId } as any });
    if (!scr) {
      throw new Error(`Scraper not found: ${scraperId}`);
    }
    return this.runScraper(scr as any);
  }


  async runScraper<T extends ScraperType>(
    scrapper: Scraper<T>,
  ): Promise<ScrapingResult> {
    const func = SCRAPERS[scrapper.type];

    const result: ScrapingResult = {
      items: 0,
      meta: {},
      skipped: 0,
      inserted: 0,
      failed: 0,
    };
    // @ts-ignore
    const iterator = func(scrapper) as AsyncIterator<ScrapedItem<T>>;
    let item = await iterator.next();
    while (item.value) {
      result.items++;
      try {
        const scrapedItem: ScrapedItem<T> = item.value;
        const contentStr =
          typeof scrapedItem.content === 'string'
            ? scrapedItem.content
            : JSON.stringify(scrapedItem.content);
        const resultDocument = {
          content: contentStr,
          title: scrapedItem.title,
          contentHash: this.generateHash(contentStr),
          scrapedAt: new Date(),
          scraperId: scrapper.id,
          id: randomUUID(),
        };
        await this.documents.insert(resultDocument);
        result.inserted++;

        item = await iterator.next();
      } catch (e) {
        result.failed++;
        this.logger.error(`Scraping failed`, e);
      }
    }

    return result;
  }

  private generateHash(content: string): string {
    const hash = createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  async runById(scraperId: string) {
    const scr = await this.scrapers.findOne({ where: { id: scraperId } as any });
    if (!scr) throw new Error(`Scraper not found: ${scraperId}`);
    return this.runScraper(scr as any);
  }
}
