import express, { Express } from 'express';
import responseTime from 'response-time';

import { ContinentController } from './controller/continent.js';
import { Continent } from './model/continent.js';
import { continentRouter } from './router/continent.js';

import { CountryController } from './controller/country.js';
import { Country } from './model/country.js';
import { countryRouter } from './router/country.js';

import { PersonController } from './controller/person.js';
import { Person } from './model/person.js';
import { personRouter } from './router/person.js';

import { errorHandler } from './lib/error-handler.js';

const app: Express = express();

const continent = new Continent();
const country = new Country();
const person = new Person();

const continentController = new ContinentController({ continent });
const countryController = new CountryController({ country });
const personController = new PersonController({ person });

app.use(responseTime());
app.use('/persons', personRouter(personController));
app.use('/continents', continentRouter(continentController));
app.use('/countries', countryRouter(countryController));

app.use(errorHandler());

export { app };
