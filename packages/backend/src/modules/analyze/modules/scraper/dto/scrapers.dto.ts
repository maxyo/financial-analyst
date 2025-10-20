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
  limit: z.coerce.number().int().min(1).max(200).default(50).describe('Количество элементов на странице'),
  offset: z.coerce.number().int().min(0).default(0).describe('Смещение для пагинации'),
}).describe('Параметры пагинации');

const TrimWhiteSpaceProcessorSchema = z.object({
  type: z.literal(PostProcessorType.TRIM_WHITESPACE).describe('Тип пост-обработчика: обрезка пробелов'),
  config: trimWhitespaceConfigSchema.describe('Настройки пост-обработчика TRIM_WHITESPACE'),
}).describe('Пост-обработчик TRIM_WHITESPACE');

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

// Output schemas include id inside data
const ScraperOutputHtmlSchema = ScraperCreateHtmlSchema.extend({ id: z.uuid(), topicId: z.number().int().positive().nullable().optional() });
const ScraperOutputApiSchema = ScraperCreateApiSchema.extend({ id: z.uuid(), topicId: z.number().int().positive().nullable().optional() });

export const ScraperSchema = z.object({
  data: z.discriminatedUnion('type', [
    ScraperOutputApiSchema,
    ScraperOutputHtmlSchema,
  ]),
});

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
