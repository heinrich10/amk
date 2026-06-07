import { z } from 'zod';

export const PersonSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  country_code: z.string().length(2),
});

export const QueryPersonSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  country_code: z.string().optional(),
});
