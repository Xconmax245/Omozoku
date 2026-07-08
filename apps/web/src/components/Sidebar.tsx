'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Compass,
  BookmarkCheck,
  Tv2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './notifications/NotificationBell';
import { OmoButton } from '@/components/ui/OmoButton';
import { UserProfileButton } from './UserProfileButton';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/watchlist', icon: BookmarkCheck, label: 'Watchlist' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col items-center fixed left-0 top-0 h-full w-16 bg-bg-surface border-r border-border-subtle z-40 py-5 gap-1">
      {/* Logo */}
      <Link
        href="/"
        className="mb-6 mt-2 w-14 h-14 flex items-center justify-center select-none hover:opacity-80 transition-transform hover:scale-105 active:scale-95"
        aria-label="OmoZoku home"
      >
        <Image src="/images/logo.png" alt="OmoZoku" width={44} height={44} className="object-contain drop-shadow-sm" priority />
      </Link>

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <OmoButton
              key={href}
              asChild
              variant="navbar"
              size="icon"
              className={cn(
                'group relative flex items-center justify-center w-10 h-10 rounded-[10px] transition-colors duration-150',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              )}
            >
              <Link href={href} aria-label={label} title={label}>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-[10px] bg-accent/15"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10" />
                
                {/* Custom Animated Tooltip */}
                <span className="absolute left-14 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-subtle text-text-primary text-sm font-semibold opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-xl z-50 whitespace-nowrap">
                  {label}
                </span>
              </Link>
            </OmoButton>
          );
        })}
      </nav>

      {/* Bottom spacer and User controls */}
      <div className="mt-auto flex flex-col items-center gap-4 w-full pt-4 border-t border-border-subtle/50 relative">
        <NotificationBell />
        <UserProfileButton />
      </div>
    </aside>
  );
}


