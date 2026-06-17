import { z } from 'zod';
import { searchFilterSchema, paginationSchema } from './common.js';

export const createStudentSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  classLevel: z.string().min(1, 'Kelas wajib diisi'),
  email: z.string().email('Email tidak valid'),
  parentName: z.string().optional().default('Tidak Diketahui'),
  parentEmail: z.string().optional().default(''),
  sppAmount: z.number().int().positive('SPP harus lebih dari 0'),
});

export const listStudentSchema = searchFilterSchema.merge(paginationSchema).extend({
  classFilter: z.string().optional(),
});

export const checkinSchema = z.object({
  method: z.enum(['QR_SCAN', 'LOKASI', 'MANUAL']).optional().default('QR_SCAN'),
});
