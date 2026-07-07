// ─── Episode transformer ──────────────────────────────────────────────────────

import type { Episode } from '@omozoku/types';

interface RawJikanEpisode {
  mal_id: number;
  title: string | null;
  aired: string | null;
  filler: boolean;
  recap: boolean;
}

export function transformEpisode(raw: RawJikanEpisode, animeId: number, number: number): Episode {
  return {
    id: `jikan:${animeId}:ep${number}`,
    animeId,
    number,
    title: raw.title,
    titleJapanese: null,
    aired: raw.aired,
    filler: raw.filler,
    recap: raw.recap,
    durationSeconds: null,
    image: null,
  };
}

export function transformEpisodes(raws: RawJikanEpisode[], animeId: number): Episode[] {
  return raws.map((raw, i) => transformEpisode(raw, animeId, i + 1));
}
