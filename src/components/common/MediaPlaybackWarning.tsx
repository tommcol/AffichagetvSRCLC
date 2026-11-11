import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { clubCalendarDate } from '../../utils/clubTime';

const STORAGE_KEY = 'club_media_errors';
type MediaWarning = { name: string; at?: number };

function readWarning(): MediaWarning | null {
  try {
    const errors: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(errors)) return null;
    const error = errors.find(value => value && typeof value.name === 'string' && value.name.trim());
    if (!error) return null;
    const at = typeof error.at === 'number' && Number.isFinite(new Date(error.at).getTime()) ? error.at : undefined;
    return { name: error.name, at };
  } catch { return null; }
}

/** Local playback diagnostics only: dismissing never modifies club data or media. */
export function MediaPlaybackWarning() {
  const [warning, setWarning] = useState(readWarning);
  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setWarning(readWarning());
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  if (!warning) return null;
  const date = warning.at === undefined ? null : clubCalendarDate(new Date(warning.at));
  const dismiss = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Still allow closing for this session. */ }
    setWarning(null);
  };
  return <div role="status" className="flex max-w-xl items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
    <div className="min-w-0 break-words">
      <span className="block">Dernière erreur vidéo : {warning.name}</span>
      {date ? <time dateTime={new Date(warning.at!).toISOString()} className="block text-amber-200/80" title="Heure du club — Europe/Paris">
        Le {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </time> : <span className="block text-amber-200/80">Date et heure inconnues</span>}
    </div>
    <button type="button" onClick={dismiss} aria-label="Fermer l’avertissement vidéo" title="Fermer l’avertissement vidéo"
      className="shrink-0 rounded-lg p-2 hover:bg-amber-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  </div>;
}
