'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid2X2, X, Home, Compass, BookmarkCheck, Tv2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './notifications/NotificationBell';
import { OmoButton } from '@/components/ui/OmoButton';
import { UserProfileButton } from './UserProfileButton';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/browse', icon: Compass, label: 'Browse' },
  { href: '/watchlist', icon: BookmarkCheck, label: 'Watchlist' },
  { href: '/watch', icon: Tv2, label: 'Watch' },
];

function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      if (
        direction !== scrollDirection &&
        (scrollY - lastScrollY > 5 || scrollY - lastScrollY < -5)
      ) {
        setScrollDirection(direction);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
      setScrollY(scrollY);
    };

    window.addEventListener('scroll', updateScrollDirection, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollDirection);
  }, [scrollDirection]);

  return { scrollDirection, scrollY };
}

export function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollDirection, scrollY } = useScrollDirection();

  // Hide the navbar when scrolling down, unless we are at the very top, or a menu is open
  const isHidden = scrollDirection === 'down' && scrollY > 50 && !menuOpen;

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [menuOpen]);

  return (
    <>
      {/* Backdrop Blur Overlay for Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-md"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="md:hidden fixed bottom-5 left-3 right-3 z-50 flex flex-col-reverse items-center gap-3"
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: isHidden ? 100 : 0,
          opacity: isHidden ? 0.4 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Floating Navbar Container */}
        <div className="w-full flex items-center justify-between px-4 py-3 rounded-[24px] bg-[#121216]/45 backdrop-blur-[24px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center justify-center active:scale-95 transition-transform" onClick={() => setMenuOpen(false)}>
            <Image src="/images/logo.png" alt="OmoZoku" width={40} height={40} className="object-contain drop-shadow-sm" priority />
          </Link>

          {/* Center: Empty breathing room */}
          <div className="flex-1" />

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <OmoButton asChild variant="ghost" size="icon" className="w-10 h-10">
              <Link href="/search" aria-label="Search">
                <Search size={22} className="text-text-primary" />
              </Link>
            </OmoButton>
            
            <NotificationBell />

            <OmoButton
              variant="ghost"
              size="icon"
              className="w-10 h-10"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <motion.div
                initial={false}
                animate={{ rotate: menuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {menuOpen ? <X size={24} className="text-white" /> : <Grid2X2 size={24} className="text-white" />}
              </motion.div>
            </OmoButton>
          </div>
        </div>

        {/* Pop-up Menu Panel */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#121216]/65 backdrop-blur-[30px] border border-white/10 rounded-[28px] p-3 shadow-[0_-8px_32px_rgba(0,0,0,0.1)] flex flex-col gap-1"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <OmoButton
                    key={item.href}
                    asChild
                    variant="navbar"
                    size="default"
                    className={cn(
                      'relative px-5 py-6 flex items-center justify-start gap-4 rounded-2xl transition-all duration-200 h-auto w-full group',
                      isActive ? 'text-accent font-bold' : 'text-white/80 font-medium hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Link href={item.href} onClick={() => setMenuOpen(false)}>
                      {isActive && (
                        <motion.div
                          layoutId="mobile-nav-active"
                          className="absolute inset-0 bg-accent/15 border border-accent/20 rounded-2xl shadow-[0_0_15px_rgba(255,45,85,0.15)] pointer-events-none"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <item.icon size={22} className="relative z-10 transition-transform group-hover:scale-110" />
                      <span className="relative z-10 font-body text-[15px] tracking-wide">{item.label}</span>
                    </Link>
                  </OmoButton>
                );
              })}
              <div className="my-1 border-t border-white/10" />
              <UserProfileButton isMobile />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
