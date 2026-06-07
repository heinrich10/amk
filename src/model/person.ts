import { PersonSchema } from '../schema/person.js';
import { BaseModel } from './base.js';
import { applySort, applyPagination, applyFilter } from '../utils/query.js';

export class Person extends BaseModel {
  constructor() {
    super('persons');
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
      qs.select('id', 'first_name', 'last_name', 'country_code'),
    ]);
    return {
      total,
      limit,
      offset,
      data: rs,
    };
  }

  async getById(id: string | number): Promise<Record<string, unknown>> {
    const rs = await this.getDB()
      .join('countries', 'persons.country_code', 'countries.code')
      .join('continents', 'countries.continent_code', 'continents.code')
      .where({ id })
      .select(
        'persons.id as id',
        'persons.first_name as first_name',
        'persons.last_name as last_name',
        'persons.country_code as country_code',
        'countries.name as country_name',
        'countries.phone as phone',
        'countries.symbol as symbol',
        'countries.capital as capital',
        'countries.currency as currency',
        'countries.alpha_3 as alpha_3',
        'continents.name as continent_name',
        'continents.code as continent_code',
      ).first() as Record<string, unknown> || {};

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
    PersonSchema.parse(data);
    return this.getDB().insert(data, ['id', 'first_name', 'last_name', 'country_code']);
  }

  async update(id: string | number, data: Record<string, unknown>): Promise<unknown[]> {
    PersonSchema.parse(data);
    return this.getDB().where({ id }).update(data, ['id', 'first_name', 'last_name', 'country_code']);
  }
}
