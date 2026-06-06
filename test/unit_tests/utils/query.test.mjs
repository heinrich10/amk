import { describe, it } from 'node:test';
import { expect } from 'expect';

import { extractQueryParams } from '../../../src/utils/query.js';

describe('utils test', () => {
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
});
