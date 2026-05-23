'use client';

import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import type { FormEvent } from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { createRepertory, deleteRepertory, listRepertories } from '../api';
import {
  formatRepertoryCreatedAt,
  sortRepertoriesByCreatedAt,
} from '../lib/repertory-display';
import type { Repertory } from '../types';

const tokenKey = 'music-repertory-token';
const authStorageEvent = 'music-repertory-auth-change';

export function PlaylistsManager() {
  const token = useSyncExternalStore(
    subscribeToAuthStorage,
    getAuthSnapshot,
    () => undefined,
  );
  const [repertories, setRepertories] = useState<Repertory[]>([]);
  const [newRepertoryName, setNewRepertoryName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingRepertoryId, setDeletingRepertoryId] = useState<string | null>(
    null,
  );
  const [repertoryToDelete, setRepertoryToDelete] = useState<Repertory | null>(
    null,
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    void listRepertories(token)
      .then((repertoryResponse) => {
        if (!isMounted) {
          return;
        }

        setRepertories(sortRepertoriesByCreatedAt(repertoryResponse.repertories));
      })
      .catch(() => {
        window.localStorage.removeItem(tokenKey);
        window.dispatchEvent(new Event(authStorageEvent));

        if (isMounted) {
          setRepertories([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setHasLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleCreateRepertory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newRepertoryName.trim();

    if (!token || !name) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const repertory = await createRepertory(token, name);
      setRepertories((current) =>
        sortRepertoriesByCreatedAt([repertory, ...current]),
      );
      setNewRepertoryName('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDeleteRepertory() {
    if (!token || !repertoryToDelete) {
      return;
    }

    setDeletingRepertoryId(repertoryToDelete.id);
    setMessage(null);

    try {
      await deleteRepertory(token, repertoryToDelete.id);
      setRepertories((current) =>
        current.filter((candidate) => candidate.id !== repertoryToDelete.id),
      );
      setRepertoryToDelete(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setDeletingRepertoryId(null);
    }
  }

  if (token === undefined) {
    return (
      <section className='rounded-[14px] bg-white p-5 shadow-sm sm:p-6'>
        <p className='text-sm font-semibold text-[#6B3E21]/70'>
          Carregando playlists...
        </p>
      </section>
    );
  }

  if (!token) {
    return (
      <section className='rounded-[14px] bg-white p-5 shadow-sm sm:p-6'>
        <h1 className='text-2xl font-bold text-[#6B3E21]'>Playlists</h1>
        <p className='mt-2 text-sm font-semibold text-[#6B3E21]/70'>
          Entre para visualizar e criar suas playlists.
        </p>
        <Link
          className='mt-5 inline-flex h-11 items-center justify-center rounded-[12px] bg-[#F3A24D] px-4 text-sm font-bold text-[#6B3E21]'
          href='/login'
        >
          Entrar
        </Link>
      </section>
    );
  }

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6'>
      <section className='rounded-[14px] bg-white p-5 shadow-sm sm:p-6'>
        <div className='space-y-5'>
          <div>
            <h1 className='text-2xl font-bold text-[#6B3E21]'>Playlists</h1>
            <p className='mt-2 text-sm font-semibold text-[#6B3E21]/70'>
              Criar nova playlist
            </p>
          </div>

          <form
            className='flex w-full flex-col gap-4'
            onSubmit={handleCreateRepertory}
          >
            <label className='sr-only' htmlFor='new-playlist-name'>
              Nova playlist
            </label>
            <input
              className='h-12 w-full appearance-none rounded-[12px] border border-[#6B3E21]/15 bg-white px-4 text-base font-semibold leading-none text-[#6B3E21] shadow-sm outline-none placeholder:text-[#6B3E21]/40 focus:border-[#F3A24D] focus:ring-2 focus:ring-[#F3A24D]/25'
              id='new-playlist-name'
              onChange={(event) => setNewRepertoryName(event.target.value)}
              placeholder='Nome da playlist'
              value={newRepertoryName}
            />
            <button
              className='h-12 rounded-[12px] bg-[#F3A24D] px-5 text-sm font-bold text-[#6B3E21] shadow-sm disabled:cursor-not-allowed disabled:opacity-50'
              disabled={isSaving || !newRepertoryName.trim()}
              type='submit'
            >
              Criar
            </button>
          </form>
        </div>

        {message ? (
          <p className='mt-4 rounded-[12px] bg-amber-50 p-3 text-sm font-semibold text-amber-800'>
            {message}
          </p>
        ) : null}
      </section>

      <section className='grid gap-3'>
        {!hasLoaded ? (
          <p className='rounded-[12px] bg-white p-4 text-sm font-semibold text-[#6B3E21]/70 shadow-sm'>
            Carregando playlists...
          </p>
        ) : null}

        {hasLoaded && repertories.length === 0 ? (
          <p className='rounded-[12px] bg-white p-4 text-sm font-semibold text-[#6B3E21]/70 shadow-sm'>
            Nenhuma playlist criada ainda.
          </p>
        ) : null}

        {sortRepertoriesByCreatedAt(repertories).map((repertory) => (
          <div
            className='flex items-stretch overflow-hidden rounded-[12px] border border-[#6B3E21]/10 bg-white shadow-sm'
            key={repertory.id}
          >
            <Link
              className='min-w-0 flex-1 p-4 transition hover:bg-[#FDF8F2]'
              href={`/repertory/${repertory.id}`}
            >
              <p className='truncate text-base font-bold text-[#6B3E21]'>
                {repertory.name}
              </p>
              <p className='mt-1 text-sm font-semibold text-[#6B3E21]/70'>
                {repertory.songs.length} música(s)
              </p>
              <span className='mt-3 inline-flex rounded-full bg-[#FDF8F2] px-3 py-1 text-xs font-bold text-[#6B3E21]/65'>
                {formatRepertoryCreatedAt(repertory.createdAt)}
              </span>
            </Link>
            <button
              aria-label={`Excluir playlist ${repertory.name}`}
              className='flex w-14 shrink-0 items-center justify-center border-l border-[#6B3E21]/10 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-16'
              disabled={deletingRepertoryId === repertory.id}
              onClick={() => setRepertoryToDelete(repertory)}
              type='button'
            >
              <FontAwesomeIcon
                aria-hidden='true'
                className='h-4 w-4'
                icon={faTrash}
              />
            </button>
          </div>
        ))}
      </section>

      {repertoryToDelete ? (
        <div
          aria-labelledby='delete-playlist-title'
          aria-modal='true'
          className='fixed inset-0 z-50 flex items-center justify-center bg-[#6B3E21]/35 px-5'
          role='dialog'
        >
          <div className='w-full max-w-md rounded-[14px] bg-white p-5 shadow-xl sm:p-6'>
            <h2
              className='text-xl font-bold text-[#6B3E21]'
              id='delete-playlist-title'
            >
              Excluir playlist?
            </h2>
            <p className='mt-2 text-sm font-semibold leading-6 text-[#6B3E21]/70'>
              A playlist{' '}
              <span className='font-bold text-[#6B3E21]'>
                {repertoryToDelete.name}
              </span>{' '}
              será removida. Essa ação não pode ser desfeita.
            </p>

            <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              <button
                className='h-11 rounded-[12px] border border-[#6B3E21]/15 px-4 text-sm font-bold text-[#6B3E21] hover:bg-[#FDF8F2]'
                disabled={Boolean(deletingRepertoryId)}
                onClick={() => setRepertoryToDelete(null)}
                type='button'
              >
                Cancelar
              </button>
              <button
                className='h-11 rounded-[12px] bg-red-600 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50'
                disabled={Boolean(deletingRepertoryId)}
                onClick={() => void confirmDeleteRepertory()}
                type='button'
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function subscribeToAuthStorage(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(authStorageEvent, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(authStorageEvent, onStoreChange);
  };
}

function getAuthSnapshot() {
  return window.localStorage.getItem(tokenKey);
}
