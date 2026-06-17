import { z } from 'zod';
import { searchFilterSchema } from './common.js';

export const createMaterialSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  subject: z.string().min(1, 'Subjek wajib diisi'),
  targetLevel: z.string().min(1, 'Tingkat kelas wajib diisi'),
  type: z.enum(['PDF', 'VIDEO', 'TUGAS']),
  isLocked: z.boolean().optional().default(false),
});

export const listMaterialSchema = searchFilterSchema.extend({
  subjectFilter: z.string().optional(),
});

export const materialIdSchema = z.object({
  id: z.string().min(8, 'ID materi tidak valid'),
});
