// ─── /api/proxy/stream ────────────────────────────────────────────────────────
// Server-side proxy for HLS playlists and TS segments.
//
// Usage:
//   GET /api/proxy/stream?url=<ENCODED_URL>&referer=<ENCODED_REFERER>
//
// For .m3u8 playlists:
//   • Fetches the upstream playlist.
//   • Rewrites relative segment/playlist URIs to absolute proxied paths.
//   • Returns the modified playlist with CORS headers.
//
// For .ts / .aac / other segments:
//   • Pipes the raw upstream response bytes to the client.
//   • Injects Referer and Origin headers on the upstream request.
//
// This proxy allows the browser to load Gogoanime/GogoPlay HLS streams without
// CORS or Referer-block issues.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Allow proxying only known Gogoanime CDN hostnames to prevent open redirect abuse.
const ALLOWED_HOSTS = new Set([
  'playtaku.net',
  'gogocdn.net',
  'cdn.gogoanime.fi',
  'stream.moe',
  'vidsrc.net',
  'vidstreaming.io',
  'goload.io',
  'streamani.net',
  'playtaku.online',
  'anitaku.pe',
]);

function isAllowedHost(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, '');
  // Allow exact match or subdomain match
  for (const allowed of ALLOWED_HOSTS) {
    if (host === allowed || host.endsWith(`.${allowed}`)) return true;
  }
  return false;
}

function buildProxiedUrl(rawUrl: string, referer: string): string {
  return `/api/proxy/stream?url=${encodeURIComponent(rawUrl)}&referer=${encodeURIComponent(referer)}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawUrl = searchParams.get('url');
  const referer = searchParams.get('referer') ?? '';

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing `url` parameter' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid `url` parameter' }, { status: 400 });
  }

  if (!isAllowedHost(targetUrl)) {
    return NextResponse.json(
      { error: `Host "${targetUrl.hostname}" is not in the proxy allowlist.` },
      { status: 403 },
    );
  }

  const upstreamHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };
  if (referer) {
    const refUrl = (() => { try { return new URL(referer); } catch { return null; } })();
    upstreamHeaders['Referer'] = referer;
    if (refUrl) upstreamHeaders['Origin'] = `${refUrl.protocol}//${refUrl.hostname}`;
  }

  let upstream: Response;
  try {
    upstream = await fetch(rawUrl, {
      headers: upstreamHeaders,
      redirect: 'follow',
    });
  } catch (err) {
    console.error('[proxy/stream] fetch error', rawUrl, err);
    return NextResponse.json({ error: 'Upstream fetch failed.' }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: `Upstream returned ${upstream.status}` }, { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  const isPlaylist = rawUrl.includes('.m3u8') || contentType.includes('mpegurl');

  if (isPlaylist) {
    // Rewrite .m3u8 playlist so all segment URIs go through our proxy
    const text = await upstream.text();
    const baseOrigin = `${targetUrl.protocol}//${targetUrl.hostname}`;
    const basePath = rawUrl.slice(0, rawUrl.lastIndexOf('/'));

    const rewritten = text
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;

        // Resolve the segment URI to an absolute URL
        let absoluteUri: string;
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          absoluteUri = trimmed;
        } else if (trimmed.startsWith('/')) {
          absoluteUri = `${baseOrigin}${trimmed}`;
        } else {
          absoluteUri = `${basePath}/${trimmed}`;
        }

        return buildProxiedUrl(absoluteUri, referer);
      })
      .join('\n');

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'private, max-age=30',
      },
    });
  }

  // For binary segment/key files: stream through as-is
  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
