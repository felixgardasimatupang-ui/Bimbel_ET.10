import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

interface HttpError extends Error {
  statusCode?: number;
  status?: number;
  expose?: boolean;
  details?: unknown;
}

export function errorHandler(err: HttpError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || err.status || 500;
  const isExposed = err.expose === true || statusCode < 500;

  if (statusCode >= 500) {
    logger.error(err, 'Internal server error');
  } else if (statusCode >= 400) {
    logger.warn({ err: err.message, statusCode }, 'Client error');
  }

  res.status(statusCode).json({
    success: false,
    error: isExposed ? err.message : (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message),
    ...(err.details ? { details: err.details } : {}),
  });
}
