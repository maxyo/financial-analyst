import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { isoDate } from '../../../../../dto/utils';
import { DocumentType } from '../entities/document.entity';

export const DocumentsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  title: z.string().optional(),
  q: z.string().optional(),
  scraperId: z.uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const ScraperShortSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export const DocumentCreateSchema = z.object({
  title: z.string().min(1),
  scraperId: z.uuid(),
  content: z.any(),
  scrapedAt: z.union([z.string(), z.iso.date()]).optional(),
  contentHash: z.string().optional(),
});

export const DocumentUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    content: z.any().optional(),
    scraperId: z.string().uuid().optional(),
    scrapedAt: z.union([z.string(), z.iso.date()]).optional(),
    type: z.enum(DocumentType),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });

export const DocumentSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  content: z.string(),
  scraper: ScraperShortSchema,
  scrapedAt: isoDate,
  date: isoDate,
  meta: z.record(z.string(), z.union([z.string(), z.number()])),
  type: z.enum(DocumentType),
  contentHash: z.string(),
});

export const DocumentsListResponseSchema = z.object({
  items: z.array(DocumentSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

export class DocumentsListQueryDto extends createZodDto(DocumentsListQuerySchema) {}
export class DocumentCreateDto extends createZodDto(DocumentCreateSchema) {}
export class DocumentUpdateDto extends createZodDto(DocumentUpdateSchema) {}
export class DocumentDto extends createZodDto(DocumentSchema) {}
export class DocumentsListResponseDto extends createZodDto(DocumentsListResponseSchema) {}
