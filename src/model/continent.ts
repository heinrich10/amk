import { db } from '../lib/kysely.js';

export class Continent {
  async get(): Promise<unknown[]> {
    return db.selectFrom('continents').select(['code', 'name']).execute();
  }

  async getByCode(code: string): Promise<unknown> {
    return db.selectFrom('continents')
      .where('code', '=', code)
      .select(['code', 'name'])
      .executeTakeFirst();
  }
}
