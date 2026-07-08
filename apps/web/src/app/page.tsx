'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, PlayCircle } from 'lucide-react';
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
          a.genres.some((g) => g.name.toLowerCase().replace(/[- ]/g, '-') === activeFilter)
        );

  // Use top anime for the carousel (first 12, high-quality picks)
  const carouselAnimes = topAnime.slice(0, 12);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-12 px-4 py-6 md:px-6 lg:px-8">
      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative -mx-4 mb-12 flex min-h-[85vh] flex-col justify-end overflow-hidden px-4 pb-32 pt-16 md:-mx-6 md:px-6 md:pb-48 md:pt-24 lg:-mx-8 lg:px-12">
        {/* Micro-labels in corners (Directive 105) */}
        <div className="absolute left-4 top-8 z-20 hidden font-mono text-xs uppercase tracking-widest text-white/50 md:left-12 md:block">
          Welcome to OmoZoku
        </div>
        <div className="absolute right-4 top-8 z-20 hidden font-mono text-xs uppercase tracking-widest text-white/50 md:right-12 md:block">
          {topAnime.length > 0 ? `Now Trending: ${topAnime[0].title}` : 'Discover the Best'}
        </div>

        {/* Backdrop Images */}
        <HeroBackdrop
          images={carouselAnimes
            .map((a) => a.images?.webp?.large || a.images?.jpg?.large || '')
            .filter(Boolean)}
        />

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-screen-2xl">
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-12">
            {/* Left side: Massive Text */}
            <div className="col-span-1 space-y-6 md:col-span-8">
              {/* Micro-banner moved to inline */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-4 inline-flex items-center gap-2"
              >
                <Sparkles className="text-accent" size={16} />
                <span className="text-sm font-medium uppercase tracking-wide text-white">
                  Experience Anime
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-5xl font-extrabold leading-[0.85] tracking-tighter text-white mix-blend-plus-lighter md:text-7xl lg:text-[8rem]"
              >
                Discover the <br />
                <span className="text-accent mix-blend-normal">Ultimate</span>
              </motion.h1>
            </div>

            {/* Right side: Description & CTAs */}
            <div className="col-span-1 flex flex-col items-start space-y-8 md:col-span-4 md:pl-8">
              <motion.p
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-body text-lg leading-relaxed text-white/70 md:text-xl"
              >
                Track your progress, explore thousands of series, and watch together with your
                tribe. Welcome to <strong className="text-white">OmoZoku</strong>.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-start gap-6 sm:flex-row sm:items-center"
              >
                <Link
                  href="/search"
                  className="bg-accent rounded-full px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-white hover:text-black"
                >
                  Start Exploring
                </Link>

                <Link
                  href="/search?sort=bypopularity"
                  className="hover:text-accent group flex items-center gap-2 text-lg font-bold text-white transition-colors"
                >
                  <PlayCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="group-hover:decoration-accent underline decoration-white/30 underline-offset-4 transition-colors">
                    Trending Now
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Featured Carousel */}
      {loading ? (
        <div className="skeleton h-[380px] rounded-2xl md:h-[460px]" />
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
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="seasonal-heading"
            className="font-display text-text-primary text-xl font-extrabold"
          >
            This Season
          </h2>
          <Link href="/search" className="text-accent font-body text-sm hover:underline">
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
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="top-heading" className="font-display text-text-primary text-xl font-extrabold">
              Top Anime
            </h2>
            <Link href="/search" className="text-accent font-body text-sm hover:underline">
              Browse all →
            </Link>
          </div>
          <FilterPills items={FILTERS} active={activeFilter} onChange={setActiveFilter} />
        </div>
        <AnimeGrid animes={filteredTop} loading={loading} skeletonCount={14} />
      </section>

      {/* ─── Support the Creator (Premium Redesign) ───────────────────────── */}
      <section className="mb-12 mt-20 md:mt-32">
        <a
          href="https://x.com/0nyxexe"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-bg-surface group relative block w-full overflow-hidden rounded-3xl border border-white/5 transition-all duration-500 hover:border-white/10"
        >
          {/* Grain overlay for texture */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
            }}
          />

          {/* Huge typography texture */}
          <div className="pointer-events-none absolute -bottom-10 -right-10 select-none opacity-5 transition-opacity duration-700 group-hover:opacity-10">
            <span className="font-display text-[12rem] font-extrabold leading-none tracking-tighter md:text-[20rem]">
              NYX
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-start justify-between gap-12 p-8 md:flex-row md:items-end md:p-14">
            {/* Left side: Copy */}
            <div className="max-w-xl">
              <h2 className="font-display mb-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
                Built by one dev.
                <br />
                For the entire tribe.
              </h2>

              <p className="text-text-secondary font-body max-w-md text-base leading-relaxed md:text-lg">
                No corporate backing, no paywalls. If you vibe with OmoZoku and want to see
                what&apos;s next, dropping a follow on X is the easiest way to support it.
              </p>
            </div>

            {/* Right side: Button/CTA */}
            <div className="shrink-0 pb-2">
              <div className="group-hover:text-accent font-display flex items-center gap-4 text-lg font-bold text-white transition-colors duration-300 md:text-xl">
                <span>Follow @0nyxexe</span>
                <div className="group-hover:border-accent group-hover:bg-accent/10 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-all duration-300">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
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
