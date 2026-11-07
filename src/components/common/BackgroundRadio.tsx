import React, { useEffect, useRef, useState } from 'react';
import type { ClubSettings } from '../../types';
import { getRadioStreamUrl } from '../../utils/radioStations';
import { startRadioPlayback } from '../../utils/radioPlayback';

export function BackgroundRadio({ settings }: { settings: ClubSettings }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const controllerRef = useRef<ReturnType<typeof startRadioPlayback> | undefined>(undefined);
  const [blocked, setBlocked] = useState(false);
  const url = getRadioStreamUrl(settings);
  useEffect(() => {
    setBlocked(false);
    if (!audioRef.current || !url) return;
    const controller = startRadioPlayback(audioRef.current, url, { events: window, onBlocked: setBlocked });
    controllerRef.current = controller;
    return () => { controller.dispose(); controllerRef.current = undefined; };
  }, [url]);
  if (!url) return null;
  return <>
    <audio ref={audioRef} preload="none" hidden />
    {blocked && <button type="button" onClick={() => controllerRef.current?.retry()}
      className="absolute bottom-4 right-4 z-50 rounded-xl bg-slate-900 px-4 py-3 text-white border border-white/30 shadow-xl">
      Activer le son de la radio
    </button>}
  </>;
}
