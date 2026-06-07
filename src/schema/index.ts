import { PersonSchema, QueryPersonSchema } from './person.js';
import { QueryCountrySchema } from './country.js';

export const schemas = {
  personRequestSchema: PersonSchema,
  queryPersonSchema: QueryPersonSchema,
  queryCountrySchema: QueryCountrySchema,
} as const;
