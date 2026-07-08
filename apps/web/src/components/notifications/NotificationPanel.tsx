'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, Notification, NotificationType } from '@/stores/notificationStore';
import { Check, CheckCircle2, Hammer, Sparkles, X, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface NotificationPanelProps {
  isOpen: boolean;
  floatingRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
}

export function NotificationPanel({ isOpen, floatingRef, style }: NotificationPanelProps) {
  const { notifications, markAllRead, markRead } = useNotificationStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={floatingRef}
          style={style}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute w-80 sm:w-96 bg-bg-surface border border-border-subtle rounded-card shadow-2xl z-50 flex flex-col max-h-[70vh] overflow-hidden"
          id="notification-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-elevated/50 backdrop-blur-md shrink-0">
            <h3 className="font-display font-bold text-text-primary">Notifications</h3>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
              >
                <Check size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-3">
                  <CheckCircle2 size={24} className="text-text-secondary" />
                </div>
                <p className="text-text-primary font-medium">You're all caught up</p>
                <p className="text-sm text-text-secondary mt-1">No new notifications right now.</p>
              </div>
            ) : (
              <ul className="flex flex-col">
                <AnimatePresence initial={false}>
                  {notifications.map((notification) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      onRead={() => markRead(notification.id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({ notification, onRead }: { notification: Notification, onRead: () => void }) {
  const isUnread = !notification.read;

  // Icon mapping based on type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'build_update':
        return <Hammer size={18} className="text-text-primary" />;
      case 'new_anime':
        return <Sparkles size={18} className="text-[#FFB800]" />;
      case 'support_creator':
        // X logo representation
        return (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current text-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
          </svg>
        );
      case 'system':
      default:
        return <Info size={18} className="text-text-secondary" />;
    }
  };

  const isSupport = notification.type === 'support_creator';

  const Content = (
    <div 
      className={`relative flex gap-3 p-4 cursor-pointer transition-colors duration-200 border-b border-border-subtle/30 last:border-0 ${
        isUnread ? 'bg-bg-elevated/30 hover:bg-bg-elevated/50' : 'hover:bg-bg-elevated/20'
      } ${isSupport ? 'bg-accent/5 hover:bg-accent/10 border-b-0' : ''}`}
      onClick={() => {
        if (isUnread) onRead();
      }}
    >
      {/* Unread Indicator Transition */}
      <AnimatePresence>
        {isUnread && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`absolute left-0 top-0 bottom-0 w-1 ${isSupport ? 'bg-accent' : 'bg-accent/70'}`}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        isSupport ? 'bg-accent shadow-[0_0_15px_rgba(255,45,85,0.3)]' : 'bg-bg-surface border border-border-subtle'
      }`}>
        {getIcon(notification.type)}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-0.5">
          <p className={`text-sm font-semibold truncate ${isSupport ? 'text-accent' : 'text-text-primary'}`}>
            {notification.title}
          </p>
          <span className="text-[10px] font-medium text-text-secondary shrink-0 mt-0.5">
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
