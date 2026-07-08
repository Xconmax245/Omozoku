import { cookies } from 'next/headers';
import { db, watchProgress } from '@omozoku/db';
import { desc, eq } from 'drizzle-orm';
import { jikanGetAnime } from '@omozoku/api-clients';
import { transformAnime } from '@omozoku/transformers';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { HorizontalRail } from '@/components/ui/HorizontalRail';
import { PosterCard } from '@/components/PosterCard';
import type { Anime } from '@omozoku/types';

async function getLocalProgress() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('omo_guest_id')?.value;
  if (!sessionId) return [];

  // Get most recent 20 watched episodes
  const progress = await db
    .select()
    .from(watchProgress)
    .where(eq(watchProgress.sessionId, sessionId))
    .orderBy(desc(watchProgress.updatedAt))
    .limit(20);

  if (progress.length === 0) return [];

  const uniqueAnimeIds = Array.from(new Set(progress.map((p) => p.animeId))).slice(0, 10);

  const animeDataMap = new Map<number, Anime>();
  for (const id of uniqueAnimeIds) {
    try {
      const jikanData = await jikanGetAnime(id);
      animeDataMap.set(id, transformAnime(jikanData));
    } catch (err) {
      console.error(`Failed to fetch anime ${id} for progress rail`, err);
    }
  }

  return progress
    .filter((p) => animeDataMap.has(p.animeId))
    .map((p) => ({
      progress: p,
      anime: animeDataMap.get(p.animeId)!,
    }));
}

