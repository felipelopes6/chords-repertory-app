'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  addSongToRepertory,
  createRepertory,
  getCurrentUser,
  getSongDetails,
  listRepertories,
  removeSongFromRepertory,
  searchSongs,
} from '../api';
import type { Repertory, SearchResult, User } from '../types';

const tokenKey = 'music-repertory-token';

export function RepertoryManager() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [repertories, setRepertories] = useState<Repertory[]>([]);
  const [selectedRepertoryId, setSelectedRepertoryId] = useState('');
  const [newRepertoryName, setNewRepertoryName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedRepertory = useMemo(
    () => repertories.find((repertory) => repertory.id === selectedRepertoryId),
    [repertories, selectedRepertoryId],
  );

  useEffect(() => {
    void Promise.resolve().then(() => {
      setToken(window.localStorage.getItem(tokenKey));
    });
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    void Promise.all([getCurrentUser(token), listRepertories(token)])
      .then(([currentUser, repertoryResponse]) => {
        setUser(currentUser.user);
        setRepertories(repertoryResponse.repertories);
        setSelectedRepertoryId(
          (currentId) =>
            currentId || repertoryResponse.repertories[0]?.id || '',
        );
      })
      .catch(() => {
        window.localStorage.removeItem(tokenKey);
        setToken(null);
        setUser(null);
        setRepertories([]);
        setSelectedRepertoryId('');
      });
  }, [token]);

  async function handleSearch() {
    if (!query.trim()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await searchSongs(query);
      setResults(response.results.filter((result) => result.type === 'song'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateRepertory() {
    if (!token || !newRepertoryName.trim()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const repertory = await createRepertory(token, newRepertoryName);
      setRepertories((current) => [repertory, ...current]);
      setSelectedRepertoryId(repertory.id);
      setNewRepertoryName('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddSong(song: SearchResult) {
    if (!token) {
      setMessage('Entre na sua conta para adicionar músicas a um repertório.');
      return;
    }

    if (!selectedRepertoryId) {
      setMessage('Crie ou selecione um repertório antes de adicionar músicas.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const details =
        song.artistSlug && song.songSlug
          ? await getSongDetails(song.artistSlug, song.songSlug).catch(
              () => null,
            )
          : null;
      const repertory = await addSongToRepertory(
        token,
        selectedRepertoryId,
        song,
        details?.originalKey ?? null,
      );
      setRepertories((current) =>
        current.map((item) => (item.id === repertory.id ? repertory : item)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveSong(songId: string) {
    if (!token || !selectedRepertoryId) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const repertory = await removeSongFromRepertory(
        token,
        selectedRepertoryId,
        songId,
      );
      setRepertories((current) =>
        current.map((item) => (item.id === repertory.id ? repertory : item)),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem(tokenKey);
    setToken(null);
    setUser(null);
    setRepertories([]);
    setSelectedRepertoryId('');
  }

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]'>
      <section className='space-y-6'>
        <div className='rounded-[14px] bg-white p-5 shadow-sm sm:p-6'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-end'>
            <div className='flex-1'>
              <h2 className='text-xl font-bold text-[#6B3E21]'>
                Buscar músicas
              </h2>
              <label
                className='mt-4 block text-sm font-bold text-[#6B3E21]/85'
                htmlFor='song-search'
              >
                Música ou artista
              </label>
              <input
                className='mt-2 h-12 w-full rounded-[12px] border border-[#6B3E21]/15 px-4 text-[#6B3E21] outline-none focus:border-[#F3A24D] focus:ring-2 focus:ring-[#F3A24D]/20'
                id='song-search'
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSearch();
                  }
                }}
                placeholder='Coldplay Yellow'
                value={query}
              />
            </div>

            {token && repertories.length > 0 ? (
              <div className='w-full lg:w-72'>
                <label
                  className='block text-sm font-bold text-[#6B3E21]/85'
                  htmlFor='target-repertory'
                >
                  Adicionar em
                </label>
                <select
                  className='mt-2 h-12 w-full rounded-[12px] border border-[#6B3E21]/15 bg-white px-3 text-[#6B3E21] outline-none focus:border-[#F3A24D] focus:ring-2 focus:ring-[#F3A24D]/20'
                  id='target-repertory'
                  onChange={(event) =>
                    setSelectedRepertoryId(event.target.value)
                  }
                  value={selectedRepertoryId}
                >
                  {repertories.map((repertory) => (
                    <option key={repertory.id} value={repertory.id}>
                      {repertory.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <button
              className='h-12 rounded-[12px] bg-[#F3A24D] px-5 text-sm font-bold text-[#6B3E21] disabled:opacity-60'
              disabled={isLoading}
              onClick={handleSearch}
              type='button'
            >
              Pesquisar
            </button>
          </div>

          {message ? (
            <p className='mt-4 rounded-[12px] bg-amber-50 p-3 text-sm font-semibold text-amber-800'>
              {message}
            </p>
          ) : null}

          <div className='mt-6 grid gap-3'>
            {results.map((result) => {
              const addedSong = selectedRepertory?.songs.find(
                (song) =>
                  song.path === result.path ||
                  (song.artistSlug === result.artistSlug &&
                    song.songSlug === result.songSlug),
              );
              const isAdded = Boolean(addedSong);

              return (
                <div
                  className='flex flex-col gap-3 rounded-[12px] border border-[#6B3E21]/10 p-4 sm:flex-row sm:items-center sm:justify-between'
                  key={result.path}
                >
                  <Link
                    className='min-w-0'
                    href={
                      result.artistSlug && result.songSlug
                        ? addedSong && selectedRepertory
                          ? `/repertory/songs/${result.artistSlug}/${result.songSlug}?offset=${addedSong.keyOffset}&repertoryId=${selectedRepertory.id}&songId=${addedSong.id}&simplified=${addedSong.isSimplified ? 'true' : 'false'}`
                          : `/repertory/songs/${result.artistSlug}/${result.songSlug}`
                        : result.url
                    }
                  >
                    <p className='font-bold text-[#6B3E21]'>{result.title}</p>
                    <p className='mt-1 text-sm text-[#6B3E21]/70'>
                      {result.artist}
                    </p>
                  </Link>
                  <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                    {isAdded ? (
                      <>
                        <span className='rounded-[10px] bg-emerald-50 px-4 py-2 text-center text-sm font-bold text-emerald-700'>
                          Adicionada
                        </span>
                        <button
                          className='rounded-[10px] border border-red-200 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-60'
                          disabled={isLoading || !addedSong}
                          onClick={() => {
                            if (addedSong) {
                              void handleRemoveSong(addedSong.id);
                            }
                          }}
                          type='button'
                        >
                          Remover
                        </button>
                      </>
                    ) : (
                      <button
                        className='rounded-[10px] bg-[#6B3E21] px-4 py-2 text-sm font-bold text-white disabled:opacity-60'
                        disabled={isLoading}
                        onClick={() => void handleAddSong(result)}
                        type='button'
                      >
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <aside className='rounded-[14px] bg-white p-5 shadow-sm sm:p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-xl font-bold text-[#6B3E21]'>
              Meus repertórios
            </h2>
            <p className='mt-1 text-sm text-[#6B3E21]/70'>
              {token
                ? `Conectado como ${user?.username ?? 'usuário'}`
                : 'Entre para criar e restaurar suas listas.'}
            </p>
          </div>

          {token ? (
            <button
              className='rounded-lg border border-[#6B3E21]/15 px-3 py-2 text-sm font-bold text-[#6B3E21]/85'
              onClick={logout}
              type='button'
            >
              Sair
            </button>
          ) : (
            <Link
              className='rounded-lg bg-[#F3A24D] px-3 py-2 text-sm font-bold text-[#6B3E21]'
              href='/login'
            >
              Entrar
            </Link>
          )}
        </div>

        {token ? (
          <div className='mt-5 space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row lg:flex-col'>
              <input
                className='h-11 flex-1 rounded-[12px] border border-[#6B3E21]/15 px-3 text-[#6B3E21] outline-none focus:border-[#F3A24D] focus:ring-2 focus:ring-[#F3A24D]/20'
                onChange={(event) => setNewRepertoryName(event.target.value)}
                placeholder='Novo repertório'
                value={newRepertoryName}
              />
              <button
                className='h-11 rounded-[12px] bg-[#F3A24D] px-4 text-sm font-bold text-[#6B3E21] disabled:opacity-60'
                disabled={isLoading}
                onClick={handleCreateRepertory}
                type='button'
              >
                Criar
              </button>
            </div>

            <div className='space-y-3'>
              {repertories.length > 0 ? (
                repertories.map((repertory) => (
                  <Link
                    className='block rounded-[12px] bg-[#FDF8F2] p-4 text-[#6B3E21] hover:bg-[#FDF8F2]'
                    href={`/repertory/${repertory.id}`}
                    key={repertory.id}
                  >
                    <p className='font-bold text-[#6B3E21]'>{repertory.name}</p>
                    <p className='mt-1 text-sm text-[#6B3E21]/70'>
                      {repertory.songs.length} música(s)
                    </p>
                  </Link>
                ))
              ) : (
                <p className='rounded-[12px] bg-[#FDF8F2] p-4 text-sm font-semibold text-[#6B3E21]/70'>
                  Nenhum repertório criado ainda.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
