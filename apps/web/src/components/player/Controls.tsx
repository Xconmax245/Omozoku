import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, Settings, PictureInPicture2, Type
} from 'lucide-react';
import type { StreamSource } from '@omozoku/types';

export interface SubtitleTrack {
  url: string;
  language?: string;
}

interface ControlsProps {
  visible: boolean;
  state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    buffered: TimeRanges | null;
    volume: number;
    isMuted: boolean;
    playbackRate: number;
    isFullscreen: boolean;
    isPiP: boolean;
    currentSource: StreamSource;
  };
  actions: {
    togglePlay: () => void;
    seek: (time: number) => void;
    toggleMute: () => void;
    changeVolume: (vol: number) => void;
    changePlaybackRate: (rate: number) => void;
    changeQuality: (source: StreamSource) => void;
    toggleFullscreen: () => void;
    togglePiP: () => void;
  };
  qualities: StreamSource[];
  subtitles: SubtitleTrack[];
  activeSubtitle: number;
  setActiveSubtitle: (idx: number) => void;
  subtitleOffset: number;
  setSubtitleOffset: (offset: number) => void;
  animeTitle: string;
  episode: number;
  onNextEpisode?: () => void;
}

function fmt(secs: number): string {
  if (!isFinite(secs) || isNaN(secs)) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function Controls({
  visible, state, actions, qualities, subtitles, activeSubtitle,
  setActiveSubtitle, subtitleOffset, setSubtitleOffset, animeTitle, episode, onNextEpisode
}: ControlsProps) {
  const {
    isPlaying, currentTime, duration, buffered, volume, isMuted,
    playbackRate, isFullscreen, currentSource
  } = state;

  const [activeMenu, setActiveMenu] = useState<'none' | 'quality' | 'speed' | 'subtitle'>('none');
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const seekBarRef = useRef<HTMLDivElement>(null);

  // Calculate buffered percentage
  let bufferedPercent = 0;
  if (buffered && duration > 0) {
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
        bufferedPercent = (buffered.end(i) / duration) * 100;
        break;
      }
    }
  }

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || duration === 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    actions.seek(pos * duration);
  };

  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || duration === 0) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverPos(pos * 100);
  };

  const closeMenu = () => setActiveMenu('none');

  // Close menus when clicking outside
  useEffect(() => {
    if (activeMenu === 'none') return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.player-popover') && !(e.target as HTMLElement).closest('.player-menu-btn')) {
        closeMenu();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeMenu]);

  return (
    <div className={`player-controls ${visible ? 'player-controls--visible' : ''}`}>
      {/* ── Seek Bar ────────────────────────────────────────────────────────── */}
      <div 
        className="player-seekbar" 
        ref={seekBarRef}
        onMouseMove={handleSeekHover}
        onMouseLeave={() => setHoverTime(null)}
        onClick={handleSeekDrag}
        role="slider"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
      >
        <div className="player-seek__bg">
          <div className="player-seek__buffered" style={{ width: `${bufferedPercent}%` }} />
          <div className="player-seek__fill" style={{ width: `${playedPercent}%` }} />
        </div>
        
        {hoverTime !== null && (
          <div className="player-seek__tooltip" style={{ left: `${hoverPos}%` }}>
            {fmt(hoverTime)}
          </div>
        )}
      </div>

      <div className="player-controls__row">
        {/* Left group */}
        <div className="player-controls__left">
          <button className="player-btn" onClick={actions.togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="player-volume">
            <button className="player-btn" onClick={actions.toggleMute} aria-label="Toggle mute">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="player-volume__slider-container">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => actions.changeVolume(Number(e.target.value))}
                className="player-volume__slider"
                aria-label="Volume"
              />
            </div>
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
          {/* Subtitles Menu */}
          {subtitles.length > 0 && (
            <div className="player-menu-wrapper">
              <button
                className="player-btn player-menu-btn"
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'subtitle' ? 'none' : 'subtitle'); }}
                aria-label="Subtitles"
              >
                <Type size={18} />
              </button>
              {activeMenu === 'subtitle' && (
                <div className="player-popover" onClick={e => e.stopPropagation()}>
                  <div className="player-popover__header">Subtitles</div>
                  <button className={`player-popover__item ${activeSubtitle === -1 ? 'active' : ''}`} onClick={() => setActiveSubtitle(-1)}>Off</button>
                  {subtitles.map((sub, i) => (
                    <button key={i} className={`player-popover__item ${activeSubtitle === i ? 'active' : ''}`} onClick={() => setActiveSubtitle(i)}>
                      {sub.language || `Track ${i + 1}`}
                    </button>
                  ))}
                  <div className="player-popover__divider" />
                  <div className="player-popover__header">Sync Offset</div>
                  <div className="player-popover__row">
                    <button onClick={() => setSubtitleOffset(subtitleOffset - 0.5)}>-0.5s</button>
                    <span>{subtitleOffset > 0 ? '+' : ''}{subtitleOffset}s</span>
                    <button onClick={() => setSubtitleOffset(subtitleOffset + 0.5)}>+0.5s</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Speed Menu */}
          <div className="player-menu-wrapper">
            <button
              className="player-btn player-btn--text player-menu-btn"
              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'speed' ? 'none' : 'speed'); }}
              aria-label="Playback speed"
            >
              {playbackRate}x
            </button>
            {activeMenu === 'speed' && (
              <div className="player-popover" onClick={e => e.stopPropagation()}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button key={rate} className={`player-popover__item ${playbackRate === rate ? 'active' : ''}`} onClick={() => { actions.changePlaybackRate(rate); closeMenu(); }}>
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quality Menu */}
          <div className="player-menu-wrapper">
            <button
              className="player-btn player-btn--text player-menu-btn"
              onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'quality' ? 'none' : 'quality'); }}
              aria-label="Quality settings"
            >
              <Settings size={18} />
              <span>{currentSource.quality}</span>
            </button>
            {activeMenu === 'quality' && (
              <div className="player-popover" onClick={e => e.stopPropagation()}>
                {qualities.map((s, i) => (
                  <button key={i} className={`player-popover__item ${s.url === currentSource.url ? 'active' : ''}`} onClick={() => { actions.changeQuality(s); closeMenu(); }}>
                    {s.quality}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Next Episode */}
          {onNextEpisode && (
            <button className="player-btn" onClick={onNextEpisode} aria-label="Next episode">
              <SkipForward size={20} />
            </button>
          )}

          {/* PiP */}
          <button className="player-btn" onClick={actions.togglePiP} aria-label="Picture in picture" style={{ display: typeof document !== 'undefined' && 'pictureInPictureEnabled' in document ? 'block' : 'none' }}>
            <PictureInPicture2 size={18} />
          </button>

          {/* Fullscreen */}
          <button className="player-btn" onClick={actions.toggleFullscreen} aria-label="Fullscreen">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
