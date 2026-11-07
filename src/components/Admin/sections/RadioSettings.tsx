import React from 'react';
import type { ClubSettings } from '../../../types';
import { getRadioStreamUrl, RADIO_STATIONS } from '../../../utils/radioStations';

export function RadioSettings({ settings, onChange }: { settings: ClubSettings; onChange: (settings: ClubSettings) => void }) {
  const custom = settings.radioStationId === 'custom';
  return <section className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
    <h4 className="text-lg font-black text-white">Radio en fond sonore</h4>
    <p className="text-sm text-slate-300">Musique continue pendant le carrousel, vidéos muettes. Réglez ou coupez le son avec la télécommande de la TV.</p>
    <label className="block text-sm text-slate-200">Station radio
      <select aria-label="Station radio" value={settings.radioStationId || 'off'}
        onChange={event => onChange({ ...settings, radioStationId: event.target.value })}
        className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-white">
        <option value="off">Désactivée</option>
        {RADIO_STATIONS.map(station => <option key={station.id} value={station.id}>{station.name} — sans publicité commerciale</option>)}
        <option value="custom">Autre radio — flux HTTPS</option>
      </select>
    </label>
    {custom && <label className="block text-sm text-slate-200">Adresse du flux audio
      <input type="url" aria-label="Adresse du flux audio" value={settings.radioCustomUrl || ''}
        placeholder="https://radio.exemple/flux.mp3"
        onChange={event => onChange({ ...settings, radioCustomUrl: event.target.value })}
        className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-white" />
      <span className="block mt-1 text-xs text-slate-400">Lien direct MP3 ou AAC en HTTPS, pas l’adresse du site ou d’une liste M3U/PLS.</span>
      {!getRadioStreamUrl(settings) && <span role="alert" className="block mt-1 text-sm text-amber-300">Saisissez une adresse HTTPS valide, sans identifiant ni mot de passe.</span>}
    </label>}
    <p className="text-xs text-slate-400">Connexion Internet nécessaire. Si le navigateur bloque le démarrage, un bouton « Activer le son de la radio » apparaîtra sur la TV. La radio se reconnecte après une interruption.</p>
  </section>;
}
