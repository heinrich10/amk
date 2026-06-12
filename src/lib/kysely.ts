import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';

import { Config } from '../../config/config.js';
import { DB } from '../db-schema.js';

const database = new Database(Config.DB);

export const db = new Kysely<DB>({
  dialect: new SqliteDialect({
    database,
  }),
});
