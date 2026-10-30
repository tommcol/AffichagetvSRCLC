import { fixtureFfbbFetch } from './fixtures/ffbbFixtureFetch';
import { runScheduledFfbbSync } from '../worker/ffbb';
import assert from 'node:assert/strict';
import { prepareClubSportsSync, sportsReplacementBackup } from '../src/utils/ffbbClubScope';
import { mergeMatchItems } from '../src/utils/ffbbMergeUtils';
import { createFfbbDataSource } from '../src/utils/ffbbMobileApi';
import { commitSharedAppData } from '../worker/appDataCoordinator';
import { FFBBService } from '../src/services/ffbbService';

const settings: any = { codeFFBB: 'EX001', name: 'CLUB A', shortName: 'A', ffbbDataClubId: '1',
  logoUrl: '/personal-logo', customTeamNames: { 'U18 M1': 'Mon équipe' }, ignoredTeamCategories: ['U18 M1'] };
const own: any = { id: 'ffbb-101', ffbbMatchNumber: 'FFBB-101', category: 'U18 M1', date: '2026-11-01', selectedForWeekend: false };
const foreign: any = { ...own, id: 'ffbb-102', ffbbMatchNumber: 'FFBB-102', category: 'CLUB ETRANGER' };
const manual: any = { ...own, id: 'manual-1', ffbbMatchNumber: undefined, isManualMatch: true };
const excel: any = { ...own, id: 'excel-1', ffbbMatchNumber: undefined, calendarSource: 'excel' };
const seed = { version: 5, clubSettings: settings, matches: [own, foreign, manual, excel], results: [foreign],
  ffbbTeams: [{ id: 'old-team' }], photos: [{ id: 'photo' }], sponsors: [{ id: 'sponsor' }], birthdays: [{ id: 'birthday' }] };
const unchanged = JSON.stringify(seed);
const same = prepareClubSportsSync(settings, seed.matches, seed.results, {
  organismeId: '1', foreignMatchIds: ['102'], verifiedMatchIds: ['101'],
}, '1'); // Code and numeric ID alias are the same club.
assert.equal(same.changedClub, false);
assert.deepEqual(same.matches.map(m => m.id), ['ffbb-101', 'manual-1', 'excel-1']);
assert.equal(same.results.length, 0);
assert.equal(same.matches[0].ffbbClubId, '1');
assert.equal(same.matches[0].selectedForWeekend, false);
assert.deepEqual(same.settings.customTeamNames, settings.customTeamNames);
assert.deepEqual(same.settings.ignoredTeamCategories, settings.ignoredTeamCategories);
assert.equal(JSON.stringify(seed), unchanged, 'Planning and failure must not mutate saved data');

const next = prepareClubSportsSync(settings, seed.matches, seed.results, { organismeId: '2', clubName: 'CLUB B' }, 'EX002');
assert.equal(next.changedClub, true);
assert.deepEqual(next.matches, []);
assert.deepEqual(next.results, []);
assert.equal(next.settings.name, 'CLUB B');
assert.equal(next.settings.codeFFBB, 'EX002');
assert.equal(next.settings.ffbbDataClubId, '2');
assert.deepEqual(next.settings.customTeamNames, {});
assert.deepEqual(next.settings.ignoredTeamCategories, []);
assert.equal(next.settings.logoUrl, '/personal-logo');
assert.throws(() => prepareClubSportsSync(settings, seed.matches, seed.results, {}), /absent/);
assert.throws(() => prepareClubSportsSync(settings, seed.matches, seed.results, { organismeId: '2', degraded: true }, 'EX002'), /annulé/);
const legacy: any = { ...own, category: 'CLUB A - 1', rawFfbbCategory: 'CLUB A - 1' };
const repaired = mergeMatchItems([legacy], [{ ...own, ffbbClubId: '1' }]);
assert.equal(repaired[0].category, 'U18 M1');
assert.equal(repaired[0].rawFfbbCategory, 'U18 M1');
const personal = mergeMatchItems([{ ...own, category: 'Nos grands', rawFfbbCategory: 'U18 M1' }], [{ ...own, ffbbClubId: '1' }]);
assert.equal(personal[0].category, 'Nos grands');
const alreadyScoped = { ...own, ffbbClubId: '1', category: 'CLUB EXEMPLE - 2',
  ourClubName: 'CLUB EXEMPLE', rawFfbbCategory: 'U18 M1' };
assert.equal(mergeMatchItems([alreadyScoped], [{ ...own, ffbbClubId: '1' }])[0].category, 'U18 M1');
assert.equal(mergeMatchItems([alreadyScoped], [{ ...own, ffbbClubId: '1' }],
  { 'U18 M1': 'Mon nom volontaire' })[0].category, 'Mon nom volontaire');

