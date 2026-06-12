import { describe, it, beforeEach, afterEach, after } from 'node:test';
import request from 'supertest';
import { expect } from 'expect';

import { app } from '../../src/api.js';
import { up, down, teardown } from '../index.js';
import { paginationHelper as pgHelper } from './helper.js';
import { CountryItem, PaginatedResponse } from '../../src/types/api-response.js';

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;
const DEFAULT_LENGTH = 252;

const paginationHelper = async ({ path, params }: { path: string; params: Record<string, unknown> }) => {
  const res = await pgHelper({ client: request(app), path, params });
  const body = res.body as PaginatedResponse<CountryItem>;
  const [first] = body.data;
  expect(first).toHaveProperty('code');
  expect(first).toHaveProperty('name');
  expect(first).not.toHaveProperty('continent');
  return res;
};

describe('/countries API test', () => {
  beforeEach(async () => {
    await up();
  });
  afterEach(async () => {
    await down();
  });
  after(async () => {
    await teardown();
  });
  describe('GET /countries', () => {
    it('Should return first 10 countries if no limit is provided', async () => {
      const res = await paginationHelper({ path: '/countries', params: {} });
      const body = res.body as PaginatedResponse<CountryItem>;
      const { data, total, offset, limit } = body;
      const [first] = data;
      expect(total).toBe(DEFAULT_LENGTH);
      expect(offset).toBe(DEFAULT_OFFSET);
      expect(limit).toBe(DEFAULT_LIMIT);
      expect(data).toHaveLength(DEFAULT_LIMIT);
      expect(first).toHaveProperty('code', 'AF');
      expect(first).toHaveProperty('name', 'Afghanistan');
    });
    it('Should return next 10 countries if limit and offset is 10', async () => {
      const argOffset = 10;
      const params = { limit: DEFAULT_LIMIT, offset: argOffset };
      const res = await paginationHelper({ path: '/countries', params });
      const body = res.body as PaginatedResponse<CountryItem>;
      const { data, total, offset, limit } = body;
      const [first] = data;
      expect(total).toBe(DEFAULT_LENGTH);
      expect(offset).toBe(argOffset);
      expect(limit).toBe(DEFAULT_LIMIT);
      expect(data).toHaveLength(DEFAULT_LIMIT);
      expect(first).toHaveProperty('code', 'AR');
      expect(first).toHaveProperty('name', 'Argentina');
    });
    it('Should return 1 when limit is 1', async () => {
      const argLimit = 1;
      const params = { limit: argLimit, offset: DEFAULT_OFFSET };
      const res = await paginationHelper({ path: '/countries', params });
      const body = res.body as PaginatedResponse<CountryItem>;
      const { data, total, offset, limit } = body;
      const [first] = data;
      expect(total).toBe(DEFAULT_LENGTH);
      expect(offset).toBe(DEFAULT_OFFSET);
      expect(limit).toBe(argLimit);
      expect(data).toHaveLength(argLimit);
      expect(first).toHaveProperty('code', 'AF');
      expect(first).toHaveProperty('name', 'Afghanistan');
    });
    it('Should sort by name in descending order if sort=-name', async () => {
      const argSort = '-name';
      const argLimit = 1;
      const params = { limit: argLimit, offset: DEFAULT_OFFSET, sort: argSort };
      const res = await paginationHelper({ path: '/countries', params });
      const body = res.body as PaginatedResponse<CountryItem>;
      const { data, total, offset, limit } = body;
      const [first] = data;
      expect(total).toBe(DEFAULT_LENGTH);
      expect(offset).toBe(DEFAULT_OFFSET);
      expect(limit).toBe(argLimit);
      expect(data).toHaveLength(argLimit);
      expect(first).toHaveProperty('code', 'ZW');
      expect(first).toHaveProperty('name', 'Zimbabwe');
    });
    it('Should not sort if key is wrong', async () => {
      const argSort = 'random';
      const argLimit = 1;
      const params = { limit: argLimit, offset: DEFAULT_OFFSET, sort: argSort };
      const res = await paginationHelper({ path: '/countries', params });
      const body = res.body as PaginatedResponse<CountryItem>;
      const { data, total, offset, limit } = body;
      const [first] = data;
      expect(total).toBe(DEFAULT_LENGTH);
      expect(offset).toBe(DEFAULT_OFFSET);
      expect(limit).toBe(argLimit);
      expect(data).toHaveLength(argLimit);
      expect(first).toHaveProperty('code', 'AF');
      expect(first).toHaveProperty('name', 'Afghanistan');
    });
    it('Should return filtered results if a filter is provided', async () => {
      const argQ = { name: 'unite' };
      const argLimit = 1;
      const params = { limit: argLimit, offset: DEFAULT_OFFSET, ...argQ };
      const res = await paginationHelper({ path: '/countries', params });
      const body = res.body as PaginatedResponse<CountryItem>;
      const { data, total, offset, limit } = body;
      const [first] = data;
      expect(total).toBe(5);
      expect(offset).toBe(DEFAULT_OFFSET);
      expect(limit).toBe(argLimit);
      expect(data).toHaveLength(argLimit);
      expect(first).toHaveProperty('code', 'TZ');
      expect(first).toHaveProperty('name', 'Tanzania, United Republic of');
    });
    it('Should return results if a filter is incorrect', async () => {
      const argQ = { wrongKey: 'unite' };
      const argLimit = 1;
      const params = { limit: argLimit, offset: DEFAULT_OFFSET, ...argQ };
      const res = await paginationHelper({ path: '/countries', params });
      const body = res.body as PaginatedResponse<CountryItem>;
      const { data, total, offset, limit } = body;
      const [first] = data;
      expect(total).toBe(DEFAULT_LENGTH);
      expect(offset).toBe(DEFAULT_OFFSET);
      expect(limit).toBe(argLimit);
      expect(data).toHaveLength(argLimit);
      expect(first).toHaveProperty('code', 'AF');
      expect(first).toHaveProperty('name', 'Afghanistan');
    });
  });
  describe('GET /countries/:id', () => {
    it('Should return a continent with the given id', async () => {
      const res = await request(app)
        .get('/countries/AS')
        .expect('Content-Type', /json/)
        .expect(200);
      const body = res.body as CountryItem;
      expect(body).toBeInstanceOf(Object);
      expect(body).toHaveProperty('code', 'AS');
      expect(body).toHaveProperty('name', 'American Samoa');
      expect(body.continent).toHaveProperty('code', 'OC');
      expect(body.continent).toHaveProperty('name', 'Oceania');
    });
    it('Should return 404 if the continent with the given id does not exist', async () => {
      const res = await request(app)
        .get('/countries/XX')
        .expect('Content-Type', /json/)
        .expect(200);
      const body = res.body as Record<string, unknown>;
      expect(body).toEqual({});
    });
  });
});
