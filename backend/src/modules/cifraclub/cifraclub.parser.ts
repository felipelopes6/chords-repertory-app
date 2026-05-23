import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

import { ExternalServiceError } from '../../domain/errors.js';
import type { CifraClubSong } from './cifraclub.schema.js';

type ChordSegment = {
  text: string;
  type: 'text' | 'chord';
};

const YOUTUBE_ID_PATTERN =
  /youtubeId\s*:\s*['"](?<id>[\w-]{6,})['"]|youtube_id["']?\s*:\s*["'](?<jsonId>[\w-]{6,})["']/i;

export function parseCifraClubSong(html: string, fallbackUrl: string) {
  const $ = cheerio.load(html);
  const name = normalizeText($('.cifra h1.t1').first().text() || $('h1.t1').first().text());
  const artist = normalizeText(
    $('.cifra h2.t3 a').first().text() || $('h2.t3 a').first().text(),
  );
  const canonicalUrl = $('link[rel="canonical"]').attr('href') ?? fallbackUrl;
  const version = isSimplifiedUrl(canonicalUrl) ? 'simplified' : 'default';
  const simplifiedUrl =
    resolveCifraClubUrl($('#side-simp').attr('href'), canonicalUrl) ??
    (version === 'simplified' ? canonicalUrl : null);
  const cifraLines = extractCifraLines($);
  const cifra = cifraLines.map((line) =>
    line.map((segment) => segment.text).join(''),
  );
  const originalKey = extractOriginalKey($('body').text());
  const capo = extractCapo($);
  const youtubeUrl = extractYouTubeUrl(html);

  if (!name || !artist || cifra.length === 0) {
    throw new ExternalServiceError(
      'Não foi possível extrair a cifra do Cifra Club.',
    );
  }

  return {
    artist,
    name,
    version,
    originalKey,
    capo,
    youtubeUrl,
    cifraclubUrl: canonicalUrl,
    simplifiedUrl,
    cifra,
    cifraLines,
  } satisfies CifraClubSong;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function extractYouTubeUrl(html: string) {
  const match = html.match(YOUTUBE_ID_PATTERN);
  const videoId = match?.groups?.id ?? match?.groups?.jsonId;

  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

function isSimplifiedUrl(url: string) {
  return /\/simplificada\.html(?:$|[?#])/.test(url);
}

function resolveCifraClubUrl(value: string | undefined, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractOriginalKey(text: string) {
  const match = text.match(/\btom:\s*(?<key>[A-G](?:#|b)?m?)\b/i);

  return match?.groups?.key ?? null;
}

function extractCapo($: cheerio.CheerioAPI) {
  const capoText = normalizeText(
    $('#cifra_capo').first().text() ||
      ($('body').text().match(/Capotraste\s+(?:na|no|em)\s+\d+(?:ª|º)?\s+casa/i)?.[0] ??
        ''),
  );
  const capoMatch = capoText.match(/(?<fret>\d+)(?:ª|º)?\s+casa/i);

  if (!capoText || !capoMatch?.groups?.fret) {
    return null;
  }

  const chordShapeKeyMatch = normalizeText($('#cifra_tom').first().text()).match(
    /forma dos acordes no tom de (?<key>[A-G](?:#|b)?m?)/i,
  );

  return {
    chordShapeKey: chordShapeKeyMatch?.groups?.key ?? null,
    fret: Number.parseInt(capoMatch.groups.fret, 10),
    text: capoText,
  };
}

function extractCifraLines($: cheerio.CheerioAPI) {
  const pre = $('.cifra_cnt pre').first();
  const lines: ChordSegment[][] = [[]];

  function appendText(value: string, type: ChordSegment['type']) {
    const normalizedValue = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const parts = normalizedValue.split('\n');

    parts.forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }

      if (part) {
        lines.at(-1)?.push({
          text: part,
          type,
        });
      }
    });
  }

  function walk(node: AnyNode, inheritedType: ChordSegment['type']) {
    if (node.type === 'text') {
      appendText(node.data ?? '', inheritedType);
      return;
    }

    if (node.type !== 'tag') {
      return;
    }

    if (node.name === 'br') {
      lines.push([]);
      return;
    }

    const nextType =
      node.name === 'b' || node.name === 'strong' ? 'chord' : inheritedType;

    node.children.forEach((child) => walk(child, nextType));
  }

  pre.contents()
    .toArray()
    .forEach((node) => walk(node, 'text'));

  return trimTrailingWhitespace(lines);
}

function trimTrailingWhitespace(lines: ChordSegment[][]) {
  return lines.map((line) => {
    const clonedLine = line.map((segment) => ({ ...segment }));

    while (clonedLine.length > 0) {
      const lastSegment = clonedLine.at(-1);

      if (!lastSegment) {
        break;
      }

      const trimmedText = lastSegment.text.replace(/\s+$/g, '');

      if (trimmedText) {
        lastSegment.text = trimmedText;
        break;
      }

      clonedLine.pop();
    }

    return clonedLine;
  });
}
