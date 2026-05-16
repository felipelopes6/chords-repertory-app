import type { Metadata } from 'next';

import { PlaylistsManager } from '@/features/repertory/components/playlists-manager';
import { RepertoryShell } from '@/features/repertory/components/repertory-shell';

export const metadata: Metadata = {
  title: 'Playlists',
  description: 'Veja e gerencie suas playlists.',
};

export default function RepertoryPage() {
  return (
    <RepertoryShell>
      <section className='mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10'>
        <PlaylistsManager />
      </section>
    </RepertoryShell>
  );
}
