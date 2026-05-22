import { ExternalServiceError } from '../../domain/errors.js';
import type { CifraClubSearchResult } from './cifraclub.schema.js';
import { cifraClubSearchSchema } from './cifraclub.schema.js';

const CIFRA_CLUB_BASE_URL = 'https://www.cifraclub.com.br';
const CIFRA_CLUB_SEARCH_URL = 'https://solr.sscdn.co/cc/c7/';
const CIFRA_CLUB_SEARCH_TIMEOUT_MS = 8_000;
const safeSlugPattern = /^[a-z0-9-]{1,120}$/;

type SearchCifraClubInput = {
  limit: number;
  query: string;
};

type ListPopularCifraClubSongsInput = {
  limit: number;
};

type SolrSearchResponse = {
  response?: {
    docs?: SolrSearchDocument[];
  };
};

type SolrSearchDocument = {
  art?: string;
  dns?: string;
  imgm?: string;
  score?: number;
  tipo?: string;
  txt?: string;
  url?: string;
};

type RankedCifraClubSearchResult = CifraClubSearchResult & {
  score: number;
};

const POPULAR_SONGS: CifraClubSearchResult[] = [
  popularSong(
    'Evidências',
    'Chitãozinho & Xororó',
    'chitaozinho-xororo',
    'evidencias',
  ),
  popularSong('Trem-Bala', 'Ana Vilela', 'ana-vilela', 'trem-bala'),
  popularSong('Yellow', 'Coldplay', 'coldplay', 'yellow'),
  popularSong(
    'Velha Infância',
    'Tribalistas',
    'tribalistas',
    'velha-infancia',
  ),
  popularSong(
    'Thinking Out Loud',
    'Ed Sheeran',
    'ed-sheeran',
    'thinking-out-loud',
  ),
  popularSong(
    'Pais e Filhos',
    'Legião Urbana',
    'legiao-urbana',
    'pais-e-filhos',
  ),
  popularSong('Wonderwall', 'Oasis', 'oasis', 'wonderwall'),
  popularSong('Creep', 'Radiohead', 'radiohead', 'creep'),
  popularSong(
    'Como É Grande o Meu Amor Por Você',
    'Roberto Carlos',
    'roberto-carlos',
    'como-e-grande-o-meu-amor-por-voce',
  ),
  popularSong(
    'Bohemian Rhapsody',
    'Queen',
    'queen',
    'bohemian-rhapsody',
  ),
  popularSong(
    'Garota de Ipanema',
    'Tom Jobim',
    'tom-jobim',
    'garota-de-ipanema',
  ),
  popularSong(
    'O Leãozinho',
    'Caetano Veloso',
    'caetano-veloso',
    'o-leaozinho',
  ),
  popularSong(
    'Águas de Março',
    'Elis Regina',
    'elis-regina',
    'aguas-de-marco',
  ),
  popularSong('Aquarela', 'Toquinho', 'toquinho', 'aquarela'),
  popularSong(
    'Anunciação',
    'Alceu Valença',
    'alceu-valenca',
    'anunciacao',
  ),
];

export async function searchCifraClub({ limit, query }: SearchCifraClubInput) {
  const searchUrl = new URL(CIFRA_CLUB_SEARCH_URL);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('limit', String(limit));

  const response = await fetchCifraClubSearch(searchUrl);

  if (!response.ok) {
    throw new ExternalServiceError(
      `Busca do Cifra Club respondeu com status ${response.status}.`,
    );
  }

  const payload = (await response.json()) as SolrSearchResponse;
  const results = (payload.response?.docs ?? [])
    .flatMap((document) => mapSolrDocumentToResult(document, query))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  const exactMatch =
    results.find((result) => result.matchType === 'exact') ?? null;

  return cifraClubSearchSchema.parse({
    query,
    results,
    bestMatch: results[0] ?? null,
    exactMatch,
  });
}

