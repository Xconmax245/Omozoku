'use client';

// ─── WatchClientShell ─────────────────────────────────────────────────────────
// A thin client wrapper that owns router-driven navigation for VideoPlayer.
// Receives fully resolved WatchResponse from the parent Server Component.

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { WatchResponse } from '@omozoku/types';

// Lazy-load VideoPlayer: large hls.js bundle should not block SSR
const VideoPlayer = dynamic(() => import('./VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="player-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="player-overlay player-spinner">
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #FF2D55', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      </div>
    </div>
  ),
});

interface WatchClientShellProps {
  watchResponse: WatchResponse;
  animeTitle: string;
  episode: number;
  animeId: number;
  totalEpisodes?: number;
  posterUrl?: string;
}

export default function WatchClientShell({
  watchResponse,
  animeTitle,
  episode,
  animeId,
  totalEpisodes,
  posterUrl,
}: WatchClientShellProps) {
  const router = useRouter();

  const handleNextEpisode = () => {
    if (!totalEpisodes || episode < totalEpisodes) {
      router.push(`/watch/${animeId}/${episode + 1}`);
    }
  };

  return (
    <VideoPlayer
      watchResponse={watchResponse}
      animeTitle={animeTitle}
      episode={episode}
      posterUrl={posterUrl}
      onNextEpisode={!totalEpisodes || episode < totalEpisodes ? handleNextEpisode : undefined}
    />
  );
}
