'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getCurrentUser } from '../api';
import type { User } from '../types';

const tokenKey = 'music-repertory-token';
const authStorageEvent = 'music-repertory-auth-change';

export function ProfileManager() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(tokenKey);

    if (!token) {
      router.replace('/login');
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
        router.replace('/login');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  function logout() {
    window.localStorage.removeItem(tokenKey);
    window.dispatchEvent(new Event(authStorageEvent));
    router.push('/');
  }

  return (
    <section className='mx-auto w-full max-w-2xl rounded-[14px] bg-white p-5 shadow-sm sm:p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-[#6B3E21]'>Perfil</h1>
          <p className='mt-1 text-sm font-semibold text-[#6B3E21]/70'>
            {isLoading ? 'Carregando...' : user?.username}
          </p>
        </div>

        <button
          className='h-11 rounded-[12px] border border-[#6B3E21]/15 px-4 text-sm font-bold text-[#6B3E21] hover:bg-[#FDF8F2]'
          onClick={logout}
          type='button'
        >
          Sair
        </button>
      </div>
    </section>
  );
}
