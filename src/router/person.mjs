import express from 'express';

const router = express.Router();
const jsonParser = express.json();

export const personRouter = (personController) => {
  router.get('/', personController.getAll.bind(personController));
  router.get('/:code', personController.getOne.bind(personController));
  router.post('/', jsonParser, personController.createPerson.bind(personController));
  return router;
}
