import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { getBearerToken } from '../auth/auth.routes.js';
import { getUserByToken } from '../auth/auth.service.js';
import {
  addSongToRepertory,
  createRepertory,
  deleteRepertory,
  getPublicRepertory,
  listUserRepertories,
  removeSongFromRepertory,
  updateSongKeyOffset,
  updateSongSimplified,
} from './repertory.service.js';

const createRepertorySchema = z.object({
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
  name: z.string().min(1).max(120),
});

const addSongSchema = z.object({
  artist: z.string().min(1),
  artistSlug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  imageUrl: z.string().url().nullable().optional(),
  path: z.string().min(1).max(260).regex(/^\/[a-z0-9-]+\/[a-z0-9-]+\/?$/),
  songSlug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  url: z
    .string()
    .url()
    .refine((value) => new URL(value).origin === 'https://www.cifraclub.com.br'),
  originalKey: z.string().nullable().optional(),
});

const repertoryParamsSchema = z.object({
  id: z.string().uuid(),
});

const repertorySongParamsSchema = repertoryParamsSchema.extend({
  songId: z.string().uuid(),
});

const updateSongKeySchema = z.object({
  keyOffset: z.number().int().min(-24).max(24),
});

const updateSongSimplifiedSchema = z.object({
  isSimplified: z.boolean(),
});

export async function repertoryRoutes(app: FastifyInstance) {
  app.get('/repertories', async (request) => {
    const user = await getUserByToken(getBearerToken(request));

    return {
      repertories: await listUserRepertories(user),
    };
  });

  app.post('/repertories', async (request) => {
    const user = await getUserByToken(getBearerToken(request));
    const body = createRepertorySchema.parse(request.body);

    return createRepertory(user, body);
  });

  app.get('/repertories/:id', async (request) => {
    const params = repertoryParamsSchema.parse(request.params);

    return getPublicRepertory(params.id);
  });

  app.delete('/repertories/:id', async (request) => {
    const user = await getUserByToken(getBearerToken(request));
    const params = repertoryParamsSchema.parse(request.params);

    return deleteRepertory(user, params.id);
  });

  app.post('/repertories/:id/songs', async (request) => {
    const user = await getUserByToken(getBearerToken(request));
    const params = repertoryParamsSchema.parse(request.params);
    const body = addSongSchema.parse(request.body);

    return addSongToRepertory(user, params.id, body);
  });

  app.delete('/repertories/:id/songs/:songId', async (request) => {
    const user = await getUserByToken(getBearerToken(request));
    const params = repertorySongParamsSchema.parse(request.params);

    return removeSongFromRepertory(user, params.id, params.songId);
  });

  app.patch('/repertories/:id/songs/:songId/key', async (request) => {
    const user = await getUserByToken(getBearerToken(request));
    const params = repertorySongParamsSchema.parse(request.params);
    const body = updateSongKeySchema.parse(request.body);

    return updateSongKeyOffset(user, params.id, params.songId, body.keyOffset);
  });

  app.patch('/repertories/:id/songs/:songId/simplified', async (request) => {
    const user = await getUserByToken(getBearerToken(request));
    const params = repertorySongParamsSchema.parse(request.params);
    const body = updateSongSimplifiedSchema.parse(request.body);

    return updateSongSimplified(
      user,
      params.id,
      params.songId,
      body.isSimplified,
    );
  });
}
