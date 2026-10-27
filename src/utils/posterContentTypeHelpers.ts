import type { PosterContentType, PosterInitialContentType } from './posterTypes';

export const getInitialPosterContentType = (
  initialType: PosterInitialContentType
): PosterContentType => {
  if (initialType === 'victory' || initialType === 'defeat') {
    return 'notification';
  }

  return initialType === 'results' ? 'results' : 'matches';
};
