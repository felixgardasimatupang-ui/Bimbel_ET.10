import { Request, Response, NextFunction } from 'express';
import { getSentryModule } from '../lib/sentry.js';

export function sentryErrorHandler(err: Error, _req: Request, _res: Response, next: NextFunction) {
  const sentry = getSentryModule();
  if (sentry) {
    const Sentry = sentry as any;
    Sentry.captureException(err);
  }
  next(err);
}
