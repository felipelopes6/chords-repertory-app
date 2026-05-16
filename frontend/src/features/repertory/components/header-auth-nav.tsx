'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSyncExternalStore } from 'react';

import { getCurrentUser } from '../api';
import type { User } from '../types';

const tokenKey = 'music-repertory-token';
const authStorageEvent = 'music-repertory-auth-change';

export function HeaderAuthNav() {
  const token = useSyncExternalStore(
    subscribeToAuthStorage,
    getAuthSnapshot,
    () => undefined,
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    void getCurrentUser(token)
      .then((response) => {
        if (isMounted) {
          setUser(response.user);
        }
      })
      .catch(() => {
        window.localStorage.removeItem(tokenKey);
        window.dispatchEvent(new Event(authStorageEvent));

        if (isMounted) {
          setUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (token === undefined) {
    return null;
  }

  if (token) {
    return (
      <>
        <Link
          className='rounded-lg px-3 py-2 text-sm font-bold text-[#6B3E21] hover:bg-[#F3A24D]/15'
          href='/repertory'
        >
          Playlists
        </Link>
        <Link
          aria-label='Perfil'
          className='flex h-10 w-10 items-center justify-center rounded-full bg-[#6B3E21] text-sm font-bold uppercase text-white hover:bg-[#9A9D55]'
          href='/profile'
        >
          {getInitials(user?.username)}
        </Link>
      </>
    );
  }

  return (
    <Link
      className='rounded-lg px-3 py-2 text-sm font-bold text-[#6B3E21] hover:bg-[#F3A24D]/15'
      href='/login'
    >
      Entrar
    </Link>
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

function getInitials(username: string | undefined) {
  const cleanUsername = username?.trim();

  if (!cleanUsername) {
    return '..';
  }

  return cleanUsername.slice(0, 2).toUpperCase();
}
