// ─── Anime Facts API client ───────────────────────────────────────────────────
// https://anime-facts-rest-api.herokuapp.com

import { apiFetch } from './client';

const BASE_URL =
  process.env['ANIME_FACTS_API_URL'] ?? 'https://anime-facts-rest-api.herokuapp.com/api/v1';

interface FactsApiResponse {
  success: boolean;
  data: Array<{ id: number; fact: string }>;
}

/**
 * Fetch fun facts for an anime by its name slug.
 * Returns an empty array on any error (graceful degradation — facts are non-critical).
 */
export async function fetchAnimeFacts(
  animeSlug: string,
): Promise<Array<{ id: string; text: string }>> {
  try {
    const res = await apiFetch<FactsApiResponse>(
      `${BASE_URL}/${encodeURIComponent(animeSlug)}`,
      { provider: 'anime-facts' },
    );
    if (!res.success || !res.data) return [];
    return res.data.map((f) => ({ id: String(f.id), text: f.fact }));
  } catch {
    // Facts are decorative — never fail a page because of them
    return [];
  }
}
