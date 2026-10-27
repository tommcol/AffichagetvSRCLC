import { AppDataPayload } from '../types';

export const getPolledAppDataVersion = (
  data: AppDataPayload,
  responseVersion?: number
): number =>
  typeof data.version === 'number'
    ? data.version
    : typeof responseVersion === 'number'
      ? responseVersion
      : 0;

export const hasChangedJson = <T>(previous: T, next: T): boolean =>
  JSON.stringify(previous) !== JSON.stringify(next);

export const getPolledCollections = (data: AppDataPayload) => ({
  results: Array.isArray(data.results) ? data.results : undefined,
  matches: Array.isArray(data.matches) ? data.matches : undefined,
  sponsors: Array.isArray(data.sponsors) ? data.sponsors : undefined,
  photos: Array.isArray(data.photos) ? data.photos : undefined,
  events: Array.isArray(data.events) ? data.events : undefined,
  categories: Array.isArray(data.categories) ? data.categories : undefined,
});
