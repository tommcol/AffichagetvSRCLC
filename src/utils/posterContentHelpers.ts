import type { PosterContentType } from './posterTypes';

export type PosterContentCollection = PosterContentType;

export const getPosterContentItems = <T>(
  contentType: PosterContentType,
  matches: T[],
  results: T[]
): T[] => {
  return contentType === 'results' ? results : matches;
};
