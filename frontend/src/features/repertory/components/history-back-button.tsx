'use client';

import { useRouter } from 'next/navigation';

type HistoryBackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

export function HistoryBackButton({
  fallbackHref = '/',
  label = 'Voltar',
}: HistoryBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button
      className='text-sm font-bold text-[#F3A24D] underline-offset-4 hover:underline'
      onClick={handleBack}
      type='button'
    >
      {label}
    </button>
  );
}
