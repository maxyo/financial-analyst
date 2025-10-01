import type { Request } from 'express';

export const getQ = (req: Request, key: string): string | undefined => {
  const v = (req.query as Record<string, unknown>)[key];
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : String(v[0]);
  return v != null ? String(v) : undefined;
};

export const getN = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const errorMessage = (e: unknown, fallback = 'internal error'): string => {
  if (e instanceof Error) return e.message;
  return typeof e === 'string' ? e : fallback;
};
