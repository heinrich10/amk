import { Request, Response } from 'express';
import { ValidationError } from '../lib/error.js';
import { PersonSchema } from '../schema/person.js';
import { Person } from '../model/person.js';
import { extract } from '../utils/query.js';

export class PersonController {
  private person: Person;

  constructor({ person }: { person: Person }) {
    this.person = person;
  }

  async getAll(req: Request, res: Response) {
    const { query } = req;
    const validKey = ['first_name', 'last_name', 'country_code'];
    const [q, sort, pagination] = extract(query, validKey);
    const person = await this.person.get({ q, sort, pagination });
    res.json(person);
  }

  async getOne(req: Request, res: Response) {
    const code = String(req.params.code);
    const person = await this.person.getById(code);
    res.json(person);
  }

  async createPerson(req: Request, res: Response) {
    const body = req.body as Record<string, unknown>;
    const result = PersonSchema.safeParse(body);
    if (result.success) {
      const person = await this.person.save(result.data);
      res.json(person[0]);
    } else {
      const error = new ValidationError('Validation failed');
      error.errors = result.error.issues;
      throw error;
    }
  }
}
