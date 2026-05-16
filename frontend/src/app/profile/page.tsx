import type { Metadata } from 'next';

import { ProfileManager } from '@/features/repertory/components/profile-manager';
import { RepertoryShell } from '@/features/repertory/components/repertory-shell';

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Gerencie seu perfil.',
};

export default function ProfilePage() {
  return (
    <RepertoryShell>
      <section className='mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10'>
        <ProfileManager />
      </section>
    </RepertoryShell>
  );
}
