import { PersonSchema, QueryPersonSchema } from './person.mjs';
import { QueryCountrySchema } from './country.mjs';

export const schemas = {
  personRequestSchema: PersonSchema,
  queryPersonSchema: QueryPersonSchema,
  queryCountrySchema: QueryCountrySchema,
};
