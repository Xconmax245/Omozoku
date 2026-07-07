export function NotificationSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-[20px] bg-white/[0.02] flex gap-4 items-start animate-pulse border border-white/5">
          <div className="shrink-0 w-12 h-12 rounded-full bg-white/5" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 bg-white/10 rounded-md w-3/4" />
            <div className="h-3 bg-white/5 rounded-md w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
