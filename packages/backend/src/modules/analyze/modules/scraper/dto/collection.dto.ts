import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
// Classes for nestjs-zod

export const CollectionFiltersSchema = z.any();

export const CollectionCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  filters: CollectionFiltersSchema.nullable().optional(),
});

export const CollectionUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    filters: CollectionFiltersSchema.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });

export const CollectionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  filters: CollectionFiltersSchema.nullable(),
  created_at: z.iso.date(),
  updated_at: z.iso.date(),
});

export const CollectionsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().optional(),
});

export const CollectionsListResponseSchema = z.object({
  items: z.array(CollectionSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

export const CollectionDocumentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const DocumentSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  content: z.string(),
  scraperId: z.string(),
  contentHash: z.string(),
  scrapedAt: z.iso.date(),
});

export class CollectionDto extends createZodDto(CollectionSchema) {}
export class CollectionCreateDto extends createZodDto(CollectionCreateSchema) {}
export class CollectionUpdateDto extends createZodDto(CollectionUpdateSchema) {}
export class CollectionsListQueryDto extends createZodDto(
  CollectionsListQuerySchema,
) {}
export class CollectionsListResponseDto extends createZodDto(
  CollectionsListResponseSchema,
) {}
export class CollectionDocumentsQueryDto extends createZodDto(
  CollectionDocumentsQuerySchema,
) {}
export class DocumentDto extends createZodDto(DocumentSchema) {}
