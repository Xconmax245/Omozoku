// ─── Gogoanime / GogoPlay Scraper ─────────────────────────────────────────────
// Provider: gogoanime.is (confirmed working, bypasses anti-bot with correct headers)
//
// Flow:
//  1. Search gogoanime.is for anime title → extract category slugs
//  2. Fetch /category/<slug> page → read episode links directly from HTML
//  3. Fetch episode page → extract GogoPlay embed URL
//  4. Fetch embed page → extract encrypted id + data-value token
//  5. AES-decrypt token, AES-encrypt id, call encrypt-ajax.php
//  6. AES-decrypt response → extract m3u8 / mp4 sources
//
// Key reference: @consumet/extensions GogoCDN extractor
//   key:        37911490979715163134003223491201
//   secondKey:  54674138327930866480207815084989
//   iv:         3134003223491201

import * as crypto from 'crypto';
import type { WatchResponse, StreamSource } from '@omozoku/types';
import { SourceUnavailableError } from './errors';

// ─── Constants (env-overridable) ──────────────────────────────────────────────

const GOGO_BASE = (process.env['GOGO_DOMAIN'] ?? 'https://www.gogoanime.is').replace(/\/$/, '');
// The AJAX CDN is sometimes on the same host — we fall back to it
const GOGO_AJAX = process.env['GOGO_AJAX'] ?? 'https://ajax.gogocdn.net';

const KEYS = {
  key:       Buffer.from('37911490979715163134003223491201', 'utf8'),
  secondKey: Buffer.from('54674138327930866480207815084989', 'utf8'),
  iv:        Buffer.from('3134003223491201', 'utf8'),
};

// ─── Headers that bypass gogoanime.is anti-bot ────────────────────────────────

function makeHeaders(referer?: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Fetch-Site': referer ? 'same-origin' : 'none',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Dest': 'document',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    ...(referer ? { Referer: referer } : {}),
  };
}

function makeAjaxHeaders(referer: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Requested-With': 'XMLHttpRequest',
    Referer: referer,
    Origin: GOGO_BASE,
  };
}

// ─── AES helpers (mirrors CryptoJS CBC with PKCS7) ────────────────────────────

function aesEncrypt(text: string, key: Buffer, iv: Buffer): string {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('base64');
}

function aesDecrypt(ciphertext: string, key: Buffer, iv: Buffer): string {
  const buf = Buffer.from(ciphertext, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(buf), decipher.final()]).toString('utf8');
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function gogoFetch(url: string, referer?: string, timeoutMs = 15_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: makeHeaders(referer),
      redirect: 'follow',
      signal: controller.signal,
    });
    const text = await res.text();
    console.info(`[gogo-scraper] GET ${url} → ${res.status} (${text.length} bytes)`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function gogoFetchJson<T>(url: string, referer: string, timeoutMs = 12_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: makeAjaxHeaders(referer),
      redirect: 'follow',
      signal: controller.signal,
    });
    const text = await res.text();
    console.info(`[gogo-scraper] AJAX GET ${url} → ${res.status} (${text.length} bytes)`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Regex helpers ────────────────────────────────────────────────────────────

function attr(html: string, pattern: RegExp): string | null {
  return html.match(pattern)?.[1] ?? null;
}

function allMatches(html: string, re: RegExp): string[] {
  const results: string[] = [];
  const g = new RegExp(re.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = g.exec(html)) !== null) results.push(m[1]);
  return results;
}

// ─── Step 1: Search ───────────────────────────────────────────────────────────

export interface GogoSearchResult {
  id: string;     // slug e.g. "naruto"
  title: string;
}

export async function gogoSearch(query: string): Promise<GogoSearchResult[]> {
  const url = `${GOGO_BASE}/search.html?keyword=${encodeURIComponent(query)}`;
  const html = await gogoFetch(url);

  // Result items: <p class="name"><a href="/category/SLUG" title="TITLE">
  const slugs  = allMatches(html, /href="\/category\/([^"]+)"/);
  const titles = allMatches(html, /class="name"><a[^>]+title="([^"]+)"/);

  if (!slugs.length) {
    console.warn(`[gogo-scraper] gogoSearch("${query}"): no results (html length=${html.length})`);
  }

  return slugs.map((id, i) => ({ id, title: titles[i] ?? id }));
}

