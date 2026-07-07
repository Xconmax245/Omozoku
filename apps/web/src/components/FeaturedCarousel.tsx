/* eslint-disable */
'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MouseEvent as ReactMouseEvent,
} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Anime } from '@omozoku/types';

// ─── Easing ──────────────────────────────────────────────────────────────────
const PREMIUM_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Depth config ─────────────────────────────────────────────────────────────
function getSlideStyle(offset: number) {
  const abs = Math.abs(offset);
  const scale = abs === 0 ? 1 : abs === 1 ? 0.94 : 0.88;
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.75 : 0.45;
  const blur = abs === 0 ? 0 : abs === 1 ? 1 : 3;
  const translateY = abs === 0 ? 0 : abs === 1 ? 12 : 24;
  const rotateY = offset < 0 ? Math.max(offset * 4, -8) : Math.min(offset * 4, 8);
  const zIndex = 10 - abs;

  return { scale, opacity, blur, translateY, rotateY, zIndex };
}

// ─── Ambient background blobs ─────────────────────────────────────────────────
function AmbientBackground({ activeColor }: { activeColor: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Primary glow — accent coloured, slow float */}
      <motion.div
        className="absolute w-[900px] h-[900px] rounded-full opacity-[0.12]"
        style={{
          background: `radial-gradient(circle, ${activeColor} 0%, transparent 70%)`,
          top: '-30%',
          left: '20%',
        }}
        animate={{ x: [0, 60, -40, 0], y: [0, -40, 30, 0], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 34, ease: 'easeInOut', repeat: Infinity }}
      />
      {/* Secondary glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #9333ea 0%, transparent 70%)', bottom: '-20%', right: '10%' }}
        animate={{ x: [0, -50, 30, 0], y: [0, 30, -20, 0], scale: [1, 0.92, 1.06, 1] }}
        transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity, delay: 4 }}
      />
      {/* Tertiary shimmer */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', top: '40%', left: '60%' }}
        animate={{ x: [0, 40, -30, 0], y: [0, -30, 40, 0] }}
        transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity, delay: 8 }}
      />
      {/* Noise grain overlay */}
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }}
      />
    </div>
  );
}

