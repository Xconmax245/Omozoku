// ─── Episode types ────────────────────────────────────────────────────────────

export interface Episode {
  id: string; // provider-specific episode ID
  animeId: number;
  number: number;
  title: string | null;
  titleJapanese: string | null;
  aired: string | null;
  filler: boolean;
  recap: boolean;
  durationSeconds: number | null;
  image: string | null;
}

export interface EpisodeList {
  animeId: number;
  totalEpisodes: number | null;
  episodes: Episode[];
}
