'use client';

import { faShareNodes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AppToast } from '@/components/ui/toast';

import {
  addSongToRepertory,
  deleteRepertory,
  getCurrentUser,
  getSongDetails,
  removeSongFromRepertory,
  searchSongs,
} from '../api';
import { getPlaylistSongHref } from '../lib/playlist-navigation';
import { formatRepertoryCreatedAt } from '../lib/repertory-display';
import { formatSongKey } from '../lib/transpose';
import type { Repertory, SearchResult, User } from '../types';

const tokenKey = 'music-repertory-token';

type RepertoryDetailProps = {
  initialRepertory: Repertory;
};

export function RepertoryDetail({ initialRepertory }: RepertoryDetailProps) {
  const router = useRouter();
  const [repertory, setRepertory] = useState(initialRepertory);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [originalKeysBySongId, setOriginalKeysBySongId] = useState<
    Record<string, string | null>
  >({});
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [updatingSongPath, setUpdatingSongPath] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingRepertory, setIsDeletingRepertory] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLElement | null>(null);
  const searchRequestId = useRef(0);
  const canEdit = Boolean(user && user.id === repertory.ownerId);
  const firstSong = repertory.songs[0];

  useEffect(() => {
    void Promise.resolve().then(() => {
      setToken(window.localStorage.getItem(tokenKey));
    });
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    void getCurrentUser(token)
      .then((response) => setUser(response.user))
      .catch(() => {
        window.localStorage.removeItem(tokenKey);
        setToken(null);
        setUser(null);
      });
  }, [token]);

  useEffect(() => {
    const songsMissingOriginalKey = repertory.songs.filter(
      (song) =>
        !song.originalKey && originalKeysBySongId[song.id] === undefined,
    );

    if (songsMissingOriginalKey.length === 0) {
      return;
    }

    void Promise.all(
      songsMissingOriginalKey.map(async (song) => {
        const details = await getSongDetails(
          song.artistSlug,
          song.songSlug,
        ).catch(() => null);

        return [song.id, details?.originalKey ?? null] as const;
      }),
    ).then((entries) => {
      setOriginalKeysBySongId((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });
  }, [originalKeysBySongId, repertory.songs]);

  async function handleRemoveSong(songId: string) {
    if (!token) {
      setMessage('Entre na sua conta para editar este repertório.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const updatedRepertory = await removeSongFromRepertory(
        token,
        repertory.id,
        songId,
      );
      setRepertory(updatedRepertory);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  const searchForSongs = useCallback(async (query: string) => {
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setMessage(null);

    try {
      const response = await searchSongs(query, 30);
      if (searchRequestId.current === requestId) {
        setSearchResults(
          response.results
            .filter(
              (result) =>
                result.type === 'song' &&
                Boolean(result.artist) &&
                Boolean(result.artistSlug) &&
                Boolean(result.songSlug),
            )
            .slice(0, 10),
        );
      }
    } catch (error) {
      if (searchRequestId.current === requestId) {
        setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
      }
    } finally {
      if (searchRequestId.current === requestId) {
        setIsSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!canEdit) {
      return;
    }

    if (!query) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void searchForSongs(query);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [canEdit, searchForSongs, searchQuery]);

  useEffect(() => {
    if (searchResults.length === 0) {
      return;
    }

    function closeResultsWhenOutside(event: MouseEvent | FocusEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        searchContainerRef.current?.contains(target)
      ) {
        return;
      }

      setSearchResults([]);
    }

    document.addEventListener('mousedown', closeResultsWhenOutside);
    document.addEventListener('focusin', closeResultsWhenOutside);

    return () => {
      document.removeEventListener('mousedown', closeResultsWhenOutside);
      document.removeEventListener('focusin', closeResultsWhenOutside);
    };
  }, [searchResults.length]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  function handleSearchSongs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchForSongs(searchQuery.trim());
  }

  function handleSearchQueryChange(value: string) {
    setSearchQuery(value);

    if (!value.trim()) {
      searchRequestId.current += 1;
      setSearchResults([]);
      setIsSearching(false);
    }
  }

  async function handleAddSong(song: SearchResult) {
    if (!token || !song.artist || !song.artistSlug || !song.songSlug) {
      return;
    }

    setUpdatingSongPath(song.path);
    setMessage(null);

    try {
      const details = await getSongDetails(
        song.artistSlug,
        song.songSlug,
      ).catch(() => null);
      const updatedRepertory = await addSongToRepertory(
        token,
        repertory.id,
        song,
        details?.originalKey ?? null,
      );

      setRepertory(updatedRepertory);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setUpdatingSongPath(null);
    }
  }

  async function handleToggleSong(song: SearchResult) {
    const addedSong = repertory.songs.find(
      (candidate) =>
        candidate.path === song.path ||
        (candidate.artistSlug === song.artistSlug &&
          candidate.songSlug === song.songSlug),
    );

    if (addedSong) {
      setUpdatingSongPath(song.path);
      await handleRemoveSong(addedSong.id);
      setUpdatingSongPath(null);
      return;
    }

    await handleAddSong(song);
  }

  async function confirmDeleteRepertory() {
    if (!token) {
      setMessage('Entre na sua conta para editar este repertório.');
      return;
    }

    setIsDeletingRepertory(true);
    setMessage(null);

    try {
      await deleteRepertory(token, repertory.id);
      router.push('/repertory');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeletingRepertory(false);
    }
  }

  async function handleShareRepertory() {
    const url = window.location.href;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        copyTextWithFallback(url);
      }

      setToastMessage('Playlist copiada.');
    } catch {
      setMessage('Não foi possível copiar o link da playlist.');
    }
  }

  return (
    <article className='mt-6 rounded-[14px] bg-white p-5 shadow-sm sm:p-8'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='text-sm font-bold text-[#6B3E21]/60'>
            Repertório de {repertory.ownerUsername}
          </p>
          <h1 className='mt-2 text-2xl font-bold text-[#6B3E21] sm:text-3xl'>
            {repertory.name}
          </h1>
          <p className='mt-1 text-sm text-[#6B3E21]/70'>
            {repertory.songs.length} música(s)
          </p>
          <span className='mt-3 inline-flex rounded-full bg-[#FDF8F2] px-3 py-1 text-xs font-bold text-[#6B3E21]/65'>
            {formatRepertoryCreatedAt(repertory.createdAt)}
          </span>
        </div>

        <div className='flex shrink-0 flex-wrap justify-end gap-2'>
          {firstSong ? (
            <Link
              className='flex h-10 items-center justify-center rounded-[10px] bg-[#F3A24D] px-4 text-sm font-bold text-[#6B3E21] transition hover:bg-[#F6B469]'
              href={getPlaylistSongHref(repertory.id, firstSong)}
            >
              Iniciar playlist
            </Link>
          ) : null}

          <button
            aria-label='Copiar link da playlist'
            className='flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#6B3E21]/15 text-[#6B3E21] transition hover:bg-[#FDF8F2]'
            onClick={() => void handleShareRepertory()}
            type='button'
          >
            <FontAwesomeIcon
              aria-hidden='true'
              className='h-4 w-4'
              icon={faShareNodes}
            />
          </button>

          {canEdit ? (
            <button
              aria-label={`Excluir playlist ${repertory.name}`}
              className='flex h-10 w-10 items-center justify-center rounded-[10px] border border-red-200 text-red-700 transition hover:bg-red-50'
              onClick={() => setIsDeleteDialogOpen(true)}
              type='button'
            >
              <FontAwesomeIcon
                aria-hidden='true'
                className='h-4 w-4'
                icon={faTrash}
              />
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <p className='mt-5 rounded-[12px] bg-amber-50 p-3 text-sm font-semibold text-amber-800'>
          {message}
        </p>
      ) : null}

      {!canEdit ? (
        <p className='mt-5 rounded-[12px] bg-[#FDF8F2] p-3 text-sm font-semibold text-[#6B3E21]/70'>
          Você está visualizando este repertório. Entre com a conta dona para
          editar a lista.
        </p>
      ) : null}

      {canEdit ? (
        <section className='mt-8' ref={searchContainerRef}>
          <form className='relative' onSubmit={handleSearchSongs}>
            <label className='sr-only' htmlFor='playlist-song-search'>
              Buscar música para adicionar
            </label>
            <input
              autoComplete='off'
              className='h-14 w-full rounded-[12px] border border-[#6B3E21]/15 bg-white px-4 pr-14 text-base font-semibold text-[#6B3E21] shadow-sm outline-none placeholder:text-[#6B3E21]/40 focus:border-[#F3A24D] focus:ring-2 focus:ring-[#F3A24D]/25'
              id='playlist-song-search'
              onChange={(event) => handleSearchQueryChange(event.target.value)}
              placeholder='Busque uma música ou artista.'
              type='search'
              value={searchQuery}
            />
            <button
              aria-label='Buscar'
              className='absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#6B3E21]/60 hover:bg-[#FDF8F2] hover:text-[#6B3E21] disabled:opacity-50'
              disabled={isSearching}
              type='submit'
            >
              <svg
                aria-hidden='true'
                className='h-5 w-5'
                fill='none'
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2.4'
                viewBox='0 0 24 24'
              >
                <path d='m21 21-4.35-4.35' />
                <circle cx='11' cy='11' r='7' />
              </svg>
            </button>
          </form>

          {searchResults.length > 0 ? (
            <div className='mt-2 overflow-hidden rounded-[12px] border border-[#6B3E21]/10 bg-white shadow-sm'>
              {searchResults.map((result) => {
                const addedSong = repertory.songs.find(
                  (candidate) =>
                    candidate.path === result.path ||
                    (candidate.artistSlug === result.artistSlug &&
                      candidate.songSlug === result.songSlug),
                );
                const isAdded = Boolean(addedSong);
                const isUpdating = updatingSongPath === result.path;

                return (
                  <button
                    aria-pressed={isAdded}
                    className='flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-[#FDF8F2] disabled:cursor-wait disabled:opacity-70'
                    disabled={isUpdating}
                    key={result.path}
                    onClick={() => void handleToggleSong(result)}
                    type='button'
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border text-white ${
                        isAdded
                          ? 'border-[#6B3E21] bg-[#6B3E21]'
                          : 'border-[#6B3E21]/30 bg-white'
                      }`}
                    >
                      {isAdded ? (
                        <svg
                          aria-hidden='true'
                          className='h-4 w-4'
                          fill='none'
                          stroke='currentColor'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='3'
                          viewBox='0 0 24 24'
                        >
                          <path d='m5 12 4 4L19 6' />
                        </svg>
                      ) : null}
                    </span>
                    <span className='min-w-0 text-base font-semibold text-[#6B3E21]'>
                      <span className='truncate'>{result.title}</span>
                      <span className='font-bold'> - {result.artist}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      <ol className='mt-8 space-y-3'>
        {repertory.songs.map((song, index) => (
          <li
            className='flex items-stretch overflow-hidden rounded-[12px] bg-[#FDF8F2] text-[#6B3E21]'
            key={song.id}
          >
            <Link
              className='min-w-0 flex-1 p-4 transition hover:bg-[#F3A24D]/10'
              href={getPlaylistSongHref(repertory.id, song)}
            >
              <span className='block font-bold text-[#6B3E21]'>
                {index + 1} - {song.title} -{' '}
                {formatSongKey(
                  song.originalKey ?? originalKeysBySongId[song.id] ?? null,
                  song.keyOffset,
                )}
              </span>
              <span className='mt-1 block text-sm text-[#6B3E21]/70'>
                {song.artist}
              </span>
            </Link>

            {canEdit ? (
              <button
                aria-label={`Remover ${song.title}`}
                className='flex w-14 shrink-0 items-center justify-center border-l border-[#6B3E21]/10 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-16'
                disabled={isLoading}
                onClick={() => void handleRemoveSong(song.id)}
                type='button'
              >
                <FontAwesomeIcon
                  aria-hidden='true'
                  className='h-4 w-4'
                  icon={faTrash}
                />
              </button>
            ) : null}
          </li>
        ))}
      </ol>

      {repertory.songs.length === 0 ? (
        <p className='mt-8 rounded-[12px] bg-[#FDF8F2] p-4 text-sm font-semibold text-[#6B3E21]/70'>
          Nenhuma música adicionada ainda.
        </p>
      ) : null}

      {isDeleteDialogOpen ? (
        <div
          aria-labelledby='delete-repertory-title'
          aria-modal='true'
          className='fixed inset-0 z-50 flex items-center justify-center bg-[#6B3E21]/35 px-5'
          role='dialog'
        >
          <div className='w-full max-w-md rounded-[14px] bg-white p-5 shadow-xl sm:p-6'>
            <h2
              className='text-xl font-bold text-[#6B3E21]'
              id='delete-repertory-title'
            >
              Excluir playlist?
            </h2>
            <p className='mt-2 text-sm font-semibold leading-6 text-[#6B3E21]/70'>
              A playlist{' '}
              <span className='font-bold text-[#6B3E21]'>{repertory.name}</span>{' '}
              será removida. Essa ação não pode ser desfeita.
            </p>

            <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button
                className='h-11 rounded-[12px] border border-[#6B3E21]/15 px-4 text-sm font-bold text-[#6B3E21] hover:bg-[#FDF8F2]'
                disabled={isDeletingRepertory}
                onClick={() => setIsDeleteDialogOpen(false)}
                type='button'
              >
                Cancelar
              </button>
              <button
                className='h-11 rounded-[12px] bg-red-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50'
                disabled={isDeletingRepertory}
                onClick={() => void confirmDeleteRepertory()}
                type='button'
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? <AppToast message={toastMessage} /> : null}
    </article>
  );
}

function copyTextWithFallback(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
