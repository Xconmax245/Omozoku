import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationHeader } from './NotificationHeader';
import { NotificationFooter } from './NotificationFooter';
import { NotificationCard } from './NotificationCard';
import { NotificationEmpty } from './NotificationEmpty';
import { NotificationSkeleton } from './NotificationSkeleton';

interface NotificationPanelProps {
  isOpen: boolean;
}

export function NotificationPanel({ isOpen }: NotificationPanelProps) {
  const { notifications, loading } = useNotificationStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, x: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.96, x: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-[80px] left-[72px] w-[380px] max-h-[620px] overflow-hidden flex flex-col bg-[rgba(16,16,20,0.62)] backdrop-blur-[28px] border border-[rgba(255,255,255,0.08)] rounded-[28px] shadow-[0_20px_80px_rgba(0,0,0,0.35)] z-[9999] transform-gpu"
          role="dialog"
          aria-labelledby="notification-title"
          aria-modal="true"
        >
          <NotificationHeader />

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {loading && notifications.length === 0 ? (
              <NotificationSkeleton />
            ) : notifications.length === 0 ? (
              <NotificationEmpty />
            ) : (
              notifications.map((n) => (
                <NotificationCard key={n.id} notification={n} />
              ))
            )}
          </div>

          <NotificationFooter />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
