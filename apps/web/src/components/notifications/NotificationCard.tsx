import { motion } from 'framer-motion';
import Image from 'next/image';
import { Play, Calendar, AlertCircle, Info, CheckCircle2, Bookmark } from 'lucide-react';
import { Notification, useNotificationStore } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { OmoButton } from '@/components/ui/OmoButton';

export function NotificationCard({ notification }: { notification: Notification }) {
  const markRead = useNotificationStore(state => state.markRead);

  // Determine icon and colors based on type
  let Icon = Info;
  let iconColor = "text-white/60";
  
  switch(notification.type) {
    case 'episode': Icon = Play; iconColor = "text-accent"; break;
    case 'success': Icon = CheckCircle2; iconColor = "text-green-400"; break;
    case 'error': Icon = AlertCircle; iconColor = "text-red-500"; break;
    case 'watchlist': Icon = Bookmark; iconColor = "text-purple-400"; break;
    case 'system': Icon = Info; iconColor = "text-blue-400"; break;
  }

  // Allow custom override from the DB/API if provided
  if (notification.metadata?.iconType === 'calendar') Icon = Calendar;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, filter: 'brightness(1.04)' }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={() => !notification.read && markRead(notification.id)}
      className={`relative p-4 rounded-[20px] flex gap-4 items-start cursor-pointer transition-colors duration-250 ${
        notification.read 
          ? 'bg-[rgba(255,255,255,0.03)] opacity-75' 
          : 'bg-[rgba(255,255,255,0.07)] opacity-100'
      }`}
    >
      {/* Unread indicator dot */}
      {!notification.read && (
        <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-2.5 bg-accent rounded-full shadow-[0_0_10px_#FF2D55]" />
      )}

      {/* Avatar/Icon Area */}
      <div className="shrink-0 w-12 h-16 rounded-lg bg-black/40 relative overflow-hidden flex items-center justify-center border border-white/5">
        {notification.image ? (
          <Image src={notification.image} alt="" fill className="object-cover" sizes="48px" />
        ) : (
          <Icon size={20} className={iconColor} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-[14px] font-bold text-white tracking-tight truncate leading-tight">
          {notification.title}
        </h4>
        <p className="text-[13px] text-white/60 mt-1 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[11px] font-medium text-white/40 mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Action CTA */}
      {notification.actionLabel && (
        <OmoButton variant="secondary" size="pill" className="shrink-0 self-center">
          {notification.actionLabel}
        </OmoButton>
      )}
    </motion.div>
  );
}
