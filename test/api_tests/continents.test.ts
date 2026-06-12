import { describe, it, beforeEach, afterEach, after } from 'node:test';
import request from 'supertest';
import { expect } from 'expect';

import { app } from '../../src/api.js';
import { up, down, teardown } from '../index.js';
import { ContinentResponse } from '../../src/types/api-response.js';

describe('/continents API test', () => {
  beforeEach(async () => {
    await up();
  });
  afterEach(async () => {
    await down();
  });
  after(async () => {
    await teardown();
  });
  describe('GET /continents', () => {
    it('Should return all continents', async () => {
      const res = await request(app)
        .get('/continents')
        .expect('Content-Type', /json/)
        .expect(200);
      const body = res.body as ContinentResponse[];
      expect(body).toBeInstanceOf(Array);
      expect(body).toHaveLength(7);
    });
  });
  describe('GET /continents/:id', () => {
    it('Should return a continent with the given id', async () => {
      const res = await request(app)
        .get('/continents/AS')
        .expect('Content-Type', /json/)
        .expect(200);
      const body = res.body as ContinentResponse;
      expect(body).toBeInstanceOf(Object);
      expect(body).toHaveProperty('code', 'AS');
      expect(body).toHaveProperty('name', 'Asia');
    });
    it('Should return 404 if the continent with the given id does not exist', async () => {
      const res = await request(app)
        .get('/continents/XX')
        .expect('Content-Type', /json/)
        .expect(200);
      const body = res.body as Record<string, unknown>;
      expect(body).toEqual({});
    });
  });
});
