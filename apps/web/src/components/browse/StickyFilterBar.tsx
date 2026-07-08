'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Dices, Loader2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryState } from 'nuqs';
import { useRouter } from 'next/navigation';

interface FilterOption {
  label: string;
  value: string;
}

const SORT_OPTIONS: FilterOption[] = [
  { label: 'Popularity', value: 'bypopularity' },
  { label: 'Top Rated', value: 'score' },
  { label: 'Most Favorited', value: 'favorite' },
  { label: 'Newest', value: 'start_date' },
];

const STATUS_OPTIONS: FilterOption[] = [
  { label: 'Airing', value: 'airing' },
  { label: 'Complete', value: 'complete' },
  { label: 'Upcoming', value: 'upcoming' },
];

const TYPE_OPTIONS: FilterOption[] = [
  { label: 'TV', value: 'tv' },
  { label: 'Movie', value: 'movie' },
  { label: 'OVA', value: 'ova' },
  { label: 'Special', value: 'special' },
];

const QUICK_GENRES: { label: string; value: string }[] = [
  { label: 'Action', value: '1' },
  { label: 'Romance', value: '22' },
  { label: 'Comedy', value: '4' },
  { label: 'Sci-Fi', value: '24' },
  { label: 'Fantasy', value: '10' },
  { label: 'Horror', value: '14' },
  { label: 'Sports', value: '30' },
];

// Dropdown component defined outside to avoid re-renders
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: FilterOption[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeOption = options.find((o) => o.value === value);
  const isActive = !!value;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
          isActive
            ? 'bg-white/10 border-white/20 text-white'
            : 'bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80'
        )}
      >
        {activeOption ? activeOption.label : label}
        <ChevronDown
          size={12}
          className={cn('opacity-60 transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Click-away backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-2 left-0 min-w-[160px] bg-[#1C1C20] border border-white/10 rounded-2xl shadow-2xl z-50 py-1.5 overflow-hidden"
            >
              <button
                className="w-full text-left px-4 py-2 text-sm text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
                onClick={() => { onChange(null); setOpen(false); }}
              >
                Any {label}
              </button>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between gap-2',
                    value === opt.value
                      ? 'text-white bg-white/5'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                >
                  {opt.label}
                  {value === opt.value && <Check size={12} className="text-accent shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StickyFilterBar() {
  const router = useRouter();
  const [sort, setSort] = useQueryState('sort', { defaultValue: 'bypopularity' });
  const [status, setStatus] = useQueryState('status');
  const [type, setType] = useQueryState('type');
  const [genre, setGenre] = useQueryState('genre');

  const [isRandomizing, setIsRandomizing] = useState(false);

  const handleRandom = async () => {
    setIsRandomizing(true);
    try {
      const res = await fetch('https://api.jikan.moe/v4/random/anime');
      const { data } = await res.json();
      if (data?.mal_id) {
        router.push(`/anime/${data.mal_id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRandomizing(false);
    }
  };

  const hasActiveFilters =
    status !== null || type !== null || sort !== 'bypopularity' || genre !== null;

  const clearAll = () => {
    setSort(null);
    setStatus(null);
    setType(null);
    setGenre(null);
  };

  return (
    <div
      id="filters-section"
      className="sticky top-0 z-40 w-full bg-[#0E0E11]/90 backdrop-blur-2xl border-b border-white/[0.06]"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Single scrollable row */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto hide-scrollbar">
          
          {/* Filters label */}
          <div className="flex items-center gap-1.5 text-white/40 pr-3 border-r border-white/10 shrink-0">
            <SlidersHorizontal size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
          </div>

          {/* Dropdowns */}
          <FilterDropdown label="Type" value={type} options={TYPE_OPTIONS} onChange={setType} />
          <FilterDropdown label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <FilterDropdown label="Sort" value={sort === 'bypopularity' ? null : sort} options={SORT_OPTIONS} onChange={(v) => setSort(v ?? 'bypopularity')} />

          {/* Visual separator */}
          <div className="w-px h-5 bg-white/10 shrink-0 mx-1" />

          {/* Genre pills */}
          {QUICK_GENRES.map((g) => {
            const isActive = genre === g.value;
            return (
              <button
                key={g.value}
                onClick={() => setGenre(isActive ? null : g.value)}
                className={cn(
                  'shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border',
                  isActive
                    ? 'bg-accent/15 border-accent/40 text-accent shadow-[0_0_12px_rgba(255,45,85,0.2)]'
                    : 'bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:border-white/20 hover:text-white/80'
                )}
              >
                {g.label}
              </button>
            );
          })}

          {/* Visual separator */}
          <div className="w-px h-5 bg-white/10 shrink-0 mx-1" />

          {/* Random */}
          <button
            onClick={handleRandom}
            disabled={isRandomizing}
            className="shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border border-accent/30 text-accent bg-accent/5 hover:bg-accent/15 hover:border-accent/50 disabled:opacity-40 shadow-[0_0_16px_rgba(255,45,85,0.1)]"
          >
            {isRandomizing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Dices size={14} />
            )}
            Random
          </button>

          {/* Clear — only shows when filters are active */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                onClick={clearAll}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors border border-white/0 hover:border-white/10 ml-1"
              >
                <X size={12} />
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
