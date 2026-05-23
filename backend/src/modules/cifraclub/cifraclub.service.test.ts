import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCifraClubSong } from './cifraclub.service.js';

describe('getCifraClubSong', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to Cifra Club YouTube search when song metadata has no video id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          `
            <html>
              <head>
                <link rel="canonical" href="https://www.cifraclub.com.br/demuvi/ficar-aqui/">
                <script>
                  window.__pageArgs = {
                    song: {
                      videoId: '',
                      youtubeId: ''
                    }
                  };
                </script>
              </head>
              <body>
                <div class="g-1 g-fix cifra">
                  <h1 class="t1">Ficar Aqui</h1>
                  <h2 class="t3"><a href="/demuvi/">Demúvi</a></h2>
                  <div class="cifra_cnt">
                    <pre><b>G</b>
Quando a minha alma reconhece quem tu és</pre>
                  </div>
                </div>
              </body>
            </html>
          `,
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({
          items: [
            {
              id: {
                kind: 'youtube#video',
                videoId: '2gcvjfRYvyQ',
              },
            },
          ],
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const result = await getCifraClubSong({
      artist: 'demuvi',
      song: 'ficar-aqui',
    });

    expect(result.youtubeUrl).toBe(
      'https://www.youtube.com/watch?v=2gcvjfRYvyQ',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      'https://solr.sscdn.co/youtube/v3/search',
    );
  });
});
