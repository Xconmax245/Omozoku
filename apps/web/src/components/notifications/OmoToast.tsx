'use client';

import { Toaster } from 'sonner';

export function OmoToast() {
  // Optional: check if mobile to position bottom-center vs bottom-right
  // For now we'll use a responsive CSS class approach or stick to bottom-right 
  // as Sonner handles mobile stacking decently by default.

  return (
    <Toaster 
      position="bottom-right"
      duration={4000}
      toastOptions={{
        style: {
          background: 'rgba(16, 16, 20, 0.62)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          color: 'white',
          boxShadow: '0 20px 80px rgba(0, 0, 0, 0.35)',
        },
        className: 'font-body',
      }}
    />
  );
}
