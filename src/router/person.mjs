import express from 'express';
import wrap from 'amk-wrap';

const router = express.Router();
const jsonParser = express.json();

export const personRouter = (personController) => {
  router.get('/', wrap(personController, 'getPerson'));
  // router.get('/:code', wrap(countryController, 'getOneContinent'));
  return router;
}