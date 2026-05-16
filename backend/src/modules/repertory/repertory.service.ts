import { randomUUID } from 'node:crypto';

import { ResourceNotFoundError } from '../../domain/errors.js';
import { fileStore } from '../storage/file-store.js';
import type { Repertory, RepertorySong } from './repertory.schema.js';
import { repertorySchema } from './repertory.schema.js';

type PublicUser = {
  id: string;
  username: string;
};

type CreateRepertoryInput = {
  name: string;
  description?: string | null;
  isPublic?: boolean;
};

type AddSongInput = {
  title: string;
  artist: string;
  artistSlug: string;
  songSlug: string;
  path: string;
  url: string;
  imageUrl?: string | null;
  originalKey?: string | null;
};

export async function listUserRepertories(user: PublicUser) {
  const data = await fileStore.read();

  return data.repertories
    .filter((repertory) => repertory.ownerId === user.id)
    .map((repertory) => repertorySchema.parse(repertory));
}

export async function getPublicRepertory(id: string) {
  const data = await fileStore.read();
  const repertory = data.repertories.find((candidate) => candidate.id === id);

  if (!repertory || !repertory.isPublic) {
    throw new ResourceNotFoundError('Repertório não encontrado.');
  }

  return repertorySchema.parse(repertory);
}

export async function createRepertory(
  user: PublicUser,
  input: CreateRepertoryInput,
) {
  const data = await fileStore.read();
  const now = new Date().toISOString();
  const repertory: Repertory = {
    id: randomUUID(),
    ownerId: user.id,
    ownerUsername: user.username,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    isPublic: input.isPublic ?? true,
    createdAt: now,
    updatedAt: now,
    songs: [],
  };

  data.repertories.push(repertory);
  await fileStore.write(data);

  return repertorySchema.parse(repertory);
}

export async function deleteRepertory(user: PublicUser, repertoryId: string) {
  const data = await fileStore.read();
  const initialLength = data.repertories.length;

  data.repertories = data.repertories.filter(
    (candidate) =>
      !(candidate.id === repertoryId && candidate.ownerId === user.id),
  );

  if (data.repertories.length === initialLength) {
    throw new ResourceNotFoundError('Repertório não encontrado.');
  }

  await fileStore.write(data);

  return { deleted: true };
}

export async function addSongToRepertory(
  user: PublicUser,
  repertoryId: string,
  input: AddSongInput,
) {
  const data = await fileStore.read();
  const repertory = data.repertories.find(
    (candidate) => candidate.id === repertoryId && candidate.ownerId === user.id,
  );

  if (!repertory) {
    throw new ResourceNotFoundError('Repertório não encontrado.');
  }

  const existingSong = repertory.songs.find(
    (song) => song.artistSlug === input.artistSlug && song.songSlug === input.songSlug,
  );

  if (existingSong) {
    return repertorySchema.parse(repertory);
  }

  const now = new Date().toISOString();
  const song: RepertorySong = {
    id: randomUUID(),
    title: input.title.trim(),
    artist: input.artist.trim(),
    artistSlug: input.artistSlug,
    songSlug: input.songSlug,
    path: input.path,
    url: input.url,
    imageUrl: input.imageUrl ?? null,
    originalKey: input.originalKey ?? null,
    keyOffset: 0,
    addedAt: now,
  };

  repertory.songs.push(song);
  repertory.updatedAt = now;
  await fileStore.write(data);

  return repertorySchema.parse(repertory);
}

export async function updateSongKeyOffset(
  user: PublicUser,
  repertoryId: string,
  songId: string,
  keyOffset: number,
) {
  const data = await fileStore.read();
  const repertory = data.repertories.find(
    (candidate) => candidate.id === repertoryId && candidate.ownerId === user.id,
  );

  if (!repertory) {
    throw new ResourceNotFoundError('Repertório não encontrado.');
  }

  const song = repertory.songs.find((candidate) => candidate.id === songId);

  if (!song) {
    throw new ResourceNotFoundError('Música não encontrada no repertório.');
  }

  song.keyOffset = keyOffset;
  repertory.updatedAt = new Date().toISOString();
  await fileStore.write(data);

  return repertorySchema.parse(repertory);
}

export async function removeSongFromRepertory(
  user: PublicUser,
  repertoryId: string,
  songId: string,
) {
  const data = await fileStore.read();
  const repertory = data.repertories.find(
    (candidate) => candidate.id === repertoryId && candidate.ownerId === user.id,
  );

  if (!repertory) {
    throw new ResourceNotFoundError('Repertório não encontrado.');
  }

  const initialLength = repertory.songs.length;
  repertory.songs = repertory.songs.filter((song) => song.id !== songId);

  if (repertory.songs.length === initialLength) {
    throw new ResourceNotFoundError('Música não encontrada no repertório.');
  }

  repertory.updatedAt = new Date().toISOString();
  await fileStore.write(data);

  return repertorySchema.parse(repertory);
}
