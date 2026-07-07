// ─── CacheProvider interface + in-memory implementation ──────────────────────
// The real Upstash Redis client implements the same interface.
// Swap by setting CACHE_PROVIDER=redis in .env.

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Returns true if the key exists, without fetching the full value. */
  has(key: string): Promise<boolean>;
}

// ─── In-memory implementation (local dev / testing) ──────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // ms timestamp
}

export class MemoryCache implements CacheProvider {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }
}

// ─── Key convention helpers (§6 of the blueprint) ────────────────────────────

export const CacheKeys = {
  home: () => 'omozoku:home:v1',
  seasonal: (year: number, season: string) => `omozoku:seasonal:${year}:${season}`,
  search: (queryHash: string) => `omozoku:search:${queryHash}`,
  anime: (id: number) => `omozoku:anime:${id}`,
  characters: (id: number) => `omozoku:anime:${id}:characters`,
  relations: (id: number) => `omozoku:anime:${id}:relations`,
  episodes: (id: number) => `omozoku:anime:${id}:episodes`,
  watch: (animeId: number, episode: number) => `omozoku:watch:${animeId}:ep${episode}`,
  facts: (id: number) => `omozoku:facts:${id}`,
  top: () => 'omozoku:top:v1',
};

export const CacheTTL = {
  home: 30 * 60,           // 30 min
  seasonal: 6 * 60 * 60,  // 6h
  search: 15 * 60,         // 15 min
  anime: 24 * 60 * 60,    // 24h
  characters: 24 * 60 * 60,
  relations: 7 * 24 * 60 * 60, // 7d
  episodes: 12 * 60 * 60, // 12h
  watch: 5 * 60,           // 5 min (stream URLs expire fast)
  facts: 365 * 24 * 60 * 60, // forever (~1yr)
  top: 6 * 60 * 60,       // 6h
} as const;

// ─── Singleton (lazily instantiated) ─────────────────────────────────────────
// In production, replace MemoryCache with an UpstashRedisCache class
// that satisfies the same CacheProvider interface.

let _cache: CacheProvider | null = null;

export function getCache(): CacheProvider {
  if (!_cache) {
    // Future: check process.env.CACHE_PROVIDER === 'redis' and return UpstashRedisCache
    _cache = new MemoryCache();
  }
  return _cache;
}
