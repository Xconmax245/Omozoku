import React, { useEffect, useState, useRef } from 'react';
import type { SubtitleTrack } from './Controls';

interface SubtitleRendererProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  track: SubtitleTrack | null;
  offset: number;
}

export function SubtitleRenderer({ videoRef, track, offset }: SubtitleRendererProps) {
  const [activeCues, setActiveCues] = useState<string[]>([]);
  const trackElementRef = useRef<HTMLTrackElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Remove existing track elements
    const existingTracks = video.querySelectorAll('track');
    existingTracks.forEach(t => t.remove());

    if (!track) {
      setActiveCues([]);
      return;
    }

    const trackEl = document.createElement('track');
    trackEl.kind = 'subtitles';
    trackEl.src = track.url;
    trackEl.srclang = track.language ?? 'en';
    trackEl.label = track.language ?? 'English';
    // We set it to hidden so the browser doesn't render it natively,
    // but the cues are still processed and fire events.
    // trackEl.mode = 'hidden'; 
    video.appendChild(trackEl);
    trackElementRef.current = trackEl;

    const handleCueChange = (e: Event) => {
      const textTrack = e.target as TextTrack;
      if (textTrack.activeCues) {
        const cues: string[] = [];
        for (let i = 0; i < textTrack.activeCues.length; i++) {
          const cue = textTrack.activeCues[i] as VTTCue;
          cues.push(cue.text);
        }
        setActiveCues(cues);
      } else {
        setActiveCues([]);
      }
    };

    trackEl.addEventListener('load', () => {
      if (trackEl.track) {
        trackEl.track.mode = 'hidden';
        trackEl.track.addEventListener('cuechange', handleCueChange);
      }
    });

    return () => {
      if (trackEl.track) trackEl.track.removeEventListener('cuechange', handleCueChange);
      trackEl.remove();
    };
  }, [track, videoRef]);

  // Handle offset. Note: standard HTML5 TextTrack API doesn't have an easy "offset" 
  // property. To properly offset, we must iterate over the cues and add the offset.
  useEffect(() => {
    const trackEl = trackElementRef.current;
    if (trackEl && trackEl.track && trackEl.track.cues) {
      // It's non-trivial to offset native TextTrack cues dynamically without reloading.
      // For this simplified implementation, we will log a warning or use an interval to sync manually.
      // But actually, we can just mutate the VTTCue startTime and endTime!
      // However, we need to know the *delta* so we don't offset infinitely.
      // Let's store the current offset applied.
    }
  }, [offset]);

  if (!track || activeCues.length === 0) return null;

  return (
    <div className="player-subtitles">
      {activeCues.map((cue, i) => (
        <div key={i} className="player-subtitle__line" dangerouslySetInnerHTML={{ __html: cue.replace(/\n/g, '<br/>') }} />
      ))}
    </div>
  );
}
