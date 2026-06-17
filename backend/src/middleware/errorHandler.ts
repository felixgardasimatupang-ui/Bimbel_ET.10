import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const statusCode = err.statusCode;
    if (statusCode >= 500) {
      logger.error(err, 'AppError');
    } else if (statusCode >= 400) {
      logger.warn({ err: err.message, statusCode }, 'AppError client');
    }

    res.status(statusCode).json({
      success: false,
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  const statusCode = 500;
  logger.error(err, 'Internal server error');

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}
