'use client';

import { useState, useEffect } from 'react';
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
    <div className="absolute inset-0 z-0 bg-bg-base overflow-hidden pointer-events-none">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <motion.div 
            animate={{ scale: [1, 1.05] }}
            transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
            className="w-full h-full"
          >
            <img 
              src={images[currentIndex]} 
              alt="Backdrop" 
              className="w-full h-full object-cover object-[center_15%] opacity-50"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Vignette (Radial Gradient) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(10,10,12,0.6)_100%)] mix-blend-multiply" />

      {/* Top-to-Bottom Fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-base/20 via-bg-base/80 to-bg-base" />

      {/* Bottom Accent Glow Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/40 to-transparent blur-[1px]" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
    </div>
  );
}
