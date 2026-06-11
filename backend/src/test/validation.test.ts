import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().min(1, 'Nama wajib diisi'),
});

const createStudentSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  classLevel: z.string().min(1, 'Kelas wajib diisi'),
  email: z.string().email('Email tidak valid'),
  parentName: z.string().optional().default('Tidak Diketahui'),
  parentEmail: z.string().optional().default(''),
  sppAmount: z.number().int().positive('SPP harus lebih dari 0'),
});

const evaluateSchema = z.object({
  pedagogical: z.number().int().min(1).max(5),
  professional: z.number().int().min(1).max(5),
  social: z.number().int().min(1).max(5),
  feedback: z.string().min(1, 'Catatan evaluasi wajib diisi'),
});

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid registration', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'invalid',
        password: 'password123',
        name: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '12345',
        name: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createStudentSchema', () => {
    it('accepts valid student data', () => {
      const result = createStudentSchema.safeParse({
        name: 'Budi Santoso',
        classLevel: '12 SMA - IPA',
        email: 'budi@example.com',
        sppAmount: 750000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parentName).toBe('Tidak Diketahui');
        expect(result.data.parentEmail).toBe('');
      }
    });

    it('rejects zero sppAmount', () => {
      const result = createStudentSchema.safeParse({
        name: 'Budi',
        classLevel: '12 SMA',
        email: 'budi@example.com',
        sppAmount: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = createStudentSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('evaluateSchema', () => {
    it('accepts valid evaluation', () => {
      const result = evaluateSchema.safeParse({
        pedagogical: 4,
        professional: 5,
        social: 3,
        feedback: 'Good teacher',
      });
      expect(result.success).toBe(true);
    });

    it('rejects score below 1', () => {
      const result = evaluateSchema.safeParse({
        pedagogical: 0,
        professional: 5,
        social: 3,
        feedback: 'Bad',
      });
      expect(result.success).toBe(false);
    });

    it('rejects score above 5', () => {
      const result = evaluateSchema.safeParse({
        pedagogical: 6,
        professional: 5,
        social: 3,
        feedback: 'Bad',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty feedback', () => {
      const result = evaluateSchema.safeParse({
        pedagogical: 4,
        professional: 4,
        social: 4,
        feedback: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('parseIntSafe utility', () => {
  function parseIntSafe(val: string | undefined, defaultVal: number, min: number, max: number): number {
    const n = parseInt(val || String(defaultVal), 10);
    if (isNaN(n)) return defaultVal;
    return Math.max(min, Math.min(max, n));
  }

  it('parses valid number string', () => {
    expect(parseIntSafe('5', 1, 1, 100)).toBe(5);
  });

  it('returns default for undefined', () => {
    expect(parseIntSafe(undefined, 10, 1, 100)).toBe(10);
  });

  it('clamps to min', () => {
    expect(parseIntSafe('0', 1, 1, 100)).toBe(1);
  });

  it('clamps to max', () => {
    expect(parseIntSafe('200', 50, 1, 100)).toBe(100);
  });

  it('returns default for NaN', () => {
    expect(parseIntSafe('abc', 25, 1, 100)).toBe(25);
  });
});
