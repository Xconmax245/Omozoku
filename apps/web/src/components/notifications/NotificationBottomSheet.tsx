import { Drawer } from 'vaul';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationHeader } from './NotificationHeader';
import { NotificationFooter } from './NotificationFooter';
import { NotificationCard } from './NotificationCard';
import { NotificationEmpty } from './NotificationEmpty';
import { NotificationSkeleton } from './NotificationSkeleton';

interface NotificationBottomSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationBottomSheet({ isOpen, onOpenChange }: NotificationBottomSheetProps) {
  const { notifications, loading } = useNotificationStore();

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 h-[75vh] mx-3 mb-3 bg-[rgba(16,16,20,0.62)] backdrop-blur-[28px] border border-[rgba(255,255,255,0.08)] rounded-[32px] flex flex-col z-[100] outline-none shadow-[0_20px_80px_rgba(0,0,0,0.35)] overflow-hidden">
          {/* Drag Handle */}
          <div className="w-full flex items-center justify-center pt-4 pb-2 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
