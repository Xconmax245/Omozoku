'use client';

import { useEffect } from 'react';
import 'aos/dist/aos.css';

/** One-time AOS initialization — must be a client component */
export function AosInit() {
  useEffect(() => {
    // Dynamically import AOS to avoid SSR issues
    import('aos').then((AosModule) => {
      const AOS = AosModule.default;
      AOS.init({
        duration: 500,
        easing: 'ease-out-cubic',
        once: true,
        offset: 40,
      });
    });
  }, []);

  return null;
}
