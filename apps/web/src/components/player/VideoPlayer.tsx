'use client';

// ─── VideoPlayer ──────────────────────────────────────────────────────────────
// A production-grade HLS video player built on hls.js with:
//   • Native Safari HLS fallback (video.canPlayType)
//   • Quality/resolution switcher
//   • Skip Intro / Skip Outro overlays
//   • Custom controls (play/pause, volume, seek, fullscreen, pip)
//   • Proxy routing through /api/proxy/stream for CORS bypassing
//   • Memory-safe: hls.destroy() on unmount and episode change

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { WatchResponse, StreamSource } from '@omozoku/types';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, Settings, ChevronDown, Loader2, AlertTriangle,
  PictureInPicture2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoPlayerProps {
  watchResponse: WatchResponse;
  animeTitle: string;
  episode: number;
  /** Optional poster image to show before play */
  posterUrl?: string;
  /** Called when next episode button is pressed */
  onNextEpisode?: () => void;
}

// ─── Proxy URL helper ─────────────────────────────────────────────────────────

function toProxiedUrl(url: string, referer: string): string {
  return `/api/proxy/stream?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
}

// ─── Format time helper ───────────────────────────────────────────────────────

function fmt(secs: number): string {
  if (!isFinite(secs) || isNaN(secs)) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VideoPlayer({
  watchResponse,
  animeTitle,
  episode,
  posterUrl,
  onNextEpisode,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<import('hls.js').default | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Choose best source: prefer highest-quality m3u8
  const sortedSources = [...watchResponse.sources].sort((a, b) => {
    const order = { '1080p': 0, '720p': 1, '480p': 2, '360p': 3, auto: 4 };
    return (order[a.quality] ?? 5) - (order[b.quality] ?? 5);
  });

  const [currentSource, setCurrentSource] = useState<StreamSource>(sortedSources[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipOutro, setShowSkipOutro] = useState(false);

  const referer = watchResponse.headers?.['Referer'] ?? '';

  // ─── HLS Initialisation ─────────────────────────────────────────────────────

  const initPlayer = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !currentSource) return;

    setError(null);
    setIsLoading(true);

    const src = currentSource.isM3U8
      ? toProxiedUrl(currentSource.url, referer)
      : currentSource.url;

    // Destroy any existing hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (currentSource.isIframe) {
      setIsLoading(false);
      return;
    }

    if (currentSource.isM3U8) {
      const { default: Hls } = await import('hls.js');

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          void video.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError(`HLS error: ${data.type} — ${data.details}`);
            setIsLoading(false);
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
          void video.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
        }, { once: true });
      } else {
        setError('Your browser does not support HLS streaming.');
        setIsLoading(false);
      }
    } else {
      // Direct MP4
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        void video.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }, { once: true });
    }
  }, [currentSource, referer]);

  // Reinitialise on source change
  useEffect(() => {
    void initPlayer();
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [initPlayer]);

  // ─── Video events ────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay    = () => setIsPlaying(true);
    const onPause   = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const intro = watchResponse.skipIntro;
      const outro = watchResponse.skipOutro;
      if (intro) setShowSkipIntro(video.currentTime >= intro.start && video.currentTime < intro.end);
      if (outro) setShowSkipOutro(video.currentTime >= outro.start && video.currentTime < outro.end);
    };
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange   = () => { setVolume(video.volume); setIsMuted(video.muted); };
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const onError = () => {
      setError('Video playback error. The stream may have expired — try refreshing.');
      setIsLoading(false);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('error', onError);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('error', onError);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [watchResponse]);

  // ─── Controls auto-hide ───────────────────────────────────────────────────────

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) setShowControls(true);
  }, [isPlaying]);

  // ─── Control handlers ─────────────────────────────────────────────────────────

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Number(e.target.value);
    v.muted = Number(e.target.value) === 0;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) void el.requestFullscreen();
    else void document.exitFullscreen();
  };

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await v.requestPictureInPicture().catch(() => null);
  };

  const skipIntro = () => {
    const v = videoRef.current;
    if (v && watchResponse.skipIntro) v.currentTime = watchResponse.skipIntro.end;
  };

  const skipOutro = () => {
    const v = videoRef.current;
    if (v && watchResponse.skipOutro) v.currentTime = watchResponse.skipOutro.end;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="player-error">
        <AlertTriangle size={40} className="player-error__icon" />
        <p className="player-error__msg">{error}</p>
        <button className="player-error__retry" onClick={() => void initPlayer()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`player-root ${currentSource.isIframe ? 'player-root--iframe' : ''}`}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={() => { resetControlsTimer(); }}
    >
      {/* ── Video element or Iframe ───────────────────────────────────────────── */}
      {currentSource.isIframe ? (
        <iframe
          src={currentSource.url}
          className="player-video"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{ width: '100%', height: '100%', border: 'none', aspectRatio: '16/9' }}
        />
      ) : (
        <video
          ref={videoRef}
          className="player-video"
          poster={posterUrl}
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          onClick={togglePlay}
        />
      )}

      {/* ── Loading spinner ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="player-overlay player-spinner">
          <Loader2 size={48} className="player-spinner__icon" />
        </div>
      )}

      {/* ── Skip Intro ──────────────────────────────────────────────── */}
      {showSkipIntro && !currentSource.isIframe && (
        <button className="player-skip player-skip--intro" onClick={skipIntro}>
          <SkipForward size={16} />
          Skip Intro
        </button>
      )}

      {/* ── Skip Outro ──────────────────────────────────────────────── */}
      {showSkipOutro && !currentSource.isIframe && (
        <button className="player-skip player-skip--outro" onClick={skipOutro}>
          <SkipForward size={16} />
          Skip Outro
        </button>
      )}

      {/* ── Controls ────────────────────────────────────────────────── */}
      {!currentSource.isIframe && (
        <div className={`player-controls ${showControls ? 'player-controls--visible' : ''}`}>
          {/* Progress bar */}
          <div className="player-seekbar">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="player-seek"
              aria-label="Seek"
            />
            <div className="player-seek__fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="player-controls__row">
            {/* Left group */}
            <div className="player-controls__left">
              <button className="player-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <div className="player-volume">
                <button className="player-btn" onClick={toggleMute} aria-label="Toggle mute">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="player-volume__slider"
                  aria-label="Volume"
                />
              </div>

              <span className="player-time">
                {fmt(currentTime)} / {fmt(duration)}
              </span>
            </div>

            {/* Title */}
            <span className="player-title">
              {animeTitle} — Ep {episode}
            </span>

            {/* Right group */}
            <div className="player-controls__right">
              {/* Quality selector */}
              <div className="player-quality">
                <button
                  className="player-btn player-btn--text"
                  onClick={() => setShowQualityMenu((p) => !p)}
                  aria-label="Quality settings"
                >
                  <Settings size={18} />
                  <span>{currentSource.quality}</span>
                  <ChevronDown size={14} />
                </button>

                {showQualityMenu && (
                  <div className="player-quality__menu">
                    {sortedSources.map((s, i) => (
                      <button
                        key={i}
                        className={`player-quality__option ${s.url === currentSource.url ? 'active' : ''}`}
                        onClick={() => { setCurrentSource(s); setShowQualityMenu(false); }}
                      >
                        {s.quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Next episode */}
              {onNextEpisode && (
                <button className="player-btn" onClick={onNextEpisode} aria-label="Next episode">
                  <SkipForward size={20} />
                </button>
              )}

              {/* PiP */}
              <button className="player-btn" onClick={() => void togglePip()} aria-label="Picture in picture">
                <PictureInPicture2 size={18} />
              </button>

              {/* Fullscreen */}
              <button className="player-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
