import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  listPopularCifraClubSongs,
  searchCifraClub,
} from './cifraclub.search.js';
import { getCifraClubSong } from './cifraclub.service.js';

const songParamsSchema = z.object({
  artist: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  song: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
});

const songQuerySchema = z.object({
  version: z.enum(['default', 'simplified']).default('default'),
});

const searchQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(10),
  q: z.string().trim().min(1).max(120),
});

const popularSongsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

export async function cifraClubRoutes(app: FastifyInstance) {
  app.get('/search', async (request) => {
    const query = searchQuerySchema.parse(request.query);

    return searchCifraClub({
      limit: query.limit,
      query: query.q,
    });
  });

  app.get('/popular-songs', async (request) => {
    const query = popularSongsQuerySchema.parse(request.query);

    return listPopularCifraClubSongs({
      limit: query.limit,
    });
  });

  app.get('/artists/:artist/songs/:song', async (request) => {
    const params = songParamsSchema.parse(request.params);
    const query = songQuerySchema.parse(request.query);

    return getCifraClubSong({
      ...params,
      version: query.version,
    });
  });
}
