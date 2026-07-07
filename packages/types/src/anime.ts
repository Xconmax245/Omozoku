// ─── Core Anime types ────────────────────────────────────────────────────────

export type AnimeStatus = 'Finished Airing' | 'Currently Airing' | 'Not yet aired' | 'Unknown';
export type AnimeType = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special' | 'Music' | 'Unknown';
export type AnimeRating = 'G' | 'PG' | 'PG-13' | 'R' | 'R+' | 'Rx' | 'Unknown';
export type WatchlistStatus = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch';

export interface Genre {
  id: number;
  name: string;
}

export interface Studio {
  id: number;
  name: string;
}

export interface AnimeImage {
  jpg: { small?: string; medium?: string; large?: string; original?: string };
  webp?: { small?: string; medium?: string; large?: string; original?: string };
}

export interface Anime {
  /** Internal ID — Jikan/MAL ID */
  id: number;
  title: string;
  titleEnglish: string | null;
  titleJapanese: string | null;
  synopsis: string | null;
  status: AnimeStatus;
  type: AnimeType;
  rating: AnimeRating;
  episodes: number | null;
  score: number | null;
  scoredBy: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  year: number | null;
  season: 'winter' | 'spring' | 'summer' | 'fall' | null;
  duration: string | null;
  genres: Genre[];
  studios: Studio[];
  images: AnimeImage;
  trailerUrl: string | null;
  trailerImage: string | null;
  airing: boolean;
  airingStart: string | null;
  airingEnd: string | null;
  source: string | null;
}

export interface AnimeRelation {
  relation: string;
  entries: Array<{ id: number; title: string; type: string }>;
}

export interface Character {
  id: number;
  name: string;
  role: 'Main' | 'Supporting';
  image: string | null;
  voiceActors: Array<{ name: string; language: string; image: string | null }>;
}

export interface AnimeFact {
  animeId: number;
  factId: string;
  text: string;
}
