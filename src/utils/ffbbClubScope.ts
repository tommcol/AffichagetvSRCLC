import type { ClubSettings, MatchItem } from '../types';
import { normalizeFfbbNumber } from './ffbbMergeUtils';

export const clubCodeKey = (value?: string) => String(value || '').trim().toUpperCase();
export const officialMatchIds = (rows: MatchItem[]) => [...new Set(rows
  .filter(row => row.calendarSource !== 'excel' && !row.isManualMatch)
  .map(row => normalizeFfbbNumber(row.ffbbMatchNumber || (/^ffbb-/i.test(row.id) ? row.id : '')))
  .filter((value): value is string => !!value && /^\d+$/.test(value)))];

/** Called only after a successful response. Never infer ownership from displayed club names. */
export function prepareClubSportsSync(
  settings: ClubSettings, matches: MatchItem[], results: MatchItem[],
  payload: { organismeId?: string; officialClubCode?: string; foreignMatchIds?: string[]; verifiedMatchIds?: string[]; clubName?: string; degraded?: boolean },
  requestedCode = settings.codeFFBB,
) {
  const clubId = String(payload.organismeId || '');
  if (!clubId) throw new Error('Identifiant officiel du club absent : données conservées.');
  const activeKey = clubCodeKey(settings.codeFFBB);
  const changedClub = settings.ffbbDataClubId
    ? settings.ffbbDataClubId !== clubId
    : activeKey !== clubCodeKey(requestedCode) && activeKey !== clubId && activeKey !== clubCodeKey(payload.officialClubCode);
  if (changedClub && payload.degraded) throw new Error('Calendrier de secours incomplet : changement de club annulé, données précédentes conservées.');
  const foreign = new Set((payload.foreignMatchIds || []).map(String));
  const verified = new Set(payload.verifiedMatchIds || []);
  const stamp = (row: MatchItem) => verified.has(normalizeFfbbNumber(row.ffbbMatchNumber || row.id) || '') ? { ...row, ffbbClubId: clubId } : row;
  const keep = (row: MatchItem) => (!row.ffbbClubId || row.ffbbClubId === clubId)
    && !foreign.has(normalizeFfbbNumber(row.ffbbMatchNumber || row.id) || '');
  return {
    changedClub,
    matches: changedClub ? [] : matches.filter(keep).map(stamp),
    results: changedClub ? [] : results.filter(keep).map(stamp),
    settings: { ...settings, codeFFBB: requestedCode.trim(), ffbbDataClubId: clubId,
      ...(changedClub ? { customTeamNames: {}, ignoredTeamCategories: [],
        name: payload.clubName || settings.name, shortName: payload.clubName || settings.shortName } : {}) },
  };
}

/** A private recovery snapshot, without media, whenever sports rows are replaced. */
export function sportsReplacementBackup(current: any, next: any) {
  if (!current) return null;
  const removed = ['matches', 'results'].some(key => {
    const nextIds = new Set((next[key] || []).map((m: MatchItem) => m.id));
    return (current[key] || []).some((m: MatchItem) => !nextIds.has(m.id));
  });
  if (!removed) return null;
  return { version: current.version || 0, savedAt: new Date().toISOString(),
    clubSettings: current.clubSettings, ffbbTeams: current.ffbbTeams || [],
    matches: current.matches || [], results: current.results || [] };
}

