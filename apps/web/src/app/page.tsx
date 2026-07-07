'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimeGrid } from '@/components/AnimeGrid';
import { FilterPills } from '@/components/FilterPills';
import { FeaturedCarousel } from '@/components/FeaturedCarousel';
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
      <section>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 space-y-1"
        >
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-text-primary">
            Welcome to{' '}
            <span className="text-accent">OmoZoku</span>
          </h1>
          <p className="text-text-secondary font-body text-base">
            Discover, watch, and track anime with your tribe.
          </p>
        </motion.div>

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
      </section>

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
    </div>
  );
}
