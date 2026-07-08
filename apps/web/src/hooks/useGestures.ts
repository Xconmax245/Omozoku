import { useEffect, useRef, useState } from 'react';

interface UseGesturesProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  seek: (time: number) => void;
  currentTime: number;
  duration: number;
  volume: number;
  changeVolume: (vol: number) => void;
  toggleControls: () => void;
}

export function useGestures({
  containerRef,
  seek,
  currentTime,
  duration,
  volume,
  changeVolume,
  toggleControls,
}: UseGesturesProps) {
  const [brightness, setBrightness] = useState(1);
  const [showSeekRipple, setShowSeekRipple] = useState<'left' | 'right' | null>(null);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ time: number } | null>(null);
  const initialVolumeRef = useRef(volume);
  const initialBrightnessRef = useRef(brightness);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Don't interfere with control bar interactions
      if ((e.target as HTMLElement).closest('.player-controls')) return;

      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      initialVolumeRef.current = volume;
      initialBrightnessRef.current = brightness;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      // Don't interfere with control bar interactions
      if ((e.target as HTMLElement).closest('.player-controls')) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaX = touch.clientX - touchStartRef.current.x;

      // If it's mostly a vertical swipe
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 20) {
        e.preventDefault(); // Prevent page scroll
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Swipe up decreases Y, so negative delta means we want to increase value
        const change = -(deltaY / screenHeight) * 1.5; // multiplier for sensitivity

        if (touchStartRef.current.x > screenWidth / 2) {
          // Right half: Volume
          const newVol = Math.max(0, Math.min(1, initialVolumeRef.current + change));
          changeVolume(newVol);
        } else {
          // Left half: Brightness
          const newBright = Math.max(0.1, Math.min(1, initialBrightnessRef.current + change));
          setBrightness(newBright);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const target = e.target as HTMLElement;
      if (target.closest('.player-controls')) {
        touchStartRef.current = null;
        return;
      }

      const now = Date.now();
      const timeDiff = now - touchStartRef.current.time;
      const changedTouch = e.changedTouches[0];
      
      const deltaX = changedTouch.clientX - touchStartRef.current.x;
      const deltaY = changedTouch.clientY - touchStartRef.current.y;

      // Detect tap (no significant movement and quick)
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && timeDiff < 300) {
        // Check for double tap
        if (lastTapRef.current && now - lastTapRef.current.time < 300) {
          // Double tap
          const screenWidth = window.innerWidth;
          if (changedTouch.clientX > (screenWidth / 3) * 2) {
            seek(Math.min(duration, currentTime + 10));
            setShowSeekRipple('right');
            setTimeout(() => setShowSeekRipple(null), 500);
          } else if (changedTouch.clientX < screenWidth / 3) {
            seek(Math.max(0, currentTime - 10));
            setShowSeekRipple('left');
            setTimeout(() => setShowSeekRipple(null), 500);
          }
          lastTapRef.current = null; // reset
        } else {
          // Single tap
          lastTapRef.current = { time: now };
          // We wait a bit to see if it becomes a double tap before firing single tap action
          setTimeout(() => {
            if (lastTapRef.current?.time === now) {
              toggleControls();
              lastTapRef.current = null;
            }
          }, 300);
        }
      }

      touchStartRef.current = null;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentTime, duration, volume, brightness, changeVolume, seek, toggleControls, containerRef]);

  // Reset brightness on unmount
  useEffect(() => {
    return () => setBrightness(1);
  }, []);

  return { brightness, showSeekRipple };
}
