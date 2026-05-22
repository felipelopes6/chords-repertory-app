import { ExternalServiceError, ResourceNotFoundError } from '../../domain/errors.js';
import { toCifraClubSlug } from '../../utils/slug.js';
import { parseCifraClubSong } from './cifraclub.parser.js';
import { cifraClubSongSchema } from './cifraclub.schema.js';

const CIFRA_CLUB_BASE_URL = 'https://www.cifraclub.com.br';

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
  const response = await fetch(url, {
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'user-agent':
        'Mozilla/5.0 (compatible; RepertorioMusicalBot/1.0; +https://localhost)',
    },
  });

  if (response.status === 404) {
    throw new ResourceNotFoundError('Cifra não encontrada no Cifra Club.');
  }

  if (!response.ok) {
    throw new ExternalServiceError(
      `Cifra Club respondeu com status ${response.status}.`,
    );
  }

  const html = await response.text();
  const parsedSong = parseCifraClubSong(html, url);

  if (version === 'simplified' && parsedSong.version !== 'simplified') {
    throw new ResourceNotFoundError(
      'Versão simplificada não encontrada no Cifra Club.',
    );
  }

  return cifraClubSongSchema.parse(parsedSong);
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
