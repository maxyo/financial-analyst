import { z } from 'zod';

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
    pagination?: {
      nextSelector?: string;
      nextUrlTemplate?: string;
      pageParam?: string;
      startPage?: number;
      maxPages?: number;
    };
    document?: {
      linkSelector: string;
      linkAttr?: string; // default: 'href'
      titleSelector?: string; // selector to extract title on the document page
      contentSelector?: string; // selector to extract content on the document page
      baseUrl?: string; // base URL for resolving relative links
      maxDocsPerPage?: number; // safety limit per page
    };
  };
};
export const apiScraperConfigurationSchema = z.object({
  url: z.string().url(),
});
export const htmlScraperConfigurationSchema = z
  .object({
    url: z.string().url(),
    selectors: z.array(
      z.object({
        name: z.string(),
        selector: z.string(),
      }),
    ),
    headers: z.record(z.string(), z.string()),
    timeoutMs: z.number().positive(),
  })
  .extend({
    pagination: z
      .object({
        nextSelector: z.string().min(1).optional(),
        nextUrlTemplate: z.string().min(1).optional(),
        pageParam: z.string().min(1).optional(),
        startPage: z.number().int().min(1).optional(),
        maxPages: z.number().int().positive().optional(),
      })
      .optional(),
    document: z
      .object({
        linkSelector: z.string(),
        linkAttr: z.string().optional(),
        titleSelector: z.string().optional(),
        contentSelector: z.string().optional(),
        baseUrl: z.string().url().optional(),
        maxDocsPerPage: z.number().int().positive().optional(),
      })
      .optional(),
  });

export const scraperConfigurationSchema = z.object({
  [ScraperType.API]: apiScraperConfigurationSchema,
  [ScraperType.HTML]: htmlScraperConfigurationSchema,
});

export type ScrapedItem<T> = {
  title: string;
  content: T;
};
export enum PostProcessorType {
  TRIM_WHITESPACE = 'TRIM_WHITESPACE',
}

export const trimWhitespaceConfigSchema = z.object({
  collapseMultipleSpaces: z.boolean().optional().default(true),
  collapseNewlines: z.boolean().optional().default(true),
  trimEachLine: z.boolean().optional().default(true),
});

export const postProcessorConfigurationSchema = z.object({
  [PostProcessorType.TRIM_WHITESPACE]: trimWhitespaceConfigSchema,
});

export type TrimWhitespaceConfig = z.infer<typeof trimWhitespaceConfigSchema>;
export type PostProcessorConfiguration = z.infer<
  typeof postProcessorConfigurationSchema
>;