async function fetchCifraClubSearch(searchUrl: URL) {
  try {
    return await fetch(searchUrl, {
      headers: {
        accept: 'application/json',
        'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'user-agent':
          'Mozilla/5.0 (compatible; RepertorioMusicalBot/1.0; +https://localhost)',
      },
      signal: AbortSignal.timeout(CIFRA_CLUB_SEARCH_TIMEOUT_MS),
    });
  } catch {
    throw new ExternalServiceError(
      'Não foi possível buscar músicas no Cifra Club.',
    );
  }
}

export async function listPopularCifraClubSongs({
  limit,
}: ListPopularCifraClubSongsInput) {
  const results = shuffle(POPULAR_SONGS).slice(0, limit);

  return cifraClubSearchSchema.parse({
    query: 'popular',
    results,
    bestMatch: results[0] ?? null,
    exactMatch: null,
  });
}

function popularSong(
  title: string,
  artist: string,
  artistSlug: string,
  songSlug: string,
): RankedCifraClubSearchResult {
  const path = `/${artistSlug}/${songSlug}/`;

  return {
    type: 'song',
    title,
    artist,
    artistSlug,
    songSlug,
    path,
    url: `${CIFRA_CLUB_BASE_URL}${path}`,
    imageUrl: null,
    score: 0,
    matchType: 'strong',
  };
}

function mapSolrDocumentToResult(
  document: SolrSearchDocument,
  query: string,
): RankedCifraClubSearchResult[] {
  if (
    document.tipo === '2' &&
    document.art &&
    document.dns &&
    document.txt &&
    document.url
  ) {
    if (!isSafeSlug(document.dns) || !isSafeSlug(document.url)) {
      return [];
    }

    const path = `/${document.dns}/${document.url}/`;
    const matchType = getMatchType(query, [document.txt, document.art]);

    return [
      {
        type: 'song',
        title: document.txt,
        artist: document.art,
        artistSlug: document.dns,
        songSlug: document.url,
        path,
        url: `${CIFRA_CLUB_BASE_URL}${path}`,
        imageUrl: getImageUrl(document.imgm),
        score: getRankScore(document.score, matchType),
        matchType,
      },
    ];
  }

  if (document.tipo === '1' && document.txt && document.dns) {
    if (!isSafeSlug(document.dns)) {
      return [];
    }

    const path = `/${document.dns}/`;
    const matchType = getMatchType(query, [document.txt]);

    return [
      {
        type: 'artist',
        title: document.txt,
        artist: null,
        artistSlug: document.dns,
        songSlug: null,
        path,
        url: `${CIFRA_CLUB_BASE_URL}${path}`,
        imageUrl: getImageUrl(document.imgm),
        score: getRankScore(document.score, matchType),
        matchType,
      },
    ];
  }

  return [];
}

function isSafeSlug(value: string) {
  return safeSlugPattern.test(value);
}

function getImageUrl(value: string | undefined) {
  return value && value.startsWith('https://') ? value : null;
}

function getRankScore(
  score: number | undefined,
  matchType: CifraClubSearchResult['matchType'],
) {
  const baseScore = score ?? 0;

  if (matchType === 'exact') {
    return baseScore + 1000;
  }

  if (matchType === 'strong') {
    return baseScore + 500;
  }

  return baseScore;
}

function getMatchType(
  query: string,
  parts: Array<string | null | undefined>,
): CifraClubSearchResult['matchType'] {
  const normalizedQuery = normalizeForSearch(query);
  const normalizedParts = parts
    .filter(Boolean)
    .map((part) => normalizeForSearch(part ?? ''));
  const combined = normalizedParts.join(' ');
  const reversibleCombined = [...normalizedParts].reverse().join(' ');
  const tokens = normalizedQuery.split(' ').filter(Boolean);

  if (normalizedQuery === combined || normalizedQuery === reversibleCombined) {
    return 'exact';
  }

  if (tokens.length > 0 && tokens.every((token) => combined.includes(token))) {
    return 'strong';
  }

  return 'partial';
}

function normalizeForSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentItem = shuffled[index];
    const randomItem = shuffled[randomIndex];

    if (currentItem === undefined || randomItem === undefined) {
      continue;
    }

    shuffled[index] = randomItem;
    shuffled[randomIndex] = currentItem;
  }

  return shuffled;
}
