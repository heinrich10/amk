import { describe, it, beforeEach, afterEach, after } from 'node:test';
import request from 'supertest';
import { expect } from 'expect';

import { app } from '../../src/api.mjs';
import { up, down, teardown } from '../index.mjs';

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
    it('Should return all continents', () => {
      return request(app)
        .get('/continents')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          const {body} = res;
          expect(body).toBeInstanceOf(Array);
          expect(body).toHaveLength(7);
        });
    });
  });
  describe('GET /continents/:id', () => {
    it('Should return a continent with the given id', () => {
      return request(app)
        .get('/continents/AS')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          const { body } = res;
          expect(body).toBeInstanceOf(Object);
          expect(body).toHaveProperty('code', 'AS');
          expect(body).toHaveProperty('name', 'Asia');
      });
    });
    it('Should return 404 if the continent with the given id does not exist', () => {
      return request(app)
        .get('/continents/XX')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          const { body } = res;
          expect(body).toEqual({});
      });
    });
  });
});
