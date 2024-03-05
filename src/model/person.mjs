import { db } from '../lib/db.mjs';

export class Person {
  constructor() {
    this.dbName = 'persons';
  }

  async get() {
    return db(this.dbName).select();
  }

  async getByCode(code) {
    return db(this.dbName).where({ code }).first();
  }
}