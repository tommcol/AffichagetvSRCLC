import { MatchItem } from '../types';
import { sortMatchesChronologically } from './matchDateHelper';

export function getWeekendMatches(matches: MatchItem[]): MatchItem[] {
  const selected = matches.filter((m) => m.selectedForWeekend !== false);
  return selected.length > 0 ? selected : matches;
}

export function getWeekendResults(results: MatchItem[]): MatchItem[] {
  const selected = results.filter((r) => r.selectedForWeekend !== false);
  return selected.length > 0 ? selected : results;
}

export interface PosterItemCounts {
  home: number;
  away: number;
  exempt: number;
}

export function getPosterItemCounts(
  items: MatchItem[],
  isExemptItem: (item: MatchItem) => boolean
): PosterItemCounts {
  return {
    home: items.filter((item) => item.isHomeMatch).length,
    away: items.filter((item) => !item.isHomeMatch).length,
    exempt: items.filter(isExemptItem).length,
  };
}

export function filterPosterItems(
  items: MatchItem[],
  posterFilter: 'home' | 'away' | 'exempt' | 'all',
  isExemptItem: (item: MatchItem) => boolean
): MatchItem[] {
  let list: MatchItem[] = [];

  if (posterFilter === 'home') {
    list = items.filter((item) => item.isHomeMatch);
  } else if (posterFilter === 'away') {
    list = items.filter((item) => !item.isHomeMatch);
  } else if (posterFilter === 'exempt') {
    list = items.filter(isExemptItem);
  } else {
    list = items;
  }

  return [...list].sort(sortMatchesChronologically);
}

export function getMaxDisplayMatches(
  aspectRatio: '4:5' | '9:16' | '1:1' | '16:9',
  matchesLimit: number | 'auto'
): number {
  if (matchesLimit !== 'auto') {
    return matchesLimit;
  }

  if (aspectRatio === '9:16') return 6;
  if (aspectRatio === '4:5') return 6;
  if (aspectRatio === '1:1') return 4;

  return 6;
}

export function getTotalPages(
  itemsLength: number,
  maxDisplayMatches: number
): number {
  return Math.max(1, Math.ceil(itemsLength / maxDisplayMatches));
}

export function paginatePosterItems(
  items: MatchItem[],
  currentPage: number,
  maxDisplayMatches: number
): MatchItem[] {
  const start = (currentPage - 1) * maxDisplayMatches;
  return items.slice(start, start + maxDisplayMatches);
}
