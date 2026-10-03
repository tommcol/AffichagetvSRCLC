export type PosterContentCollection = 'matches' | 'results' | 'notification';

export const getPosterContentItems = <T>(
  contentType: PosterContentCollection,
  matches: T[],
  results: T[]
): T[] => {
  return contentType === 'results' ? results : matches;
};
