import { z } from 'zod';

export const QueryCountrySchema = z.object({
  name: z.string().optional(),
  phone: z.coerce.number().optional(),
  symbol: z.string().optional(),
  capital: z.string().optional(),
  currency: z.string().optional(),
  continent_code: z.string().optional(),
  alpha_3: z.string().optional(),
}).partial();
