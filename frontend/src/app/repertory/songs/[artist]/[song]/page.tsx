import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSongDetails } from '@/features/repertory/api';
import { ChordViewer } from '@/features/repertory/components/chord-viewer';
import { HistoryBackButton } from '@/features/repertory/components/history-back-button';
import { RepertoryShell } from '@/features/repertory/components/repertory-shell';

type SongPageProps = {
  params: Promise<{
    artist: string;
    song: string;
  }>;
  searchParams: Promise<{
    offset?: string;
    repertoryId?: string;
    simplified?: string;
    songId?: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Cifra',
};

export default async function SongPage({
  params,
  searchParams,
}: SongPageProps) {
  const { artist, song } = await params;
  const { offset, repertoryId, simplified, songId } = await searchParams;
  const shouldOpenSimplified = simplified === 'true';
  const details = await getSongDetails(
    artist,
    song,
    shouldOpenSimplified ? 'simplified' : 'default',
  ).catch(() => getSongDetails(artist, song).catch(() => null));

  if (!details) {
    notFound();
  }

  const initialOffset = Number.parseInt(offset ?? '0', 10) || 0;

  return (
    <RepertoryShell>
      <section className='mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10'>
        <HistoryBackButton fallbackHref='/' />

        <article className='mt-6 rounded-[14px] bg-white p-5 shadow-sm sm:p-8'>
          <p className='text-sm font-bold text-[#6B3E21]/60'>Cifra</p>
          <h1 className='mt-2 text-2xl font-bold text-[#6B3E21] sm:text-3xl'>
            {details.name}
          </h1>
          <p className='mt-1 text-base text-[#6B3E21]/70'>{details.artist}</p>

          <ChordViewer
            artistSlug={artist}
            details={details}
            initialOffset={initialOffset}
            repertoryId={repertoryId}
            shouldPersistSimplified={Boolean(repertoryId && songId)}
            songSlug={song}
            songId={songId}
          />
        </article>
      </section>
    </RepertoryShell>
  );
}
