'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Play, X } from 'lucide-react';

interface NextEpisodeCardProps {
  animeId: number;
  animeTitle: string;
  nextEpisode: number;
  posterUrl?: string;
  countdownStart?: number;
  onCancel: () => void;
  onNext: () => void;
}

export function NextEpisodeCard({ 
  animeTitle, 
  nextEpisode, 
  posterUrl, 
  countdownStart = 15,
  onCancel,
  onNext 
}: NextEpisodeCardProps) {
  const [timeLeft, setTimeLeft] = useState(countdownStart);

  useEffect(() => {
    if (timeLeft <= 0) {
      onNext();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onNext]);

  return (
    <div className="absolute bottom-24 right-4 md:bottom-28 md:right-8 z-50 bg-bg-surface/95 backdrop-blur-md border border-border-subtle rounded-xl p-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-8 fade-in duration-300 w-[300px]">
      {/* Thumbnail */}
      <div className="w-20 aspect-video rounded-md bg-bg-elevated overflow-hidden shrink-0 relative">
        {posterUrl && (
          <Image src={posterUrl} alt="Poster" fill sizes="80px" className="object-cover opacity-60" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Play size={20} className="text-white drop-shadow-md" fill="currentColor" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-0.5">
          Up Next in {timeLeft}s
        </div>
        <div className="text-sm font-display font-extrabold text-text-primary truncate">
          Episode {nextEpisode}
        </div>
        <div className="text-xs text-text-secondary font-body truncate">
          {animeTitle}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-l border-border-subtle pl-3 ml-1 shrink-0">
        <button 
          onClick={onCancel}
          className="p-1.5 rounded-full hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
          title="Cancel Autoplay"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-bg-elevated rounded-b-xl overflow-hidden">
        <div 
          className="h-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / countdownStart) * 100}%` }}
        />
      </div>
    </div>
  );
}
