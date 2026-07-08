'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, Notification, NotificationType } from '@/stores/notificationStore';
import { Check, CheckCircle2, Hammer, Sparkles, X, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface NotificationBottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationBottomSheet({ isOpen, onOpenChange }: NotificationBottomSheetProps) {
  const { notifications, markAllRead, markRead } = useNotificationStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-bg-surface rounded-t-3xl border-t border-border-subtle shadow-2xl z-[101] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-border-subtle rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-border-subtle shrink-0">
              <h3 className="font-display font-bold text-xl text-text-primary">Notifications</h3>
              <div className="flex items-center gap-3">
                {notifications.some(n => !n.read) && (
                  <button
                    onClick={markAllRead}
                    className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-full bg-bg-elevated text-text-secondary"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto pb-6">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-text-secondary" />
                  </div>
                  <p className="text-lg text-text-primary font-medium">You're all caught up</p>
                  <p className="text-text-secondary mt-1">No new notifications right now.</p>
                </div>
              ) : (
                <ul className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {notifications.map((notification) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        onRead={() => markRead(notification.id)}
                        onClose={() => onOpenChange(false)}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({ notification, onRead, onClose }: { notification: Notification, onRead: () => void, onClose: () => void }) {
  const isUnread = !notification.read;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'build_update':
        return <Hammer size={20} className="text-text-primary" />;
      case 'new_anime':
        return <Sparkles size={20} className="text-[#FFB800]" />;
      case 'support_creator':
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current text-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
          </svg>
        );
      case 'system':
      default:
        return <Info size={20} className="text-text-secondary" />;
    }
  };

  const isSupport = notification.type === 'support_creator';

  const Content = (
    <div 
      className={`relative flex gap-4 p-5 cursor-pointer transition-colors border-b border-border-subtle/30 last:border-0 ${
        isUnread ? 'bg-bg-elevated/30' : ''
      } ${isSupport ? 'bg-accent/5 border-b-0' : ''}`}
      onClick={() => {
        if (isUnread) onRead();
        if (notification.linkUrl) onClose(); // Close sheet when clicking link
      }}
    >
      <AnimatePresence>
        {isUnread && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSupport ? 'bg-accent' : 'bg-accent/70'}`}
          />
        )}
      </AnimatePresence>

      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
        isSupport ? 'bg-accent shadow-[0_0_15px_rgba(255,45,85,0.3)]' : 'bg-bg-surface border border-border-subtle'
      }`}>
        {getIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <p className={`text-base font-semibold truncate ${isSupport ? 'text-accent' : 'text-text-primary'}`}>
            {notification.title}
          </p>
          <span className="text-xs font-medium text-text-secondary shrink-0 mt-0.5">
            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className={`text-sm leading-snug line-clamp-2 ${isSupport ? 'text-text-primary/90' : 'text-text-secondary'}`}>
          {notification.body}
        </p>
      </div>
    </div>
  );

  if (notification.linkUrl) {
    const isExternal = notification.linkUrl.startsWith('http');
    return (
      <motion.li layout>
        <Link 
          href={notification.linkUrl} 
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="block"
        >
          {Content}
        </Link>
      </motion.li>
    );
  }

  return <motion.li layout>{Content}</motion.li>;
}
