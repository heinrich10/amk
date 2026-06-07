import { BaseModel } from './base.js';

export class Continent extends BaseModel {
  constructor() {
    super('continents');
  }

  async get(): Promise<unknown[]> {
    return this.getDB().select('code', 'name');
  }

  async getByCode(code: string): Promise<unknown> {
    return this.getDB()
      .where({ code })
      .select('code', 'name')
      .first();
  }
}
