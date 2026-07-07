import { CheckCheck } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { OmoButton } from '@/components/ui/OmoButton';

export function NotificationHeader() {
  const unreadCount = useNotificationStore(state => state.unreadCount());
  const markAllRead = useNotificationStore(state => state.markAllRead);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
      <div className="flex items-center gap-3">
        <h2 className="text-[18px] font-bold text-white tracking-tight">Notifications</h2>
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-semibold">
            {unreadCount} new
          </span>
        )}
      </div>
      
      {unreadCount > 0 && (
        <OmoButton
          variant="ghost"
          size="sm"
          onClick={markAllRead}
          className="group flex items-center gap-1.5 rounded-full"
        >
          <CheckCheck size={14} className="text-white/60 group-hover:text-white transition-colors" />
          <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">Clear All</span>
        </OmoButton>
      )}
    </div>
  );
}
