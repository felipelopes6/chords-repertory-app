import { z } from 'zod';

export const cifraClubChordSegmentSchema = z.object({
  text: z.string(),
  type: z.enum(['text', 'chord']),
});

export const cifraClubSongSchema = z.object({
  artist: z.string(),
  name: z.string(),
  originalKey: z.string().nullable(),
  youtubeUrl: z.string().url().nullable(),
  cifraclubUrl: z.string().url(),
  cifra: z.array(z.string()),
  cifraLines: z.array(z.array(cifraClubChordSegmentSchema)),
});

export type CifraClubSong = z.infer<typeof cifraClubSongSchema>;

export const cifraClubSearchResultSchema = z.object({
  type: z.enum(['artist', 'song']),
  title: z.string(),
  artist: z.string().nullable(),
  artistSlug: z.string().nullable(),
  songSlug: z.string().nullable(),
  path: z.string(),
  url: z.string().url(),
  imageUrl: z.string().url().nullable(),
  matchType: z.enum(['exact', 'strong', 'partial']),
});

export const cifraClubSearchSchema = z.object({
  query: z.string(),
  results: z.array(cifraClubSearchResultSchema),
  bestMatch: cifraClubSearchResultSchema.nullable(),
  exactMatch: cifraClubSearchResultSchema.nullable(),
});

export type CifraClubSearchResult = z.infer<
  typeof cifraClubSearchResultSchema
>;
export type CifraClubSearch = z.infer<typeof cifraClubSearchSchema>;
