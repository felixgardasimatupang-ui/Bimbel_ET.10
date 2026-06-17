import * as Sentry from '@sentry/node';
import logger from '../utils/logger.js';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry disabled: SENTRY_DSN not set');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
    integrations: [
      Sentry.expressIntegration(),
      Sentry.httpIntegration(),
      Sentry.prismaIntegration(),
    ],
  });

  logger.info('Sentry initialized for backend');
}

export { sentryErrorHandler } from '../middleware/sentry.js';
