import { BaseModel } from './base.js';
import { applySort, applyFilter, applyPagination } from '../utils/query.js';

export class Country extends BaseModel {
  constructor() {
    super('countries');
  }

  async get({ q = {}, sort = {}, pagination = {} }: {
    q?: Record<string, unknown>;
    sort?: { key?: string; order?: 'asc' | 'desc' };
    pagination?: { limit?: number; offset?: number };
  }): Promise<Record<string, unknown>> {
    const { limit, offset } = pagination;
    const qs = applyFilter(q)(this.getDB()) as import('knex').Knex.QueryBuilder;
    applySort(sort)(qs);
    applyPagination(pagination)(qs);
    const [total, rs] = await Promise.all([
      this.getCount(q),
      qs.select(
        'code',
        'name',
        'phone',
        'symbol',
        'capital',
        'currency',
        'alpha_3',
      ),
    ]);

    return {
      total,
      limit,
      offset,
      data: rs,
    };
  }

  async getByCode(code: string): Promise<Record<string, unknown>> {
    const rs = await this.getDB()
      .join('continents', 'countries.continent_code', 'continents.code')
      .where({ 'countries.code': code })
      .select(
        'countries.*', 'continents.name as continent_name', 'continents.code as continent_code',
      ).first() as Record<string, unknown> || {};

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
