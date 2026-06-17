import { z } from 'zod';

export const evaluateSchema = z.object({
  pedagogical: z.number().int().min(1, 'Min 1').max(5, 'Max 5'),
  professional: z.number().int().min(1, 'Min 1').max(5, 'Max 5'),
  social: z.number().int().min(1, 'Min 1').max(5, 'Max 5'),
  feedback: z.string().min(1, 'Catatan evaluasi wajib diisi'),
});
