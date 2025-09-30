import type { IScraper } from './types';

export type ScraperFactory = () => IScraper;

class Registry {
  private map = new Map<string, ScraperFactory>();

  register(type: string, factory: ScraperFactory) {
    this.map.set(type.toLowerCase(), factory);
  }

  get(type: string): IScraper | null {
    const f = this.map.get(type.toLowerCase());
    return f ? f() : null;
  }
}

export const ScraperRegistry = new Registry();
