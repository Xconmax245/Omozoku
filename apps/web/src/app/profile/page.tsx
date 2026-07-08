'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogOut, Bookmark, History, Settings, Mail, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function EditableAvatar({
  src,
  name,
  size = 80,
  onUploadSuccess,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  onUploadSuccess: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = name?.[0]?.toUpperCase() ?? 'U';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload image');

      onUploadSuccess(data.url);
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group cursor-pointer w-full h-full rounded-2xl overflow-hidden" onClick={() => fileInputRef.current?.click()}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {src ? (
        <Image src={src} alt={name ?? 'Profile'} width={size} height={size} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-display font-extrabold text-white"
          style={{ background: 'linear-gradient(135deg, #FF2D55 0%, #bf204c 100%)', fontSize: size * 0.4 }}
        >
          {initial}
        </div>
      )}

      {/* Hover Overlay */}
      <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center backdrop-blur-sm ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {isUploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Camera className="w-6 h-6 text-white" />
        )}
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { label: 'Watchlist', href: '/watchlist', icon: Bookmark, desc: 'Anime you\'re tracking' },
  { label: 'History', href: '/history', icon: History, desc: 'Recently watched' },
  { label: 'Settings', href: '/settings', icon: Settings, desc: 'Account preferences' },
];

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/profile');
    }
  }, [status, router]);

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 rounded-full skeleton" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 lg:px-8 py-10 max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-8 group transition-colors">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        {/* Profile card */}
        <div className="bg-bg-surface border border-border-subtle rounded-3xl p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl border-2 border-border-subtle shrink-0 shadow-lg relative">
            <EditableAvatar 
              src={session.user?.image} 
              name={session.user?.name} 
              size={80} 
              onUploadSuccess={(url) => update({ image: url })} 
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-display font-extrabold text-text-primary">
              {session.user?.name ?? 'Tribe Member'}
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-text-secondary text-sm">
              <Mail size={14} />
              {session.user?.email ?? '—'}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">Member</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-red-400 hover:bg-red-500/5 border border-border-subtle hover:border-red-500/20 transition-all"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ label, href, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-bg-surface border border-border-subtle rounded-2xl p-5 flex flex-col gap-2 hover:border-accent/40 hover:bg-bg-elevated transition-all group"
            >
              <Icon size={22} className="text-accent group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-text-primary text-sm">{label}</p>
              <p className="text-xs text-text-secondary">{desc}</p>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
