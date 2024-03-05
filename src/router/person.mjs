import express from 'express';
import wrap from 'amk-wrap';

const router = express.Router();
const jsonParser = express.json();

export const personRouter = (personController) => {
  router.get('/', personController.getAll.bind(personController));
  // router.get('/:code', wrap(personController, 'getOneContinent'));
  router.post('/', jsonParser, personController.createPerson.bind(personController));
  return router;
}