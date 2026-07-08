import { useState, useEffect, useRef, useCallback } from 'react';
import type { StreamSource } from '@omozoku/types';
import type Hls from 'hls.js';
import { useSettingsStore } from '@/stores/settingsStore';

interface UsePlayerProps {
  sources: StreamSource[];
  referer: string;
  animeId: number;
  episode: number;
  initialTime?: number;
  onSourceSwitch?: (source: StreamSource) => void;
}

export function usePlayer({ sources, referer, animeId, episode, initialTime = 0, onSourceSwitch }: UsePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const preferredQuality = useSettingsStore(state => state.quality);
  const shouldSaveProgress = useSettingsStore(state => state.saveProgress);

  // Sort sources by quality initially
  const sortedSources = [...sources].sort((a, b) => {
    // If one matches the preferred quality, prioritize it
    if (a.quality === preferredQuality) return -1;
    if (b.quality === preferredQuality) return 1;

    const order: Record<string, number> = { '1080p': 0, '720p': 1, '480p': 2, '360p': 3, auto: 4 };
    return (order[a.quality] ?? 5) - (order[b.quality] ?? 5);
  });

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const currentSource = sortedSources[currentSourceIndex];

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState<TimeRanges | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toProxiedUrl = (url: string, ref: string) =>
    `/api/proxy/stream?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(ref)}`;

  // Save progress logic
  const saveProgress = useCallback(async (time: number) => {
    if (!shouldSaveProgress) return;
    // Only save if meaningful
    if (time < 5) return;
    try {
      let sessionId = localStorage.getItem('omozoku_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('omozoku_session_id', sessionId);
      }
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId,
          episode,
          secondsWatched: Math.floor(time),
          sessionId,
        }),
      });
    } catch (e) {
      console.warn('Failed to save progress', e);
    }
  }, [animeId, episode, shouldSaveProgress]);

  // Init Player
  const initPlayer = useCallback(async () => {
    if (!currentSource) return;

    if (currentSource.isIframe) {
      setIsBuffering(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setIsBuffering(true);

    const src = currentSource.isM3U8
      ? toProxiedUrl(currentSource.url, referer)
      : currentSource.url;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (currentSource.isIframe) {
      setIsBuffering(false);
      return;
    }

    if (currentSource.isM3U8) {
      const { default: Hls } = await import('hls.js');

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          startPosition: initialTime > 0 ? initialTime : -1,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          // Only auto-play if we actually are ready, but mostly wait for user interaction unless already playing
          // The spec doesn't require autoplay on load, but typically we don't autoplay until user clicks play
          // unless they are switching qualities
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('Fatal network error encountered, try to recover');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('Fatal media error encountered, try to recover');
                hls.recoverMediaError();
                break;
              default:
                // Cannot recover, try fallback
                if (currentSourceIndex + 1 < sortedSources.length) {
                  showToast('Switching source...');
                  setCurrentSourceIndex(prev => prev + 1);
                } else {
                  setError(`HLS error: ${data.details}`);
                  setIsBuffering(false);
                }
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.currentTime = initialTime;
        video.addEventListener('loadedmetadata', () => setIsBuffering(false), { once: true });
      } else {
        setError('Your browser does not support HLS streaming.');
        setIsBuffering(false);
      }
    } else {
      video.src = src;
      video.currentTime = initialTime;
      video.addEventListener('loadedmetadata', () => setIsBuffering(false), { once: true });
    }
  }, [currentSource, currentSourceIndex, initialTime, referer, sortedSources.length]);

  // Handle source switch
  useEffect(() => {
    initPlayer();
    if (onSourceSwitch) onSourceSwitch(currentSource);
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initPlayer, currentSource, onSourceSwitch]);

  // Video Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPlaying = () => setIsBuffering(false);
    const onPause = () => {
      setIsPlaying(false);
      saveProgress(video.currentTime);
    };
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    
    // Initial check in case it's already loaded
    if (video.readyState >= 3) {
      setIsBuffering(false);
    }
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // If time is updating, it means we are actively playing/moving, so we are not buffering.
      setIsBuffering(false);
    };
    const onDurationChange = () => setDuration(video.duration);
    const onProgress = () => setBuffered(video.buffered);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const onRateChange = () => setPlaybackRate(video.playbackRate);

    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('progress', onProgress);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('ratechange', onRateChange);
    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('ratechange', onRateChange);
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, [saveProgress]);

  // Fullscreen event (attached to document)
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Sync interval
  useEffect(() => {
    progressTimerRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveProgress(videoRef.current.currentTime);
      }
    }, 5000);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [saveProgress]);

  // Exposed Controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const seek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
  };

  const changeVolume = (vol: number) => {
    if (videoRef.current) {
      videoRef.current.volume = vol;
      if (vol > 0) videoRef.current.muted = false;
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  const changeQuality = (source: StreamSource) => {
    const idx = sortedSources.findIndex(s => s.url === source.url);
    if (idx !== -1 && idx !== currentSourceIndex) {
      // Remember time and playing state
      const wasPlaying = isPlaying;
      const time = currentTime;
      
      showToast(`Switching to ${source.quality}...`);
      setCurrentSourceIndex(idx);
      
      // We will resume playing inside initPlayer via HLS events if needed, but since we recreate HLS,
      // we might need a small timeout to play it again after it attaches.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
          if (wasPlaying) videoRef.current.play().catch(() => {});
        }
      }, 500);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const togglePiP = () => {
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else {
      videoRef.current.requestPictureInPicture().catch(() => {});
    }
  };

  return {
    videoRef,
    state: {
      isPlaying,
      currentTime,
      duration,
      buffered,
      volume,
      isMuted,
      playbackRate,
      isFullscreen,
      isPiP,
      isBuffering,
      error,
      currentSource,
      toastMessage,
    },
    controls: {
      togglePlay,
      seek,
      toggleMute,
      changeVolume,
      changePlaybackRate,
      changeQuality,
      toggleFullscreen,
      togglePiP,
      availableQualities: sortedSources,
      retry: initPlayer,
    }
  };
}
