import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTeamCalendarRows, formatTeamCalendarDate } from '../src/utils/teamCalendarHelpers';
import { getTotalPages, getMaxDisplayMatches } from '../src/utils/posterDataHelpers';
import { VisualThemePosterRedSection } from '../src/components/posterSections/VisualThemePosterRedSection';
import type { MatchItem } from '../src/types';
(globalThis as any).React = React;
const match = (id: string, date: string, home: boolean, opponent = 'ADVERSAIRE - 1', overrides = {}): MatchItem => ({
  id, date, time: '18:30', category: 'U18 M1', competition: 'Championnat Phase 2', pouleId: 'p2',
  teamHome: home ? 'CLUB EXEMPLE' : opponent, teamAway: home ? opponent : 'CLUB EXEMPLE',
  isHomeMatch: home, ourClubName: 'CLUB EXEMPLE', gymnasium: '', city: '', status: 'upcoming', ...overrides,
});
const a = match('a', '2030-01-10', false), b = match('b', '2030-03-07', true);
const original = JSON.stringify([b,a]);
const rows = buildTeamCalendarRows([b,a]);
assert.equal(rows.length, 1);
assert.equal(rows[0].first?.id, 'a');
assert.equal(rows[0].second?.id, 'b');
assert.equal(rows[0].opponent, 'ADVERSAIRE - 1');
assert.equal(JSON.stringify([b,a]), original);
const period = buildTeamCalendarRows([a,b], [b]);
assert.equal(period[0].first, undefined, 'A return-only period does not move the return into the first column');
assert.equal(period[0].second?.id, 'b');
assert.equal(buildTeamCalendarRows([a,b], []).length, 0);
assert.equal(buildTeamCalendarRows([a]).length, 1);
assert.equal(buildTeamCalendarRows([a])[0].second, undefined);
assert.equal(buildTeamCalendarRows([a, match('c','2030-02-10',false)]).length, 2, 'Two away matches are not an invented home/away pair');
assert.equal(buildTeamCalendarRows([a, { ...b, competition: 'Championnat Phase 3' }]).length, 2);
assert.equal(buildTeamCalendarRows([a, { ...b, pouleId: 'another-poule' }]).length, 2);
assert.equal(buildTeamCalendarRows([a, { ...b, date: '2031-03-07' }]).length, 2);
assert.equal(buildTeamCalendarRows([a, match('c','2030-03-07',true,'ADVERSAIRE - 2')]).length, 2, 'Opponent squads remain distinct');
assert.equal(buildTeamCalendarRows([a, { ...a, id: 'ffbb-123', ffbbMatchNumber: 'FFBB-123' },
  { ...a, id: 'other-alias', ffbbMatchNumber: 'FFBB-123' }]).length, 2, 'Official duplicate aliases count once');
const unknown = [a,b].map(m => ({ ...m, pouleId: undefined, competition: 'Championnat FFBB' }));
assert.equal(buildTeamCalendarRows(unknown).length, 2, 'Missing competition context is not a pairing proof');
assert.equal(buildTeamCalendarRows([match('x','2030-01-10',true,'Adversaire Inconnu'), match('y','2030-03-07',false,'Adversaire Inconnu')]).length, 2);
assert.equal(formatTeamCalendarDate('2030-01-10'), '10 janvier');
assert.equal(formatTeamCalendarDate('2030-02-30'), 'Date à confirmer');
assert.equal(formatTeamCalendarDate(), 'Date à confirmer');

const games = Array.from({length:7},(_,i)=>[
  match(`h${i}`, `2030-01-${String(10+i).padStart(2,'0')}`, true, `ADVERSAIRE ${i}`),
  match(`a${i}`, `2030-03-${String(10+i).padStart(2,'0')}`, false, `ADVERSAIRE ${i}`),
]).flat();
const seven = buildTeamCalendarRows(games);
assert.equal(seven.length, 7);
assert.equal(getTotalPages(seven.length, getMaxDisplayMatches('4:5','auto')), 2);
const page1 = seven.slice(0,6), page2 = seven.slice(6);
assert.equal(page1.length, 6); assert.equal(page2.length, 1);
assert.equal(page1.flatMap(r=>[r.first,r.second]).filter(Boolean).length, 12, 'A pair cannot split between pages');

const settings = {effectiveCategoryConfig:{},effectiveBgUrl:'/icon.svg',layer1Brightness:1,layer1Blur:0,layer1Scale:1,
  layer2PrimaryColor:'#ff0000',layer2BadgeBgColor:'#ff0000',layer2BadgeTextColor:'#ffffff',layer2TextColor:'#ffffff',
  layer2FontHeader:'bebas',layer2FontBody:'montserrat',badgeTitle:'MATCHS — U18 M1',safeClubName:'CLUB EXEMPLE',safeShortName:'EXEMPLE',
  contentType:'matches', displayedResults:[], displayedMatches:[a,b],matches:[a,b],posterFilter:'all',
  teamCalendarRows:rows,teamCalendarTitle:'MATCHS PHASE 2',teamCalendarTeam:'U18 M1'};
for (const aspectRatio of ['4:5','9:16','1:1','16:9']) {
  const html = renderToStaticMarkup(React.createElement(VisualThemePosterRedSection,{...settings,aspectRatio}));
  const text = html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  assert.equal((html.match(/data-calendar-row=/g)||[]).length, 1);
  assert.ok(html.includes('data-team-calendar="true"'));
  assert.equal((text.match(/ADVERSAIRE - 1/g)||[]).length, 1, 'Opponent appears once');
  assert.ok(text.indexOf('10 janvier') < text.indexOf('ADVERSAIRE - 1'));
  assert.ok(text.indexOf('ADVERSAIRE - 1') < text.indexOf('7 mars'));
  assert.ok(text.includes('Extérieur') && text.includes('Domicile'));
  assert.ok(text.includes('MATCHS PHASE 2'));
  assert.equal((text.match(/U18 M1/g)||[]).length, 1);
  assert.ok(!text.includes('18:30'));
  assert.ok(html.includes('/icon.svg'), 'Existing background retained');
  assert.ok(html.includes('bg-slate-900/95') && html.includes('rounded-full'), 'Existing visual style retained');
  const missing = renderToStaticMarkup(React.createElement(VisualThemePosterRedSection,{...settings,aspectRatio,teamCalendarRows:buildTeamCalendarRows([a])}));
  assert.ok(missing.includes('Retour non renseigné dans la période'));
  assert.ok(!missing.includes('7 mars'));
}
// The preview card remains the single element exported by the existing image exporter.
const source = readFileSync('src/components/VisualExporterModal.tsx','utf8');
assert.ok(source.includes('teamCalendarRows={teamCalendarMode ? displayedCalendarRows : undefined}'));
assert.ok(source.includes("teamFilterEnabled && contentType === 'matches'"));
console.log('Team calendar: pairing, phase/season/squad separation, missing return, period, pagination and rendered 4-format structure OK');
