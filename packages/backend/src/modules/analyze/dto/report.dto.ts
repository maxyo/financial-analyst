import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { isoDate } from '../../../dto/utils';
import { ReportStructureName } from '../entities/report/report-structure';

export const ReportCreateSchema = z.object({
  profileId: z.coerce.number().int().positive(),
  type: ReportStructureName,
  content: z.string(),
  llmModel: z.string(),
  tokensIn: z.coerce.number().int().nonnegative(),
  tokensOut: z.coerce.number().int().nonnegative(),
  cost: z.coerce.number().nonnegative(),
});

export const ReportUpdateSchema = z
  .object({
    type: ReportStructureName,
    content: z.string(),
    llmModel: z.string(),
    tokensIn: z.coerce.number().int().nonnegative(),
    tokensOut: z.coerce.number().int().nonnegative(),
    cost: z.coerce.number().nonnegative(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });

export const ReportSchema = z.object({
  id: z.uuid(),
  profileId: z.number().int().positive().nullable(),
  type: z.string().nullable(),
  content: z.string().nullable(),
  llmModel: z.string().nullable(),
  createdAt: isoDate,
  tokensIn: z.number().int().nonnegative().nullable(),
  tokensOut: z.number().int().nonnegative().nullable(),
  cost: z.number().nonnegative().nullable(),
});

export const ReportsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  profileId: z.coerce.number().int().positive().optional(),
});

export const ReportsListResponseSchema = z.object({
  items: z.array(ReportSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

export class ReportDto extends createZodDto(ReportSchema) {}
export class ReportCreateDto extends createZodDto(ReportCreateSchema) {}
export class ReportUpdateDto extends createZodDto(ReportUpdateSchema) {}
export class ReportsListQueryDto extends createZodDto(ReportsListQuerySchema) {}
export class ReportsListResponseDto extends createZodDto(
  ReportsListResponseSchema,
) {}
