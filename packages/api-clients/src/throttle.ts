// ─── Token-bucket rate limiter ────────────────────────────────────────────────
// Prevents hammering a single provider beyond its documented limits.
// No external dependency — a Map-based bucket per provider label.
//
// Jikan public limits: 3 req/sec, 60 req/min.
// We're conservative: max 2 req/sec to leave headroom for burst variance.

interface BucketConfig {
  /** Max tokens (= max burst). */
  capacity: number;
  /** Tokens added per second. */
  refillRate: number;
}

interface Bucket {
  tokens: number;
  lastRefillMs: number;
}

const PROVIDER_CONFIGS: Record<string, BucketConfig> = {
  jikan:    { capacity: 2, refillRate: 2 },   // 2/s, burst of 2
  consumet: { capacity: 5, refillRate: 5 },   // permissive — self-hosted
  anidb:    { capacity: 1, refillRate: 1 },   // UDP API is very strict
  default:  { capacity: 10, refillRate: 10 }, // unknown providers: lenient
};

const buckets = new Map<string, Bucket>();

function getBucket(provider: string): { bucket: Bucket; config: BucketConfig } {
  const config = PROVIDER_CONFIGS[provider] ?? PROVIDER_CONFIGS['default']!;
  if (!buckets.has(provider)) {
    buckets.set(provider, { tokens: config.capacity, lastRefillMs: Date.now() });
  }
  const bucket = buckets.get(provider)!;
  return { bucket, config };
}

function refill(bucket: Bucket, config: BucketConfig): void {
  const now = Date.now();
  const elapsed = (now - bucket.lastRefillMs) / 1_000; // seconds
  bucket.tokens = Math.min(config.capacity, bucket.tokens + elapsed * config.refillRate);
  bucket.lastRefillMs = now;
}

/**
 * Wait until a token is available for `provider`, then consume it.
 * Resolves immediately if a token is available, otherwise waits (max 10s).
 */
export async function acquireToken(provider: string): Promise<void> {
  const MAX_WAIT_MS = 10_000;
  const POLL_MS = 50;
  const start = Date.now();

  while (true) {
    const { bucket, config } = getBucket(provider);
    refill(bucket, config);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return;
    }

    if (Date.now() - start > MAX_WAIT_MS) {
      console.warn(`[throttle:${provider}] Token wait exceeded ${MAX_WAIT_MS}ms — proceeding anyway to avoid deadlock.`);
      return;
    }

    // Wait one poll interval then try again
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}
