import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { HeaderAuthNav } from './header-auth-nav';

type RepertoryShellProps = {
  children: ReactNode;
};

export function RepertoryShell({ children }: RepertoryShellProps) {
  return (
    <main className='min-h-screen bg-[#FDF8F2]'>
      <header className='sticky top-0 z-30 border-b border-[#6B3E21]/10 bg-[#FDF8F2]/95 backdrop-blur'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-10'>
          <Link
            aria-label='Início'
            className='flex shrink-0 items-center gap-3 hover:opacity-80 transition-opacity'
            href='/'
          >
            <div className='flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-[#6B3E21]/10'>
              <Image
                alt=''
                className='h-full w-full object-contain'
                height={44}
                src='/app-logo.png'
                width={44}
              />
            </div>
            <span className='text-xl font-bold text-[#6B3E21]'>
              Gato Cifras
            </span>
          </Link>

          <nav className='flex shrink-0 items-center gap-3'>
            <HeaderAuthNav />
          </nav>
        </div>
      </header>

      {children}
    </main>
  );
}
