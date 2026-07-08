'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

export function SkeletonLoader({ className }: SkeletonProps) {
  return (
    <motion.div
      className={cn('bg-white/5 rounded-lg border border-white/5 overflow-hidden relative', className)}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg]"
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <SkeletonLoader className="aspect-[2/3] w-full rounded-2xl" />
      <SkeletonLoader className="h-5 w-3/4 rounded-md" />
      <SkeletonLoader className="h-4 w-1/2 rounded-md" />
    </div>
  );
}

export function RailSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden py-4 px-4 md:px-0">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex-none w-[140px] md:w-[180px]">
          <AnimeCardSkeleton />
        </div>
      ))}
    </div>
  );
}
