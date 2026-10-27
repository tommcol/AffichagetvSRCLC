import { videoPlaybackState } from '../../utils/videoPlaybackState';
import React, { useEffect, useRef } from 'react';

/** Coordinates the videos actually mounted in a TV slide, including free layers.
 * Hidden layers are absent; the longest visible video controls completion.
 */
export function VideoPlaybackBoundary({ children, playing, slideId, onComplete, onVideoMode, onProgress }: {
  children: React.ReactNode; playing: boolean; slideId: string;
  onComplete: () => void; onVideoMode: (active: boolean) => void; onProgress: (value: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const playingRef = useRef(playing);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  playingRef.current = playing;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let done = false;
    const failed = new Set<HTMLVideoElement>();
    const clocks = new Map<HTMLVideoElement, { time: number; changed: number }>();
    const visibleVideos = () => Array.from(element.querySelectorAll('video')).filter(v =>
      v.getClientRects().length > 0 && getComputedStyle(v).visibility !== 'hidden');
    const finish = () => { if (!done && playingRef.current) { done = true; completeRef.current(); } };
    const report = (v: HTMLVideoElement) => {
      if (failed.has(v)) return;
      failed.add(v);
      const source = v.currentSrc || v.src;
      const name = /^(data|blob):/.test(source) ? 'Vidéo intégrée' : (source.split('/').pop()?.split('?')[0] || 'Vidéo indisponible').slice(0, 140);
      try {
        const list = JSON.parse(localStorage.getItem('club_media_errors') || '[]');
        localStorage.setItem('club_media_errors', JSON.stringify([{ name, at: Date.now() }, ...list].slice(0, 10)));
      } catch { /* Diagnostics must not block playback. */ }
      check();
    };
    const check = () => {
      const videos = visibleVideos();
      onVideoMode(videos.length > 0);
      const state = videoPlaybackState(videos.map(v => ({ duration: v.duration, currentTime: v.currentTime, ended: v.ended, failed: failed.has(v) })));
      if (state.complete) finish();
      onProgress(state.progress);
    };
    const synchronize = () => {
      for (const v of visibleVideos()) {
        v.loop = false;
        if (!clocks.has(v)) clocks.set(v, { time: v.currentTime, changed: Date.now() });
        if (!playingRef.current) v.pause();
        else if (!v.ended && !failed.has(v) && v.paused) void v.play().catch(() => report(v));
      }
      check();
    };
    const onPlay = (event: Event) => {
      if (!playingRef.current && event.target instanceof HTMLVideoElement) event.target.pause();
    };
    const onError = (event: Event) => {
      if (event.target instanceof HTMLVideoElement) report(event.target);
    };
    const observer = new MutationObserver(synchronize);
    observer.observe(element, { childList: true, subtree: true });
    element.addEventListener('play', onPlay, true);
    element.addEventListener('error', onError, true);
    element.addEventListener('loadedmetadata', synchronize, true);
    element.addEventListener('ended', check, true);
    const timer = window.setInterval(() => {
      for (const v of visibleVideos()) {
        const last = clocks.get(v) || { time: v.currentTime, changed: Date.now() };
        if (!playingRef.current || last.time !== v.currentTime || v.ended) {
          clocks.set(v, { time: v.currentTime, changed: Date.now() });
        } else if (Date.now() - last.changed > 8000) report(v);
      }
      synchronize();
    }, 250);
    synchronize();
    return () => {
      observer.disconnect(); window.clearInterval(timer);
      element.removeEventListener('play', onPlay, true);
      element.removeEventListener('error', onError, true);
      element.removeEventListener('loadedmetadata', synchronize, true);
      element.removeEventListener('ended', check, true);
    };
  }, [slideId, onVideoMode, onProgress]);
  useEffect(() => {
    for (const v of root.current?.querySelectorAll('video') || []) {
      if (!playing) v.pause();
      else if (!v.ended) void v.play().catch(() => { /* Watchdog handles playback failure. */ });
    }
  }, [playing]);
  return <div ref={root} className="w-full h-full">{children}</div>;
}
