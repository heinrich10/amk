import { sql } from 'kysely';
import { db } from '../lib/kysely.js';
import { DB } from '../db-schema.js';
import { applyFilter } from '../utils/query.js';

export class Country {
  async get({ q = {}, sort = {}, pagination = {} }: {
    q?: Record<string, unknown>;
    sort?: { key?: string; order?: 'asc' | 'desc' };
    pagination?: { limit?: number; offset?: number };
  }): Promise<Record<string, unknown>> {
    const { limit, offset } = pagination;
    let query = db.selectFrom('countries')
      .select(['code', 'name', 'phone', 'symbol', 'capital', 'currency', 'alpha_3'])
      .where(applyFilter<DB, 'countries'>(q));
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
    const result = await db.selectFrom('countries')
      .where(applyFilter<DB, 'countries'>(q))
      .select((eb) => eb.fn.countAll().as('count'))
      .executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  async getByCode(code: string): Promise<Record<string, unknown>> {
    const rs = (await db.selectFrom('countries')
      .innerJoin('continents', 'countries.continent_code', 'continents.code')
      .where('countries.code', '=', code)
      .select([
        'countries.code',
        'countries.name',
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
      code: rs.code,
      name: rs.name,
      phone: rs.phone,
      symbol: rs.symbol,
      capital: rs.capital,
      currency: rs.currency,
      alpha_3: rs.alpha_3,
    };

    if (rs.continent_name || rs.continent_code) {
      res.continent = {
        code: rs.continent_code,
        name: rs.continent_name,
      };
    }
    return res;
  }
}
