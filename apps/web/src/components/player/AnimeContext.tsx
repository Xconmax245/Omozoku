'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Play, Calendar } from 'lucide-react';
import Image from 'next/image';
import type { Anime } from '@omozoku/types';

interface AnimeContextProps {
  anime: Anime;
}

export function AnimeContext({ anime }: AnimeContextProps) {
  const [expanded, setExpanded] = useState(false);

  // Score formatting
  const scoreColor = 
    !anime.score ? 'text-text-secondary' :
    anime.score >= 8 ? 'text-score-green' :
    anime.score >= 6 ? 'text-score-amber' :
    'text-score-red';

  return (
    <div className="bg-bg-surface rounded-card border border-border-subtle p-4 md:p-6 flex flex-col md:flex-row gap-6">
      {/* Poster */}
      <div className="hidden md:block w-32 shrink-0">
        <div className="w-full aspect-poster rounded-lg overflow-hidden bg-bg-elevated relative">
          <Image 
            src={anime.images.webp?.large || anime.images.jpg.large || ''} 
            alt={anime.title}
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-start">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-body font-bold mb-2">
          {anime.score ? (
            <div className={`flex items-center gap-1 ${scoreColor}`}>
              <Star size={14} fill="currentColor" />
              <span>{anime.score.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-text-secondary">
              <Star size={14} />
              <span>N/A</span>
            </div>
          )}
          {anime.type && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Play size={14} />
              <span>{anime.type}</span>
            </div>
          )}
          {anime.year && (
            <div className="flex items-center gap-1 text-text-secondary">
              <Calendar size={14} />
              <span>{anime.year}</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary mb-1 truncate">
          {anime.title}
        </h1>
        {anime.titleEnglish && anime.titleEnglish !== anime.title && (
          <h2 className="text-text-secondary font-body text-sm mb-3 truncate">
            {anime.titleEnglish}
          </h2>
        )}

        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-4 mt-2">
          {anime.genres.slice(0, 4).map((g) => (
            <span key={g.id} className="px-2 py-1 bg-bg-elevated text-text-primary text-xs font-bold rounded-md">
              {g.name}
            </span>
          ))}
        </div>

        {/* Synopsis */}
        <div className="text-text-secondary font-body text-sm leading-relaxed">
          <p className={expanded ? '' : 'line-clamp-3'}>
            {anime.synopsis || 'No synopsis available.'}
          </p>
          {anime.synopsis && anime.synopsis.length > 150 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-accent hover:underline font-bold mt-1"
            >
              {expanded ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border-subtle">
           <Link href={`/anime/${anime.id}`} className="text-accent hover:underline font-body font-bold text-sm">
             Go to full detail page →
           </Link>
        </div>
      </div>
    </div>
  );
}
