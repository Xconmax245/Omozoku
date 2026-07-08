'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function BrowseHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const scrollToFilters = () => {
    const el = document.getElementById('filters-section');
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative pt-24 pb-12 px-4 md:px-8 overflow-hidden rounded-b-3xl bg-gradient-to-b from-bg-base via-bg-base to-bg-surface/30">
      <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
          <h1 className="text-[36px] md:text-[56px] leading-[1.1] mb-4 font-display font-extrabold text-white tracking-tight">
            Discover your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#FF4B63] drop-shadow-[0_0_15px_rgba(255,45,85,0.4)]">obsession.</span>
          </h1>
          <p className="text-[18px] text-text-secondary font-body mb-8 max-w-2xl mx-auto">
            Explore thousands of anime. Filter by season, studio, or let fate decide.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-2xl"
        >
          <form onSubmit={handleSearch} className="relative group flex items-center w-full h-[56px]">
            <div className="absolute left-6 text-text-secondary group-focus-within:text-accent transition-colors pointer-events-none">
              <Search size={24} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, character, or studio..."
              className="w-full h-full pl-[56px] pr-[120px] bg-white/5 border border-white/10 rounded-full text-lg text-white placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 focus:bg-white/10 transition-all backdrop-blur-md shadow-lg"
            />
            <button 
              type="button"
              onClick={scrollToFilters}
              className="absolute right-1 top-1 bottom-1 px-4 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center gap-2 font-medium transition-colors border border-white/5"
            >
              <SlidersHorizontal size={18} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
