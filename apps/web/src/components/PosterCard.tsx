'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn, scoreBg, normalizeScore } from '@/lib/utils';
import type { Anime } from '@omozoku/types';
import { Play } from 'lucide-react';

interface PosterCardProps {
  anime: Pick<Anime, 'id' | 'title' | 'images' | 'score' | 'year' | 'type'>;
  priority?: boolean;
  aosDelay?: number;
}

export function PosterCard({ anime, priority = false, aosDelay = 0 }: PosterCardProps) {
  const score100 = normalizeScore(anime.score);
  const posterUrl =
    anime.images.webp?.large ??
    anime.images.webp?.medium ??
    anime.images.jpg.large ??
    anime.images.jpg.medium ??
    '';

  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div data-aos="fade-up" data-aos-delay={aosDelay} data-aos-once="true">
      <Link href={`/anime/${anime.id}`} className="group/card block perspective-[1000px]">
        <motion.div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative aspect-[2/3] rounded-[20px] overflow-hidden bg-bg-surface border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors duration-300 group-hover/card:border-white/20"
        >
          {/* Poster image */}
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={anime.title}
              fill
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, (max-width: 1440px) 16vw, 14vw"
              className="object-cover transition-transform duration-500 group-hover/card:scale-110"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 skeleton" />
          )}

          {/* Inner Shadow / Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)] pointer-events-none" />

          {/* Quick Action Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
             <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,45,85,0.4)] transform scale-75 group-hover/card:scale-100 transition-transform duration-300 delay-75">
               <Play size={20} className="translate-x-0.5" />
             </div>
          </div>

          {/* Glassmorphic Score Badge */}
          {score100 !== null && (
            <div
              className={cn(
                'absolute top-2 right-2 px-2.5 py-1 rounded-xl text-xs font-display font-extrabold tabular-nums flex items-center gap-1 shadow-lg',
                'bg-black/40 backdrop-blur-md border border-white/10 text-white'
              )}
              style={{ transform: 'translateZ(20px)' }}
            >
              <div className={cn('w-1.5 h-1.5 rounded-full', scoreBg(score100).replace('text-', 'bg-').replace('bg-', 'bg-'))} />
              {anime.score?.toFixed(1)}
            </div>
          )}
        </motion.div>

        {/* Card footer */}
        <div className="mt-3 px-1">
          <p className="text-sm font-body font-medium text-text-primary line-clamp-2 leading-snug group-hover/card:text-accent transition-colors duration-200">
            {anime.title}
          </p>
          <p className="text-xs font-body text-text-secondary mt-0.5">
            {[anime.type !== 'Unknown' ? anime.type : null, anime.year].filter(Boolean).join(' · ')}
          </p>
        </div>
      </Link>
    </div>
  );
}

export function PosterCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-[2/3] skeleton rounded-[20px]" />
      <div className="space-y-1.5 px-1">
        <div className="h-3.5 skeleton rounded-pill w-3/4" />
        <div className="h-3 skeleton rounded-pill w-1/3" />
      </div>
    </div>
  );
}