// ─── Slide content (staggered) ────────────────────────────────────────────────
function SlideContent({ anime, isActive }: { anime: Anime; isActive: boolean }) {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.65, ease: PREMIUM_EASE } },
    exit: { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const genres = anime.genres?.slice(0, 3) ?? [];

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={anime.id}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute inset-0 flex flex-col justify-end rounded-2xl overflow-hidden"
        >
          {/* Layered gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/95 via-[#0a0a0c]/40 to-transparent pointer-events-none md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 ease-out" />
          
          <div className="relative z-10 p-5 md:p-6 space-y-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-700 ease-out">
            {/* Genres */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-1.5">
              {genres.map(g => (
                <span key={g.name} className="px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-semibold text-white/70"
                  style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                  {g.name}
                </span>
              ))}
            </motion.div>

            {/* Title */}
            <motion.h2 variants={itemVariants} className="text-lg md:text-xl font-display font-bold text-white/95 leading-snug line-clamp-2">
              {anime.title}
            </motion.h2>

            {/* Meta row */}
            <motion.div variants={itemVariants} className="flex items-center gap-2.5 text-[10px] text-white/50 font-medium">
              {anime.score && (
                <span className="flex items-center gap-1 text-white/80">
                  <Star size={10} className="fill-accent text-accent" />
                  <span className="tabular-nums">{anime.score.toFixed(1)}</span>
                </span>
              )}
              {anime.type !== 'Unknown' && <span>{anime.type}</span>}
              {anime.year && <span>{anime.year}</span>}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex items-center gap-2 pt-2">
              <Link
                href={`/anime/${anime.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-black hover:bg-white/90 active:scale-95 transition-all text-[11px] font-bold shadow-lg"
                onClick={e => e.stopPropagation()}
              >
                <Play size={11} fill="black" />
                Play
              </Link>
              <Link
                href={`/anime/${anime.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/80 hover:text-white text-[11px] font-medium transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)' }}
                onClick={e => e.stopPropagation()}
              >
                <Info size={11} />
                Details
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Single card in the 3D fan ────────────────────────────────────────────────
function CarouselCard({
  anime,
  offset,
  onClick,
}: {
  anime: Anime;
  offset: number;
  onClick: () => void;
}) {
  const isActive = offset === 0;
  const style = getSlideStyle(offset);

  // Mouse-tilt for active card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const tiltX = useSpring(useTransform(mouseY, [-1, 1], [3, -3]), { stiffness: 300, damping: 30 });
  const tiltY = useSpring(useTransform(mouseX, [-1, 1], [-3, 3]), { stiffness: 300, damping: 30 });

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    if (!isActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const poster =
    anime.images?.webp?.large ??
    anime.images?.webp?.medium ??
    anime.images?.jpg?.large ??
    anime.images?.jpg?.medium ??
    '';
  return (
    <motion.div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex-shrink-0 cursor-pointer w-full h-full group"
      animate={{
        opacity: style.opacity,
        translateY: style.translateY,
        scale: style.scale,
        rotateY: style.rotateY,
      }}
      transition={{ duration: 0.75, ease: PREMIUM_EASE }}
      style={{
        rotateX: isActive ? tiltX : 0,
        rotateY: isActive ? tiltY : style.rotateY,
        translateY: style.translateY,
        scale: style.scale,
        zIndex: style.zIndex,
        filter: style.blur > 0 ? `blur(${style.blur}px)` : undefined,
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          aspectRatio: '2/3',
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: isActive ? 'blur(24px)' : undefined,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: isActive
            ? '0 25px 70px rgba(0,0,0,0.5), 0 0 40px rgba(255,45,85,0.15)'
            : '0 12px 40px rgba(0,0,0,0.35)',
          transition: 'box-shadow 0.4s ease, transform 0.18s ease',
        }}
      >
        {/* Poster */}
        {poster && (
          <Image
            src={poster}
            alt={anime.title}
            fill
            priority={isActive}
            sizes="(max-width: 768px) 200px, 280px"
            className="object-cover"
            style={{ transition: 'transform 0.4s ease' }}
          />
        )}

        {/* Active card content overlay */}
        {isActive && <SlideContent anime={anime} isActive={isActive} />}

        {/* Non-active darkening veil */}
        {!isActive && (
          <div className="absolute inset-0 bg-black/30 rounded-2xl" />
        )}
      </div>

      {/* Active card glow underneath */}
      {isActive && (
        <div
          className="absolute -bottom-4 left-4 right-4 h-8 rounded-full blur-2xl opacity-60"
          style={{ background: 'rgba(255,45,85,0.35)' }}
        />
      )}
    </motion.div>
  );
}

// ─── Glass capsule dot indicators ────────────────────────────────────────────
function Indicators({
  count,
  active,
  onSelect,
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6" role="tablist" aria-label="Carousel slide indicators">
      {Array.from({ length: count }).map((_, i) => (
        <motion.button
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onSelect(i)}
          animate={{ width: i === active ? 28 : 8, opacity: i === active ? 1 : 0.35 }}
          transition={{ duration: 0.4, ease: PREMIUM_EASE }}
          className="h-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent"
          style={{
            background:
              i === active
                ? 'linear-gradient(90deg, #FF2D55, #ff6b88)'
                : 'rgba(255,255,255,0.4)',
            boxShadow: i === active ? '0 0 10px rgba(255,45,85,0.5)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function FeaturedCarousel({ animes }: { animes: Anime[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false,
  });

  const [activeIdx, setActiveIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = animes.slice(0, 12);
  const count = items.length;

  // Sync activeIdx from Embla
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIdx(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Autoplay logic
  const scheduleNext = useCallback(() => {
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    autoplayRef.current = setTimeout(() => {
      if (!isPaused && !isHovered && emblaApi) {
        emblaApi.scrollNext();
      }
    }, 7000);
  }, [isPaused, isHovered, emblaApi]);

  useEffect(() => {
    scheduleNext();
    return () => { if (autoplayRef.current) clearTimeout(autoplayRef.current); };
  }, [activeIdx, scheduleNext]);

  // Pause on interaction
  useEffect(() => {
    if (!emblaApi) return;
    const pause = () => setIsPaused(true);
    const resume = () => {
      setIsPaused(false);
      scheduleNext();
    };
    emblaApi.on('pointerDown', pause);
    emblaApi.on('pointerUp', resume);
    return () => {
      emblaApi.off('pointerDown', pause);
      emblaApi.off('pointerUp', resume);
    };
  }, [emblaApi, scheduleNext]);

  const goPrev = useCallback(() => { emblaApi?.scrollPrev(); setIsPaused(false); }, [emblaApi]);
  const goNext = useCallback(() => { emblaApi?.scrollNext(); setIsPaused(false); }, [emblaApi]);
  const goTo = useCallback((i: number) => { emblaApi?.scrollTo(i); setIsPaused(false); }, [emblaApi]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  if (count === 0) return null;

  // Accent color for ambient bg (static for now; could be sampled from poster)
  const accentColor = '#FF2D55';

  return (
    <section
      aria-label="Featured anime carousel"
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0d0d12 0%, #0a0a0c 100%)',
        minHeight: '520px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated ambient background */}
      <AmbientBackground activeColor={accentColor} />

      {/* Padding top so title has breathing room */}
      <div className="relative z-10 pt-10 pb-6 px-4 md:px-8">

        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: PREMIUM_EASE }}
          className="text-center text-xs uppercase tracking-[0.3em] text-white/30 font-semibold mb-8"
        >
          Featured Anime
        </motion.p>

        {/* ── Cards stage ───────────────────────────────────────────────── */}
        <div
          ref={emblaRef}
          className="overflow-hidden"
          style={{ perspective: '1200px' }}
        >
          <div
            className="flex items-center"
            style={{ gap: 'clamp(16px, 2.5vw, 40px)', padding: '40px 0' }}
          >
            {items.map((anime, i) => {
              const offset = i - activeIdx;
              // Wrap offset for circular display
              let wrappedOffset = offset;
              if (offset > count / 2) wrappedOffset = offset - count;
              if (offset < -count / 2) wrappedOffset = offset + count;
              const isVisible = Math.abs(wrappedOffset) <= 3;

              return (
                <div
                  key={anime.id}
                  style={{ 
                    flex: '0 0 auto', 
                    width: 'clamp(180px, 22vw, 280px)',
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? 'auto' : 'none',
                    transition: 'opacity 0.4s ease'
                  }}
                >
                  <CarouselCard
                    anime={anime}
                    offset={wrappedOffset}
                    onClick={() => { if (wrappedOffset !== 0) goTo(i); }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Navigation arrows ─────────────────────────────────────────── */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 md:px-5 pointer-events-none z-20"
          style={{ top: '10%', bottom: '15%' }}>
          <motion.button
            onClick={goPrev}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Previous slide"
            className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center text-white focus-visible:ring-2 focus-visible:ring-accent outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft size={20} />
          </motion.button>
          <motion.button
            onClick={goNext}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Next slide"
            className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center text-white focus-visible:ring-2 focus-visible:ring-accent outline-none"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>

        {/* ── Indicators ────────────────────────────────────────────────── */}
        <Indicators count={Math.min(count, 12)} active={activeIdx} onSelect={goTo} />
      </div>

      {/* Reduced-motion: override animations with instant transitions */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .embla__slide { transition: none !important; }
        }
      `}</style>
    </section>
  );
}
