// ─── Typed error classes ──────────────────────────────────────────────────────
// All external API errors are wrapped in these so callers can switch on type
// without parsing message strings.

export class OmoZokuError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'OmoZokuError';
  }
}

export class ProviderDownError extends OmoZokuError {
  constructor(provider: string, cause?: unknown) {
    super(`Provider "${provider}" is currently unavailable.`, 'PROVIDER_DOWN', provider);
    this.name = 'ProviderDownError';
    if (cause instanceof Error) this.cause = cause;
  }
}

export class NotFoundError extends OmoZokuError {
  constructor(provider: string, resource: string) {
    super(`Resource "${resource}" not found on "${provider}".`, 'NOT_FOUND', provider, 404);
    this.name = 'NotFoundError';
  }
}

export class SourceUnavailableError extends OmoZokuError {
  constructor(provider: string, detail?: string) {
    super(detail ?? `Stream source unavailable from "${provider}".`, 'SOURCE_UNAVAILABLE', provider);
    this.name = 'SourceUnavailableError';
  }
}

export class RateLimitError extends OmoZokuError {
  constructor(provider: string, retryAfterSeconds?: number) {
    super(
      `Rate limited by "${provider}".${retryAfterSeconds ? ` Retry after ${retryAfterSeconds}s.` : ''}`,
      'RATE_LIMITED',
      provider,
      429,
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfterSeconds;
  }
  retryAfter?: number;
}
