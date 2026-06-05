import express from 'express';

const router = express.Router();

export const countryRouter = (countryController) => {
  router.get('/:code', countryController.getCountry.bind(countryController));
  router.get('/', countryController.getAll.bind(countryController));
  return router;
}
