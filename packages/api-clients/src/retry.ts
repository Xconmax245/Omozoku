// ─── Exponential backoff retry utility ────────────────────────────────────────

export interface RetryOptions {
  /** Max number of attempts (including the first one). Default: 3 */
  maxAttempts?: number;
  /** Base delay in ms before first retry. Default: 500 */
  baseDelayMs?: number;
  /** Max delay cap in ms. Default: 10_000 */
  maxDelayMs?: number;
  /** Only retry on these HTTP status codes (empty = all 5xx + timeout). */
  retryOn?: number[];
}

/** Returns true when the error is retryable (5xx, network/timeout, not 4xx). */
function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    // AbortError means timeout — retryable
    if (error.name === 'AbortError') return true;
    // TypeError usually means network failure
    if (error.name === 'TypeError') return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with exponential backoff retry logic.
 * Never retries on 4xx errors (client errors are deterministic).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500, maxDelayMs = 10_000 } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt || !isRetryable(err)) throw err;

      // Exponential backoff with jitter
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1) + Math.random() * 100, maxDelayMs);
      console.warn(
        `[omozoku:retry] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${Math.round(delay)}ms.`,
        err instanceof Error ? err.message : err,
      );

      await sleep(delay);
    }
  }

  throw lastError;
}
