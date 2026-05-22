import { z } from 'zod';

export const repertorySongSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  artistSlug: z.string(),
  songSlug: z.string(),
  path: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url().nullable(),
  originalKey: z.string().nullable().default(null),
  keyOffset: z.number().int().min(-24).max(24).default(0),
  isSimplified: z.boolean().default(false),
  addedAt: z.string(),
});

export const repertorySchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  ownerUsername: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  songs: z.array(repertorySongSchema),
});

export type Repertory = z.infer<typeof repertorySchema>;
export type RepertorySong = z.infer<typeof repertorySongSchema>;
