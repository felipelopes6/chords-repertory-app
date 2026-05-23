import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublicRepertory, getSongDetails } from '@/features/repertory/api';
import { ChordViewer } from '@/features/repertory/components/chord-viewer';
import { HistoryBackButton } from '@/features/repertory/components/history-back-button';
import { PlaylistSongNavigation } from '@/features/repertory/components/playlist-song-navigation';
import { RepertoryShell } from '@/features/repertory/components/repertory-shell';
import { SongVideoButton } from '@/features/repertory/components/song-video-button';
import { getPlaylistSongHref } from '@/features/repertory/lib/playlist-navigation';

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
  const [details, playlist] = await Promise.all([
    getSongDetails(
      artist,
      song,
      shouldOpenSimplified ? 'simplified' : 'default',
    ).catch(() => getSongDetails(artist, song).catch(() => null)),
    repertoryId
      ? getPublicRepertory(repertoryId).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!details) {
    notFound();
  }

  const initialOffset = Number.parseInt(offset ?? '0', 10) || 0;
  const currentPlaylistSongIndex =
    playlist && songId
      ? playlist.songs.findIndex((playlistSong) => playlistSong.id === songId)
      : -1;
  const previousPlaylistSong =
    playlist && currentPlaylistSongIndex > 0
      ? playlist.songs[currentPlaylistSongIndex - 1]
      : null;
  const nextPlaylistSong =
    playlist && currentPlaylistSongIndex >= 0
      ? playlist.songs[currentPlaylistSongIndex + 1] ?? null
      : null;

  return (
    <RepertoryShell>
      <section className='mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10'>
        <HistoryBackButton fallbackHref='/' />

        {playlist && currentPlaylistSongIndex >= 0 ? (
          <PlaylistSongNavigation
            currentIndex={currentPlaylistSongIndex}
            nextHref={
              nextPlaylistSong
                ? getPlaylistSongHref(playlist.id, nextPlaylistSong)
                : null
            }
            playlistHref={`/repertory/${playlist.id}`}
            playlistName={playlist.name}
            previousHref={
              previousPlaylistSong
                ? getPlaylistSongHref(playlist.id, previousPlaylistSong)
                : null
            }
            totalSongs={playlist.songs.length}
          />
        ) : null}

        <article className='mt-6 rounded-[14px] bg-white p-5 shadow-sm sm:p-8'>
          <p className='text-sm font-bold text-[#6B3E21]/60'>Cifra</p>
          <div className='mt-2 flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <h1 className='text-2xl font-bold text-[#6B3E21] sm:text-3xl'>
                {details.name}
              </h1>
              <p className='mt-1 text-base text-[#6B3E21]/70'>
                {details.artist}
              </p>
            </div>

            <SongVideoButton
              artist={details.artist}
              songName={details.name}
              youtubeUrl={details.youtubeUrl}
            />
          </div>

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
