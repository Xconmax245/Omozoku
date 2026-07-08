import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  togglePlay: () => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  changeVolume: (vol: number) => void;
  changePlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

export function useKeyboardShortcuts({
  togglePlay,
  toggleMute,
  seek,
  changeVolume,
  changePlaybackRate,
  toggleFullscreen,
  currentTime,
  duration,
  volume,
  playbackRate,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or navigating a menu with arrows
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="menu"]') // Trapped focus in popovers
      ) {
        return;
      }

      // We only want to hijack events if the player is in focus or fullscreen, 
      // but typically we attach to document and filter, or attach to the container.
      // We'll attach to the document but ensure the container is what they're looking at,
      // or we attach directly to the container. Since it's a dedicated watch page, document is fine.
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 10));
          break;
        case 'arrowright':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 10));
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(Math.min(1, volume + 0.05));
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(Math.max(0, volume - 0.05));
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '<':
        case ',':
          e.preventDefault();
          changePlaybackRate(Math.max(0.5, playbackRate - 0.25));
          break;
        case '>':
        case '.':
          e.preventDefault();
          changePlaybackRate(Math.min(2, playbackRate + 0.25));
          break;
        default:
          // Check for 0-9
          if (!isNaN(Number(e.key)) && e.key !== ' ') {
            e.preventDefault();
            const percent = Number(e.key) / 10;
            seek(duration * percent);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    toggleMute,
    seek,
    changeVolume,
    changePlaybackRate,
    toggleFullscreen,
    currentTime,
    duration,
    volume,
    playbackRate,
  ]);
}
