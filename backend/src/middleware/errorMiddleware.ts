import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    detail: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};
