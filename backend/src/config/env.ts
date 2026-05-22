import './load-env.js';

import { z } from 'zod';

const envSchema = z.object({
  FRONTEND_ORIGINS: z.string().optional(),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URL: z.string().min(1, 'MONGODB_URL is required'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
});

export const env = envSchema.parse(process.env);

const defaultDevelopmentOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export const allowedFrontendOrigins =
  env.FRONTEND_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ??
  (env.NODE_ENV === 'production' ? [] : defaultDevelopmentOrigins);
