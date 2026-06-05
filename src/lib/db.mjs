import knex from 'knex';

import { Config } from '../../config/config.mjs'

const isMemoryDb = Config.DB === ':memory:';

export const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: Config.DB
  },
  useNullAsDefault: true,
  pool: isMemoryDb ? { min: 1, max: 1 } : undefined,
});
