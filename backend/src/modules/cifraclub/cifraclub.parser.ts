import * as cheerio from 'cheerio';

import { ExternalServiceError } from '../../domain/errors.js';
import type { CifraClubSong } from './cifraclub.schema.js';

const YOUTUBE_ID_PATTERN =
  /youtubeId\s*:\s*['"](?<id>[\w-]{6,})['"]|youtube_id["']?\s*:\s*["'](?<jsonId>[\w-]{6,})["']/i;

export function parseCifraClubSong(html: string, fallbackUrl: string) {
  const $ = cheerio.load(html);
  const name = normalizeText($('.cifra h1.t1').first().text() || $('h1.t1').first().text());
  const artist = normalizeText(
    $('.cifra h2.t3 a').first().text() || $('h2.t3 a').first().text(),
  );
  const canonicalUrl = $('link[rel="canonical"]').attr('href') ?? fallbackUrl;
  const cifraText = $('.cifra_cnt pre').first().text();
  const cifra = normalizeCifra(cifraText);
  const originalKey = extractOriginalKey($('body').text());
  const youtubeUrl = extractYouTubeUrl(html);

  if (!name || !artist || cifra.length === 0) {
    throw new ExternalServiceError(
      'Não foi possível extrair a cifra do Cifra Club.',
    );
  }

  return {
    artist,
    name,
    originalKey,
    youtubeUrl,
    cifraclubUrl: canonicalUrl,
    cifra,
  } satisfies CifraClubSong;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeCifra(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''));
}

function extractYouTubeUrl(html: string) {
  const match = html.match(YOUTUBE_ID_PATTERN);
  const videoId = match?.groups?.id ?? match?.groups?.jsonId;

  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

function extractOriginalKey(text: string) {
  const match = text.match(/\btom:\s*(?<key>[A-G](?:#|b)?m?)\b/i);

  return match?.groups?.key ?? null;
}
