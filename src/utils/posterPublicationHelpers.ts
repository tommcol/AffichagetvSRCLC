import type { MatchItem } from '../types';
import type { PosterContentType } from './posterTypes';

export const getPosterPublicationItems = (
  contentType: PosterContentType,
  matches: MatchItem[],
  results: MatchItem[]
): { matches: MatchItem[]; results: MatchItem[] } => ({
  matches: contentType === 'matches' ? matches : [],
  results: contentType === 'results' ? results : [],
});
