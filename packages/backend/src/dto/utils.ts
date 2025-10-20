import { z } from 'zod';

export const isoDate = z
  .union([z.iso.date(), z.string()]);
