import type { MatchItem } from '../types';

export const getPosterPublicationItems = (
  contentType: 'matches' | 'results' | 'notification',
  matches: MatchItem[],
  results: MatchItem[]
): { matches: MatchItem[]; results: MatchItem[] } => ({
  matches: contentType === 'matches' ? matches : [],
  results: contentType === 'results' ? results : [],
});
