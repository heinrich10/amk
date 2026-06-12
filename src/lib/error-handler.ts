import { ErrorRequestHandler } from 'express';
import { env } from '../../config/config.js';

interface AppError {
  statusCode?: number;
  message: string;
  name?: string;
  errors?: unknown;
  stack?: string;
}

export const errorHandler = (): ErrorRequestHandler => {
  return (err, _req, res, _next) => {
    const appErr = err as AppError;
    const statusCode = appErr.statusCode ?? 500;
    const message = appErr.message || 'Internal Server Error';

    const response: { message: string; errors?: unknown; stack?: string } = { message };

    if (appErr.name === 'ValidationError' && appErr.errors) {
      response.errors = appErr.errors;
    }

    if (env.NODE_ENV !== 'production') {
      response.stack = appErr.stack;
    }

    res.status(statusCode).json(response);
  };
};
