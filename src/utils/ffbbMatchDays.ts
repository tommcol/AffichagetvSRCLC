import { clubDateTimeTimestamp, clubCalendarDate } from './clubTime';
import { isExemptItem } from './socialCaptionGenerator';

/** Only automatic polling is restricted; manual refresh is always available. */
export function isClubMatchDay(matches: any[], now = new Date()): boolean {
  const day = clubCalendarDate(now);
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  return matches.some(m => m && m.date === date && !isExemptItem(m) && m.status !== 'cancelled' && m.status !== 'postponed');
}

/** Finished without a score is still pending; errors never end polling. */
export function isAwaitingOfficialScore(match: any, now = new Date()): boolean {
  if (!match || match.isScoreManual || match.isManualMatch || isExemptItem(match)
    || ['cancelled', 'postponed'].includes(match.status)) return false;
  const key = String(match.ffbbMatchNumber || match.id || '');
  if (!/^(?:ffbb[-_])?\d+$/i.test(key)) return false;
  const score = (v: any) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
  if (score(match.homeScore) && score(match.awayScore)) return false;
  const start = clubDateTimeTimestamp(String(match.date || ''), String(match.time || ''));
  return start !== null && start <= now.getTime();
}

export function shouldPollFfbb(matches: any[], now = new Date()): boolean {
  return isClubMatchDay(matches, now) || matches.some(m => isAwaitingOfficialScore(m, now));
}