// ─── Step 2: Episode list ─────────────────────────────────────────────────────

export interface GogoEpisode {
  id: string;     // e.g. "naruto-episode-1"
  number: number;
}

export async function gogoGetEpisodes(animeSlug: string): Promise<GogoEpisode[]> {
  const categoryUrl = `${GOGO_BASE}/category/${animeSlug}`;
  const html = await gogoFetch(categoryUrl, GOGO_BASE);

  // The category page embeds ep links directly:
  // <a href="/naruto-episode-1" ep_start="1" ep_end="1">1</a>
  // We match href="/<slug>-episode-<n>" patterns from the #episode_page section
  const epLinks = allMatches(html, /href="\/([\w-]+-episode-\d+)"/);

  if (epLinks.length === 0) {
    // Fallback: try to read movie_id and call AJAX (for sites where the AJAX isn't blocked)
    const movieId = attr(html, /id="movie_id"[^>]*value="(\d+)"/);
    if (!movieId) {
      console.error(`[gogo-scraper] gogoGetEpisodes("${animeSlug}"): no episode links and no movie_id. html length=${html.length}`);
      throw new SourceUnavailableError('gogoanime', `No episodes found for "${animeSlug}"`);
    }

    // Extract ep_start/ep_end from episode pagination
    const epStart = attr(html, /ep_start="(\d+)"/) ?? '0';
    const epEnd   = attr(html, /ep_end="(\d+)"/)   ?? '0';

    try {
      const ajaxUrl = `${GOGO_AJAX}/ajax/load-list-episode?ep_start=${epStart}&ep_end=${epEnd}&id=${movieId}&default_ep=0`;
      const data = await gogoFetchJson<{ html: string }>(ajaxUrl, categoryUrl);
      const ajaxEpLinks = allMatches(data.html, /href="\/([\w-]+-episode-\d+)"/);
      if (ajaxEpLinks.length > 0) {
        return parseEpisodeLinks(ajaxEpLinks).reverse();
      }
    } catch {
      // AJAX also blocked; fall through
    }

    throw new SourceUnavailableError('gogoanime', `Cannot resolve episode list for "${animeSlug}"`);
  }

  // Remove duplicates and sort
  const unique = [...new Set(epLinks)];
  return parseEpisodeLinks(unique).reverse();
}

function parseEpisodeLinks(links: string[]): GogoEpisode[] {
  return links
    .map((slug) => {
      const m = slug.match(/-episode-(\d+(?:\.\d+)?)$/);
      return m ? { id: slug, number: Number(m[1]) } : null;
    })
    .filter((ep): ep is GogoEpisode => ep !== null)
    .sort((a, b) => a.number - b.number);
}

// ─── Step 3: Sources via GogoPlay decryption ──────────────────────────────────

interface GogoSource { file: string; label?: string; type?: string; }
interface GogoAjaxResponse {
  source: GogoSource[];
  source_bk?: GogoSource[];
  track?: { tracks?: Array<{ file: string; kind: string; label?: string }> };
}

export async function gogoGetSources(episodeSlug: string): Promise<WatchResponse> {
  const episodeUrl = `${GOGO_BASE}/${episodeSlug}`;

  // Step A: Fetch episode page → find primary embed iframe
  const episodePage = await gogoFetch(episodeUrl, GOGO_BASE);

  // Try multiple iframe patterns used by different gogoanime mirrors
  let embedUrl =
    attr(episodePage, /class="play-video"[^>]*>\s*<iframe[^>]+src="([^"]+)"/) ??
    attr(episodePage, /<iframe[^>]+src="(https?:\/\/[^"]+(?:embed|newplayer|watch|play|load|vid)[^"]*)"/) ??
    attr(episodePage, /src="(\/\/[^"]+)"/);

  if (!embedUrl) {
    console.error(`[gogo-scraper] No embed found for ${episodeSlug}. html length=${episodePage.length}`);
    throw new SourceUnavailableError('gogoanime', `No embed found for ${episodeSlug}`);
  }

  if (embedUrl.startsWith('//')) embedUrl = `https:${embedUrl}`;
  console.info(`[gogo-scraper] primary embed: ${embedUrl}`);

  // Step B: Check embed type — gogoanime.me.uk newplayer or legacy GogoPlay?
  if (embedUrl.includes('gogoanime.me.uk') || embedUrl.includes('newplayer.php')) {
    // New chain: gogoanime.me.uk/newplayer.php?id=SLUG?ep=EPID → megaplay.buzz
    return await handleNewPlayerChain(embedUrl, episodeUrl);
  }

  // Step C: Legacy GogoPlay/GogoCDN AES decryption path
  return await handleGogoPlayChain(embedUrl, episodeUrl, episodeSlug);
}

