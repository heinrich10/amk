import express from 'express';

const router = express.Router();

export const continentRouter = (continentController) => {
  router.get('/', continentController.getContinent.bind(continentController));
  router.get('/:code', continentController.getOneContinent.bind(continentController));
  return router;
}
