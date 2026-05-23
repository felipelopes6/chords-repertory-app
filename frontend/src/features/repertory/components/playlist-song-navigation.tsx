import Link from 'next/link';

type PlaylistSongNavigationProps = {
  currentIndex: number;
  nextHref: string | null;
  playlistHref: string;
  playlistName: string;
  previousHref: string | null;
  totalSongs: number;
};

export function PlaylistSongNavigation({
  currentIndex,
  nextHref,
  playlistHref,
  playlistName,
  previousHref,
  totalSongs,
}: PlaylistSongNavigationProps) {
  return (
    <nav
      aria-label='Navegação da playlist'
      className='mt-6 rounded-[14px] border border-[#6B3E21]/10 bg-white p-4 shadow-sm'
    >
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <p className='text-xs font-bold uppercase tracking-[0.18em] text-[#6B3E21]/45'>
            Playlist
          </p>
          <p className='mt-1 truncate text-base font-bold text-[#6B3E21]'>
            {playlistName}
          </p>
          <p className='mt-1 text-sm font-semibold text-[#6B3E21]/60'>
            {currentIndex + 1} de {totalSongs}
          </p>
        </div>

        <div className='grid grid-cols-2 gap-2 sm:flex sm:items-center'>
          <Link
            className='col-span-2 flex h-10 items-center justify-center rounded-[10px] border border-[#6B3E21]/15 px-4 text-sm font-bold text-[#6B3E21] transition hover:bg-[#FDF8F2] sm:col-span-1'
            href={playlistHref}
          >
            Voltar à playlist
          </Link>

          <NavigationLink
            disabledLabel='Primeira música'
            href={previousHref}
            label='Anterior'
          />
          <NavigationLink
            disabledLabel='Fim da playlist'
            href={nextHref}
            label='Próxima'
            primary
          />
        </div>
      </div>
    </nav>
  );
}

function NavigationLink({
  disabledLabel,
  href,
  label,
  primary = false,
}: {
  disabledLabel: string;
  href: string | null;
  label: string;
  primary?: boolean;
}) {
  if (!href) {
    return (
      <span className='flex h-10 items-center justify-center rounded-[10px] border border-[#6B3E21]/10 px-4 text-sm font-bold text-[#6B3E21]/35'>
        {disabledLabel}
      </span>
    );
  }

  return (
    <Link
      className={`flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-bold transition ${
        primary
          ? 'bg-[#F3A24D] text-[#6B3E21] hover:bg-[#F6B469]'
          : 'border border-[#6B3E21]/15 text-[#6B3E21] hover:bg-[#FDF8F2]'
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}
