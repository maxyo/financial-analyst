import { z } from 'zod';
import { util } from 'zod/v3';

import objectKeys = util.objectKeys;

const ReportStructureBase = z.object({
  type: z.string(),
});

export const ArticleStructureSchema = ReportStructureBase.extend({
  type: z.literal('json'),
  data: z.object({
    observations: z.array(z.string()),
    quotes: z.array(z.string()),
  }),
});
export const MDStructureSchema = ReportStructureBase.extend({
  type: z.literal('md'),
  content: z.string(),
});

export const reportStructures = {
  md: MDStructureSchema,
  article: ArticleStructureSchema,
} as const;

export const ReportStructureName = z.enum(objectKeys(reportStructures) as (keyof typeof reportStructures)[]);
