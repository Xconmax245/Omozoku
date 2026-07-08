'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassChipProps extends Omit<HTMLMotionProps<'button'>, 'className' | 'children'> {
  className?: string;
  active?: boolean;
  children?: React.ReactNode;
}

export function GlassChip({ children, className, active, ...props }: GlassChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'relative px-4 py-1.5 rounded-full text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden transition-colors',
        'border backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
        active
          ? 'bg-accent/20 border-accent/40 text-accent shadow-[0_0_15px_rgba(255,45,85,0.2)]'
          : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white',
        className
      )}
      {...props}
    >
      {/* Glossy reflection effect */}
      <span className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none opacity-50" />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
