import type {
  Repertory,
  SearchResult,
  SongDetails,
  SongSearchResponse,
  User,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3333';

type AuthResponse = {
  token: string;
  user: User;
};

export async function register(username: string, password: string) {
  return request<AuthResponse>('/auth/register', {
    body: JSON.stringify({ username, password }),
    method: 'POST',
  });
}

export async function login(username: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    body: JSON.stringify({ username, password }),
    method: 'POST',
  });
}

export async function getCurrentUser(token: string) {
  return request<{ user: User }>('/me', {
    token,
  });
}

export async function listRepertories(token: string) {
  return request<{ repertories: Repertory[] }>('/repertories', {
    token,
  });
}

export async function createRepertory(token: string, name: string) {
  return request<Repertory>('/repertories', {
    body: JSON.stringify({ isPublic: true, name }),
    method: 'POST',
    token,
  });
}

export async function deleteRepertory(token: string, repertoryId: string) {
  return request<{ deleted: true }>(`/repertories/${repertoryId}`, {
    method: 'DELETE',
    token,
  });
}

export async function searchSongs(query: string, limit = 10) {
  return request<SongSearchResponse>(
    `/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
}

export async function getPopularSongs(limit = 12) {
  return request<SongSearchResponse>(`/popular-songs?limit=${limit}`, {
    cache: 'no-store',
  });
}

export async function getSongDetails(
  artistSlug: string,
  songSlug: string,
  version: 'default' | 'simplified' = 'default',
) {
  const query = version === 'simplified' ? '?version=simplified' : '';

  return request<SongDetails>(
    `/artists/${encodeURIComponent(artistSlug)}/songs/${encodeURIComponent(songSlug)}${query}`,
  );
}

export async function addSongToRepertory(
  token: string,
  repertoryId: string,
  song: SearchResult,
  originalKey: string | null = null,
) {
  return request<Repertory>(`/repertories/${repertoryId}/songs`, {
    body: JSON.stringify({
      artist: song.artist,
      artistSlug: song.artistSlug,
      imageUrl: song.imageUrl,
      path: song.path,
      songSlug: song.songSlug,
      title: song.title,
      url: song.url,
      originalKey,
    }),
    method: 'POST',
    token,
  });
}

export async function removeSongFromRepertory(
  token: string,
  repertoryId: string,
  songId: string,
) {
  return request<Repertory>(`/repertories/${repertoryId}/songs/${songId}`, {
    method: 'DELETE',
    token,
  });
}

export async function updateSongKeyOffset(
  token: string,
  repertoryId: string,
  songId: string,
  keyOffset: number,
) {
  return request<Repertory>(`/repertories/${repertoryId}/songs/${songId}/key`, {
    body: JSON.stringify({ keyOffset }),
    method: 'PATCH',
    token,
  });
}

export async function updateSongSimplified(
  token: string,
  repertoryId: string,
  songId: string,
  isSimplified: boolean,
) {
  return request<Repertory>(
    `/repertories/${repertoryId}/songs/${songId}/simplified`,
    {
      body: JSON.stringify({ isSimplified }),
      method: 'PATCH',
      token,
    },
  );
}

export async function getPublicRepertory(id: string) {
  return request<Repertory>(`/repertories/${id}`, {
    cache: 'no-store',
  });
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
) {
  const headers = new Headers(init.headers);

  if (init.body) {
    headers.set('content-type', 'application/json');
  }

  if (init.token) {
    headers.set('authorization', `Bearer ${init.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(error?.message ?? 'Não foi possível concluir a operação.');
  }

  return (await response.json()) as T;
}
