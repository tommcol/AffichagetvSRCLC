import React, { useEffect, useRef, useState } from 'react';
import type { ClubSettings } from '../../types';
import { getRadioStreamUrl, isHlsRadioStation } from '../../utils/radioStations';
import { startRadioPlayback } from '../../utils/radioPlayback';
import { createHlsRadioSource } from '../../utils/radioHlsSource';

export function BackgroundRadio({ settings }: { settings: ClubSettings }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const controllerRef = useRef<ReturnType<typeof startRadioPlayback> | undefined>(undefined);
  const [blocked, setBlocked] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const url = getRadioStreamUrl(settings);
  const hls = isHlsRadioStation(settings.radioStationId);
  useEffect(() => {
    setBlocked(false);
    setUnavailable(false);
    const audio = audioRef.current;
    if (!audio || !url) return;
    let cancelled = false;
    let controller: ReturnType<typeof startRadioPlayback> | undefined;
    const start = (source?: ReturnType<typeof createHlsRadioSource>) => {
      controller = startRadioPlayback(audio, url, { events: window, onBlocked: setBlocked, source });
      controllerRef.current = controller;
    };
    if (!hls || audio.canPlayType('application/vnd.apple.mpegurl')) start();
    else {
      // Only this station loads HLS support; direct MP3/AAC stations stay native.
      void import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) { setUnavailable(true); return; }
        start(createHlsRadioSource(audio, url, Hls, () => audio.dispatchEvent(new Event('error'))));
      }).catch(() => { if (!cancelled) setUnavailable(true); });
    }
    return () => { cancelled = true; controller?.dispose(); controllerRef.current = undefined; };
  }, [url, hls]);
  if (!url) return null;
  return <>
    <audio ref={audioRef} preload="none" hidden />
    {unavailable && <p role="status" className="absolute bottom-4 right-4 z-50 rounded-xl bg-slate-900 px-4 py-3 text-white">
      Cette radio ne peut pas être chargée. Choisissez une autre station dans les réglages.
    </p>}
    {blocked && <button type="button" onClick={() => controllerRef.current?.retry()}
      className="absolute bottom-4 right-4 z-50 rounded-xl bg-slate-900 px-4 py-3 text-white border border-white/30 shadow-xl">
      Activer le son de la radio
    </button>}
  </>;
}
