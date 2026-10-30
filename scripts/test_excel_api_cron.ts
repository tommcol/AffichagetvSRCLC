import { fixtureFfbbFetch } from './fixtures/ffbbFixtureFetch';
import assert from 'node:assert/strict';
import { runScheduledFfbbSync } from '../worker/ffbb';
import { parseCalendarRows, calendarRowToMatch } from '../src/utils/excelMatchParser';
const headers = ['Division', 'N° de match', 'Equipe 1', 'Equipe 2', 'Date de rencontre', 'Heure', 'Salle'];
const row = parseCalendarRows([headers, ['DMU18-3-P2', '18', 'CLUB EXEMPLE - 1', 'ADVERSAIRE FICTIF - 2', '08/11/2026', '15:00', 'Salle importée']]).rows[0];
const imported = { ...calendarRowToMatch(row, 'CLUB EXEMPLE', 'U18 M1', []), selectedForWeekend: true, isTimeManual: true };
const map = new Map([['app-data', JSON.stringify({ version: 1, clubSettings: { codeFFBB: '999999' }, matches: [imported], results: [] })]]);
const env: any = { AFFICHAGE_KV: { get: async (k: string) => map.get(k) || null, put: async (k: string, v: string) => map.set(k, v) } };
let rows: any[] = [{ ffbbMatchId: '900001', dateISO: '2026-11-09', time: '17:30', team: 'CLUB EXEMPLE - 1', competition: 'Départementale masculine U18 - Division 2 - Phase 2', opponent: 'ADVERSAIRE FICTIF - 2', isHome: true, location: 'Salle officielle' }];
const original = globalThis.fetch;
globalThis.fetch = fixtureFfbbFetch(() => rows, 'Départementale masculine U18 - Division 2 - Phase 2');
try {
    await runScheduledFfbbSync(env);
    let snapshot = JSON.parse(map.get('app-data')!);
    assert.equal(snapshot.matches.length, 1);
    assert.equal(snapshot.matches[0].calendarSource, 'ffbb');
    assert.equal(snapshot.matches[0].time, '17:30');
    assert.equal(snapshot.matches[0].date, '2026-11-09');
    assert.equal(snapshot.matches[0].selectedForWeekend, true);
    assert.equal(snapshot.matches[0].calendarImport.key, imported.calendarImport.key);
    rows = [{ ...rows[0], scoreLocal: 75, scoreOpponent: 60 }];
    await runScheduledFfbbSync(env);
    snapshot = JSON.parse(map.get('app-data')!);
    assert.equal(snapshot.matches.length, 1);
    assert.equal(snapshot.results.length, 1);
    assert.equal(snapshot.results[0].homeScore, 75);
    rows = [];
    await runScheduledFfbbSync(env);
    snapshot = JSON.parse(map.get('app-data')!);
    assert.equal(snapshot.results.length, 1);
    assert.equal(snapshot.matches.length, 1);
    console.log('Worker cron: Excel to FFBB handoff, rescheduled time, official score and empty-response history retention OK');
}
finally {
    globalThis.fetch = original;
}
