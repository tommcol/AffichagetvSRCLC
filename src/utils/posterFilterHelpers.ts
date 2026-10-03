export type PosterFilterType = 'all' | 'home' | 'away' | 'exempt';

export const getAvailablePosterFilter = (
  currentFilter: PosterFilterType,
  counts: { home: number; away: number; exempt: number }
): PosterFilterType => {
  if (currentFilter === 'home' && counts.home === 0) return 'all';
  if (currentFilter === 'away' && counts.away === 0) return 'all';
  if (currentFilter === 'exempt' && counts.exempt === 0) return 'all';
  return currentFilter;
};
