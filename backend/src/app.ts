import cors from '@fastify/cors';
import Fastify from 'fastify';
import { ZodError } from 'zod';

import {
  ExternalServiceError,
  ResourceNotFoundError,
} from './domain/errors.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { AuthError, ConflictError } from './modules/auth/auth.service.js';
import { cifraClubRoutes } from './modules/cifraclub/cifraclub.routes.js';
import { repertoryRoutes } from './modules/repertory/repertory.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow all origins in development and production
      cb(null, true);
    },
    credentials: true,
    allowedHeaders: [
      'authorization',
      'content-type',
      'x-requested-with',
      'accept',
      'accept-version',
      'content-length',
      'content-md5',
      'date',
      'x-api-version',
      'x-csrf-token',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  });

  app.get('/health', async () => ({
    status: 'ok',
  }));

  await app.register(authRoutes);
  await app.register(cifraClubRoutes);
  await app.register(repertoryRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Parâmetros inválidos.',
        details: error.issues,
      });
    }

    if (
      error instanceof ResourceNotFoundError ||
      error instanceof ExternalServiceError ||
      error instanceof AuthError ||
      error instanceof ConflictError
    ) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
      });
    }

    app.log.error(error);

    return reply.status(500).send({
      error: 'InternalServerError',
      message: 'Erro interno do servidor.',
    });
  });

  return app;
}
