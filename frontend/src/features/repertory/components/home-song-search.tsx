'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPopularSongs, searchSongs } from '../api';
import type { SearchResult } from '../types';

const songListLimit = 15;

const popularSongsFallback: SearchResult[] = [
  popularSong(
    'Evidências',
    'Chitãozinho & Xororó',
    'chitaozinho-xororo',
    'evidencias',
  ),
  popularSong('Trem-Bala', 'Ana Vilela', 'ana-vilela', 'trem-bala'),
  popularSong('Yellow', 'Coldplay', 'coldplay', 'yellow'),
  popularSong('Velha Infância', 'Tribalistas', 'tribalistas', 'velha-infancia'),
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
  popularSong('Bohemian Rhapsody', 'Queen', 'queen', 'bohemian-rhapsody'),
  popularSong(
    'Garota de Ipanema',
    'Tom Jobim',
    'tom-jobim',
    'garota-de-ipanema',
  ),
  popularSong('O Leãozinho', 'Caetano Veloso', 'caetano-veloso', 'o-leaozinho'),
  popularSong('Águas de Março', 'Elis Regina', 'elis-regina', 'aguas-de-marco'),
  popularSong('Aquarela', 'Toquinho', 'toquinho', 'aquarela'),
  popularSong('Anunciação', 'Alceu Valença', 'alceu-valenca', 'anunciacao'),
];

export function HomeSongSearch() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<SearchResult[]>(popularSongsFallback);
  const [mode, setMode] = useState<'popular' | 'search'>('popular');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestId = useRef(0);
  const modeRef = useRef(mode);

  const title = useMemo(
    () => (mode === 'search' ? 'Resultados' : 'Músicas populares'),
    [mode],
  );

  const loadPopularSongs = useCallback(async () => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await getPopularSongs(songListLimit);

      if (requestId.current !== currentRequestId) {
        return;
      }

      const apiSongs = response.results
        .filter((result) => result.type === 'song')
        .slice(0, songListLimit);

      if (apiSongs.length > 0) {
        setSongs(apiSongs);
      }

      setMode('popular');
    } catch {
      if (requestId.current === currentRequestId) {
        setSongs(popularSongsFallback);
        setMode('popular');
      }
    } finally {
      if (requestId.current === currentRequestId) {
        setIsLoading(false);
      }
    }
  }, []);

  const searchForSongs = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery) {
        await loadPopularSongs();
        return;
      }

      const currentRequestId = requestId.current + 1;
      requestId.current = currentRequestId;

      setIsLoading(true);
      setMessage(null);

      try {
        const response = await searchSongs(searchQuery, 30);

        if (requestId.current === currentRequestId) {
          setSongs(
            response.results
              .filter((result) => result.type === 'song')
              .slice(0, songListLimit),
          );
          setMode('search');
        }
      } catch (error) {
        if (requestId.current === currentRequestId) {
          setMessage(
            error instanceof Error ? error.message : 'Erro inesperado.',
          );
        }
      } finally {
        if (requestId.current === currentRequestId) {
          setIsLoading(false);
        }
      }
    },
    [loadPopularSongs],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPopularSongs();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPopularSongs]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!query.trim() && modeRef.current === 'popular') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void searchForSongs(query.trim());
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query, searchForSongs]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void searchForSongs(query.trim());
  }

  return (
    <div className='mx-auto w-full max-w-6xl'>
      <form onSubmit={handleSearch}>
        <label className='sr-only' htmlFor='home-song-search'>
          Buscar música ou artista
        </label>
        <input
          autoComplete='off'
          className='h-12 w-full rounded-[12px] border border-[#6B3E21]/15 bg-white px-4 text-base font-semibold text-[#6B3E21] shadow-sm outline-none placeholder:text-[#6B3E21]/40 focus:border-[#F3A24D] focus:ring-2 focus:ring-[#F3A24D]/25'
          id='home-song-search'
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Busque uma música ou artista.'
          type='search'
          value={query}
        />
      </form>

      <div className='mt-8'>
        <div className='mb-3 flex min-h-7 items-center justify-between gap-4'>
          <h1 className='text-xl font-bold text-[#6B3E21]'>{title}</h1>
          {isLoading ? (
            <span className='text-sm font-semibold text-[#9A9D55]'>
              Searching...
            </span>
          ) : null}
        </div>

        {message ? (
          <p className='rounded-[12px] bg-amber-50 p-3 text-sm font-semibold text-amber-800'>
            {message}
          </p>
        ) : null}

        <div className='grid gap-3'>
          {songs.map((song, index) => (
            <Link
              className='grid min-h-20 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-[12px] border border-[#6B3E21]/10 bg-white p-4 shadow-sm transition hover:border-[#F3A24D]/60 hover:bg-[#FDF8F2] sm:grid-cols-[3rem_minmax(0,1fr)]'
              href={
                song.artistSlug && song.songSlug
                  ? `/repertory/songs/${song.artistSlug}/${song.songSlug}`
                  : song.url
              }
              key={song.path}
            >
              <span className='text-xl font-bold tabular-nums text-[#9A9D55]'>
                {index + 1}.
              </span>
              <span className='min-w-0'>
                <span className='block truncate font-bold text-[#6B3E21]'>
                  {song.title}
                </span>
                <span className='mt-1 block truncate text-sm font-semibold text-[#6B3E21]/70'>
                  {song.artist}
                </span>
              </span>
            </Link>
          ))}
        </div>

        {!isLoading && songs.length === 0 ? (
          <p className='rounded-[12px] bg-white p-4 text-sm font-semibold text-[#6B3E21]/70 shadow-sm'>
            Nenhuma música encontrada.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function popularSong(
  title: string,
  artist: string,
  artistSlug: string,
  songSlug: string,
): SearchResult {
  const path = `/${artistSlug}/${songSlug}/`;

  return {
    type: 'song',
    title,
    artist,
    artistSlug,
    songSlug,
    path,
    url: `https://www.cifraclub.com.br${path}`,
    imageUrl: null,
    matchType: 'strong',
  };
}
