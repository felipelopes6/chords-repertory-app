import type { RepertorySong } from '../types';

export function getPlaylistSongHref(
  repertoryId: string,
  song: RepertorySong,
) {
  const params = new URLSearchParams({
    offset: String(song.keyOffset),
    repertoryId,
    simplified: song.isSimplified ? 'true' : 'false',
    songId: song.id,
  });

  return `/repertory/songs/${song.artistSlug}/${song.songSlug}?${params.toString()}`;
}
