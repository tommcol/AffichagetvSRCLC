import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MatchesSlide } from '../src/components/slides/MatchesSlide';
import { ResultsSlide } from '../src/components/slides/ResultsSlide';
import { VisualThemePosterRedSection } from '../src/components/posterSections/VisualThemePosterRedSection';

const club: any = { name: 'Club Exemple', shortName: 'EXEMPLE', primaryColor: '#c80815' };
const theme: any = { visualStyle: 'poster-red', primaryColor: '#c80815', badgeBgColor: '#c80815', badgeTextColor: '#ffffff', textColor: '#ffffff', fontFamilyHeader: 'Bebas Neue', fontFamilyBody: 'Montserrat' };
for (const count of [1, 2, 3, 4, 6, 10]) {
  const matches: any[] = Array.from({ length: count }, (_, i) => ({ id: String(i), date: '2030-11-09', time: `${10 + i}:30`, category: `U${11 + i} F1`, isHomeMatch: i % 2 === 0, teamHome: i % 2 ? 'Association Sportive du Grand Village - 2' : club.name, teamAway: i % 2 ? club.name : 'Association Sportive du Grand Village - 2', status: 'upcoming', selectedForWeekend: true }));
  const results = matches.map(m => ({ ...m, status: 'finished', result: 'win', homeScore: m.isHomeMatch ? 104 : 98, awayScore: m.isHomeMatch ? 98 : 104 }));
  const original = JSON.stringify({ matches, results });
  for (const kind of ['matches', 'results'] as const) for (const mode of ['both', 'score', 'status']) {
    const title = 'Titre personnalisé';
    const common = { aspectRatio: '16:9', contentType: kind, displayedMatches: kind === 'matches' ? matches : [], displayedResults: kind === 'results' ? results : [], posterFilter: 'all', badgeTitle: title, layer2PrimaryColor: theme.primaryColor, layer2BadgeBgColor: theme.badgeBgColor, layer2BadgeTextColor: theme.badgeTextColor, layer2FontHeader: theme.fontFamilyHeader, layer2FontBody: theme.fontFamilyBody, layer2TextColor: theme.textColor, safeClubName: club.name, safeShortName: club.shortName, resultDisplayMode: kind === 'results' ? mode : 'both' };
    const shared = renderToStaticMarkup(React.createElement(VisualThemePosterRedSection, { ...common, contentOnly: true }));
    const social = renderToStaticMarkup(React.createElement(VisualThemePosterRedSection, common));
    const Component = kind === 'matches' ? MatchesSlide : ResultsSlide;
    const tv = renderToStaticMarkup(React.createElement(Component as any, { [kind]: kind === 'matches' ? matches : results, clubSettings: club, customHeaderTitle: title, hideShareButton: true, onDownloadVisual: () => {}, theme: { ...theme, resultDisplayMode: mode } }));
    assert.ok(social.endsWith(shared), `${kind}/${count}/${mode}: reference social composition`);
    assert.ok(tv.includes(shared), `${kind}/${count}/${mode}: TV must contain exactly the social 16:9 composition`);
    assert.ok(!shared.includes('20h30'), 'No duplicated time beside date');
    if (kind === 'results') assert.ok(!shared.includes('novembre'), 'No date reintroduced on results');
  }
  assert.equal(JSON.stringify({ matches, results }), original, 'No data changed');
}
console.log('TV/social parity: same 16:9 markup for matches/results, 1–10 fixtures, all score modes and custom title');
