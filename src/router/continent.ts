import { Router } from 'express';
import { ContinentController } from '../controller/continent.js';

const router = Router();

export const continentRouter = (continentController: ContinentController) => {
  router.get('/', continentController.getContinent.bind(continentController));
  router.get('/:code', continentController.getOneContinent.bind(continentController));
  return router;
};
