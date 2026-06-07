import express, { Router } from 'express';
import { PersonController } from '../controller/person.js';

const router = Router();

export const personRouter = (personController: PersonController) => {
  router.get('/', personController.getAll.bind(personController));
  router.get('/:code', personController.getOne.bind(personController));
  router.post('/', express.json(), personController.createPerson.bind(personController));
  return router;
};
