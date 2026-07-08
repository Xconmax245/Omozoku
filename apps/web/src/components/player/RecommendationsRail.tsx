'use client';

import { useState, useEffect } from 'react';
import type { Anime } from '@omozoku/types';
import { AnimeGrid } from '../AnimeGrid';

interface RecommendationsRailProps {
  animeId: number;
}

export function RecommendationsRail({ animeId }: RecommendationsRailProps) {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch(`/api/recommendations?animeId=${animeId}`);
        const data = await res.json();
        if (data.data) {
          setAnimes(data.data);
        }
      } catch (e) {
        console.error('Failed to fetch recommendations', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, [animeId]);

  if (!loading && animes.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-display font-extrabold text-text-primary mb-4">
        More Like This
      </h3>
      <AnimeGrid
        animes={animes}
        loading={loading}
        skeletonCount={5}
        prioritizeFirst
      />
    </div>
  );
}
