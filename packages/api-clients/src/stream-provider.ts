// ─── StreamProvider interface + Local Gogoanime adapter ──────────────────────
// The interface is the contract. GogoScraper is the default implementation.
// To swap providers: create a new class implementing StreamProvider, update getStreamProvider().

import type { WatchResponse } from '@omozoku/types';
import { SourceUnavailableError } from './errors';
import { gogoSearch, gogoGetEpisodes, gogoGetSources } from './gogo-scraper';
import { jikanGetAnime } from './jikan';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface StreamProvider {
  /**
   * Resolve the internal anime ID (MAL/Jikan ID) to a provider-specific
   * episode ID that can be used to fetch sources.
   */
  resolveEpisodeId(animeId: number, episode: number, fallbackTitle?: string, fallbackTitleEnglish?: string): Promise<string>;

  /**
   * Fetch streaming sources for a given provider episode ID.
   */
  getSources(episodeId: string): Promise<WatchResponse>;
}

// ─── Local Gogo Scraper adapter ───────────────────────────────────────────────
// Resolves via the scraper in gogo-scraper.ts using Node crypto (no Docker needed).

export class LocalGogoStreamProvider implements StreamProvider {
  async resolveEpisodeId(animeId: number, episode: number, fallbackTitle?: string, fallbackTitleEnglish?: string): Promise<string> {
    let title = fallbackTitleEnglish ?? fallbackTitle;
    let romajiTitle = fallbackTitle;

    // Only fetch from Jikan if we didn't receive fallbacks
    if (!title || !romajiTitle) {
      try {
        const animeData = await jikanGetAnime(animeId);
        title = animeData.title_english ?? animeData.title;
        romajiTitle = animeData.title;
      } catch (err) {
        throw new SourceUnavailableError('gogoanime', `Cannot determine title for MAL ID ${animeId} (Jikan fetch failed)`);
      }
    }

    if (!title) {
      throw new SourceUnavailableError('gogoanime', `Cannot determine title for MAL ID ${animeId}`);
    }

    // Step 2: Search Gogoanime for the anime using English or romaji title
    const results = await gogoSearch(title);
    if (!results.length) {
      // Fallback: try romaji title
      if (!romajiTitle) {
        throw new SourceUnavailableError('gogoanime', `No search results for "${title}" (MAL ID: ${animeId})`);
      }
      const romajiResults = await gogoSearch(romajiTitle);
      if (!romajiResults.length) {
        throw new SourceUnavailableError('gogoanime', `No search results for "${title}" or "${romajiTitle}" (MAL ID: ${animeId})`);
      }
      return this._resolveFromResults(romajiResults, animeId, episode);
    }

    return this._resolveFromResults(results, animeId, episode);
  }

  private async _resolveFromResults(
    results: Awaited<ReturnType<typeof gogoSearch>>,
    animeId: number,
    episode: number,
  ): Promise<string> {
    // Pick the best match (first result — Gogoanime sorts by relevance)
    const best = results[0];

    // Step 3: Fetch episode list for the matched anime
    const episodes = await gogoGetEpisodes(best.id);
    if (!episodes.length) {
      throw new SourceUnavailableError('gogoanime', `No episodes found for "${best.id}"`);
    }

    // Step 4: Match by episode number
    const ep = episodes.find((e) => e.number === episode);
    if (!ep) {
      // Some shows have a different numbering; try index-based as fallback
      const indexed = episodes[episode - 1];
      if (!indexed) {
        throw new SourceUnavailableError('gogoanime', `Episode ${episode} not found for MAL ID ${animeId}`);
      }
      return indexed.id;
    }

    return ep.id;
  }

  async getSources(episodeId: string): Promise<WatchResponse> {
    return gogoGetSources(episodeId);
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _streamProvider: StreamProvider | null = null;

export function getStreamProvider(): StreamProvider {
  if (!_streamProvider) {
    _streamProvider = new LocalGogoStreamProvider();
  }
  return _streamProvider;
}

// Keep the Consumet class exported for reference but unused by default
export class ConsumetStreamProvider implements StreamProvider {
  constructor(_baseUrl?: string) {
    // no-op: this provider is disabled. Use LocalGogoStreamProvider instead.
  }

  async resolveEpisodeId(_animeId: number, _episode: number, _fallbackTitle?: string, _fallbackTitleEnglish?: string): Promise<string> {
    throw new SourceUnavailableError('consumet', 'Consumet provider is not the active provider. Use LocalGogoStreamProvider.');
  }

  async getSources(_episodeId: string): Promise<WatchResponse> {
    throw new SourceUnavailableError('consumet', 'Consumet provider is not the active provider. Use LocalGogoStreamProvider.');
  }
}
