import { describe, it, before, after } from 'node:test';
import { expect } from 'expect';
import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';

import { DB } from '../../../src/db-schema.js';
import { applyFilter, extractQueryParams } from '../../../src/utils/query.js';

describe('utils test', () => {
  let db: Kysely<DB>;

  before(() => {
    db = new Kysely<DB>({
      dialect: new SqliteDialect({
        database: new Database(':memory:'),
      }),
    });
  });

  after(async () => {
    await db.destroy();
  });

  describe('extractQueryParams', () => {
    it('Should extract query from the input with respect to validKeys', () => {
      const query = { name: 'John', age: 20 };
      const validKeys = ['name'];
      const result = extractQueryParams(query, validKeys);
      expect(result).toEqual({ name: 'John' });
    });
    it('Should return nothing if no validKeys', () => {
      const query = { name: 'John', age: 20 };
      const result = extractQueryParams(query, []);
      expect(result).toEqual({});
    });
    it('Should return nothing if no input', () => {
      const result = extractQueryParams();
      expect(result).toEqual({});
    });
  });

  describe('applyFilter', () => {
    it('Should use LIKE for fields containing name', () => {
      const query = db.selectFrom('persons')
        .selectAll()
        .where(applyFilter<DB, 'persons'>({ first_name: 'John' }));
      const compiled = query.compile();

      expect(compiled.sql.toLowerCase()).toContain('like');
      expect(compiled.parameters).toEqual(['%john%']);
    });

    it('Should use exact equality for non-name fields', () => {
      const query = db.selectFrom('persons')
        .selectAll()
        .where(applyFilter<DB, 'persons'>({ country_code: 'US' }));
      const compiled = query.compile();

      expect(compiled.sql.toLowerCase()).not.toContain('like');
      expect(compiled.parameters).toEqual(['US']);
    });

    it('Should AND multiple conditions together', () => {
      const query = db.selectFrom('persons')
        .selectAll()
        .where(applyFilter<DB, 'persons'>({ first_name: 'John', country_code: 'US' }));
      const compiled = query.compile();

      expect(compiled.sql.toLowerCase()).toContain('like');
      expect(compiled.sql.toLowerCase()).toContain('and');
      expect(compiled.parameters).toEqual(['%john%', 'US']);
    });

    it('Should return a no-op condition for empty filters', () => {
      const query = db.selectFrom('persons')
        .selectAll()
        .where(applyFilter<DB, 'persons'>({}));
      const compiled = query.compile();

      expect(compiled.parameters).toContain(1);
    });

    it('Should ignore undefined, null, and empty string values', () => {
      const query = db.selectFrom('persons')
        .selectAll()
        .where(applyFilter<DB, 'persons'>({
          first_name: '',
          last_name: null,
          country_code: undefined,
        }));
      const compiled = query.compile();

      expect(compiled.parameters).toContain(1);
      expect(compiled.parameters).not.toContain('');
      expect(compiled.parameters).not.toContain(null);
    });
  });
});
