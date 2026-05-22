type AppToastVariant = 'success' | 'info' | 'error';

type AppToastProps = {
  message: string;
  variant?: AppToastVariant;
};

const toastStyles: Record<
  AppToastVariant,
  {
    container: string;
    icon: string;
  }
> = {
  success: {
    container: 'border-[#9A9D55]/30 text-[#4B4D26]',
    icon: 'bg-[#9A9D55] text-white',
  },
  info: {
    container: 'border-[#F3A24D]/35 text-[#6B3E21]',
    icon: 'bg-[#F3A24D] text-white',
  },
  error: {
    container: 'border-red-200 text-red-800',
    icon: 'bg-red-600 text-white',
  },
};

export function AppToast({ message, variant = 'success' }: AppToastProps) {
  const styles = toastStyles[variant];

  return (
    <div
      aria-live='polite'
      className='pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 sm:bottom-6 sm:justify-end sm:px-6'
      role='status'
    >
      <div
        className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[14px] border bg-white/95 px-4 py-3 text-sm font-bold shadow-[0_16px_48px_rgba(107,62,33,0.18)] backdrop-blur ${styles.container}`}
      >
        <span
          aria-hidden='true'
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
        >
          {variant === 'error' ? (
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='3'
              viewBox='0 0 24 24'
            >
              <path d='M18 6 6 18' />
              <path d='m6 6 12 12' />
            </svg>
          ) : (
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='3'
              viewBox='0 0 24 24'
            >
              <path d='m5 12 4 4L19 6' />
            </svg>
          )}
        </span>

        <p className='min-w-0 leading-5'>{message}</p>
      </div>
    </div>
  );
}
