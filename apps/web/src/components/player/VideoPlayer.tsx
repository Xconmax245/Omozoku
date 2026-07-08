'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { WatchResponse } from '@omozoku/types';
import { Loader2, AlertTriangle, SkipForward, Play, Pause } from 'lucide-react';

import { usePlayer } from '../../hooks/usePlayer';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useGestures } from '../../hooks/useGestures';
import { Controls } from './Controls';
import { SubtitleRenderer } from './SubtitleRenderer';
import { NextEpisodeCard } from './NextEpisodeCard';
import { useSettingsStore } from '@/stores/settingsStore';

interface VideoPlayerProps {
  watchResponse: WatchResponse;
  animeTitle: string;
  animeId: number;
  episode: number;
  posterUrl?: string;
  onNextEpisode?: () => void;
}

export default function VideoPlayer({
  watchResponse,
  animeTitle,
  animeId,
  episode,
  posterUrl,
  onNextEpisode,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { autoplay, skipIntro: autoSkipIntro } = useSettingsStore();

  const [activeSubtitle, setActiveSubtitle] = useState(-1);
  const [subtitleOffset, setSubtitleOffset] = useState(0);

  const [resumePrompt, setResumePrompt] = useState<{ time: number, display: string } | null>(null);
  const [hasCheckedResume, setHasCheckedResume] = useState(false);

  const [nextEpisodeCanceled, setNextEpisodeCanceled] = useState(false);
  const hasAutoSkippedIntro = useRef(false);

  // Check resume progress on mount
  useEffect(() => {
    let mounted = true;
    async function checkResume() {
      try {
        const res = await fetch(`/api/progress?animeId=${animeId}&episode=${episode}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (mounted && data.time && data.time > 10) {
          const display = new Date(data.time * 1000).toISOString().substr(11, 8);
          setResumePrompt({ time: data.time, display: display.startsWith('00:') ? display.slice(3) : display });
        }
      } catch {
        // fail silently
      } finally {
        if (mounted) setHasCheckedResume(true);
      }
    }
    checkResume();
    
    const timer = setTimeout(() => {
      if (mounted) setHasCheckedResume(true);
    }, 2000);
    return () => { mounted = false; clearTimeout(timer); };
  }, [animeId, episode]);

  const { videoRef, state, controls } = usePlayer({
    sources: watchResponse.sources,
    referer: watchResponse.headers?.['Referer'] ?? '',
    animeId,
    episode,
    initialTime: 0,
  });

  const intro = watchResponse.skipIntro;
  const outro = watchResponse.skipOutro;
  const subtitles = watchResponse.subtitles || [];

  const {
    isPlaying, currentTime, duration, volume, playbackRate, toastMessage, isBuffering, error, currentSource
  } = state;

  const showSkipIntro = intro && currentTime >= intro.start && currentTime <= intro.end;
  const showSkipOutro = outro && currentTime >= outro.start && currentTime <= outro.end;

  // Auto-skip intro logic
  useEffect(() => {
    if (autoSkipIntro && showSkipIntro && !hasAutoSkippedIntro.current && intro) {
      controls.seek(intro.end);
      hasAutoSkippedIntro.current = true;
    }
  }, [autoSkipIntro, showSkipIntro, intro, controls]);

  const showNextEpisodeCard = Boolean(
    onNextEpisode && 
    !nextEpisodeCanceled && 
    duration > 0 && 
    duration - currentTime <= 15
  );

  // Auto-hide controls
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

  // Keyboard and Gestures
  useKeyboardShortcuts({
    togglePlay: controls.togglePlay, toggleMute: controls.toggleMute,
    seek: controls.seek, changeVolume: controls.changeVolume, changePlaybackRate: controls.changePlaybackRate,
    toggleFullscreen: controls.toggleFullscreen, currentTime, duration, volume, playbackRate
  });

  const { brightness, showSeekRipple } = useGestures({
    containerRef, seek: controls.seek, currentTime, duration, volume, changeVolume: controls.changeVolume,
    toggleControls: () => setShowControls(p => !p)
  });

  // Tap-to-play burst
  const [showPlayBurst, setShowPlayBurst] = useState(false);
  const [showPauseBurst, setShowPauseBurst] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isPlaying) {
      setShowPlayBurst(true);
      setTimeout(() => setShowPlayBurst(false), 500);
    } else {
      setShowPauseBurst(true);
      setTimeout(() => setShowPauseBurst(false), 500);
    }
  }, [isPlaying]);

  const activeTrack = activeSubtitle >= 0 ? subtitles[activeSubtitle] : null;

  if (error) {
    return (
      <div className="player-error">
        <AlertTriangle size={40} className="player-error__icon" />
        <p className="player-error__msg">{error}</p>
        <button className="player-error__retry" onClick={controls.retry}>Retry</button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`player-root ${currentSource.isIframe ? 'player-root--iframe' : ''} ${!showControls && isPlaying ? 'player-root--hide-cursor' : ''}`}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={() => resetControlsTimer()}
      style={{ '--player-brightness': brightness } as React.CSSProperties}
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
          onClick={controls.togglePlay}
          controls={false}
        />
      )}

      {/* Brightness Overlay */}
      <div className="player-brightness-overlay" style={{ opacity: 1 - brightness }} />

      {!hasCheckedResume ? (
        <div className="player-overlay player-spinner">
          <Loader2 size={48} className="player-spinner__icon" />
        </div>
      ) : (
        <>
          {/* Resume Prompt */}
          {resumePrompt && (
            <div className="player-resume-prompt">
              <p>Resume from {resumePrompt.display}?</p>
              <div className="player-resume-prompt__actions">
                <button onClick={() => { controls.seek(resumePrompt.time); setResumePrompt(null); controls.togglePlay(); }}>Resume</button>
                <button onClick={() => { setResumePrompt(null); controls.togglePlay(); }}>Start Over</button>
              </div>
            </div>
          )}

          {/* Play/Pause Burst */}
          {showPlayBurst && <div className="player-burst"><Play size={64} fill="white" /></div>}
          {showPauseBurst && <div className="player-burst"><Pause size={64} fill="white" /></div>}

          {/* Seek Ripples */}
          {showSeekRipple === 'left' && <div className="player-ripple player-ripple--left">« 10s</div>}
          {showSeekRipple === 'right' && <div className="player-ripple player-ripple--right">10s »</div>}

          {/* Toast Message */}
          {toastMessage && <div className="player-toast">{toastMessage}</div>}

          {/* Loading Spinner */}
          {isBuffering && !resumePrompt && (
            <div className="player-overlay player-spinner">
              <Loader2 size={48} className="player-spinner__icon" />
            </div>
          )}

          {/* Subtitles */}
          {!currentSource.isIframe && (
            <SubtitleRenderer videoRef={videoRef} track={activeTrack} offset={subtitleOffset} />
          )}

          {/* Skip Intro/Outro */}
          {showSkipIntro && !currentSource.isIframe && (
            <button className="player-skip player-skip--intro" onClick={() => controls.seek(intro.end)}>
              <SkipForward size={16} /> Skip Intro
            </button>
          )}
          {showSkipOutro && !currentSource.isIframe && (
            <button className="player-skip player-skip--outro" onClick={() => controls.seek(outro.end)}>
              <SkipForward size={16} /> Skip Outro
            </button>
          )}

          {/* Controls Bar */}
          {!currentSource.isIframe && (
            <Controls
              visible={showControls}
              state={state}
              actions={controls}
              qualities={controls.availableQualities}
              subtitles={subtitles}
              activeSubtitle={activeSubtitle}
              setActiveSubtitle={setActiveSubtitle}
              subtitleOffset={subtitleOffset}
              setSubtitleOffset={setSubtitleOffset}
              animeTitle={animeTitle}
              episode={episode}
              onNextEpisode={onNextEpisode}
            />
          )}

          {/* Next Episode Auto-Advance Card */}
          {showNextEpisodeCard && onNextEpisode && (
            <NextEpisodeCard
              animeId={animeId}
              animeTitle={animeTitle}
              nextEpisode={episode + 1}
              posterUrl={posterUrl}
              countdownStart={15}
              autoPlay={autoplay}
              onCancel={() => setNextEpisodeCanceled(true)}
              onNext={onNextEpisode}
            />
          )}
        </>
      )}
    </div>
  );
}
