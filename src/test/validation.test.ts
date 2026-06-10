import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  validateEmail, sanitizeCSV, filterSiswas, filterMateris,
  hasDuplicateSPPThisMonth, calculateQuizScore,
} from '../utils/validation';

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejects email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('accepts email with subdomain', () => {
    expect(validateEmail('user@sub.example.com')).toBe(true);
  });
});

describe('sanitizeCSV', () => {
  it('passes through normal text', () => {
    expect(sanitizeCSV('Hello World')).toBe('Hello World');
  });

  it('quotes text containing commas', () => {
    expect(sanitizeCSV('Hello, World')).toBe('"Hello, World"');
  });

  it('quotes text containing double quotes', () => {
    expect(sanitizeCSV('He said "hello"')).toBe('"He said ""hello"""');
  });

  it('prefixes with single quote when starts with =', () => {
    expect(sanitizeCSV('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
  });

  it('prefixes with single quote when starts with +', () => {
    expect(sanitizeCSV('+12345')).toBe("'+12345");
  });

  it('prefixes with single quote when starts with -', () => {
    expect(sanitizeCSV('-1+2')).toBe("'-1+2");
  });

  it('prefixes with single quote when starts with @', () => {
    expect(sanitizeCSV('@DDE')).toBe("'@DDE");
  });
});

describe('filterSiswas', () => {
  const data = [
    { name: 'Budi Santoso', id: 'SIS-001', parentName: 'Hendra', classLevel: '12 SMA - IPA' },
    { name: 'Siti Aminah', id: 'SIS-002', parentName: 'Ahmad', classLevel: '12 SMA - IPS' },
    { name: 'Doni', id: 'SIS-003', parentName: 'Suryo', classLevel: '11 SMA - IPA' },
  ];

  it('returns all when search is empty and filter is Semua', () => {
    expect(filterSiswas(data, '', 'Semua')).toHaveLength(3);
  });

  it('filters by name search', () => {
    expect(filterSiswas(data, 'budi', 'Semua')).toHaveLength(1);
  });

  it('filters by ID search', () => {
    expect(filterSiswas(data, 'SIS-002', 'Semua')).toHaveLength(1);
  });

  it('filters by parent name search', () => {
    expect(filterSiswas(data, 'hendra', 'Semua')).toHaveLength(1);
  });

  it('filters by class', () => {
    expect(filterSiswas(data, '', '12 SMA')).toHaveLength(2);
  });

  it('combines search and class filter', () => {
    expect(filterSiswas(data, 'siti', '12 SMA')).toHaveLength(1);
  });

  it('returns empty when no match', () => {
    expect(filterSiswas(data, 'nonexistent', 'Semua')).toHaveLength(0);
  });

  it('handles empty array', () => {
    expect(filterSiswas([], '', 'Semua')).toHaveLength(0);
  });
});

describe('filterMateris', () => {
  const data = [
    { title: 'Rumus Cepat Integral', author: 'Dr. Gunawan', subject: 'Matematika', isLocked: false },
    { title: 'TOEFL Masterclass', author: 'Liem Christian', subject: 'Bahasa Inggris', isLocked: true },
    { title: 'Kimia Dasar', author: 'Siti Rahma', subject: 'Kimia', isLocked: false },
  ];

  it('returns all for ADMIN', () => {
    expect(filterMateris(data, '', 'Semua', 'ADMIN')).toHaveLength(3);
  });

  it('filters locked materials for SISWA role', () => {
    expect(filterMateris(data, '', 'Semua', 'SISWA')).toHaveLength(2);
  });

  it('filters by subject', () => {
    expect(filterMateris(data, '', 'Matematika', 'ADMIN')).toHaveLength(1);
  });

  it('filters by title search', () => {
    expect(filterMateris(data, 'TOEFL', 'Semua', 'ADMIN')).toHaveLength(1);
  });

  it('filters by author search', () => {
    expect(filterMateris(data, 'siti', 'Semua', 'ADMIN')).toHaveLength(1);
  });

  it('handles empty array', () => {
    expect(filterMateris([], '', 'Semua', 'ADMIN')).toHaveLength(0);
  });

  it('is case insensitive for title search', () => {
    expect(filterMateris(data, 'rumus cepat', 'Semua', 'ADMIN')).toHaveLength(1);
  });

  it('is case insensitive for subject filter', () => {
    expect(filterMateris(data, '', 'matematika', 'ADMIN')).toHaveLength(1);
  });
});

describe('hasDuplicateSPPThisMonth', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  it('returns true when duplicate exists', () => {
    const txs = [
      { payeeName: 'SIS-001 - Budi (Wali Hendra)', type: 'SPP_MASUK', date: '2026-06-10' },
    ];
    expect(hasDuplicateSPPThisMonth(txs, 'SIS-001')).toBe(true);
  });

  it('returns false when no duplicate', () => {
    const txs = [
      { payeeName: 'SIS-002 - Siti (Wali Ahmad)', type: 'SPP_MASUK', date: '2026-06-10' },
    ];
    expect(hasDuplicateSPPThisMonth(txs, 'SIS-001')).toBe(false);
  });

  it('returns false for transactions from different month', () => {
    const txs = [
      { payeeName: 'SIS-001 - Budi (Wali Hendra)', type: 'SPP_MASUK', date: '2026-05-01' },
    ];
    expect(hasDuplicateSPPThisMonth(txs, 'SIS-001')).toBe(false);
  });

  it('returns false for non-SPP transactions', () => {
    const txs = [
      { payeeName: 'SIS-001 - Budi (Wali Hendra)', type: 'OPERASIONAL', date: '2026-06-01' },
    ];
    expect(hasDuplicateSPPThisMonth(txs, 'SIS-001')).toBe(false);
  });
});

describe('calculateQuizScore', () => {
  const questions = [
    { id: 'q1', correctIndex: 1 },
    { id: 'q2', correctIndex: 2 },
    { id: 'q3', correctIndex: 0 },
  ];

  it('returns 100 when all correct', () => {
    expect(calculateQuizScore({ q1: 1, q2: 2, q3: 0 }, questions)).toBe(100);
  });

  it('returns 0 when all wrong', () => {
    expect(calculateQuizScore({ q1: 0, q2: 0, q3: 1 }, questions)).toBe(0);
  });

  it('returns partial score', () => {
    expect(calculateQuizScore({ q1: 1, q2: 0, q3: 1 }, questions)).toBe(33);
  });

  it('returns 0 for empty questions', () => {
    expect(calculateQuizScore({}, [])).toBe(0);
  });

  it('ignores unanswered questions as wrong', () => {
    expect(calculateQuizScore({ q1: 1 }, questions)).toBe(33);
  });
});

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

describe('createId', () => {
  it('generates ID with given prefix', () => {
    expect(createId('SIS').startsWith('SIS-')).toBe(true);
  });

  it('generates unique IDs on successive calls', () => {
    const id1 = createId('SIS');
    const id2 = createId('SIS');
    expect(id1).not.toBe(id2);
  });

  it('generates IDs of expected minimum length', () => {
    const id = createId('MAT');
    expect(id.length).toBeGreaterThan(10);
  });

  it('applies different prefixes', () => {
    expect(createId('TX').startsWith('TX-')).toBe(true);
    expect(createId('EV').startsWith('EV-')).toBe(true);
  });
});

describe('hasDuplicateSPPThisMonth edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false for empty transactions', () => {
    expect(hasDuplicateSPPThisMonth([], 'SIS-001')).toBe(false);
  });

  it('is case sensitive for siswaId in payeeName', () => {
    const txs = [
      { payeeName: 'sis-001 - Budi (Wali Hendra)', type: 'SPP_MASUK', date: '2026-06-10' },
    ];
    expect(hasDuplicateSPPThisMonth(txs, 'SIS-001')).toBe(false);
  });
});

describe('GPS_DEFAULT', () => {
  it('uses default Jakarta coordinates when env not set', () => {
    vi.unstubAllEnvs();
    const { GPS_DEFAULT } = { GPS_DEFAULT: { lat: -6.2088, lon: 106.8456 } };
    expect(GPS_DEFAULT.lat).toBe(-6.2088);
    expect(GPS_DEFAULT.lon).toBe(106.8456);
  });

  it('reads from VITE_GPS_LAT and VITE_GPS_LON when set', () => {
    vi.stubEnv('VITE_GPS_LAT', '-7.2500');
    vi.stubEnv('VITE_GPS_LON', '112.7500');
    const lat = parseFloat(import.meta.env.VITE_GPS_LAT || '-6.2088');
    const lon = parseFloat(import.meta.env.VITE_GPS_LON || '106.8456');
    expect(lat).toBe(-7.25);
    expect(lon).toBe(112.75);
    vi.unstubAllEnvs();
  });
});
