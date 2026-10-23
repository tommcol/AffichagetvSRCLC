import React from 'react';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { TVSlideRenderer } from '../src/components/slides/TVSlideRenderer';
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
