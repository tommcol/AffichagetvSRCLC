import { fixtureFfbbFetch } from './fixtures/ffbbFixtureFetch';
import assert from 'node:assert/strict';
import { runScheduledFfbbSync } from '../worker/ffbb';
const RealDate = Date;
class TestDate extends RealDate {
  constructor(...args: any[]) { super(...(args.length ? args : ['2026-11-06T23:30:00+01:00']) as [any]); }
  static now() { return new RealDate('2026-11-06T23:30:00+01:00').getTime(); }
}
const originalFetch = globalThis.fetch;
(globalThis as any).Date = TestDate;
const base: any = { id: 'ffbb-900001', ffbbMatchNumber: 'FFBB-900001', category: 'Nom senior personnalisé', date: '2026-11-06', time: '20:30', teamHome: 'DÉMO', teamAway: 'ADVERSAIRE FICTIF', isHomeMatch: true, selectedForWeekend: false };
const historic = { ...base, id: 'historic', ffbbMatchNumber: 'FFBB-historic', category: 'Seniors M2', date: '2026-10-10', result: 'win', homeScore: 72, awayScore: 60 };
const data = new Map<string, string>([['app-data', JSON.stringify({ version: 1, clubSettings: { codeFFBB: '999999', customTeamNames: { 'Seniors F1': 'Nom senior personnalisé' }, ignoredTeamCategories: ['Seniors M2'] }, matches: [base, historic], results: [historic] })]]);
const env: any = { AFFICHAGE_KV: { get: async (key: string) => data.get(key) || null, put: async (key: string, value: string) => { data.set(key, value); } } };
const raw: any = { ffbbMatchId: '900001', dateISO: '2026-11-06', time: '20:30', team: 'Seniors Filles 1', competition: 'Seniors Féminin', opponent: 'ADVERSAIRE FICTIF', isHome: true };
let rows = [raw];
globalThis.fetch = fixtureFfbbFetch(() => rows, 'Seniors Féminin');
try {
 await runScheduledFfbbSync(env);
 let snapshot = JSON.parse(data.get('app-data')!);
 assert.equal(snapshot.matches.find((m: any) => m.id === base.id).status, 'finished');
 assert.equal(snapshot.matches.find((m: any) => m.id === base.id).category, 'Nom senior personnalisé');
 assert.equal(snapshot.matches.find((m: any) => m.id === base.id).selectedForWeekend, false);
 assert.ok(snapshot.matches.some((m: any) => m.id === 'historic'));
 assert.ok(snapshot.results.some((m: any) => m.id === 'historic'));
 const version = snapshot.version;
 await runScheduledFfbbSync(env);
 assert.equal(JSON.parse(data.get('app-data')!).version, version, 'unchanged sync should not increment version');
 rows = [{ ...raw, scoreLocal: 65, scoreOpponent: 52 }];
 await runScheduledFfbbSync(env);
 snapshot = JSON.parse(data.get('app-data')!);
 assert.equal(snapshot.results.filter((m: any) => m.id === base.id).length, 1);
 const scoredVersion = snapshot.version;
 await runScheduledFfbbSync(env);
 const repeated = JSON.parse(data.get('app-data')!);

 assert.equal(repeated.version, scoredVersion);
 assert.equal(JSON.parse(data.get('alerts') || '[]').length, 1);
 console.log('FFBB regression: ignored history, custom name, no-score status, selection, no-op sync and single result/alert preserved');
} finally { (globalThis as any).Date = RealDate; globalThis.fetch = originalFetch; }
