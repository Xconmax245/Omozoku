'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Settings, Bookmark, History, ChevronRight } from 'lucide-react';
import { OmoButton } from '@/components/ui/OmoButton';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfileButtonProps {
  className?: string;
  isMobile?: boolean;
}

const MENU_ITEMS = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Watchlist', href: '/watchlist', icon: Bookmark },
  { label: 'History', href: '/history', icon: History },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function Avatar({ src, name, size = 40 }: { src?: string | null; name?: string | null; size?: number }) {
  const initial = name?.[0]?.toUpperCase() ?? 'U';
  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? 'Profile'}
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center font-display font-extrabold text-white"
      style={{ background: 'linear-gradient(135deg, #FF2D55 0%, #bf204c 100%)', fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  );
}

export function UserProfileButton({ className, isMobile = false }: UserProfileButtonProps) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  /* ── Loading skeleton ─────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className={`w-10 h-10 rounded-[10px] skeleton ${className ?? ''}`} />
    );
  }

  /* ── Unauthenticated ──────────────────────────────────────────────────── */
  if (!session) {
    if (isMobile) {
      return (
        <OmoButton
          asChild
          variant="navbar"
          className={`relative px-5 py-6 flex items-center justify-start gap-4 rounded-2xl h-auto w-full group text-white/80 font-medium hover:text-white hover:bg-white/5 ${className ?? ''}`}
        >
          <Link href="/auth/signin">
            <User size={22} className="relative z-10 transition-transform group-hover:scale-110" />
            <span className="relative z-10 font-body text-[15px] tracking-wide">Log In</span>
          </Link>
        </OmoButton>
      );
    }

    return (
      <OmoButton
        asChild
        variant="navbar"
        size="icon"
        className={`w-10 h-10 rounded-[10px] bg-accent/10 hover:bg-accent/20 text-accent group relative ${className ?? ''}`}
      >
        <Link href="/auth/signin">
          <User size={20} />
          <span className="absolute left-14 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-text-primary text-sm font-semibold opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-xl z-50 whitespace-nowrap">
            Sign In
          </span>
        </Link>
      </OmoButton>
    );
  }

  /* ── Mobile authenticated ─────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="flex flex-col gap-1">
        {/* User row */}
        <OmoButton
          asChild
          variant="navbar"
          className={`relative px-5 py-4 flex items-center justify-start gap-4 rounded-2xl h-auto w-full group text-white/90 font-medium hover:text-white hover:bg-white/5 ${className ?? ''}`}
        >
          <Link href="/profile">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-border-subtle shrink-0">
              <Avatar src={session.user?.image} name={session.user?.name} size={36} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.user?.name ?? 'Tribe Member'}</p>
              <p className="text-xs text-white/40 truncate">{session.user?.email ?? ''}</p>
            </div>
            <ChevronRight size={16} className="text-white/30 shrink-0" />
          </Link>
        </OmoButton>

        {/* Sign out */}
        <OmoButton
          variant="navbar"
          className="relative px-5 py-3.5 flex items-center justify-start gap-4 rounded-2xl h-auto w-full group text-white/50 font-medium hover:text-red-400 hover:bg-white/5"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut size={18} className="relative z-10" />
          <span className="text-[14px] tracking-wide">Sign Out</span>
        </OmoButton>
      </div>
    );
  }

  /* ── Desktop authenticated – avatar + floating dropdown ──────────────── */
  return (
    <div ref={menuRef} className={`relative ${className ?? ''}`}>
      {/* Avatar trigger */}
      <button
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Open profile menu"
        className={`w-10 h-10 rounded-[10px] overflow-hidden border transition-all duration-200 group relative
          ${menuOpen ? 'border-accent shadow-[0_0_0_2px_rgba(255,45,85,0.3)]' : 'border-border-subtle hover:border-accent/60'}`}
      >
        <Avatar src={session.user?.image} name={session.user?.name} size={40} />

        {/* Tooltip — only show when menu is closed */}
        {!menuOpen && (
          <span className="absolute left-14 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-text-primary text-sm font-semibold opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-xl z-50 whitespace-nowrap">
            {session.user?.name ?? 'Profile'}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-full left-full mb-2 ml-2 w-56 bg-bg-surface/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden z-[100] origin-bottom-left"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-border-subtle bg-bg-elevated/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-border-subtle shrink-0">
                  <Avatar src={session.user?.image} name={session.user?.name} size={36} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{session.user?.name ?? 'Tribe Member'}</p>
                  <p className="text-xs text-text-secondary truncate">{session.user?.email ?? ''}</p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <div className="py-1.5">
              {MENU_ITEMS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Sign out */}
            <div className="border-t border-border-subtle py-1.5">
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-red-400 hover:bg-red-500/5 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
