import { db } from '../lib/db.mjs';
import { personRequestSchema } from '../schema/person.mjs';
import { ajv } from '../lib/ajv.mjs';
export class Person {
  constructor() {
    this.dbName = 'persons'
    this.db = db(this.dbName);
    this.validate = ajv.getSchema('personRequestSchema');
  }

  async get() {
    return this.db.select();
  }

  async getById(id) {
    return this.db.where({ id }).first();
  }

  async save(data){
    this.validate(data);
    return this.db.insert(data, ['id', 'first_name', 'last_name', 'country_code']);
  }

  async update(id, data) {
    this.validate(data);
    return this.db.where({ id }).update(data, ['id', 'first_name', 'last_name', 'country_code']);
  }
}