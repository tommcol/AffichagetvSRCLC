import type { ClubSettings } from '../types';

export const RADIO_STATIONS = [
  { id: 'radio-paradise', name: 'Radio Paradise — Mix principal', url: 'https://stream.radioparadise.com/mp3-192' },
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
