'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationPanel } from './NotificationPanel';
import { NotificationBottomSheet } from './NotificationBottomSheet';
import { useFloating, shift, flip, offset } from '@floating-ui/react';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = useNotificationStore(state => state.unreadCount());
  const startPolling = useNotificationStore(state => state.startPolling);
  const stopPolling = useNotificationStore(state => state.stopPolling);

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'right-end',
    middleware: [
      offset(16),
      flip({ fallbackPlacements: ['left-end', 'bottom', 'top'] }),
      shift({ padding: 16 }),
    ],
  });

  useEffect(() => {
    startPolling();
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Click outside for desktop panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isMobile && isOpen && wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (refs.floating.current && refs.floating.current.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile, refs.floating]);

  return (
    <div className="relative" ref={wrapperRef}>
      <motion.button
        ref={refs.setReference}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="relative flex items-center justify-center w-[44px] h-[44px] rounded-full bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors z-50"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-controls="notification-panel"
      >
        <Bell size={20} className="text-white" />

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                type: 'spring',
                mass: 0.8,
                damping: 18,
              }}
              className="absolute top-0 right-0 -mr-1 -mt-1 min-w-[10px] h-[10px] flex items-center justify-center bg-[#FF4B63] rounded-full border border-[rgba(16,16,20,0.8)]"
              style={{
                width: unreadCount > 9 ? 'auto' : '10px',
                height: unreadCount > 9 ? '18px' : '10px',
                padding: unreadCount > 9 ? '0 6px' : '0',
                top: unreadCount > 9 ? '-4px' : '0',
                right: unreadCount > 9 ? '-6px' : '0',
              }}
            >
              {unreadCount > 9 && (
                <span className="text-white text-[10px] font-semibold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {isMobile ? (
        <NotificationBottomSheet isOpen={isOpen} onOpenChange={setIsOpen} />
      ) : (
        <NotificationPanel 
          isOpen={isOpen} 
          floatingRef={refs.setFloating} 
          style={floatingStyles} 
        />
      )}
    </div>
  );
}
