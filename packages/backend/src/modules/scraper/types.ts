import { createHash } from 'crypto';

export type SourceType = string;

export interface DataSourceRecord {
  id: number;
  name: string;
  source_type: SourceType;
  config: unknown; // JSON blob per source type
  created_at: string; // ISO
  update_strategy: unknown; // JSON
  is_active: 0 | 1;
}

export interface NewDataSource {
  name: string;
  source_type: SourceType;
  config: unknown;
  update_strategy?: unknown;
  is_active?: boolean;
}

export interface DocumentRecord {
  id: number;
  source_id: number;
  content: unknown; // JSON or string
  scraped_at: string; // ISO
  content_hash: string;
}

export interface IScraper {
  scrape(config: unknown, ctx: ScrapeContext): Promise<ScrapeResult>;
}

export interface ScrapeContext {
  now?: Date;
  env?: Record<string, string | undefined>;
}

export type ScrapeResultItem = unknown;
export interface ScrapeResult {
  items: ScrapeResultItem[];
  meta?: Record<string, unknown>;
}

export function computeContentHash(content: unknown): string {
  const json = typeof content === 'string' ? content : JSON.stringify(content);
  return createHash('sha256').update(json).digest('hex');
}
