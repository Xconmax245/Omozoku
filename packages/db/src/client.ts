// ─── DB client — local mock implementation ────────────────────────────────────
// Implements the same interface the real Supabase/Drizzle client will expose.
// Swap by setting SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.

import { randomUUID } from 'node:crypto';
import type { WatchlistEntry, WatchProgress } from '@omozoku/types';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface DbClient {
  watchlist: {
    getByUser(userId: string): Promise<WatchlistEntry[]>;
    upsert(entry: Omit<WatchlistEntry, 'id' | 'addedAt'>): Promise<WatchlistEntry>;
    remove(userId: string, animeId: number): Promise<void>;
  };
  progress: {
    get(userId: string, animeId: number, episode: number): Promise<WatchProgress | null>;
    upsert(data: Omit<WatchProgress, 'id' | 'updatedAt'>): Promise<WatchProgress>;
    getRecent(userId: string, limit?: number): Promise<WatchProgress[]>;
  };
}

// ─── In-memory mock ───────────────────────────────────────────────────────────

class MemoryDb implements DbClient {
  private watchlistStore = new Map<string, WatchlistEntry>();
  private progressStore = new Map<string, WatchProgress>();

  watchlist = {
    getByUser: async (userId: string): Promise<WatchlistEntry[]> =>
      [...this.watchlistStore.values()].filter((e) => e.userId === userId),

    upsert: async (
      entry: Omit<WatchlistEntry, 'id' | 'addedAt'>,
    ): Promise<WatchlistEntry> => {
      const key = `${entry.userId}:${entry.animeId}`;
      const existing = this.watchlistStore.get(key);
      const full: WatchlistEntry = {
        id: existing?.id ?? randomUUID(),
        addedAt: existing?.addedAt ?? new Date().toISOString(),
        ...entry,
      };
      this.watchlistStore.set(key, full);
      return full;
    },

    remove: async (userId: string, animeId: number): Promise<void> => {
      this.watchlistStore.delete(`${userId}:${animeId}`);
    },
  };

  progress = {
    get: async (
      userId: string,
      animeId: number,
      episode: number,
    ): Promise<WatchProgress | null> =>
      this.progressStore.get(`${userId}:${animeId}:${episode}`) ?? null,

    upsert: async (data: Omit<WatchProgress, 'id' | 'updatedAt'>): Promise<WatchProgress> => {
      const key = `${data.userId}:${data.animeId}:${data.episode}`;
      const existing = this.progressStore.get(key);
      const full: WatchProgress = {
        id: existing?.id ?? randomUUID(),
        updatedAt: new Date().toISOString(),
        ...data,
      };
      this.progressStore.set(key, full);
      return full;
    },

    getRecent: async (userId: string, limit = 20): Promise<WatchProgress[]> =>
      [...this.progressStore.values()]
        .filter((p) => p.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, limit),
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: DbClient | null = null;

export function getDb(): DbClient {
  if (!_db) {
    // Future: if (process.env.SUPABASE_URL) return new SupabaseDb();
    _db = new MemoryDb();
  }
  return _db;
}
