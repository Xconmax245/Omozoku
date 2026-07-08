'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

interface Episode {
  mal_id: number;
  title: string | null;
  aired: string | null;
  filler: boolean;
  recap: boolean;
}

interface EpisodeListProps {
  animeId: number;
  currentEpisode: number;
  totalEpisodes?: number;
}

export function EpisodeList({ animeId, currentEpisode, totalEpisodes }: EpisodeListProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEps() {
      try {
        const res = await fetch(`/api/episodes?animeId=${animeId}&page=1`);
        const data = await res.json();
        if (data.data) {
          setEpisodes(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch episodes', e);
      } finally {
        setLoading(false);
      }
    }
    fetchEps();
  }, [animeId]);

  if (loading) {
    return (
      <div className="bg-bg-surface rounded-card border border-border-subtle p-4 h-full flex flex-col">
        <h3 className="font-display font-extrabold text-lg mb-4 text-text-primary">Episodes</h3>
        <div className="flex-1 space-y-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg skeleton" />
          ))}
        </div>
      </div>
    );
  }

  // If the API returns no episodes but we know totalEpisodes, we could fake it.
  // For now, let's just use what the API returned, or fake it if empty.
  const displayEpisodes = episodes.length > 0 
    ? episodes 
    : Array.from({ length: totalEpisodes || currentEpisode }).map((_, i) => ({
        mal_id: i + 1,
        title: `Episode ${i + 1}`,
        aired: null,
        filler: false,
        recap: false
      }));

  return (
    <div className="bg-bg-surface rounded-card border border-border-subtle flex flex-col h-full max-h-[600px] lg:max-h-[800px]">
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <h3 className="font-display font-extrabold text-lg text-text-primary">Episodes</h3>
        <span className="text-sm font-body text-text-secondary">{displayEpisodes.length} Episodes</span>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {displayEpisodes.map((ep) => {
          const isCurrent = ep.mal_id === currentEpisode;
          return (
            <Link 
              key={ep.mal_id} 
              href={`/watch/${animeId}/${ep.mal_id}`}
              className={`flex items-center gap-4 p-2 rounded-lg transition-colors group ${
                isCurrent 
                  ? 'bg-accent/10 border border-accent/20' 
                  : 'hover:bg-bg-elevated border border-transparent'
              }`}
            >
              {/* Thumbnail Placeholder */}
              <div className="relative w-24 aspect-video rounded-md bg-bg-elevated overflow-hidden shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-bg-elevated to-border-subtle opacity-50" />
                <span className={`font-display font-bold text-lg z-10 ${isCurrent ? 'text-accent' : 'text-text-secondary'}`}>
                  {ep.mal_id}
                </span>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <Play size={20} className={isCurrent ? 'text-accent' : 'text-white'} fill="currentColor" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-body font-bold truncate ${isCurrent ? 'text-accent' : 'text-text-primary'}`}>
                  {ep.title || `Episode ${ep.mal_id}`}
                </h4>
                {ep.filler && (
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold bg-score-amber/20 text-score-amber px-1.5 py-0.5 rounded">Filler</span>
                )}
                {!ep.filler && ep.recap && (
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-wider font-bold bg-score-amber/20 text-score-amber px-1.5 py-0.5 rounded">Recap</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
