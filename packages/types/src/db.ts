// ─── Database / user-owned types ─────────────────────────────────────────────

import type { WatchlistStatus } from './anime';

export interface WatchlistEntry {
  id: string;
  userId: string;
  animeId: number;
  status: WatchlistStatus;
  addedAt: string; // ISO date string
}

export interface WatchProgress {
  id: string;
  userId: string;
  animeId: number;
  episode: number;
  secondsWatched: number;
  updatedAt: string; // ISO date string
}
