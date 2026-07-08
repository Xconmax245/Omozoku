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
import { EpisodeList } from '@/components/player/EpisodeList';
import { AnimeContext } from '@/components/player/AnimeContext';
import { RecommendationsRail } from '@/components/player/RecommendationsRail';
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

async function fetchSources(host: string, protocol: string, animeId: number, episode: number, title: string, titleEnglish?: string): Promise<{ data: WatchResponse | null; error: { type: string, message: string } | null }> {
  try {
    const url = new URL(`${protocol}://${host}/api/watch`);
    url.searchParams.set('animeId', String(animeId));
    url.searchParams.set('episode', String(episode));
    url.searchParams.set('title', title);
    if (titleEnglish) url.searchParams.set('titleEnglish', titleEnglish);

    const res = await fetch(url.toString(), {
      cache: 'no-store',
    });
    const data = await res.json() as WatchResponse & { message?: string, error?: string };
    if (!res.ok) {
      return { 
        data: null, 
        error: { 
          type: data.error || 'UNKNOWN', 
          message: data.message || 'Stream temporarily unavailable.' 
        } 
      };
    }
    return { data, error: null };
  } catch {
    return { data: null, error: { type: 'NETWORK', message: 'Failed to connect to streaming provider.' } };
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

  const { data: watchResponse, error: sourceError } = await fetchSources(
    host,
    protocol,
    animeId,
    episode,
    anime.title,
    anime.titleEnglish ?? undefined
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
      {/* Back to details */}
      <OmoButton asChild variant="ghost" size="sm" className="w-fit text-text-secondary hover:text-accent font-body">
        <Link href={`/anime/${animeId}`} className="inline-flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to {anime.title}
        </Link>
      </OmoButton>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Main Column: Player, Context, Recommendations */}
        <div className="space-y-6 min-w-0">
          {/* Video Player Area */}
          {sourceError || !watchResponse ? (
            <div className="w-full aspect-video bg-bg-surface rounded-card border border-border-subtle flex flex-col items-center justify-center overflow-hidden shadow-sm relative p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${sourceError?.type === 'NOT_FOUND' ? 'bg-score-amber/10' : 'bg-score-red/10'}`}>
                <AlertTriangle size={32} className={sourceError?.type === 'NOT_FOUND' ? 'text-score-amber' : 'text-score-red'} />
              </div>
              <h3 className="text-xl font-display font-extrabold text-text-primary mb-2">
                {sourceError?.type === 'NOT_FOUND' ? 'Episode Not Found' : 'Source Unavailable'}
              </h3>
              <p className="text-text-secondary font-body max-w-md mb-6">
                {sourceError?.type === 'NOT_FOUND' 
                  ? "This episode hasn't aired yet or isn't available on our streaming provider." 
                  : "The streaming provider could not be reached."}
                {sourceError && sourceError.type !== 'NOT_FOUND' && <span className="text-text-primary/70"> ({sourceError.message})</span>}
              </p>
              {sourceError?.type !== 'NOT_FOUND' && (
                <OmoButton asChild variant="secondary" size="pill">
                  <a href={`/watch/${animeId}/${episode}`} className="flex items-center gap-2 font-body font-semibold">
                    <RefreshCw size={16} />
                    Try Again
                  </a>
                </OmoButton>
              )}
            </div>
          ) : (
            <div className="relative">
              {/* Client shell renders the interactive VideoPlayer */}
              <WatchClientShell
                watchResponse={watchResponse}
                animeTitle={anime.title}
                episode={episode}
                animeId={animeId}
                totalEpisodes={anime.episodes ?? undefined}
                posterUrl={anime.images.webp?.large ?? anime.images.jpg.large ?? undefined}
              />
            </div>
          )}

          {/* Anime Context Details */}
          <div data-aos="fade-up">
            <AnimeContext anime={anime} />
          </div>

          {/* Recommendations Rail */}
          <div data-aos="fade-up" data-aos-delay="100">
            <RecommendationsRail animeId={animeId} />
          </div>
        </div>

        {/* Sidebar: Episode List */}
        <div className="lg:sticky lg:top-6" data-aos="fade-up" data-aos-delay="150">
          <EpisodeList 
            animeId={animeId} 
            currentEpisode={episode} 
            totalEpisodes={anime.episodes ?? undefined} 
          />
        </div>
      </div>
    </div>
  );
}
