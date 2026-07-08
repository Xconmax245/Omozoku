'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimeGrid } from '@/components/AnimeGrid';
import { FilterPills } from '@/components/FilterPills';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
import { HeroBackdrop } from '@/components/home/HeroBackdrop';
import type { Anime } from '@omozoku/types';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'action', label: 'Action' },
  { id: 'romance', label: 'Romance' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'thriller', label: 'Thriller' },
  { id: 'sci-fi', label: 'Sci-Fi' },
  { id: 'sports', label: 'Sports' },
  { id: 'slice-of-life', label: 'Slice of Life' },
];

interface HomeData {
  top: Anime[];
  seasonal: Anime[];
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetch('/api/home')
      .then((r) => r.json())
      .then((d: HomeData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const topAnime = data?.top ?? [];

  const filteredTop =
    activeFilter === 'all'
      ? topAnime
      : topAnime.filter((a) =>
          a.genres.some((g) => g.name.toLowerCase().replace(/[- ]/g, '-') === activeFilter),
        );

  // Use top anime for the carousel (first 12, high-quality picks)
  const carouselAnimes = topAnime.slice(0, 12);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 space-y-12 max-w-screen-2xl mx-auto">

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 pt-24 pb-32 md:pt-32 md:pb-48 mb-12 overflow-hidden flex flex-col items-center text-center">
        {/* Backdrop Images & Gradient */}
        <HeroBackdrop images={carouselAnimes.map(a => a.images?.webp?.large || a.images?.jpg?.large || '').filter(Boolean)} />

        {/* Content */}
        <div className="relative z-10 max-w-3xl space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-display font-extrabold text-text-primary tracking-tight flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <span>Welcome to</span>
            <img src="/images/logo-wordmark.png" alt="OmoZoku" className="h-12 md:h-16 mt-2 md:mt-0 object-contain drop-shadow-[0_0_20px_rgba(255,45,85,0.4)]" />
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-text-secondary font-body text-lg md:text-xl max-w-xl mx-auto"
          >
            Discover, watch, and track anime with your tribe.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pt-4 flex items-center justify-center gap-4"
          >
            <Link 
              href="/search" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border-2 border-accent text-accent font-body font-bold hover:bg-accent/10 transition-colors"
            >
              Browse All
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 3D Featured Carousel */}
      {loading ? (
        <div className="h-[380px] md:h-[460px] rounded-2xl skeleton" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <FeaturedCarousel animes={carouselAnimes} />
        </motion.div>
      )}

      {/* ─── This Season ──────────────────────────────────────────────────── */}
      <section aria-labelledby="seasonal-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="seasonal-heading" className="text-xl font-display font-extrabold text-text-primary">
            This Season
          </h2>
          <Link href="/search" className="text-sm text-accent hover:underline font-body">
            See all →
          </Link>
        </div>
        <AnimeGrid
          animes={data?.seasonal ?? []}
          loading={loading}
          skeletonCount={7}
          prioritizeFirst
        />
      </section>

      {/* ─── Top Anime ────────────────────────────────────────────────────── */}
      <section aria-labelledby="top-heading">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 id="top-heading" className="text-xl font-display font-extrabold text-text-primary">
              Top Anime
            </h2>
            <Link href="/search" className="text-sm text-accent hover:underline font-body">
              Browse all →
            </Link>
          </div>
          <FilterPills
            items={FILTERS}
            active={activeFilter}
            onChange={setActiveFilter}
          />
        </div>
        <AnimeGrid
          animes={filteredTop}
          loading={loading}
          skeletonCount={14}
        />
      </section>

      {/* ─── Support the Tribe ────────────────────────────────────────────── */}
      <section className="mt-16 md:mt-24">
        <div className="bg-bg-surface rounded-card border border-border-subtle p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="max-w-xl relative z-10 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary mb-3">
              Support the Tribe
            </h2>
            <p className="text-text-secondary font-body leading-relaxed">
              OmoZoku is a solo-built, entirely free sanctuary for anime fans. If you love what I&apos;m building, the absolute best way to support future development and new features is to follow along on X.
            </p>
          </div>
          
          <div className="relative z-10 shrink-0">
            <a 
              href="https://x.com/0nyxexe" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-full font-body font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,45,85,0.3)]"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </svg>
              Follow @0nyxexe
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
