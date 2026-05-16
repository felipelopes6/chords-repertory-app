import { describe, expect, it, vi } from 'vitest';

import { searchCifraClub } from './cifraclub.search.js';

describe('searchCifraClub', () => {
  it('returns probable matches and highlights the exact match', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        json: async () => ({
          response: {
            docs: [
              {
                art: 'Coldplay',
                dns: 'coldplay',
                imgm: 'https://akamai.sscdn.co/coldplay.jpg',
                score: 80,
                tipo: '2',
                txt: 'Yellow',
                url: 'yellow',
              },
              {
                art: 'Coldplay',
                dns: 'coldplay',
                imgm: 'https://akamai.sscdn.co/coldplay.jpg',
                score: 70,
                tipo: '2',
                txt: 'The Scientist',
                url: 'the-scientist',
              },
            ],
          },
        }),
        ok: true,
      })),
    );

    const result = await searchCifraClub({
      limit: 10,
      query: 'coldplay the scientist',
    });

    vi.unstubAllGlobals();

    expect(result.bestMatch).toMatchObject({
      type: 'song',
      title: 'The Scientist',
      artist: 'Coldplay',
      artistSlug: 'coldplay',
      songSlug: 'the-scientist',
      matchType: 'exact',
    });
    expect(result.exactMatch?.title).toBe('The Scientist');
    expect(result.results).toHaveLength(2);
  });
});
