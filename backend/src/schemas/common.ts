import { z } from 'zod';

export const idParam = z.string().min(8, 'ID tidak valid (min 8 karakter)');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const searchFilterSchema = z.object({
  search: z.string().optional(),
});

export function parseId(id: string | undefined): string | null {
  const result = idParam.safeParse(id);
  return result.success ? result.data : null;
}

export function parseIntSafe(val: string | undefined, defaultVal: number, min: number, max: number): number {
  const n = parseInt(val || String(defaultVal), 10);
  if (isNaN(n)) return defaultVal;
  return Math.max(min, Math.min(max, n));
}
