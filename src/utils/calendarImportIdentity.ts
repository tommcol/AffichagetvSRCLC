import { getFfbbKey, mergeMatchItems } from './ffbbMergeUtils';
import { isExemptItem } from './socialCaptionGenerator';
import type { MatchItem, FFBBTeamItem } from '../types';
/** Keep API-adopted imports and manual fixtures; only explicit Excel ownership is removable. */
export function withoutExcelFixtures(items: MatchItem[]): MatchItem[] {
    return items.filter(item => item.calendarSource !== 'excel');
}
export const calendarText = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
export const cleanCalendarTeam = (value: unknown) => String(value ?? '').replace(/\s*\(\d+\)\s*$/, '').trim();
export const calendarClub = (value: unknown) => cleanCalendarTeam(value).replace(/\s*-\s*\d+\s*$/, '').trim();
export const calendarSeason = (date: string) => { const year = Number(date.slice(0, 4)); return `${Number(date.slice(5, 7)) >= 7 ? year : year - 1}`; };
function categoryKey(raw: string): string {
    const text = calendarText(raw);
    const age = text.match(/U\s*(\d+)/)?.[1];
    if (!age && !text.includes('SENIOR'))
        return text;
    const gender = /FILLE|FEMIN|(?:^| )F\d*(?: |$)/.test(text) ? 'F' : /GARCON|MASCUL|(?:^| )[MG]\d*(?: |$)/.test(text) ? 'M' : 'Mixte';
    const number = text.match(/(?:[MFG]\s*)?(\d+)$/)?.[1] || '1';
    return `${age ? 'U' + age : 'SENIORS'} ${gender}${number}`;
}
export function calendarIdentity(m: MatchItem): string {
    return [calendarSeason(m.date), categoryKey(m.rawFfbbCategory || m.category), m.isHomeMatch ? calendarText(calendarClub(m.teamHome)) : calendarText(cleanCalendarTeam(m.teamHome)), m.isHomeMatch ? calendarText(cleanCalendarTeam(m.teamAway)) : calendarText(calendarClub(m.teamAway)), m.isHomeMatch ? 'home' : 'away'].join('|');
}
/** Only join an Excel fixture to official data when both sides identify one match.
 * Date is preferred; a unique seasonal pairing also supports a rescheduled match.
 * Never rely on the short number from the export, which is not globally unique.
 */
function sameEngagementFixture(a: MatchItem, b: MatchItem, aliases = new Map<string, string>()): boolean {
    if (!a.ffbbTeamId || !b.ffbbTeamId || (aliases.get(a.ffbbTeamId) || a.ffbbTeamId) !== (aliases.get(b.ffbbTeamId) || b.ffbbTeamId)) return false;
    if (calendarSeason(a.date) !== calendarSeason(b.date) || a.isHomeMatch !== b.isHomeMatch) return false;
    if (a.ffbbClubId && b.ffbbClubId && a.ffbbClubId !== b.ffbbClubId) return false;
    const opponent = (m: MatchItem) => calendarText(cleanCalendarTeam(m.isHomeMatch ? m.teamAway : m.teamHome));
    const own = (m: MatchItem) => calendarText(calendarClub(m.isHomeMatch ? m.teamHome : m.teamAway));
    if (own(a) !== own(b)) return false;
    if (opponent(a) === opponent(b)) return true;
    // An explicit Excel bye can identify the one undated-opponent API fixture on that exact day.
    // Never apply this to a rescheduled date or a known different opponent.
    const unknown = (m: MatchItem) => /^(ADVERSAIRE INCONNU|INCONNU)?$/.test(opponent(m));
    return a.date === b.date && ((isExemptItem(a) && unknown(b)) || (isExemptItem(b) && unknown(a)));
}
export function findCalendarCounterpart(item: MatchItem, candidates: MatchItem[], peers: MatchItem[], aliases = new Map<string, string>()): MatchItem | undefined {
    const same = (m: MatchItem) => sameEngagementFixture(item, m, aliases) || calendarIdentity(m) === calendarIdentity(item);
    const matches = candidates.filter(same);
    const exact = matches.filter(m => m.date === item.date);
    if (exact.length === 1 && peers.filter(m => (sameEngagementFixture(item, m, aliases) || calendarIdentity(m) === calendarIdentity(item)) && m.date === item.date).length === 1)
        return exact[0];
    if (matches.length === 1 && peers.filter(m => sameEngagementFixture(item, m, aliases) || calendarIdentity(m) === calendarIdentity(item)).length === 1)
        return matches[0];
    return undefined;
}
export function prepareExcelApiHandoff(existingMatches: MatchItem[], existingResults: MatchItem[], incomingMatches: MatchItem[], incomingResults: MatchItem[], teams: FFBBTeamItem[] = []) {
    const aliases = new Map<string, string>();
    for (const team of teams) for (const id of [team.id, ...(team.engagementIds || [])]) aliases.set(id, team.id);
    const official = [...new Map([...incomingMatches, ...incomingResults].map(m => [m.ffbbMatchNumber || m.id, m])).values()];
    const imported = [...existingMatches, ...existingResults].filter(m => m.calendarSource === 'excel');
    const counterparts = new Map(imported.map(item => [item, findCalendarCounterpart(item, official, imported, aliases)]));
    const adoptedKeys = new Set([...counterparts.values()].filter(Boolean).map(m => getFfbbKey(m!)).filter(Boolean));
    const resultIds = new Set(incomingResults.map(m => m.id));
    const matches: MatchItem[] = [], results: MatchItem[] = [];
    const visit = (item: MatchItem, wasResult: boolean) => {
        const fresh = counterparts.get(item);
        if (item.calendarSource !== 'excel' && adoptedKeys.has(getFfbbKey(item))) return;
        if (!fresh) {
            (wasResult ? results : matches).push(item);
            return;
        }
        let adopted: MatchItem = {
            ...item, ...fresh, id: item.id, calendarImport: item.calendarImport, calendarSource: 'ffbb',
            category: item.category, rawFfbbCategory: fresh.rawFfbbCategory || fresh.category,
            selectedForWeekend: item.selectedForWeekend,
            isManualMatch: false, isDateManual: false, isTimeManual: false, isGymnasiumManual: false, isScoreManual: false,
        };
        if (isExemptItem(item) && !isExemptItem(fresh) && sameEngagementFixture(item, fresh, aliases)) {
            if (item.isHomeMatch) adopted.teamAway = 'Exempt'; else adopted.teamHome = 'Exempt';
        }
        const previous = [...existingMatches, ...existingResults].find(m => m.calendarSource !== 'excel' && getFfbbKey(m) && getFfbbKey(m) === getFfbbKey(fresh));
        if (previous) adopted = mergeMatchItems([previous], [adopted])[0];
        (resultIds.has(fresh.id) ? results : matches).push(adopted);
    };
    existingMatches.forEach(m => visit(m, false));
    existingResults.forEach(m => visit(m, true));
    return { matches, results };
}
