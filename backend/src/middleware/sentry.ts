import type { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';

export function sentryErrorHandler(err: Error, _req: Request, _res: Response, next: NextFunction) {
  Sentry.captureException(err);
  next(err);
}
