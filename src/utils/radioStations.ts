import type { ClubSettings } from '../types';

export const RADIO_STATIONS = [
  { id: 'radio-paradise', name: 'Radio Paradise — Mix principal', url: 'https://stream.radioparadise.com/mp3-192' },
  { id: 'frequence3', name: 'Fréquence 3 — Tubes actuels et classiques', url: 'https://frequence3.net-radio.fr/frequence3-128.mp3' },
  { id: 'frequence3-gold', name: 'Fréquence 3 Gold — Années 80 et 90', url: 'https://frequence3.net-radio.fr/frequence3gold.mp3' },
  { id: 'frequence3-dance', name: 'Fréquence 3 Dance — Dance et électro', url: 'https://frequence3.net-radio.fr/frequence3dance.mp3' },
  { id: 'radio-swiss-pop', name: 'Radio Swiss Pop — Pop et tubes variés', url: 'https://stream.srg-ssr.ch/srgssr/rsp/mp3/128' },
  { id: 'radio-odyssey', name: 'Radio Odyssey — Tubes des années 80 à aujourd’hui', url: 'https://listen.radioking.com/radio/706859/stream/772319' },
] as const;

export function getRadioStreamUrl(settings: Pick<ClubSettings, 'radioStationId' | 'radioCustomUrl'>): string | undefined {
  if (settings.radioStationId === 'custom') {
    try {
      const url = new URL(settings.radioCustomUrl?.trim() || '');
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
    } catch { return undefined; }
  }
  return RADIO_STATIONS.find(station => station.id === settings.radioStationId)?.url;
}
