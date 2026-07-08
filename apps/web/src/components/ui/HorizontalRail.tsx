'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface HorizontalRailProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function HorizontalRail({ title, children, action }: HorizontalRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 py-2 group">
      <div className="flex items-center justify-between px-4 md:px-6">
        <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white drop-shadow-sm">
          {title}
        </h2>
        {action && <div>{action}</div>}
      </div>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-bg-base via-bg-base/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-start pl-2"
          aria-label="Scroll left"
        >
          <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} className="p-2 bg-black/50 rounded-full backdrop-blur-md">
            <ChevronLeft className="text-white" size={24} />
          </motion.div>
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar px-4 md:px-6 pb-6 pt-2 scroll-smooth"
        >
          {children}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-bg-base via-bg-base/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-end pr-2"
          aria-label="Scroll right"
        >
          <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} className="p-2 bg-black/50 rounded-full backdrop-blur-md">
            <ChevronRight className="text-white" size={24} />
          </motion.div>
        </button>
      </div>
    </div>
  );
}
