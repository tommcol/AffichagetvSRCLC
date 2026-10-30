import assert from 'node:assert/strict';
import { createFfbbDataSource } from '../src/utils/ffbbMobileApi';
import { ffbbMatches } from '../worker/ffbb';
import { fetchOfficialClubData } from '../server/ffbbDataHelpers';

// Fictional fixtures only. No network, no production KV or Telegram calls.
const club = { id: '99', nom: 'CLUB EXEMPLE', code: 'EX0099', engagements: [
  { id: 'a', numeroEquipe: '1', idPoule: { id: 'p1' }, idCompetition: { nom: 'Départementale masculine U18 - Division 3' } },
  { id: 'b', numeroEquipe: '1', idPoule: { id: 'p2' }, idCompetition: { nom: 'Départementale masculine U18 - Division 3 - Phase 2' } },
] };
const row = (overrides = {}) => ({ id: 'm2', idOrganismeEquipe1: '88', idOrganismeEquipe2: '99',
  idEngagementEquipe1: 'opponent', idEngagementEquipe2: 'b', nomEquipe1: 'ADVERSAIRE - 1',
  nomEquipe2: 'CLUB EXEMPLE - 1', date_rencontre: '2026-11-15T13:30:00', horaire: '1330',
  resultatEquipe1: null, resultatEquipe2: null, joue: false, ...overrides });
let failPoule = false;
let failRest = false;
let paginated = false;
let scored = false;
let midnight = false;
let configs = 0;
const calls: string[] = [];
const mock: typeof fetch = async (input, init) => {
  const u = new URL(String(input)); calls.push(u.toString());
  if (u.hostname === 'api.ffbb.com') {
    if (u.pathname === '/items/configuration') { configs++; return Response.json({ data: { key_dh: 'fixture-token' } }); }
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer fixture-token');
    assert.match(new Headers(init?.headers).get('User-Agent') || '', /^FFBB\//);
    if (u.pathname === '/items/ffbbserver_organismes') {
      assert.equal(u.searchParams.get('filter[code][_eq]'), 'EX0099');
      return Response.json({ data: [{ id: '99' }] });
    }
    if (u.pathname.endsWith('/organismes/99') || u.pathname.endsWith('/ffbbserver_organismes/99')) return Response.json({ data: club });
    if (u.pathname.endsWith('/ffbbserver_rencontres')) {
      if (failPoule) return new Response('upstream unavailable', { status: 503 });
      const pid = u.searchParams.get('filter[idPoule][_eq]');
      const r = row(scored ? { resultatEquipe1: 0, resultatEquipe2: 72, joue: true } : midnight ? { date_rencontre: '2026-11-15T00:00:00', horaire: '0000' } : {});
      if (paginated && pid === 'p2') {
        if (u.searchParams.get('offset') === '0') return Response.json({ data: Array.from({ length: 500 }, () => r) });
        return Response.json({ data: [row({ id: 'm3', date_rencontre: '2026-12-12T16:30:00' })] });
      }
      return Response.json({ data: pid === 'p1' ? [row({ id: 'm1', idEngagementEquipe2: 'a', date_rencontre: '2026-10-24T15:00:00' })] : [r, row({ id: 'other', idOrganismeEquipe2: '77' })] });
    }
    throw new Error('Unexpected official route');
  }
  if (u.hostname === 'ffbb-api.desimone.fr') {
    if (failRest) return new Response('unavailable', { status: 503 });
    return Response.json({ matches: [], total: 0 });
  }
  throw new Error('Unexpected network call');
};

const api = createFfbbDataSource(mock);
assert.equal(await api.resolveClub('EX0099'), '99');
const [data, details, teams] = await Promise.all([api.get('/api/v1/club/99/matches'), api.get('/api/v1/club/99'), api.get('/api/v1/club/99/teams')]);
assert.equal(configs, 1);
assert.equal(data.source, 'ffbb_mobile');
assert.equal(data.matches.length, 2); // Phase 1 + phase 2, excluding the other clubs' match.
assert.equal(data.matches[1].time, '13:30');
assert.equal(data.matches[1].isHome, false);
assert.equal(details.nom, club.nom);
assert.equal(teams.teams[1].engagement_id, 'b');
assert.equal(teams.teams[1].team_number, '1');
const pouleCalls = calls.length;
await api.get('/api/v1/poule/p2');
assert.equal(calls.length, pouleCalls, 'Reuse fetched poule for the existing score mapper');
assert.ok(!JSON.stringify(data).includes('fixture-token'));

paginated = true;
const pages = await createFfbbDataSource(mock).get('/api/v1/club/99/matches');
assert.equal(pages.matches.length, 3, 'Follow pagination and deduplicate official IDs');
assert.ok(pages.matches.some((m: any) => m.ffbbMatchId === 'm3'));
paginated = false;
midnight = true;
assert.equal((await createFfbbDataSource(mock).get('/api/v1/club/99/matches')).matches[1].time, '');
midnight = false;

// Run the real Worker mapping too, but entirely against fixtures.
const original = globalThis.fetch;
globalThis.fetch = mock;
try {
  scored = true;
  const env: any = { AFFICHAGE_KV: { get: async () => null } };
  const response = await ffbbMatches(new Request('https://test.invalid/api/ffbb/matches?code=99'), env);
  const mapped: any = await response.json();
  assert.equal(mapped.success, true);
  assert.equal(mapped.source, 'ffbb_mobile');
  const m = mapped.matches.find((m: any) => m.id === 'ffbb-m2');
  assert.equal(m.category, 'U18 M1');
  assert.equal(m.homeScore, 0);
  assert.equal(m.awayScore, 72);
  assert.equal(m.result, 'win');
  assert.equal(m.isHomeMatch, false);
  assert.ok(mapped.results.some((r: any) => r.id === m.id));
  const local = await fetchOfficialClubData('99');
  const localMatch = local.matches.find((m: any) => m.id === 'ffbb-m2');
  assert.equal(local.source, 'ffbb_mobile');
  assert.equal(localMatch.homeScore, 0);
  assert.equal(localMatch.awayScore, 72);
  assert.equal(localMatch.result, 'win');
  scored = false;
  midnight = true;
  const unknown = await fetchOfficialClubData('99');
  assert.equal(unknown.matches.find((m: any) => m.id === 'ffbb-m2').time, '');
  midnight = false;
} finally { globalThis.fetch = original; }

failPoule = true;
const fallback = await createFfbbDataSource(mock).get('/api/v1/club/99/matches');
assert.equal(fallback.source, 'ffbb_api_desimone');
assert.equal(fallback.degraded, true);
failRest = true;
await assert.rejects(createFfbbDataSource(mock).get('/api/v1/club/99/matches'), /indisponible/);
console.log('FFBB mobile: phase 2, ID filtering, dates, pagination, scores, token isolation and error fallback OK');
