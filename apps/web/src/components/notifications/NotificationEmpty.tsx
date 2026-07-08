import { Bell } from 'lucide-react';

export function NotificationEmpty() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
        <Bell className="text-white/40" size={24} />
      </div>
      <div>
        <p className="text-white font-bold mb-1">You&apos;re all caught up.</p>
        <p className="text-sm text-white/50">We&apos;ll notify you when something new happens.</p>
      </div>
    </div>
  );
}
