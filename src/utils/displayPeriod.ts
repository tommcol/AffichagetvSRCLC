import { clubCalendarDate } from './clubTime';
import { ClubSettings, MatchItem } from '../types';
import { isMatchInCurrentWeekend } from './matchDateHelper';

export function isInDisplayPeriod(item: MatchItem, settings: ClubSettings, type: 'matches' | 'results') {
  const start = type === 'matches' ? settings.matchesFilterStart : settings.resultsFilterStart;
  const end = type === 'matches' ? settings.matchesFilterEnd : settings.resultsFilterEnd;
  return start || end
    ? Boolean(item.date && (!start || item.date >= start) && (!end || item.date <= end))
    : isMatchInCurrentWeekend(item.date, clubCalendarDate());
}

export function getDisplayItems(items: MatchItem[], settings: ClubSettings, type: 'matches' | 'results') {
  return items.filter(item => item.selectedForWeekend !== false && isInDisplayPeriod(item, settings, type));
}
