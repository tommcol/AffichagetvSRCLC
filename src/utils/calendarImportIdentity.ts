import type { MatchItem } from '../types';
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
export function findCalendarCounterpart(item: MatchItem, candidates: MatchItem[], peers: MatchItem[]): MatchItem | undefined {
    const matches = candidates.filter(m => calendarIdentity(m) === calendarIdentity(item));
    const exact = matches.filter(m => m.date === item.date);
    if (exact.length === 1 && peers.filter(m => calendarIdentity(m) === calendarIdentity(item) && m.date === item.date).length === 1)
        return exact[0];
    if (matches.length === 1 && peers.filter(m => calendarIdentity(m) === calendarIdentity(item)).length === 1)
        return matches[0];
    return undefined;
}
export function prepareExcelApiHandoff(existingMatches: MatchItem[], existingResults: MatchItem[], incomingMatches: MatchItem[], incomingResults: MatchItem[]) {
    const official = [...new Map([...incomingMatches, ...incomingResults].map(m => [m.ffbbMatchNumber || m.id, m])).values()];
    const imported = [...existingMatches, ...existingResults].filter(m => m.calendarSource === 'excel');
    const resultIds = new Set(incomingResults.map(m => m.id));
    const matches: MatchItem[] = [], results: MatchItem[] = [];
    const visit = (item: MatchItem, wasResult: boolean) => {
        const fresh = item.calendarSource === 'excel' ? findCalendarCounterpart(item, official, imported) : undefined;
        if (!fresh) {
            (wasResult ? results : matches).push(item);
            return;
        }
        const adopted: MatchItem = {
            ...item, ...fresh, id: item.id, calendarImport: item.calendarImport, calendarSource: 'ffbb',
            category: item.category, rawFfbbCategory: fresh.rawFfbbCategory || fresh.category,
            selectedForWeekend: item.selectedForWeekend,
            isManualMatch: false, isDateManual: false, isTimeManual: false, isGymnasiumManual: false, isScoreManual: false,
        };
        (resultIds.has(fresh.id) ? results : matches).push(adopted);
    };
    existingMatches.forEach(m => visit(m, false));
    existingResults.forEach(m => visit(m, true));
    return { matches, results };
}
