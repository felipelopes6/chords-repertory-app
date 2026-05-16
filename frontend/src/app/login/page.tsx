import type { Metadata } from 'next';
import Image from 'next/image';

import { AuthManager } from '@/features/repertory/components/auth-manager';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entre ou cadastre-se.',
};

export default function LoginPage() {
  return (
    <main className='flex min-h-screen items-center bg-[#FDF8F2] px-5 py-8 sm:px-8 sm:py-12'>
      <section className='mx-auto w-full max-w-xl'>
        <div className='mb-6 flex justify-center'>
          <Image
            alt='Repertório Musical'
            className='h-32 w-32 rounded-full object-contain shadow-sm ring-1 ring-[#6B3E21]/10 sm:h-28 sm:w-28'
            height={112}
            priority
            src='/app-logo.png'
            width={112}
          />
        </div>
        <AuthManager />
      </section>
    </main>
  );
}