export async function WatchHero() {
  const localHistory = await getLocalProgress();

  if (localHistory.length === 0) {
    return (
      <div className="bg-bg-base relative flex min-h-[60vh] flex-col justify-end border-b border-white/5 px-4 pb-24 pt-32 md:px-12">
        {/* Micro-labels */}
        <div className="text-text-secondary absolute left-4 top-8 font-mono text-xs uppercase tracking-widest md:left-12">
          OmoZoku / Watch Hub
        </div>
        <div className="text-text-secondary absolute right-4 top-8 flex items-center gap-2 font-mono text-xs uppercase tracking-widest md:right-12">
          <div className="bg-accent h-1.5 w-1.5 rounded-full" />
          Local to this browser
        </div>

        <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 items-end gap-8 md:grid-cols-12">
          <div className="col-span-1 md:col-span-8">
            <h1 className="font-display text-6xl font-extrabold leading-[0.9] tracking-tighter text-white md:text-8xl lg:text-[9rem]">
              Your Anime <br />
              <span className="text-accent">Journey.</span>
            </h1>
          </div>

          <div className="col-span-1 flex flex-col items-start space-y-8 md:col-span-4 md:items-end md:text-right">
            <p className="text-text-secondary font-body max-w-sm text-lg leading-relaxed md:text-xl">
              You haven't watched anything yet on this device. Your history is stored securely in
              your browser.
            </p>
            <Link
              href="/browse"
              className="hover:text-accent group inline-flex items-center gap-3 text-xl font-bold text-white transition-colors"
            >
              Start Exploring
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const latest = localHistory[0];
  const { anime, progress } = latest;
  const bannerImage = anime.images.webp?.large || anime.images.jpg?.large || '';

  return (
    <div className="relative flex min-h-[50vh] items-end overflow-hidden rounded-b-3xl px-4 pb-16 pt-32 md:px-8">
      {/* Banner Backdrop */}
      {bannerImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={bannerImage}
            alt={anime.title}
            fill
            className="scale-105 object-cover opacity-40 blur-sm"
            priority
          />
          <div className="from-bg-base via-bg-base/80 absolute inset-0 bg-gradient-to-t to-transparent" />
          <div className="from-bg-base via-bg-base/60 absolute inset-0 bg-gradient-to-r to-transparent" />
        </div>
      )}

      <div className="absolute right-4 top-24 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur-md md:right-8">
        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        Local to this browser
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-screen-2xl flex-col items-end gap-8 md:flex-row">
        {/* Cover Poster */}
        <div className="hidden w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-2xl md:block md:w-48">
          <Image
            src={anime.images.webp?.large || ''}
            alt={anime.title}
            width={200}
            height={300}
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-accent/20 border-accent/30 text-accent mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Continue Watching
          </div>

          <h1 className="font-display text-3xl font-extrabold leading-tight text-white drop-shadow-md md:text-5xl">
            {anime.title}
          </h1>

          <div className="flex items-center gap-4 text-sm font-medium text-white/80">
            <span className="flex items-center gap-1.5 rounded-md bg-black/40 px-3 py-1 backdrop-blur-sm">
              <Play size={14} /> Episode {progress.episode}
            </span>
            <span className="flex items-center gap-1.5 rounded-md bg-black/40 px-3 py-1 backdrop-blur-sm">
              <Clock size={14} /> {Math.floor(progress.secondsWatched / 60)}m watched
            </span>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href={`/watch/${anime.id}/${progress.episode}`}
              className="flex items-center gap-2 rounded-full bg-white px-8 py-3 font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:bg-white/90"
            >
              <Play size={18} className="fill-current" />
              Resume Ep {progress.episode}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function WatchHistoryRail() {
  const localHistory = await getLocalProgress();
  if (localHistory.length <= 1) return null; // Only show if they have more than the hero

  // Deduplicate by animeId for the rail, excluding the hero (index 0)
  const seen = new Set([localHistory[0].anime.id]);
  const railItems = [];

  for (const item of localHistory.slice(1)) {
    if (!seen.has(item.anime.id)) {
      seen.add(item.anime.id);
      railItems.push(item);
    }
  }

  if (railItems.length === 0) return null;

  return (
    <HorizontalRail title="Recently Watched">
      {railItems.map((item, i) => (
        <div key={item.anime.id} className="w-[140px] flex-none md:w-[180px]">
          <PosterCard anime={item.anime} aosDelay={i * 50} />
          {/* Progress bar overlay could go here */}
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            {/* Fake progress for now since we don't have episode duration */}
            <div className="bg-accent h-full w-1/3" />
          </div>
          <p className="text-text-secondary mt-1 text-xs font-medium">
            Episode {item.progress.episode}
          </p>
        </div>
      ))}
    </HorizontalRail>
  );
}

export async function StatisticsGrid() {
  const localHistory = await getLocalProgress();
  if (localHistory.length === 0) return null;

  const totalSeconds = localHistory.reduce((acc, curr) => acc + curr.progress.secondsWatched, 0);
  const hoursWatched = (totalSeconds / 3600).toFixed(1);
  const totalEpisodes = localHistory.length;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8 md:px-8">
      <h2 className="font-display mb-4 text-xl font-bold text-white md:text-2xl">Your Stats</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="group relative flex flex-col justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
          <div className="absolute -bottom-4 -right-4 opacity-5 transition-opacity group-hover:opacity-10">
            <Clock size={80} />
          </div>
          <p className="text-text-secondary mb-1 text-sm font-medium">Hours Watched</p>
          <p className="font-display text-3xl font-extrabold text-white">{hoursWatched}h</p>
        </div>

        <div className="group relative flex flex-col justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
          <div className="absolute -bottom-4 -right-4 opacity-5 transition-opacity group-hover:opacity-10">
            <Play size={80} />
          </div>
          <p className="text-text-secondary mb-1 text-sm font-medium">Episodes Started</p>
          <p className="font-display text-3xl font-extrabold text-white">{totalEpisodes}</p>
        </div>

        <div className="group relative flex flex-col justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10">
          <div className="absolute -bottom-4 -right-4 opacity-5 transition-opacity group-hover:opacity-10">
            <CheckCircle size={80} />
          </div>
          <p className="text-text-secondary mb-1 text-sm font-medium">Anime Started</p>
          <p className="font-display text-3xl font-extrabold text-white">
            {new Set(localHistory.map((h) => h.anime.id)).size}
          </p>
        </div>
      </div>
    </div>
  );
}