const mock: typeof fetch = async input => {
  const u = new URL(String(input));
  if (u.pathname.endsWith('/configuration')) return Response.json({ data: { key_dh: 'fixture-token' } });
  assert.equal(u.searchParams.get('filter[id][_in]'), '101,102,103,104,105,106,107,108');
  return Response.json({ data: [
    { id: '101', idOrganismeEquipe1: '1', idOrganismeEquipe2: '8' },
    { id: '102', idOrganismeEquipe1: '7', idOrganismeEquipe2: '8' },
    { id: '104', idOrganismeEquipe1: '7', idOrganismeEquipe2: null },
    { id: '105', idOrganismeEquipe1: '7' }, // Absent field: unknown, don't delete.
    { id: '106', idOrganismeEquipe1: '1', idOrganismeEquipe2: null }, // Our own exempt match.
    { id: '107', idOrganismeEquipe1: null, idOrganismeEquipe2: null },
    { id: '108', idOrganismeEquipe1: null, idOrganismeEquipe2: '8' },
  ] }); // 103 absent: not evidence of foreign ownership.
};
const proof = await createFfbbDataSource(mock).inspectMembership('1', ['101', '102', '103', '104', '105', '106', '107', '108']);
assert.deepEqual(proof.foreignMatchIds, ['102', '104', '108']);
assert.deepEqual([...proof.owned.keys()], ['101', '106']);

const nextData = { ...seed, clubSettings: next.settings, matches: next.matches, results: next.results, ffbbTeams: [] };
const backup = sportsReplacementBackup(seed, nextData)!;
assert.equal(backup.matches.length, 4);
assert.equal(backup.results.length, 1);
assert.equal('photos' in backup, false);
const store = new Map([['app-data', JSON.stringify(seed)]]);
const env: any = { AFFICHAGE_KV: { get: async (k: string) => store.get(k) || null, put: async (k: string, v: string) => { store.set(k, v); } } };
assert.equal(await commitSharedAppData(env, nextData, 5), true);
assert.deepEqual(JSON.parse(store.get('sports-backup-v5')!).matches, JSON.parse(JSON.stringify(seed.matches)));
const saved = JSON.parse(store.get('app-data')!);
for (const key of ['photos', 'sponsors', 'birthdays']) assert.deepEqual(saved[key], seed[key]);
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => Response.json({ success: false, matches: [], results: [] });
try { await assert.rejects(FFBBService.fetchClubData('EX002'), /conservés/); }
finally { globalThis.fetch = originalFetch; }
assert.equal(JSON.stringify(seed), unchanged);
// Full automatic sync: remove only foreign IDs, keep manual/Excel and create recovery backup.
const cronStore = new Map([['app-data', JSON.stringify(seed)]]);
const cronEnv: any = { AFFICHAGE_KV: { get: async (k: string) => cronStore.get(k) || null,
  put: async (k: string, v: string) => { cronStore.set(k, v); } } };
const mobile = fixtureFfbbFetch(() => [{ ffbbMatchId: '101', dateISO: '2026-11-01', time: '15:00',
  team: 'CLUB A - 1', opponent: 'ADVERSAIRE - 1', isHome: true }], 'Départementale masculine U18 - Division 3', '1');
globalThis.fetch = async (input, init) => {
  const u = new URL(String(input));
  if (u.searchParams.has('filter[id][_in]')) return Response.json({ data: [
    { id: '101', idOrganismeEquipe1: '1', idOrganismeEquipe2: '8' },
    { id: '102', idOrganismeEquipe1: '7', idOrganismeEquipe2: '8' },
  ] });
  return mobile(input, init);
};
try { await runScheduledFfbbSync(cronEnv); }
finally { globalThis.fetch = originalFetch; }
const afterCron = JSON.parse(cronStore.get('app-data')!);
assert.ok(!afterCron.matches.some((m: any) => m.id === 'ffbb-102'));
assert.ok(!afterCron.results.some((m: any) => m.id === 'ffbb-102'));
assert.ok(afterCron.matches.some((m: any) => m.id === 'ffbb-101'));
assert.ok(afterCron.matches.some((m: any) => m.id === 'manual-1'));
assert.ok(afterCron.matches.some((m: any) => m.id === 'excel-1'));
assert.equal(afterCron.matches.find((m: any) => m.id === 'ffbb-101').selectedForWeekend, false);
assert.ok(cronStore.has('sports-backup-v5'));
for (const key of ['photos', 'sponsors', 'birthdays']) assert.deepEqual(afterCron[key], seed[key]);
console.log('Club scope: same club history, canonical aliases, club replacement, empty calendars, failure safety, proven foreign removal, legacy repair and private backup OK');
