import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  apiScraperConfigurationSchema,
  htmlScraperConfigurationSchema,
  PostProcessorType,
  ScraperType,
  trimWhitespaceConfigSchema,
} from '../types';

export const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const TrimWhiteSpaceProcessorSchema = z.object({
  type: z.literal(PostProcessorType.TRIM_WHITESPACE),
  config: trimWhitespaceConfigSchema,
});

const PostProcessorSchema = z.discriminatedUnion('type', [TrimWhiteSpaceProcessorSchema]);

export const ScraperCreateHtmlSchema = z.object({
  name: z.string().min(1),
  type: z.literal(ScraperType.HTML),
  config: htmlScraperConfigurationSchema,
  postProcessors: z.array(PostProcessorSchema).optional(),
});
export const ScraperCreateApiSchema = z.object({
  name: z.string().min(1),
  type: z.literal(ScraperType.API),
  config: apiScraperConfigurationSchema,
  postProcessors: z.array(PostProcessorSchema).optional(),
});

export const ScraperCreateSchema = z.object({
  data: z.discriminatedUnion('type', [
    ScraperCreateApiSchema,
    ScraperCreateHtmlSchema,
  ]),
});

export const ScraperUpdateSchema = ScraperCreateSchema;

export const ScraperSchema = ScraperCreateSchema;


export const ScrapersListResponseSchema = z.object({
  items: z.array(ScraperSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

export const ScraperRunResponseSchema = z.object({
  ok: z.boolean(),
  jobId: z.union([z.string(), z.number()]).optional(),
});

export class ListQueryDto extends createZodDto(ListQuerySchema) {}
export class ScraperCreateDto extends createZodDto(ScraperCreateSchema) {}
export class ScraperUpdateDto extends createZodDto(ScraperUpdateSchema) {}
export class ScraperDto extends createZodDto(ScraperSchema) {}
export class ScrapersListResponseDto extends createZodDto(
  ScrapersListResponseSchema,
) {}
export class ScraperRunResponseDto extends createZodDto(
  ScraperRunResponseSchema,
) {}
