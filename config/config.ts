const DB = process.env.DB || './dbdev.sqlite3.db';
const NODE_ENV = process.env.NODE_ENV || 'development';

export const Config = {
  DB,
  NODE_ENV,
} as const;
