import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/prisma/**',
        '**/coverage/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/**',
        '**/e2e/**',
        '**/scripts/**'
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
    },
    testTimeout: 10000,
    setupFiles: ['./src/test/setup.ts'],
  },
});