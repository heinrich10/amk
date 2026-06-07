import { Router } from 'express';
import { CountryController } from '../controller/country.js';

const router = Router();

export const countryRouter = (countryController: CountryController) => {
  router.get('/:code', countryController.getCountry.bind(countryController));
  router.get('/', countryController.getAll.bind(countryController));
  return router;
};
