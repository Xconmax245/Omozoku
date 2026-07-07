// ─── Jikan v4 API client ──────────────────────────────────────────────────────
// Jikan is the unofficial MAL API. Rate limit: 3 req/s, 60 req/min.
// Docs: https://docs.api.jikan.moe/

import { apiFetch } from './client';

const BASE_URL = 'https://api.jikan.moe/v4';

// ─── Raw Jikan response types (not exposed outside this package) ──────────────

interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: { count: number; total: number; per_page: number };
}

interface JikanImage {
  jpg: { image_url?: string; small_image_url?: string; large_image_url?: string };
  webp?: { image_url?: string; small_image_url?: string; large_image_url?: string };
}

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string | null;
  status: string;
  type: string;
  rating: string | null;
  episodes: number | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  year: number | null;
  season: string | null;
  duration: string | null;
  genres: Array<{ mal_id: number; name: string }>;
  studios: Array<{ mal_id: number; name: string }>;
  images: JikanImage;
  trailer: { youtube_id: string | null; images: { maximum_image_url: string | null } };
  airing: boolean;
  aired: { from: string | null; to: string | null };
  source: string | null;
}

interface JikanCharacter {
  character: {
    mal_id: number;
    name: string;
    images: JikanImage;
  };
  role: string;
  voice_actors: Array<{
    person: { name: string; images: JikanImage };
    language: string;
  }>;
}

interface JikanRelation {
  relation: string;
  entry: Array<{ mal_id: number; name: string; type: string }>;
}

// ─── Client functions ─────────────────────────────────────────────────────────

/** Raw Jikan response — transformers in packages/transformers normalize these. */

export async function jikanGetAnime(id: number): Promise<JikanAnime> {
  const res = await apiFetch<{ data: JikanAnime }>(`${BASE_URL}/anime/${id}`, { provider: 'jikan' });
  return res.data;
}

export async function jikanSearchAnime(query: string, page = 1, genres?: number[]): Promise<{ data: JikanAnime[]; pagination: JikanPagination }> {
  const params = new URLSearchParams({ q: query, page: String(page) });
  if (genres?.length) params.set('genres', genres.join(','));
  return apiFetch<{ data: JikanAnime[]; pagination: JikanPagination }>(
    `${BASE_URL}/anime?${params}`,
    { provider: 'jikan' },
  );
}

export async function jikanGetTopAnime(page = 1, filter = 'bypopularity'): Promise<{ data: JikanAnime[]; pagination: JikanPagination }> {
  return apiFetch<{ data: JikanAnime[]; pagination: JikanPagination }>(
    `${BASE_URL}/top/anime?page=${page}&filter=${filter}`,
    { provider: 'jikan' },
  );
}

export async function jikanGetSeasonalAnime(year: number, season: string): Promise<{ data: JikanAnime[]; pagination: JikanPagination }> {
  return apiFetch<{ data: JikanAnime[]; pagination: JikanPagination }>(
    `${BASE_URL}/seasons/${year}/${season}`,
    { provider: 'jikan' },
  );
}

export async function jikanGetCurrentSeason(): Promise<{ data: JikanAnime[]; pagination: JikanPagination }> {
  return apiFetch<{ data: JikanAnime[]; pagination: JikanPagination }>(
    `${BASE_URL}/seasons/now`,
    { provider: 'jikan' },
  );
}

export async function jikanGetCharacters(animeId: number): Promise<JikanCharacter[]> {
  const res = await apiFetch<{ data: JikanCharacter[] }>(
    `${BASE_URL}/anime/${animeId}/characters`,
    { provider: 'jikan' },
  );
  return res.data;
}

export async function jikanGetRelations(animeId: number): Promise<JikanRelation[]> {
  const res = await apiFetch<{ data: JikanRelation[] }>(
    `${BASE_URL}/anime/${animeId}/relations`,
    { provider: 'jikan' },
  );
  return res.data;
}

export async function jikanGetEpisodes(animeId: number, page = 1): Promise<{ data: Array<{ mal_id: number; title: string | null; aired: string | null; filler: boolean; recap: boolean }>; pagination: JikanPagination }> {
  return apiFetch<{ data: Array<{ mal_id: number; title: string | null; aired: string | null; filler: boolean; recap: boolean }>; pagination: JikanPagination }>(
    `${BASE_URL}/anime/${animeId}/episodes?page=${page}`,
    { provider: 'jikan' },
  );
}

export async function jikanGetRecommendations(animeId: number): Promise<{ data: Array<{ entry: JikanAnime; votes: number }> }> {
  return apiFetch<{ data: Array<{ entry: JikanAnime; votes: number }> }>(
    `${BASE_URL}/anime/${animeId}/recommendations`,
    { provider: 'jikan' },
  );
}

export async function jikanGetAnimePictures(animeId: number): Promise<{ data: Array<{ jpg: { image_url: string }; webp?: { image_url: string } }> }> {
  return apiFetch<{ data: Array<{ jpg: { image_url: string }; webp?: { image_url: string } }> }>(
    `${BASE_URL}/anime/${animeId}/pictures`,
    { provider: 'jikan' },
  );
}

// Re-export raw types for use in transformers only
export type { JikanAnime, JikanCharacter, JikanRelation };
