import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { TVSlideRenderer } from '../src/components/slides/TVSlideRenderer';
import { MatchesSlide } from '../src/components/slides/MatchesSlide';
const settings: any = { name: 'Club Démo', shortName: 'DÉMO', primaryColor: '#c8102e', matchesFilterStart: '2026-11-06', matchesFilterEnd: '2026-11-08', resultsFilterStart: '2026-11-13', resultsFilterEnd: '2026-11-15' };
const record = (id: string, date: string, name: string): any => ({ id, category: 'Seniors F1', date, time: '20:00', isHomeMatch: true, teamHome: 'Club Démo', teamAway: name, selectedForWeekend: true, result: 'win', homeScore: 72, awayScore: 60 });
const first = record('first', '2026-11-06', 'ADVERSAIRE PREMIERE PERIODE');
const second = record('second', '2026-11-14', 'ADVERSAIRE DEUXIEME PERIODE');
for (const type of ['matches', 'results']) {
 const html = renderToStaticMarkup(React.createElement(TVSlideRenderer, { slide: { id: type, type: 'category', categoryId: type, durationSeconds: 6 } as any,
 clubSettings: settings, matches: [first, second], results: [first, second], sponsors: [], logos: [], photos: [], birthdays: [], events: [] }));
 assert.ok(html.includes(type === 'matches' ? 'PREMIERE PERIODE' : 'DEUXIEME PERIODE'));
 assert.ok(!html.includes(type === 'matches' ? 'DEUXIEME PERIODE' : 'PREMIERE PERIODE'));
}
console.log('TV server-rendered HTML: no cross-week match/result leakage');

for (const type of ['matches', 'results']) {
 for (const filterScope of ['home', 'away']) {
  const date = type === 'matches' ? first.date : second.date;
  const bye = { ...record('bye', date, 'Exempt'), category: 'EQUIPE_EXEMPTEE_UNIQUE', isHomeMatch: filterScope === 'home', teamHome: filterScope === 'home' ? 'Club Démo' : 'Exempt', teamAway: filterScope === 'home' ? 'Exempt' : 'Club Démo' };
  const html = renderToStaticMarkup(React.createElement(TVSlideRenderer, { slide: { id: type, type: 'category', categoryId: type, durationSeconds: 6, filterScope } as any,
   clubSettings: settings, matches: [first, bye], results: [second, bye], sponsors: [], logos: [], photos: [], birthdays: [], events: [] }));
  assert.ok(!html.includes('EQUIPE_EXEMPTEE_UNIQUE'), `${type}/${filterScope} ne contient pas les exemptions`);
 }
}
console.log('TV renderer: exemptions absent from home and away matches/results');

// The two-column layout also renders directly in previews and in the All scope.
const homeBye = { ...first, id: 'home-bye', category: 'EXEMPTION_DOM_UNIQUE', teamAway: 'Exempt' };
const awayBye = { ...first, id: 'away-bye', category: 'EXEMPTION_EXT_UNIQUE', isHomeMatch: false, teamHome: 'Exempt' };
for (const paginated of [false, true]) {
 const html = renderToStaticMarkup(React.createElement(MatchesSlide, {
  matches: [first, homeBye, awayBye], clubSettings: settings, onDownloadVisual: () => {},
  theme: { visualStyle: 'cards' } as any,
  ...(paginated ? { customHomeMatches: [first, homeBye], customAwayMatches: [awayBye] } : {}),
 }));
 assert.ok(html.includes('PREMIERE PERIODE'), 'la vraie rencontre reste visible');
 assert.ok(!html.includes('EXEMPTION_DOM_UNIQUE'), 'aucun exempt dans la colonne domicile');
 assert.ok(!html.includes('EXEMPTION_EXT_UNIQUE'), 'aucun exempt dans la colonne extérieur');
}
