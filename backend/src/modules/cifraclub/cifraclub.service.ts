import { ExternalServiceError, ResourceNotFoundError } from '../../domain/errors.js';
import { toCifraClubSlug } from '../../utils/slug.js';
import { parseCifraClubSong } from './cifraclub.parser.js';
import { cifraClubSongSchema } from './cifraclub.schema.js';

const CIFRA_CLUB_BASE_URL = 'https://www.cifraclub.com.br';
const CIFRA_CLUB_FETCH_TIMEOUT_MS = 8_000;
const YOUTUBE_SEARCH_BASE_URL = 'https://solr.sscdn.co/youtube/v3/search';
const YOUTUBE_SEARCH_FETCH_TIMEOUT_MS = 5_000;

type GetCifraClubSongInput = {
  artist: string;
  song: string;
  version?: 'default' | 'simplified';
};

export async function getCifraClubSong({
  artist,
  song,
  version = 'default',
}: GetCifraClubSongInput) {
  const url = buildCifraClubSongUrl(artist, song, version);
  const response = await fetchCifraClubSong(url);

  if (response.status === 404) {
    throw new ResourceNotFoundError('Cifra não encontrada no Cifra Club.');
  }

  if (!response.ok) {
    throw new ExternalServiceError(
      `Cifra Club respondeu com status ${response.status}.`,
    );
  }

  const html = await response.text();
  let parsedSong = parseCifraClubSong(html, url);

  if (!parsedSong.youtubeUrl) {
    const youtubeUrl = await searchYouTubeVideoUrl(
      `${parsedSong.artist} - ${parsedSong.name}`,
    );

    if (youtubeUrl) {
      parsedSong = {
        ...parsedSong,
        youtubeUrl,
      };
    }
  }

  if (version === 'simplified' && parsedSong.version !== 'simplified') {
    throw new ResourceNotFoundError(
      'Versão simplificada não encontrada no Cifra Club.',
    );
  }

  return cifraClubSongSchema.parse(parsedSong);
}

async function fetchCifraClubSong(url: string) {
  try {
    return await fetch(url, {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'user-agent':
          'Mozilla/5.0 (compatible; RepertorioMusicalBot/1.0; +https://localhost)',
      },
      signal: AbortSignal.timeout(CIFRA_CLUB_FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new ExternalServiceError(
      'Não foi possível buscar a cifra no Cifra Club.',
    );
  }
}

async function searchYouTubeVideoUrl(query: string) {
  const url = new URL(YOUTUBE_SEARCH_BASE_URL);

  url.searchParams.set('maxResults', '10');
  url.searchParams.set('order', 'relevance');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('safeSearch', 'moderate');
  url.searchParams.set('type', 'video');
  url.searchParams.set('v', '2');
  url.searchParams.set('videoEmbeddable', 'true');

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(YOUTUBE_SEARCH_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as unknown;
    const items = isRecord(data) && Array.isArray(data.items) ? data.items : [];

    const video = items.find((item) => {
      if (!isRecord(item) || !isRecord(item.id)) {
        return false;
      }

      return (
        item.id.kind === 'youtube#video' &&
        typeof item.id.videoId === 'string' &&
        item.id.videoId.length > 0
      );
    });

    if (!isRecord(video) || !isRecord(video.id)) {
      return null;
    }

    return `https://www.youtube.com/watch?v=${video.id.videoId}`;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function buildCifraClubSongUrl(
  artist: string,
  song: string,
  version: 'default' | 'simplified' = 'default',
) {
  const artistSlug = toCifraClubSlug(artist);
  const songSlug = toCifraClubSlug(song);

  if (!artistSlug || !songSlug) {
    throw new ResourceNotFoundError('Artista ou música inválidos.');
  }

  const suffix = version === 'simplified' ? 'simplificada.html' : '';

  return `${CIFRA_CLUB_BASE_URL}/${artistSlug}/${songSlug}/${suffix}`;
}
