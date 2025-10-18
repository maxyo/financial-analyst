import { z } from 'zod';

export const isoDate = z
  .union([z.iso.date(), z.date(), z.string()])
  .transform((v) => (v instanceof Date ? v.toISOString() : v));
