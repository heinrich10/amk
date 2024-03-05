import { db } from '../lib/db.mjs';

export class Country {
  constructor() {
    this.dbName = 'countries';
  }

  async get() {
    return db(this.dbName).select();
  }

  async getByCode(code) {
    return db(this.dbName).where({ code }).first();
  }
}