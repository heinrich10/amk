import { ValidationError } from '../lib/error.mjs';
import { PersonSchema } from '../schema/person.mjs';
import { extract } from '../utils/query.mjs';

export class PersonController {
  constructor({ person }) {
    this.person = person;
  }

  async getAll(req, res) {
    const { query } = req;
    const validKey = ['first_name', 'last_name', 'country_code'];
    const [q, sort, pagination] = extract(query, validKey);
    const person = await this.person.get({ q, sort, pagination });
    res.json(person);
  }

  async getOne(req, res) {
    const { code } = req.params;
    const person = await this.person.getById(code);
    res.json(person);
  }

  async createPerson(req, res) {
    const { body } = req;
    const result = PersonSchema.safeParse(body);
    if (result.success) {
      const person = await this.person.save(result.data);
      res.json(person[0]);
    } else {
      const error = new ValidationError('Validation failed');
      error.errors = result.error.errors;
      throw error;
    }
  }
}
