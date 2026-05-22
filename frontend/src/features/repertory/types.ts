export type User = {
  id: string;
  username: string;
  createdAt: string;
};

export type SearchResult = {
  type: 'artist' | 'song';
  title: string;
  artist: string | null;
  artistSlug: string | null;
  songSlug: string | null;
  path: string;
  url: string;
  imageUrl: string | null;
  matchType: 'exact' | 'strong' | 'partial';
};

export type SongSearchResponse = {
  query: string;
  results: SearchResult[];
  bestMatch: SearchResult | null;
  exactMatch: SearchResult | null;
};

export type SongDetails = {
  artist: string;
  name: string;
  version: 'default' | 'simplified';
  originalKey: string | null;
  youtubeUrl: string | null;
  cifraclubUrl: string;
  simplifiedUrl: string | null;
  cifra: string[];
  cifraLines?: ChordSegment[][];
};

export type ChordSegment = {
  text: string;
  type: 'text' | 'chord';
};

export type RepertorySong = {
  id: string;
  title: string;
  artist: string;
  artistSlug: string;
  songSlug: string;
  path: string;
  url: string;
  imageUrl: string | null;
  originalKey: string | null;
  keyOffset: number;
  isSimplified: boolean;
  addedAt: string;
};

export type Repertory = {
  id: string;
  ownerId: string;
  ownerUsername: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  songs: RepertorySong[];
};
