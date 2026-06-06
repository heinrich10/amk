import { Request, Response } from 'express';
import { Continent } from '../model/continent.js';

export class ContinentController {
  private continent: Continent;

  constructor({ continent }: { continent: Continent }) {
    this.continent = continent;
  }

  async getContinent(_req: Request, res: Response) {
    const rs = await this.continent.get();
    res.json(rs);
  }

  async getOneContinent(req: Request, res: Response) {
    const code = String(req.params.code);
    const rs = await this.continent.getByCode(code);
    res.json(rs || {});
  }
}
