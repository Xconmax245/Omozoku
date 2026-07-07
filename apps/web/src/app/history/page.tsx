'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, History, Play, Trash2, Clock } from 'lucide-react';
import { OmoButton } from '@/components/ui/OmoButton';

interface HistoryItem {
  id: number;
  title: string;
  image: string;
  episode: number;
  progress: number; // percentage
  watchedAt: string;
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: 11061,
    title: 'Hunter x Hunter (2011)',
    image: 'https://cdn.myanimelist.net/images/anime/1337/99013.jpg',
    episode: 45,
    progress: 88,
    watchedAt: 'Recently',
  },
  {
    id: 21,
    title: 'One Piece',
    image: 'https://cdn.myanimelist.net/images/anime/1244/138851.jpg',
    episode: 1045,
    progress: 42,
    watchedAt: 'Yesterday',
  }
];

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>(MOCK_HISTORY);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/history');
    }
  }, [status, router]);

  const clearItem = (id: number) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const clearAll = () => {
    setHistory([]);
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
      <div className="flex items-center justify-between mb-8">
        <Link href="/profile" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm group transition-colors">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Profile
        </Link>
        {history.length > 0 && (
          <button onClick={clearAll} className="text-xs text-white/40 hover:text-red-400 font-semibold transition-colors">
            Clear all history
          </button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="border-b border-border-subtle pb-5">
          <h1 className="text-3xl font-display font-extrabold flex items-center gap-3">
            <History className="text-accent" size={28} />
            Watch History
          </h1>
          <p className="text-text-secondary text-sm mt-1">Pick up right where you left off in your episodes.</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 bg-bg-surface/30 border border-border-subtle rounded-3xl flex flex-col items-center justify-center p-8">
            <Clock className="text-white/20 mb-4" size={48} />
            <h3 className="text-lg font-bold text-white">No watch history yet</h3>
            <p className="text-text-secondary text-sm max-w-sm mt-1 mb-6">Launch episodes to keep track of your progress here.</p>
            <OmoButton asChild variant="default">
              <Link href="/">Start Watching</Link>
            </OmoButton>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-bg-surface/40 hover:bg-bg-surface border border-border-subtle hover:border-white/10 p-4 rounded-2xl flex items-center gap-4 transition-all group"
              >
                <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/5">
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-accent tracking-wider">{item.watchedAt}</span>
                  <h2 className="text-base font-bold truncate text-white mt-0.5">{item.title}</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Episode {item.episode}</p>
                  
                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-white/50">{item.progress}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <OmoButton asChild variant="default" size="icon" className="w-9 h-9 rounded-xl shadow-lg">
                    <Link href={`/watch/${item.id}/${item.episode}`}>
                      <Play size={14} fill="white" />
                    </Link>
                  </OmoButton>
                  <OmoButton
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => clearItem(item.id)}
                  >
                    <Trash2 size={14} />
                  </OmoButton>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
