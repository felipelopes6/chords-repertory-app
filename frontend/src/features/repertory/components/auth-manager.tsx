'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { login, register } from '@/features/repertory/api';

const tokenKey = 'music-repertory-token';
const authStorageEvent = 'music-repertory-auth-change';

export function AuthManager() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (window.localStorage.getItem(tokenKey)) {
        router.replace('/');
      }
    });
  }, [router]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response =
        mode === 'login'
          ? await login(username, password)
          : await register(username, password);

      window.localStorage.setItem(tokenKey, response.token);
      window.dispatchEvent(new Event(authStorageEvent));
      setPassword('');
      router.push('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='rounded-[14px] bg-white p-5 shadow-sm sm:p-6'>
      <form onSubmit={handleAuth}>
        <div className='flex rounded-[12px] bg-[#FDF8F2] p-1'>
          {(['login', 'register'] as const).map((item) => (
            <button
              className={`h-10 flex-1 rounded-[10px] text-sm font-bold ${
                mode === item
                  ? 'bg-white text-[#6B3E21] shadow-sm'
                  : 'text-[#6B3E21]/70'
              }`}
              key={item}
              onClick={() => setMode(item)}
              type='button'
            >
              {item === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <div className='mt-6 space-y-4'>
          <input
            className='h-11 w-full rounded-[12px] border border-[#6B3E21]/15 px-3 text-[#6B3E21] outline-none focus:border-[#F3A24D] focus:ring-2 focus:ring-[#F3A24D]/25'
            onChange={(event) => setUsername(event.target.value)}
            placeholder='Usuário'
            required
            value={username}
          />
          <input
            className='h-11 w-full rounded-[12px] border border-[#6B3E21]/15 px-3 text-[#6B3E21] outline-none focus:border-[#F3A24D] focus:ring-2 focus:ring-[#F3A24D]/25'
            onChange={(event) => setPassword(event.target.value)}
            placeholder='Senha'
            required
            type='password'
            value={password}
          />
          <button
            className='h-11 w-full rounded-[12px] bg-[#F3A24D] px-4 text-sm font-bold text-[#6B3E21] disabled:opacity-60'
            disabled={isLoading}
            type='submit'
          >
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>

        {message ? (
          <p className='mt-4 rounded-[12px] bg-amber-50 p-3 text-sm font-semibold text-amber-800'>
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
