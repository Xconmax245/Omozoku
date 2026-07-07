'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Film, Trash2, Play } from 'lucide-react';
import { OmoButton } from '@/components/ui/OmoButton';

interface WatchlistItem {
  id: number;
  title: string;
  image: string;
  type: string;
  score: number;
  addedAt: string;
}

// Mock watchlist items for standard accounts
const MOCK_WATCHLIST: WatchlistItem[] = [
  {
    id: 11061,
    title: 'Hunter x Hunter (2011)',
    image: 'https://cdn.myanimelist.net/images/anime/1337/99013.jpg',
    type: 'TV',
    score: 9.04,
    addedAt: '2026-07-06',
  },
  {
    id: 21,
    title: 'One Piece',
    image: 'https://cdn.myanimelist.net/images/anime/1244/138851.jpg',
    type: 'TV',
    score: 8.72,
    addedAt: '2026-07-05',
  },
  {
    id: 4181,
    title: 'Clannad: After Story',
    image: 'https://cdn.myanimelist.net/images/anime/1299/110774.jpg',
    type: 'TV',
    score: 8.94,
    addedAt: '2026-07-04',
  }
];

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(MOCK_WATCHLIST);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/watchlist');
    }
  }, [status, router]);

  const removeItem = (id: number) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white px-4 md:px-6 lg:px-8 py-10 max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/profile" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm group transition-colors">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Profile
        </Link>
        <span className="text-xs uppercase tracking-widest text-text-secondary font-bold">Watchlist</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="border-b border-border-subtle pb-5">
          <h1 className="text-3xl font-display font-extrabold flex items-center gap-3">
            <Bookmark className="text-accent" size={28} />
            My Watchlist
          </h1>
          <p className="text-text-secondary text-sm mt-1">Keep track of the anime worlds you want to explore next.</p>
        </div>

        {watchlist.length === 0 ? (
          <div className="text-center py-20 bg-bg-surface/30 border border-border-subtle rounded-3xl flex flex-col items-center justify-center p-8">
            <Film className="text-white/20 mb-4" size={48} />
            <h3 className="text-lg font-bold text-white">Your watchlist is empty</h3>
            <p className="text-text-secondary text-sm max-w-sm mt-1 mb-6">Explore seasonal hits and trending anime to start filling up your watchlist.</p>
            <OmoButton asChild variant="default">
              <Link href="/">Browse Shows</Link>
            </OmoButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {watchlist.map((anime) => (
              <motion.div
                key={anime.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-bg-surface/50 border border-border-subtle rounded-2xl p-4 flex gap-4 hover:border-white/10 hover:bg-bg-surface transition-all group"
              >
                <div className="relative w-20 h-28 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/5">
                  <Image src={anime.image} alt={anime.title} fill className="object-cover" sizes="80px" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <h2 className="text-base font-bold truncate text-white group-hover:text-accent transition-colors">
                      {anime.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
                      <span>{anime.type}</span>
                      <span>★ {anime.score.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <OmoButton asChild variant="default" className="h-8 px-3 rounded-lg text-xs gap-1">
                      <Link href={`/anime/${anime.id}`}>
                        <Play size={11} fill="white" />
                        Watch
                      </Link>
                    </OmoButton>
                    <OmoButton
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => removeItem(anime.id)}
                      aria-label="Remove from watchlist"
                    >
                      <Trash2 size={14} />
                    </OmoButton>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
