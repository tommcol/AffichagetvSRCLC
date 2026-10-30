import type { MatchItem } from '../types';
import { getClubFirstMatchPresentation } from './clubFirstMatchPresentation';
import { getFfbbKey } from './ffbbMergeUtils';
import { sortMatchesChronologically } from './matchDateHelper';
import { isExemptItem } from './socialCaptionGenerator';

export interface TeamCalendarRow {
  id: string;
  opponent: string;
  first?: MatchItem;
  second?: MatchItem;
}

const key = (value?: string) => String(value || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
const identity = (match: MatchItem) => getFfbbKey(match) || match.id;

/** Pair before applying the visible period, so a return stays in the right column.
 * Never combine different opponent squads, competitions, poules or seasons.
 * Repeated home games remain separate rather than inventing an away return.
 */
export function buildTeamCalendarRows(
  matches: MatchItem[], visibleMatches = matches, clubName?: string, shortName?: string,
): TeamCalendarRow[] {
  const visible = new Set(visibleMatches.map(identity));
  const groups = new Map<string, { opponent: string; matches: MatchItem[] }>();
  const unique = [...new Map(matches.map(match => [identity(match), match])).values()]
    .sort(sortMatchesChronologically);
  for (const match of unique) {
    const exempt = isExemptItem(match);
    const presentation = getClubFirstMatchPresentation(match, clubName, shortName, exempt);
    const ymd = match.date?.match(/^(\d{4})-(\d{2})-\d{2}$/);
    const season = ymd ? String(Number(ymd[1]) - (Number(ymd[2]) < 7 ? 1 : 0)) : `unknown:${identity(match)}`;
    const unknownCompetition = !match.pouleId && !match.poule
      && (!match.competition || key(match.competition) === 'CHAMPIONNAT FFBB');
    const unknownOpponent = /^(ADVERSAIRE(?: INCONNU)?|INCONNU|\?)$/.test(key(presentation.teamRight));
    const groupKey = JSON.stringify([key(match.category), season, key(match.competition),
      match.pouleId || key(match.poule), key(presentation.teamRight), exempt ? identity(match) : '']);
    const safeGroupKey = unknownCompetition || unknownOpponent ? `${groupKey}:${identity(match)}` : groupKey;
    if (!groups.has(safeGroupKey)) groups.set(safeGroupKey, { opponent: presentation.teamRight, matches: [] });
    groups.get(safeGroupKey)!.matches.push(match);
  }
  const rows: TeamCalendarRow[] = [];
  for (const [groupKey, group] of groups) {
    const remaining = [...group.matches];
    while (remaining.length) {
      const first = remaining.shift()!;
      const home = getClubFirstMatchPresentation(first, clubName, shortName).isHome;
      const returnIndex = remaining.findIndex(match =>
        getClubFirstMatchPresentation(match, clubName, shortName).isHome !== home);
      const second = returnIndex < 0 ? undefined : remaining.splice(returnIndex, 1)[0];
      const shownFirst = visible.has(identity(first)) ? first : undefined;
      const shownSecond = second && visible.has(identity(second)) ? second : undefined;
      if (shownFirst || shownSecond) rows.push({ id: `${groupKey}:${identity(first)}`, opponent: group.opponent,
        first: shownFirst, second: shownSecond });
    }
  }
  return rows.sort((a, b) => sortMatchesChronologically(a.first || a.second!, b.first || b.second!));
}

export function formatTeamCalendarDate(date?: string): string {
  const parts = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return 'Date à confirmer';
  const [y, m, d] = parts.slice(1).map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (parsed.getUTCFullYear() !== y || parsed.getUTCMonth() !== m - 1 || parsed.getUTCDate() !== d) return 'Date à confirmer';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(parsed);
}
