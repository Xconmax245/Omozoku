'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
            <div className="relative h-12 md:h-16 w-[200px] mt-2 md:mt-0 drop-shadow-[0_0_20px_rgba(255,45,85,0.4)]">
              <Image src="/images/logo-wordmark.png" alt="OmoZoku" fill className="object-contain" priority />
            </div>
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

      {/* ─── Support the Creator (Premium Redesign) ───────────────────────── */}
      <section className="mt-20 md:mt-32 mb-12">
        <a 
          href="https://x.com/0nyxexe" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block relative w-full rounded-3xl overflow-hidden bg-bg-surface border border-white/5 transition-all duration-500 hover:border-white/10"
        >
          {/* Grain overlay for texture */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
          
          {/* Huge typography texture */}
          <div className="absolute -bottom-10 -right-10 select-none pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity duration-700">
            <span className="text-[12rem] md:text-[20rem] font-display font-extrabold leading-none tracking-tighter">NYX</span>
          </div>

          <div className="relative z-10 p-8 md:p-14 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
            
            {/* Left side: Copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-display font-bold tracking-widest uppercase mb-6 text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Solo Project
              </div>
              
              <h2 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
                Built by one dev.<br />
                For the entire tribe.
              </h2>
              
              <p className="text-text-secondary font-body text-base md:text-lg leading-relaxed max-w-md">
                No corporate backing, no paywalls. If you vibe with OmoZoku and want to see what&apos;s next, dropping a follow on X is the easiest way to support it. 
              </p>
            </div>

            {/* Right side: Button/CTA */}
            <div className="shrink-0 pb-2">
              <div className="flex items-center gap-4 text-white group-hover:text-accent transition-colors duration-300 font-display font-bold text-lg md:text-xl">
                <span>Follow @0nyxexe</span>
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/10 transition-all duration-300">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </a>
      </section>
    </div>
  );
}
