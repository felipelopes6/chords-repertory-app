import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublicRepertory } from '@/features/repertory/api';
import { HistoryBackButton } from '@/features/repertory/components/history-back-button';
import { RepertoryDetail } from '@/features/repertory/components/repertory-detail';
import { RepertoryShell } from '@/features/repertory/components/repertory-shell';

type SharedRepertoryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Repertório compartilhado',
};

export default async function SharedRepertoryPage({
  params,
}: SharedRepertoryPageProps) {
  const { id } = await params;
  const repertory = await getPublicRepertory(id).catch(() => null);

  if (!repertory) {
    notFound();
  }

  return (
    <RepertoryShell>
      <section className='mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10'>
        <HistoryBackButton fallbackHref='/repertory' />

        <RepertoryDetail initialRepertory={repertory} />
      </section>
    </RepertoryShell>
  );
}
