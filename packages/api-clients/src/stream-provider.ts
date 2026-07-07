// ─── StreamProvider interface + Consumet adapter ─────────────────────────────
// The interface is the contract. Consumet is ONE implementation.
// To swap providers: create a new class implementing StreamProvider, update getStreamProvider().

import type { WatchResponse } from '@omozoku/types';
import { apiFetch } from './client';
import { SourceUnavailableError } from './errors';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface StreamProvider {
  /**
   * Resolve the internal anime ID (MAL/Jikan ID) to a provider-specific
   * episode ID that can be used to fetch sources.
   */
  resolveEpisodeId(animeId: number, episode: number): Promise<string>;

  /**
   * Fetch streaming sources for a given provider episode ID.
   */
  getSources(episodeId: string): Promise<WatchResponse>;
}

// ─── Consumet adapter ─────────────────────────────────────────────────────────
// Docs: https://docs.consumet.org

interface ConsumetSearchResult {
  results: Array<{ id: string; title: string }>;
}

interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string;
}

interface ConsumetEpisodeList {
  episodes: ConsumetEpisode[];
}

interface ConsumetSource {
  url: string;
  quality?: string;
  isM3U8: boolean;
}

interface ConsumetSubtitle {
  url: string;
  lang: string;
}

interface ConsumetSourcesResponse {
  sources: ConsumetSource[];
  subtitles?: ConsumetSubtitle[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  headers?: Record<string, string>;
}

export class ConsumetStreamProvider implements StreamProvider {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? process.env['CONSUMET_API_URL'] ?? 'https://consumet-api.onrender.com').replace(/\/$/, '');
  }

  async resolveEpisodeId(animeId: number, episode: number): Promise<string> {
    // Step 1: search for the anime by MAL ID
    const searchResult = await apiFetch<ConsumetSearchResult>(
      `${this.baseUrl}/anime/gogoanime/search?query=${animeId}`,
      { provider: 'consumet' },
    );

    const firstResult = searchResult.results?.[0];
    if (!firstResult) {
      throw new SourceUnavailableError('consumet', `No results for anime ${animeId}`);
    }

    // Step 2: fetch episode list and find the matching episode number
    const episodeList = await apiFetch<ConsumetEpisodeList>(
      `${this.baseUrl}/anime/gogoanime/info/${encodeURIComponent(firstResult.id)}`,
      { provider: 'consumet' },
    );

    const ep = episodeList.episodes?.find((e) => e.number === episode);
    if (!ep) {
      throw new SourceUnavailableError('consumet', `Episode ${episode} not found for anime ${animeId}`);
    }

    return ep.id;
  }

  async getSources(episodeId: string): Promise<WatchResponse> {
    const data = await apiFetch<ConsumetSourcesResponse>(
      `${this.baseUrl}/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`,
      { provider: 'consumet' },
    );

    if (!data.sources?.length) {
      throw new SourceUnavailableError('consumet', `No sources returned for episode "${episodeId}"`);
    }

    return {
      sources: data.sources.map((s) => ({
        url: s.url,
        quality: (s.quality as WatchResponse['sources'][0]['quality']) ?? 'auto',
        isM3U8: s.isM3U8,
        isDub: false,
      })),
      subtitles: (data.subtitles ?? []).map((s) => ({
        url: s.url,
        lang: s.lang,
        label: s.lang,
      })),
      skipIntro: data.intro,
      skipOutro: data.outro,
      headers: data.headers,
    };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _streamProvider: StreamProvider | null = null;

export function getStreamProvider(): StreamProvider {
  if (!_streamProvider) {
    _streamProvider = new ConsumetStreamProvider();
  }
  return _streamProvider;
}