// ─── New gogoanime.me.uk → megaplay.buzz chain ────────────────────────────────

async function handleNewPlayerChain(newplayerUrl: string, referer: string): Promise<WatchResponse> {
  // Fetch the newplayer page to get the megaplay.buzz embed
  const newplayerPage = await gogoFetch(newplayerUrl, referer);

  const megaplayUrl = attr(newplayerPage, /<iframe[^>]+src="(https?:\/\/megaplay\.buzz[^"]+)"/);
  if (!megaplayUrl) {
    // Fall back: return the newplayer URL itself as an iframe source
    console.warn(`[gogo-scraper] No megaplay embed in newplayer page. Returning newplayer as iframe.`);
    return buildIframeResponse(newplayerUrl, referer);
  }

  console.info(`[gogo-scraper] megaplay embed: ${megaplayUrl}`);

  // Fetch megaplay stream page to extract data attributes
  try {
    const megaplayPage = await gogoFetch(megaplayUrl, newplayerUrl);
    const dataId     = attr(megaplayPage, /data-id="(\d+)"/);
    const dataRealId = attr(megaplayPage, /data-realid="(\d+)"/);
    const dataMedia  = attr(megaplayPage, /data-mediaid="(\d+)"/);

    console.info(`[gogo-scraper] megaplay data-id=${dataId} data-realid=${dataRealId} data-mediaid=${dataMedia}`);

    // Try known megaplay source API patterns
    if (dataId && dataRealId) {
      const apiUrls = [
        `https://megaplay.buzz/api/sources/${dataId}/${dataRealId}`,
        `https://megaplay.buzz/api/get-sources?id=${dataId}`,
        `https://megaplay.buzz/sources/${dataRealId}`,
      ];
      for (const apiUrl of apiUrls) {
        try {
          const apiData = await gogoFetchJson<{ sources?: Array<{ file: string; label?: string }> }>(
            apiUrl, megaplayUrl
          );
          if (apiData.sources?.length) {
            return buildSourcesFromArray(apiData.sources, megaplayUrl);
          }
        } catch { /* try next */ }
      }
    }
  } catch (err) {
    console.warn(`[gogo-scraper] megaplay page fetch failed: ${String(err)}`);
  }

  // Final fallback: return megaplay embed URL as iframe
  return buildIframeResponse(megaplayUrl, newplayerUrl);
}

function buildIframeResponse(embedUrl: string, referer: string): WatchResponse {
  return {
    sources: [{ url: embedUrl, quality: 'auto', isM3U8: false, isDub: false, isIframe: true }],
    subtitles: [],
    headers: { Referer: referer },
  };
}

function buildSourcesFromArray(
  rawSources: Array<{ file: string; label?: string }>,
  referer: string,
): WatchResponse {
  const sources: StreamSource[] = rawSources.map((s) => {
    const label = s.label ?? 'auto';
    const q = (/\d+p/.exec(label)?.[0] as StreamSource['quality']) ?? 'auto';
    return { url: s.file, quality: q, isM3U8: s.file.includes('.m3u8'), isDub: false };
  });
  return { sources, subtitles: [], headers: { Referer: referer } };
}

// ─── Legacy GogoPlay/GogoCDN AES decryption path ─────────────────────────────

