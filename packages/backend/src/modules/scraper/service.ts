import { ensureScraperSchema } from './schema';
import { DataSourceRepo, DocumentRepo } from './repos';
import { ScraperRegistry } from './registry';
import type { ScrapeContext, ScrapeResult } from './types';
import { RestApiScraper } from './scrapers/api';
import { HtmlScraper } from './scrapers/html';

// Register default scrapers
(function registerDefaults(){
  ScraperRegistry.register('api', () => new RestApiScraper());
  ScraperRegistry.register('html', () => new HtmlScraper());
})();

export interface RunResult {
  sourceId: number;
  items: number;
  inserted: number;
  skipped: number;
  meta?: Record<string, unknown>;
}


export async function runScrapeForSourceAsync(sourceId: number, ctx: ScrapeContext = {}): Promise<RunResult> {
  ensureScraperSchema();
  const sources = new DataSourceRepo();
  const docs = new DocumentRepo();
  const src = sources.getById(sourceId);
  if (!src) throw new Error(`Data source ${sourceId} not found`);
  const scraper = ScraperRegistry.get(src.source_type);
  if (!scraper) throw new Error(`No scraper registered for type=${src.source_type}`);

  const now = ctx.now ?? new Date();
  const res: ScrapeResult = await scraper.scrape(src.config, { now, env: ctx.env });
  let inserted = 0;
  let skipped = 0;
  for (const item of res.items || []) {
    const { inserted: ok } = docs.insert(src.id, item, now);
    if (ok) inserted++; else skipped++;
  }
  return {
    sourceId: src.id,
    items: res.items?.length || 0,
    inserted,
    skipped,
    meta: res.meta,
  };
}

export async function runScrapeBatchAsync(options: { onlyActive?: boolean } = {}): Promise<RunResult[]> {
  ensureScraperSchema();
  const sources = new DataSourceRepo();
  const list = options.onlyActive !== false ? sources.listActive() : sources.listAll();
  const results: RunResult[] = [];
  for (const src of list) {
    const r = await runScrapeForSourceAsync(src.id);
    results.push(r);
  }
  return results;
}
