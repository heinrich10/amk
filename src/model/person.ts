import { Insertable, Updateable, sql } from 'kysely';
import { PersonSchema } from '../schema/person.js';
import { db } from '../lib/kysely.js';
import { DB } from '../db-schema.js';
import { applyFilter } from '../utils/query.js';

export class Person {
  async get({ q = {}, sort = {}, pagination = {} }: {
    q?: Record<string, unknown>;
    sort?: { key?: string; order?: 'asc' | 'desc' };
    pagination?: { limit?: number; offset?: number };
  }): Promise<Record<string, unknown>> {
    const { limit, offset } = pagination;
    let query = db.selectFrom('persons')
      .select(['id', 'first_name', 'last_name', 'country_code'])
      .where(applyFilter<DB, 'persons'>(q));
    if (sort.key && sort.order) {
      query = query.orderBy(sql.ref(sort.key), sort.order);
    }
    if (pagination.limit) {
      query = query.limit(pagination.limit);
    }
    if (pagination.offset !== undefined) {
      query = query.offset(pagination.offset);
    }
    const [total, data] = await Promise.all([
      this.getCount(q),
      query.execute(),
    ]);
    return {
      total,
      limit,
      offset,
      data,
    };
  }

  async getCount(q: Record<string, unknown> = {}): Promise<number> {
    const result = await db.selectFrom('persons')
      .where(applyFilter<DB, 'persons'>(q))
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  async getById(id: string | number): Promise<Record<string, unknown>> {
    const rs = (await db.selectFrom('persons')
      .innerJoin('countries', 'persons.country_code', 'countries.code')
      .innerJoin('continents', 'countries.continent_code', 'continents.code')
      .where('persons.id', '=', Number(id))
      .select([
        'persons.id',
        'persons.first_name',
        'persons.last_name',
        'persons.country_code',
        'countries.name as country_name',
        'countries.phone',
        'countries.symbol',
        'countries.capital',
        'countries.currency',
        'countries.alpha_3',
        'continents.name as continent_name',
        'continents.code as continent_code',
      ])
      .executeTakeFirst() ?? {}) as Record<string, unknown>;

    const res: Record<string, unknown> = {
      id: rs.id,
      first_name: rs.first_name,
      last_name: rs.last_name,
    };

    if (rs.country_code) {
      res.country = {
        code: rs.country_code,
        name: rs.country_name,
        phone: rs.phone,
        symbol: rs.symbol,
        capital: rs.capital,
        currency: rs.currency,
        alpha_3: rs.alpha_3,
      };
      if (rs.continent_code) {
        (res.country as Record<string, unknown>).continent = {
          code: rs.continent_code,
          name: rs.continent_name,
        };
      }
    }

    return res;
  }

  async save(data: Record<string, unknown>): Promise<unknown[]> {
    const parsed = PersonSchema.parse(data);
    return db.insertInto('persons')
      .values(parsed as Insertable<DB['persons']>)
      .returning(['id', 'first_name', 'last_name', 'country_code'])
      .execute();
  }

  async update(id: string | number, data: Record<string, unknown>): Promise<unknown[]> {
    const parsed = PersonSchema.parse(data);
    return db.updateTable('persons')
      .set(parsed as Updateable<DB['persons']>)
      .where('id', '=', Number(id))
      .returning(['id', 'first_name', 'last_name', 'country_code'])
      .execute();
  }
}
