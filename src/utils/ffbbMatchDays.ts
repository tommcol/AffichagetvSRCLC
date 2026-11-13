import { clubCalendarDate } from './clubTime';
import { isExemptItem } from './socialCaptionGenerator';

/** Only automatic polling is restricted; manual refresh is always available. */
export function isClubMatchDay(matches: any[], now = new Date()): boolean {
  const day = clubCalendarDate(now);
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  return matches.some(m => m && m.date === date && !isExemptItem(m) && m.status !== 'cancelled' && m.status !== 'postponed');
}
