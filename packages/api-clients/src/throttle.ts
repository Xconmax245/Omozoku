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

const PROVIDER_CONFIGS: Record<string, BucketConfig> = {
  jikan:    { capacity: 2, refillRate: 2 },   // 2/s, burst of 2
  consumet: { capacity: 5, refillRate: 5 },   // permissive — self-hosted
  anidb:    { capacity: 1, refillRate: 1 },   // UDP API is very strict
  default:  { capacity: 10, refillRate: 10 }, // unknown providers: lenient
};

interface QueueState {
  queue: Array<() => void>;
  isProcessing: boolean;
  lastExecutionMs: number;
}

const queues = new Map<string, QueueState>();

function getQueue(provider: string) {
  if (!queues.has(provider)) {
    queues.set(provider, { queue: [], isProcessing: false, lastExecutionMs: 0 });
  }
  return queues.get(provider)!;
}

async function processQueue(provider: string, state: QueueState) {
  if (state.isProcessing) return;
  state.isProcessing = true;

  const config = PROVIDER_CONFIGS[provider] ?? PROVIDER_CONFIGS['default']!;
  // refillRate is tokens per second. e.g., 2 tokens/sec means 500ms between requests.
  const delayMs = 1000 / config.refillRate;

  while (state.queue.length > 0) {
    const now = Date.now();
    const timeSinceLast = now - state.lastExecutionMs;
    
    if (timeSinceLast < delayMs) {
      await new Promise(resolve => setTimeout(resolve, delayMs - timeSinceLast));
    }

    const resolve = state.queue.shift();
    if (resolve) {
      state.lastExecutionMs = Date.now();
      resolve();
    }
  }

  state.isProcessing = false;
}

export function acquireToken(provider: string): Promise<void> {
  return new Promise((resolve) => {
    const state = getQueue(provider);
    state.queue.push(resolve);
    processQueue(provider, state);
  });
}
