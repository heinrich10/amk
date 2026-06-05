export const errorHandler = () => {
  return (err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    const response = { message };

    if (err.name === 'ValidationError' && err.errors) {
      response.errors = err.errors;
    }

    if (process.env.NODE_ENV !== 'production') {
      response.stack = err.stack;
    }

    res.status(statusCode).json(response);
  };
};
