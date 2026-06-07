import { Request, Response } from 'express';
import { Country } from '../model/country.js';
import { extract } from '../utils/query.js';

export class CountryController {
  private country: Country;

  constructor({ country }: { country: Country }) {
    this.country = country;
  }

  async getCountry(req: Request, res: Response) {
    const code = String(req.params.code);
    const country = await this.country.getByCode(code);
    res.json(country);
  }

  async getAll(req: Request, res: Response) {
    const { query } = req;
    const validKeys = ['name', 'phone', 'symbol', 'capital', 'currency', 'continent_code', 'alpha_3'];
    const [q, sort, pagination] = extract(query as Record<string, unknown>, validKeys);
    const country = await this.country.get({ q, sort, pagination });
    res.json(country);
  }
}
