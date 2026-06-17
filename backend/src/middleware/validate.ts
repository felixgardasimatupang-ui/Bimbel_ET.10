import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateSource = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: ValidateSource = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const error = result.error as ZodError;
      const fieldErrors = error.flatten().fieldErrors;
      const formErrors = error.flatten().formErrors;

      res.status(400).json({
        success: false,
        error: 'Validasi gagal',
        details: fieldErrors,
        ...(formErrors.length > 0 ? { formErrors } : {}),
      });
      return;
    }
    req[source] = result.data;
    next();
  };
}
