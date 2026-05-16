import type { Metadata } from 'next';

import { HomeSongSearch } from '@/features/repertory/components/home-song-search';
import { RepertoryShell } from '@/features/repertory/components/repertory-shell';

export const metadata: Metadata = {
  title: 'Repertório Musical',
  description: 'Busque cifras, monte repertórios e salve tons por música.',
};

export default function HomePage() {
  return (
    <RepertoryShell>
      <section className='mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10'>
        <HomeSongSearch />
      </section>
    </RepertoryShell>
  );
}
