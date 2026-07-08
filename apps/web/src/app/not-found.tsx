'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Home } from 'lucide-react';
import { OmoButton } from '@/components/ui/OmoButton';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Subtle atmospheric background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-6"
        >
          <div className="text-[12rem] leading-none font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white/10 to-transparent select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass size={64} className="text-accent drop-shadow-[0_0_15px_rgba(255,45,85,0.4)] animate-pulse" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl font-display font-extrabold text-text-primary mb-4"
        >
          Lost in the Void
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-text-secondary font-body text-lg mb-10"
        >
          It looks like the anime or page you're looking for doesn't exist, or has slipped into another dimension. Let's get you back to the tribe.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <OmoButton
            asChild
            size="lg"
            className="rounded-full shadow-[0_0_20px_rgba(255,45,85,0.3)] hover:scale-105 transition-transform"
          >
            <Link href="/" className="flex items-center gap-2 font-bold tracking-wide">
              <Home size={18} />
              Return Home
            </Link>
          </OmoButton>
        </motion.div>
      </div>
    </div>
  );
}
