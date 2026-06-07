import { ErrorRequestHandler } from 'express';

export const errorHandler = (): ErrorRequestHandler => {
  return (err, _req, res, _next) => {
    const statusCode = (err as { statusCode?: number }).statusCode || 500;
    const message = err.message || 'Internal Server Error';

    const response: { message: string; errors?: unknown; stack?: string } = { message };

    if (err.name === 'ValidationError' && (err as { errors?: unknown }).errors) {
      response.errors = (err as { errors?: unknown }).errors;
    }

    if (process.env.NODE_ENV !== 'production') {
      response.stack = err.stack;
    }

    res.status(statusCode).json(response);
  };
};
