// ─── AniDB client stub ────────────────────────────────────────────────────────
// AniDB requires API key registration and has strict rate limits.
// This stub defines the interface so the rest of the app compiles.
// Implement the real HTTP client when you have an API key.
// Docs: https://wiki.anidb.net/API

import type { AnimeRelation } from '@omozoku/types';

/** AniDB API key — set in env. */
const _API_KEY = process.env['ANIDB_API_KEY'];

/**
 * Fetch relations for an anime from AniDB.
 * Falls back to an empty array if AniDB is unavailable (graceful degradation).
 */
export async function anidbGetRelations(_animeId: number): Promise<AnimeRelation[]> {
  if (!_API_KEY) {
    console.warn('[anidb] ANIDB_API_KEY not set — skipping AniDB relations fetch.');
    return [];
  }

  // TODO: Implement real AniDB HTTP API call when credentials are available.
  // AniDB uses a UDP API and/or HTTP API; both require key registration.
  // Reference: https://wiki.anidb.net/HTTP_API_Definition
  console.warn('[anidb] Real AniDB HTTP client not yet implemented — returning empty relations.');
  return [];
}
