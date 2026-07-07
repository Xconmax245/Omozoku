// ─── Streaming types ──────────────────────────────────────────────────────────

export type StreamQuality = '1080p' | '720p' | '480p' | '360p' | 'auto';

export interface StreamSource {
  url: string;
  quality: StreamQuality;
  isM3U8: boolean;
  isDub: boolean;
}

export interface Subtitle {
  lang: string;
  label: string;
  url: string;
}

export interface SkipInterval {
  start: number; // seconds
  end: number;   // seconds
}

export interface ThumbnailTimeline {
  url: string;
  interval: number; // seconds between thumbnails
}

export interface WatchResponse {
  sources: StreamSource[];
  subtitles: Subtitle[];
  skipIntro?: SkipInterval;
  skipOutro?: SkipInterval;
  thumbnails?: ThumbnailTimeline;
  nextEpisode?: { episode: number; available: boolean };
  headers?: Record<string, string>; // forwarded for CORS-protected streams
}

// ─── Typed error union (always returned, never a bare throw to the client) ───

export type WatchErrorCode = 'SOURCE_UNAVAILABLE' | 'PROVIDER_DOWN' | 'NOT_FOUND';

export interface WatchError {
  error: WatchErrorCode;
  message: string;
}
