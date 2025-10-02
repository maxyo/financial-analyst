export enum ScraperType {
  API = 'API',
  HTML = 'HTML',
}

export const scrapperTypes = Object.values(ScraperType);

export type ScraperConfiguration = {
  [ScraperType.API]: {
    url: string;
  };
  [ScraperType.HTML]: {
    url: string;
    selectors: { name: string; selector: string }[];
    headers: Record<string, string>;
    timeoutMs: number;
  };
};

export type ScrapedItem<T> = {
  title: string;
  content: T;
};
