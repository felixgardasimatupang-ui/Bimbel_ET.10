import { createRequire } from 'module';
import logger from '../utils/logger.js';

const _require = createRequire(import.meta.url);

let sentryModule: Record<string, unknown> | null = null;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry disabled: SENTRY_DSN not set');
    return;
  }

  try {
    sentryModule = _require('@sentry/node');
    const Sentry = sentryModule as any;
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
    logger.info('Sentry initialized for backend');
  } catch {
    logger.warn('Sentry not available — @sentry/node not installed');
  }
}

export function getSentryModule() {
  return sentryModule;
}
