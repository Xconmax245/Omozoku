// ─── Watch Page (Server Component) ───────────────────────────────────────────
// Fetches anime metadata + streaming sources server-side, then passes them to
// the client-side VideoPlayer component.

import { jikanGetAnime } from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { headers } from 'next/headers';
import { OmoButton } from '@/components/ui/OmoButton';
import WatchClientShell from '@/components/player/WatchClientShell';
import type { WatchResponse } from '@omozoku/types';

export const runtime = 'nodejs';

async function fetchAnime(id: number) {
  try {
    const res = await jikanGetAnime(id);
    return transformAnime(res);
  } catch {
    return null;
  }
}

async function fetchSources(host: string, protocol: string, animeId: number, episode: number): Promise<{ data: WatchResponse | null; error: string | null }> {
  try {
    const res = await fetch(`${protocol}://${host}/api/watch?animeId=${animeId}&episode=${episode}`, {
      cache: 'no-store',
    });
    const data = await res.json() as WatchResponse & { message?: string };
    if (!res.ok) return { data: null, error: (data as { message?: string }).message || 'Stream temporarily unavailable.' };
    return { data, error: null };
  } catch {
    return { data: null, error: 'Failed to connect to streaming provider.' };
  }
}

export default async function WatchPage({
  params,
}: {
  params: { id: string; episode: string };
}) {
  const animeId = Number(params.id);
  const episode = Number(params.episode);

  if (isNaN(animeId) || isNaN(episode)) notFound();

  const anime = await fetchAnime(animeId);
  if (!anime) notFound();

  const host = headers().get('host') || 'localhost:3001';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  const { data: watchResponse, error: sourceError } = await fetchSources(host, protocol, animeId, episode);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* Back to details */}
      <OmoButton asChild variant="ghost" size="sm" className="w-fit text-text-secondary hover:text-accent font-body">
        <Link href={`/anime/${animeId}`} className="inline-flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to {anime.title}
        </Link>
      </OmoButton>

      {/* Video Player Area */}
      {sourceError || !watchResponse ? (
        <div className="w-full aspect-video bg-bg-surface rounded-card border border-border-subtle flex flex-col items-center justify-center overflow-hidden shadow-sm relative p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-score-red/10 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-score-red" />
          </div>
          <h3 className="text-xl font-display font-extrabold text-text-primary mb-2">
            Source Unavailable
          </h3>
          <p className="text-text-secondary font-body max-w-md mb-6">
            The streaming provider could not be reached.{' '}
            {sourceError && <span className="text-text-primary/70">({sourceError})</span>}
          </p>
          <OmoButton asChild variant="secondary" size="pill">
            <a href={`/watch/${animeId}/${episode}`} className="flex items-center gap-2 font-body font-semibold">
              <RefreshCw size={16} />
              Try Again
            </a>
          </OmoButton>
        </div>
      ) : (
        /* Client shell renders the interactive VideoPlayer */
        <WatchClientShell
          watchResponse={watchResponse}
          animeTitle={anime.title}
          episode={episode}
          animeId={animeId}
          totalEpisodes={anime.episodes ?? undefined}
          posterUrl={anime.images.webp?.large ?? anime.images.jpg.large ?? undefined}
        />
      )}

      {/* Metadata */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-extrabold text-text-primary">
            Episode {episode}
          </h1>
          <h2 className="text-lg font-body text-text-secondary">
            {anime.title}
          </h2>
        </div>

        {/* Next/Prev Navigation */}
        <div className="flex items-center gap-3">
          {episode > 1 && (
            <OmoButton asChild variant="outline" size="pill">
              <Link href={`/watch/${animeId}/${episode - 1}`} className="font-body text-sm">
                Previous
              </Link>
            </OmoButton>
          )}
          {(!anime.episodes || episode < anime.episodes) && (
            <OmoButton asChild variant="default" size="pill" className="bg-accent hover:bg-accent/90">
              <Link href={`/watch/${animeId}/${episode + 1}`} className="font-body font-bold text-sm text-white">
                Next Episode
              </Link>
            </OmoButton>
          )}
        </div>
      </div>
    </div>
  );
}
