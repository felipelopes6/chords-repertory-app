import { describe, expect, it } from 'vitest';

import { parseCifraClubSong } from './cifraclub.parser.js';

describe('parseCifraClubSong', () => {
  it('extracts metadata, YouTube URL, canonical URL, and cifra lines', () => {
    const result = parseCifraClubSong(
      `
        <html>
          <head>
            <link rel="canonical" href="https://www.cifraclub.com.br/coldplay/the-scientist/">
            <script>window.song = { youtubeId: 'RB-RcX5DS5A' }</script>
          </head>
          <body>
            <div class="g-1 g-fix cifra">
              <h1 class="t1">The Scientist</h1>
              <h2 class="t3"><a href="/coldplay/">Coldplay</a></h2>
              <p>tom: C#m</p>
              <div class="cifra_cnt">
                <pre>[Intro] C#m7 A9

C#m7             A9
Tell me your secrets</pre>
              </div>
            </div>
          </body>
        </html>
      `,
      'https://www.cifraclub.com.br/coldplay/the-scientist/',
    );

    expect(result).toEqual({
      artist: 'Coldplay',
      name: 'The Scientist',
      originalKey: 'C#m',
      youtubeUrl: 'https://www.youtube.com/watch?v=RB-RcX5DS5A',
      cifraclubUrl: 'https://www.cifraclub.com.br/coldplay/the-scientist/',
      cifra: [
        '[Intro] C#m7 A9',
        '',
        'C#m7             A9',
        'Tell me your secrets',
      ],
    });
  });
});
