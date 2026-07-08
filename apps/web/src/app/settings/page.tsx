'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Shield, Sliders, Monitor, ChevronDown, Check } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

function QualitySelector({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  const options = [
    { value: '1080p', label: '1080p Full HD' },
    { value: '720p', label: '720p HD' },
    { value: '480p', label: '480p SD' },
  ];

  const currentLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div ref={dropdownRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all outline-none min-w-[160px]"
      >
        <span>{currentLabel}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-[180px] bg-[#121216] border border-white/10 rounded-2xl shadow-xl overflow-hidden p-1.5"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg hover:bg-white/5 transition-colors text-left ${
                  value === opt.value ? 'text-accent bg-accent/5' : 'text-white/80'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && <Check size={14} className="text-accent" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Settings State
  const { quality, autoplay, skipIntro, saveProgress, setSettings } = useSettingsStore();

  const setQuality = (val: string) => setSettings({ quality: val });
  const setAutoplay = () => setSettings({ autoplay: !autoplay });
  const setSkipIntro = () => setSettings({ skipIntro: !skipIntro });
  const setSaveProgress = () => setSettings({ saveProgress: !saveProgress });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/settings');
    }
  }, [status, router]);

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white px-4 md:px-6 lg:px-8 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link href="/profile" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm group transition-colors">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Profile
        </Link>
        <span className="text-xs uppercase tracking-widest text-text-secondary font-bold">Preferences</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="border-b border-border-subtle pb-5">
          <h1 className="text-3xl font-display font-extrabold flex items-center gap-3">
            <Settings className="text-accent" size={28} />
            Account Settings
          </h1>
          <p className="text-text-secondary text-sm mt-1">Configure your personal streaming preferences.</p>
        </div>

        <div className="space-y-6">
          {/* Card 1: Player preferences */}
          <div className="bg-bg-surface/40 border border-border-subtle rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-white">
              <Sliders size={18} className="text-accent" />
              Player Preferences
            </h2>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Auto-play Next Episode</p>
                  <p className="text-xs text-text-secondary">Start the next episode immediately after the current one ends.</p>
                </div>
                <button
                  onClick={setAutoplay}
                  className={`w-11 h-6 rounded-full transition-all relative ${autoplay ? 'bg-accent' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${autoplay ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Auto-skip Intro & Outro</p>
                  <p className="text-xs text-text-secondary">Bypass title screens and endings automatically.</p>
                </div>
                <button
                  onClick={setSkipIntro}
                  className={`w-11 h-6 rounded-full transition-all relative ${skipIntro ? 'bg-accent' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${skipIntro ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Streaming Preferences */}
          <div className="bg-bg-surface/40 border border-border-subtle rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-white">
              <Monitor size={18} className="text-accent" />
              Streaming Quality
            </h2>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Default Resolution</p>
                  <p className="text-xs text-text-secondary">Set target video quality for playback streams.</p>
                </div>
                <QualitySelector value={quality} onChange={setQuality} />
              </div>
            </div>
          </div>

          {/* Card 3: Storage & Tracking */}
          <div className="bg-bg-surface/40 border border-border-subtle rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-white">
              <Shield size={18} className="text-accent" />
              Privacy & Sync
            </h2>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Sync History & Progress</p>
                  <p className="text-xs text-text-secondary">Share watch progression with OmoZoku servers to enable device-sync.</p>
                </div>
                <button
                  onClick={setSaveProgress}
                  className={`w-11 h-6 rounded-full transition-all relative ${saveProgress ? 'bg-accent' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${saveProgress ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
