import type { FFBBTeamItem, MatchItem } from '../types';
import { calendarClub, calendarText, cleanCalendarTeam, calendarSeason, findCalendarCounterpart } from './calendarImportIdentity';
import { normalizeCategoryKey } from '../services/ffbbService';
export interface CalendarRow {
    line: number;
    division: string;
    number: string;
    home: string;
    away: string;
    date: string;
    time: string;
    gym: string;
    homeScore?: number;
    awayScore?: number;
    error?: string;
}
export interface CalendarPreview {
    rows: CalendarRow[];
    clubs: string[];
}
const requiredHeaders = ['Division', 'N° de match', 'Equipe 1', 'Equipe 2', 'Date de rencontre', 'Heure', 'Salle'];
const header = (v: unknown) => calendarText(v).replace(/^N (?:DE )?MATCH$/, 'NUM MATCH');
function dateValue(value: unknown): string {
    if (typeof value === 'number') {
        const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
        return d.toISOString().slice(0, 10);
    }
    const s = String(value ?? '').trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const iso = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : s;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(Date.parse(iso)) || new Date(iso + 'T12:00:00Z').toISOString().slice(0, 10) !== iso)
        return '';
    return iso;
}
function timeValue(value: unknown): string | null {
    if (value === '' || value == null)
        return '';
    if (typeof value === 'number') {
        const n = Math.round(value * 1440) % 1440;
        if (value < 0 || value >= 1)
            return null;
        return n ? `${Math.floor(n / 60)}`.padStart(2, '0') + ':' + `${n % 60}`.padStart(2, '0') : '';
    }
    const m = String(value).trim().match(/^(\d{1,2})[:hH](\d{2})(?::\d{2})?$/);
    if (!m || +m[1] > 23 || +m[2] > 59)
        return null;
    return +m[1] === 0 && +m[2] === 0 ? '' : m[1].padStart(2, '0') + ':' + m[2];
}
export function parseCalendarRows(table: unknown[][]): CalendarPreview {
    const first = table.findIndex(row => requiredHeaders.every(h => row.some(c => header(c) === header(h))));
    if (first < 0)
        throw new Error('Colonnes du calendrier FFBB introuvables : Division, N° de match, Equipe 1, Equipe 2, Date de rencontre, Heure et Salle.');
    const columns = table[first].map(header);
    const get = (r: unknown[], name: string) => r[columns.indexOf(header(name))] ?? '';
    const rows = table.slice(first + 1).flatMap((r, i): CalendarRow[] => {
        if (!r.some(v => String(v ?? '').trim()))
            return [];
        const date = dateValue(get(r, 'Date de rencontre')), time = timeValue(get(r, 'Heure'));
        const home = cleanCalendarTeam(get(r, 'Equipe 1')), away = cleanCalendarTeam(get(r, 'Equipe 2'));
        const hs = get(r, 'Score 1'), as = get(r, 'Score 2');
        const score = (v: unknown) => v === '' ? undefined : Number(v);
        const homeScore = score(hs), awayScore = score(as);
        const invalidScore = (hs !== '' || as !== '') && (![homeScore, awayScore].every(n => n !== undefined && Number.isInteger(n) && n >= 0));
        const forfeited = [get(r, 'Forfait 1'), get(r, 'Forfait 2')].some(v => calendarText(v) === 'OUI');
        return [{ line: first + i + 2, division: String(get(r, 'Division')).trim(), number: String(get(r, 'N° de match')).trim(), home, away, date, time: time || '', gym: String(get(r, 'Salle')).trim(), homeScore, awayScore,
                error: !date ? 'Date invalide' : time === null ? 'Horaire invalide' : !home || !away ? 'Équipe manquante' : invalidScore ? 'Scores incomplets ou invalides' : forfeited ? 'Forfait : vérifier cette rencontre manuellement' : undefined }];
    });
    if (!rows.length)
        throw new Error('Le fichier ne contient aucune rencontre.');
    const counts = new Map<string, number>();
    for (const row of rows)
        for (const t of [row.home, row.away]) {
            const c = calendarClub(t);
            counts.set(c, (counts.get(c) || 0) + 1);
        }
    return { rows, clubs: [...counts].sort((a, b) => b[1] - a[1]).map(([c]) => c) };
}
export function rowSquadKey(row: CalendarRow, club: string): string { const own = calendarText(calendarClub(row.home)) === calendarText(club) ? row.home : row.away; return `${row.division}|${own.match(/-\s*(\d+)\s*$/)?.[1] || '1'}`; }
export function guessCalendarCategory(row: CalendarRow, club: string, teams: FFBBTeamItem[]): string {
    const code = row.division.toUpperCase();
    const m = code.match(/^D([MF])(?:U(\d+))?(?:\d|\-)/);
    if (!m)
        return '';
    const number = rowSquadKey(row, club).split('|').pop();
    const category = `${m[2] ? 'U' + m[2] : 'Seniors'} ${m[1]}${number}`;
    const found = teams.filter(t => normalizeCategoryKey(t.category) === normalizeCategoryKey(category));
    return found.length === 1 ? found[0].category : category;
}
export function calendarRowToMatch(row: CalendarRow, club: string, category: string, teams: FFBBTeamItem[], names: Record<string, string> = {}): MatchItem {
    const isHome = calendarText(calendarClub(row.home)) === calendarText(club);
    const t = teams.find(t => normalizeCategoryKey(t.category) === normalizeCategoryKey(category));
    const key = [calendarSeason(row.date), row.division, row.number || row.date, calendarText(row.home), calendarText(row.away)].join('|');
    const finished = row.homeScore !== undefined && row.awayScore !== undefined;
    const ours = isHome ? row.homeScore : row.awayScore, opponent = isHome ? row.awayScore : row.homeScore;
    return { id: 'excel-' + encodeURIComponent(key), calendarSource: 'excel', calendarImport: { key }, date: row.date, time: row.time, category: (t && names[t.id]) || names[category] || t?.customName || category, rawFfbbCategory: category, ffbbTeamId: t?.id,
        competition: row.division, teamHome: row.home, teamAway: row.away, isHomeMatch: isHome, ourClubName: club, gymnasium: row.gym, city: '', status: finished ? 'finished' : 'upcoming', homeScore: row.homeScore, awayScore: row.awayScore,
        result: finished ? (ours! > opponent! ? 'win' : ours! < opponent! ? 'loss' : null) : null, selectedForWeekend: false };
}
export function mergeExcelCalendar(matches: MatchItem[], results: MatchItem[], incoming: MatchItem[]) {
    let nextMatches = [...matches], nextResults = [...results];
    let added = 0, updated = 0, skipped = 0;
    for (const item of incoming) {
        const all = [...nextMatches, ...nextResults];
        const same = all.find(m => m.calendarImport?.key === item.calendarImport?.key) || findCalendarCounterpart(item, all, incoming);
        if (same && same.calendarSource !== 'excel') {
            skipped++;
            continue;
        }
        const merged = same ? { ...same, ...item, id: same.id, selectedForWeekend: same.selectedForWeekend } : item;
        if (same) {
            updated++;
            nextMatches = nextMatches.filter(m => m.id !== same.id);
            nextResults = nextResults.filter(m => m.id !== same.id);
        }
        else
            added++;
        (merged.status === 'finished' ? nextResults : nextMatches).push(merged);
    }
    return { matches: nextMatches, results: nextResults, added, updated, skipped };
}
