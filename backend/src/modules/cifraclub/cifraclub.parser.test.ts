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
              <a id="side-simp" href="/coldplay/the-scientist/simplificada.html">Simplificar cifra</a>
              <span id="cifra_tom">tom: C#m (forma dos acordes no tom de Am)</span>
              <span id="cifra_capo">Capotraste na 4ª casa</span>
              <div class="cifra_cnt">
                <pre>[Intro] <b>C#m7</b> <b>A9</b>

<b>C#m7</b>             <b>A9</b>
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
      version: 'default',
      originalKey: 'C#m',
      capo: {
        chordShapeKey: 'Am',
        fret: 4,
        text: 'Capotraste na 4ª casa',
      },
      youtubeUrl: 'https://www.youtube.com/watch?v=RB-RcX5DS5A',
      cifraclubUrl: 'https://www.cifraclub.com.br/coldplay/the-scientist/',
      simplifiedUrl:
        'https://www.cifraclub.com.br/coldplay/the-scientist/simplificada.html',
      cifra: [
        '[Intro] C#m7 A9',
        '',
        'C#m7             A9',
        'Tell me your secrets',
      ],
      cifraLines: [
        [
          { text: '[Intro] ', type: 'text' },
          { text: 'C#m7', type: 'chord' },
          { text: ' ', type: 'text' },
          { text: 'A9', type: 'chord' },
        ],
        [],
        [
          { text: 'C#m7', type: 'chord' },
          { text: '             ', type: 'text' },
          { text: 'A9', type: 'chord' },
        ],
        [{ text: 'Tell me your secrets', type: 'text' }],
      ],
    });
  });
});