async function handleGogoPlayChain(
  embedUrl: string,
  episodeUrl: string,
  episodeSlug: string,
): Promise<WatchResponse> {
  const embed = new URL(embedUrl);
  const videoId =
    embed.searchParams.get('id') ??
    embed.searchParams.get('vid') ??
    embed.pathname.split('/').pop();

  if (!videoId) {
    throw new SourceUnavailableError('gogoanime', `Cannot extract video id from embed URL: ${embedUrl}`);
  }

  console.info(`[gogo-scraper] GogoPlay embed=${embed.toString()} videoId=${videoId}`);

  // Fetch embed page → extract encrypted token
  const embedPage = await gogoFetch(embed.toString(), episodeUrl);

  const dataValue = attr(embedPage, /data-name="episode"[^>]*data-value="([^"]+)"/);
  if (!dataValue) {
    console.error(`[gogo-scraper] No data-value in GogoPlay embed (len=${embedPage.length})`);
    throw new SourceUnavailableError('gogoanime', `No episode token in embed page for ${episodeSlug}`);
  }

  // AES decrypt token, encrypt video ID
  let decryptedToken: string;
  try {
    decryptedToken = aesDecrypt(dataValue, KEYS.key, KEYS.iv);
  } catch (err) {
    throw new SourceUnavailableError('gogoanime', `Token decrypt failed: ${String(err)}`);
  }

  const encryptedId = aesEncrypt(videoId, KEYS.key, KEYS.iv);

  // Call encrypt-ajax.php
  const ajaxUrl = `${embed.protocol}//${embed.hostname}/encrypt-ajax.php?id=${encodeURIComponent(encryptedId)}&alias=${videoId}&${decryptedToken}`;
  const ajaxData = await gogoFetchJson<{ data: string }>(ajaxUrl, embed.toString());

  if (!ajaxData?.data) {
    throw new SourceUnavailableError('gogoanime', `Empty ajax response for ${episodeSlug}`);
  }

  // Decrypt response → extract sources
  let parsed: GogoAjaxResponse;
  try {
    const decrypted = aesDecrypt(ajaxData.data, KEYS.secondKey, KEYS.iv);
    parsed = JSON.parse(decrypted) as GogoAjaxResponse;
  } catch (err) {
    throw new SourceUnavailableError('gogoanime', `Response decrypt failed: ${String(err)}`);
  }

  if (!parsed.source?.length) {
    throw new SourceUnavailableError('gogoanime', `No sources in decrypted response for ${episodeSlug}`);
  }

  // Build WatchResponse
  const sources: StreamSource[] = [];

  for (const s of parsed.source) {
    if (!s.file) continue;
    if (s.file.includes('.m3u8')) {
      try {
        const m3u8Text = await gogoFetch(s.file, embed.toString());
        const base = s.file.slice(0, s.file.lastIndexOf('/'));
        const qualityMatches = [...m3u8Text.matchAll(/RESOLUTION=\d+x(\d+)[^\n]*\n([^\n]+)/g)];
        if (qualityMatches.length > 0) {
          for (const [, height, uri] of qualityMatches) {
            const segUrl = uri.trim().startsWith('http') ? uri.trim() : `${base}/${uri.trim()}`;
            sources.push({ url: segUrl, quality: `${height}p` as StreamSource['quality'], isM3U8: true, isDub: false });
          }
        }
      } catch { /* use master */ }
      sources.push({ url: s.file, quality: 'auto', isM3U8: true, isDub: false });
    } else {
      const label = s.label ?? 'auto';
      const q = (/\d+p/.exec(label)?.[0] as StreamSource['quality']) ?? 'auto';
      sources.push({ url: s.file, quality: q, isM3U8: false, isDub: false });
    }
  }

  for (const s of parsed.source_bk ?? []) {
    if (s.file) sources.push({ url: s.file, quality: 'auto', isM3U8: s.file.includes('.m3u8'), isDub: false });
  }

  const subtitles = (parsed.track?.tracks ?? [])
    .filter((t) => t.kind !== 'thumbnails')
    .map((t) => ({ url: t.file, lang: t.kind, label: t.label ?? t.kind }));

  return {
    sources,
    subtitles,
    headers: { Referer: embed.toString(), Origin: `${embed.protocol}//${embed.hostname}` },
  };
}

