import { OmoButton } from '@/components/ui/OmoButton';

export function NotificationFooter() {
  return (
    <div className="p-3 border-t border-white/[0.08] bg-black/20">
      <OmoButton variant="ghost" className="w-full h-11 text-white/60 hover:text-white transition-all">
        View All Notifications
      </OmoButton>
    </div>
  );
}
