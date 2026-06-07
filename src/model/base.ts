import { Knex } from 'knex';
import { db } from '../lib/db.js';
import { applyFilter } from '../utils/query.js';

export class BaseModel {
  protected dbName: string;

  constructor(dbName: string) {
    this.dbName = dbName;
  }

  getDB(): Knex.QueryBuilder {
    return db(this.dbName) as Knex.QueryBuilder;
  }

  async getCount(q: Record<string, unknown> = {}): Promise<number> {
    const db_ = applyFilter(q)(this.getDB()) as Knex.QueryBuilder;
    const rs = await db_.count('* as count').first() as { count: number };
    return rs.count;
  }
}
