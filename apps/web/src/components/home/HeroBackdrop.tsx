'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroBackdropProps {
  images: string[];
}

export function HeroBackdrop({ images }: HeroBackdropProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    // Cycle every 8 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (!images.length) return null;

  return (
    <div className="bg-bg-base pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ scale: [1, 1.05] }}
            transition={{ duration: 20, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
            className="h-full w-full"
          >
            <Image
              src={images[currentIndex]}
              alt="Backdrop"
              fill
              priority
              style={{ filter: 'contrast(1.15) saturate(0.85)' }}
              className="object-cover object-[center_15%] opacity-60 mix-blend-screen"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Subtle blend transitions instead of heavy dark overlays */}
      <div className="from-bg-base absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent" />
      <div className="from-bg-base via-bg-base/80 absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r to-transparent" />
    </div>
  );
}
