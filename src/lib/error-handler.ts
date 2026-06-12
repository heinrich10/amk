import { ErrorRequestHandler } from 'express';
import { Config } from '../../config/config.js';
import { HttpError } from '../types/error.js';

export const errorHandler = (): ErrorRequestHandler => {
  return (err, _req, res, _next) => {
    const appErr = err as HttpError;
    const statusCode = appErr.statusCode ?? 500;
    const message = appErr.message || 'Internal Server Error';

    const response: { message: string; errors?: unknown; stack?: string } = { message };

    if (appErr.name === 'ValidationError' && appErr.errors) {
      response.errors = appErr.errors;
    }

    if (Config.NODE_ENV !== 'production') {
      response.stack = appErr.stack;
    }

    res.status(statusCode).json(response);
  };
};
