// ─── Shared fetch wrapper ─────────────────────────────────────────────────────
// Handles: timeouts, retries, structured logging, typed errors.
// All provider clients call this — never raw fetch().

import { withRetry, type RetryOptions } from './retry';
import { ProviderDownError, NotFoundError, RateLimitError, OmoZokuError } from './errors';
import { acquireToken } from './throttle';

export interface FetchOptions extends RequestInit {
  /** Provider name for logging/errors (e.g. "jikan", "consumet"). */
  provider: string;
  /** Timeout in ms. Default: 8000 */
  timeoutMs?: number;
  /** Retry config. Defaults: maxAttempts=3, baseDelayMs=500 */
  retry?: RetryOptions;
  /** If true, skips retry (e.g. for HEAD validation checks). */
  noRetry?: boolean;
}

export async function apiFetch<T = unknown>(url: string, options: FetchOptions): Promise<T> {
  const {
    provider,
    timeoutMs = 8_000,
    retry,
    noRetry = false,
    ...fetchOptions
  } = options;

  const start = Date.now();

  // Acquire a rate-limit token BEFORE attempting the fetch.
  // This sits outside the retry loop so retries also go through the throttle.
  await acquireToken(provider);

  const doFetch = async (): Promise<T> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
    } catch (err) {
      const latency = Date.now() - start;
      console.error(`[${provider}] Network error | url=${url} | latency=${latency}ms`, err);
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    const latency = Date.now() - start;

    // Structured log every request
    console.info(`[${provider}] ${fetchOptions.method ?? 'GET'} ${url} → ${response.status} (${latency}ms)`);

    if (response.status === 404) {
      throw new NotFoundError(provider, url);
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
      throw new RateLimitError(provider, retryAfter);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new ProviderDownError(provider, new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`));
    }

    return response.json() as Promise<T>;
  };

  if (noRetry) {
    return doFetch();
  }

  try {
    return await withRetry(doFetch, retry);
  } catch (err) {
    if (err instanceof OmoZokuError) throw err;
    throw new ProviderDownError(provider, err);
  }
}
