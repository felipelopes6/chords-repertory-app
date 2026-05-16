import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getUserByToken, loginUser, registerUser } from './auth.service.js';

const credentialsSchema = z.object({
  password: z.string().min(6),
  username: z.string().min(3).max(40),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request) => {
    const credentials = credentialsSchema.parse(request.body);

    return registerUser(credentials);
  });

  app.post('/auth/login', async (request) => {
    const credentials = credentialsSchema.parse(request.body);

    return loginUser(credentials);
  });

  app.get('/me', async (request) => {
    return {
      user: await getUserByToken(getBearerToken(request)),
    };
  });
}

export function getBearerToken(request: FastifyRequest) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim();
}
