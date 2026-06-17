import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_URL_DIRECT: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_DEFAULT_ROLE: z.enum(['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'GURU', 'SISWA', 'WALI_MURID']).default('ADMIN'),
  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be at least 8 chars'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 chars'),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
});

export function validateEnv(env: Record<string, string | undefined>) {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues
      .filter((i) => i.code === 'invalid_type' && i.received === 'undefined')
      .map((i) => i.path.join('.'));
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    throw new Error(`Environment validation failed: ${result.error.message}`);
  }
  return result.data;
}

export type EnvConfig = z.infer<typeof envSchema>;
export { envSchema };
