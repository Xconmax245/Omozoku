'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, scoreBg, normalizeScore } from '@/lib/utils';
import type { Anime } from '@omozoku/types';

interface PosterCardProps {
  anime: Pick<Anime, 'id' | 'title' | 'images' | 'score' | 'year' | 'type'>;
  priority?: boolean;
  /** AOS stagger delay in ms */
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

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={aosDelay}
      data-aos-once="true"
    >
      <Link href={`/anime/${anime.id}`} className="group block">
        <motion.div
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[2/3] rounded-card overflow-hidden bg-bg-surface skeleton border border-border-subtle shadow-lg"
        >
          {/* Poster image */}
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={anime.title}
              fill
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, (max-width: 1440px) 16vw, 14vw"
              className="object-cover transition-opacity duration-300"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 skeleton" />
          )}

          {/* Gradient overlay for score badge readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Score badge — top right */}
          {score100 !== null && (
            <span
              className={cn(
                'absolute top-2 right-2 px-2 py-0.5 rounded-pill text-xs font-display font-extrabold tabular-nums',
                scoreBg(score100),
              )}
            >
              {anime.score?.toFixed(1)}
            </span>
          )}
        </motion.div>

        {/* Card footer */}
        <div className="mt-2 space-y-0.5 px-0.5">
          <p className="text-sm font-body text-text-primary line-clamp-2 leading-snug group-hover:text-accent transition-colors duration-150">
            {anime.title}
          </p>
          <p className="text-xs font-body text-text-secondary">
            {[anime.type !== 'Unknown' ? anime.type : null, anime.year]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </Link>
    </div>
  );
}

/** Skeleton placeholder matching exact card dimensions */
export function PosterCardSkeleton() {
  return (
    <div className="space-y-2">
      <div className="aspect-[2/3] skeleton rounded-card" />
      <div className="space-y-1.5 px-0.5">
        <div className="h-3.5 skeleton rounded-pill w-3/4" />
        <div className="h-3 skeleton rounded-pill w-1/3" />
      </div>
    </div>
  );
}
