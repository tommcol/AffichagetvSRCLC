import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { generateSocialCaptions } from '../src/utils/socialCaptionGenerator';
import { BirthdaysSlide } from '../src/components/slides/BirthdaysSlide';
import { ExcelTab } from '../src/components/Admin/sections/ExcelTab';
import { MiniCalendarPicker } from '../src/components/Admin/MiniCalendarPicker';
import { getAdaptivePosterCardSizing } from '../src/utils/posterAdaptiveSizing';
import { ResultsTab } from '../src/components/Admin/sections/ResultsTab';
import { VisualThemePosterRedSection } from '../src/components/posterSections/VisualThemePosterRedSection';
import { PosterMedia } from '../src/components/posterSections/PosterMedia';

const settings: any = { name: 'Club fictif', shortName: 'DÉMO', primaryColor: '#ff0000' };
for (const ratio of ['4:5', '9:16', '1:1', '16:9'] as const) {
  assert.ok(getAdaptivePosterCardSizing(2, ratio).pillHeight > getAdaptivePosterCardSizing(3, ratio).pillHeight);
  assert.ok(getAdaptivePosterCardSizing(3, ratio).pillHeight > getAdaptivePosterCardSizing(4, ratio).pillHeight);
  if (ratio !== '16:9') assert.equal(getAdaptivePosterCardSizing(4, ratio).columns, 1);
}
const base: any = { contentType: 'matches', badgeTitle: 'MATCHS — SENIORS F1',
  captionMatches: [{ id: 's1', category: 'Seniors F1', date: '2026-09-19', time: '20:00' }, { id: 's2', category: 'Seniors F1', date: '2027-05-01', time: '20:00' }],
  captionResults: [], clubSettings: settings, safeShortName: 'DÉMO', safeClubName: 'Club fictif', safeGymnasium: 'Salle fictive',
  customCaptions: {}, isCustomCaptionEdited: {} };
for (const style of ['standard', 'short', 'hype']) {
  for (const contentType of ['matches', 'results']) {
    const result = generateSocialCaptions({ ...base, captionStyleProposal: style, contentType, isPeriodSelection: true });
    for (const text of Object.values(result)) { assert.doesNotMatch(text, /week-end/i); assert.doesNotMatch(text, /#[^\s]*période/i); }
  }
}
assert.equal(generateSocialCaptions({ ...base, isPeriodSelection: true, customCaptions: { instagram: 'Mon week-end personnalisé' }, isCustomCaptionEdited: { instagram: true } }).instagram, 'Mon week-end personnalisé');
assert.doesNotMatch(generateSocialCaptions({ ...base, captionStyleProposal: 'standard' }).instagram, /ce week-end/i);
const noScore = generateSocialCaptions({ ...base, contentType: 'notification', specificNotification: { team: 'Seniors F1', isWin: false, opponent: 'Club fictif B' } });
for (const text of Object.values(noScore)) { assert.doesNotMatch(text, /78|72|l.emporte/); assert.match(text, /Score non communiqué/); }

const empty = renderToStaticMarkup(React.createElement(BirthdaysSlide, { birthdays: [] }));
assert.match(empty, /Aucun anniversaire cette semaine/);
assert.doesNotMatch(empty, /Importez/);
const birthdayPreview = renderToStaticMarkup(React.createElement(ExcelTab, {
  birthdays: [{ id: 'future', firstName: 'FUTUR TEST', teamCategory: 'Seniors F1', birthDate: '1990-10-29' }],
  tvBirthdays: [{ id: 'current', firstName: 'ACTUEL TEST', teamCategory: 'Seniors F1', birthDate: '1990-10-23' }],
  birthdaysSubTab: 'calques', visualTemplates: {}, matches: [], results: [], clubSettings: settings,
}));
assert.match(birthdayPreview, /ACTUEL TEST/);
assert.doesNotMatch(birthdayPreview, /FUTUR TEST/);
assert.match(birthdayPreview, /semaine courante/);
const calendar = renderToStaticMarkup(React.createElement(MiniCalendarPicker, { startDate: '', endDate: '', onChangeRange() {}, emptyRangeLabel: 'Diffusion automatique : week-end courant' }));
assert.match(calendar, /week-end courant/);
assert.doesNotMatch(calendar, /Tous les matchs de la saison/);
const resultProps = {
  clubSettings: { ...settings, resultsFilterStart: '2026-10-30', resultsFilterEnd: '2026-11-01' },
  results: [{ id: 'historical-result', category: 'Seniors F1', date: '2026-10-16', teamHome: 'HISTORIQUE CONSERVÉ', teamAway: 'Adversaire fictif', homeScore: 60, awayScore: 72, selectedForWeekend: true }],
  resultsSubTab: 'list', resultsStartDate: '2026-10-30', resultsEndDate: '2026-11-01',
  showCalendarInResults: false, matches: [], availableFfbbTeams: [],
};
const history = renderToStaticMarkup(React.createElement(ResultsTab, { ...resultProps, resultsFilterMode: 'all' }));
assert.match(history, /HISTORIQUE CONSERVÉ/);
assert.match(history, /Hors période TV/);
assert.doesNotMatch(history, /Cocher pour la TV/);
const period = renderToStaticMarkup(React.createElement(ResultsTab, { ...resultProps, resultsFilterMode: 'range' }));
assert.doesNotMatch(period, /HISTORIQUE CONSERVÉ/);
assert.match(period, /Aucun résultat trouvé pour la période/);
const hiddenLayers = renderToStaticMarkup(React.createElement(VisualThemePosterRedSection, {
  effectiveCategoryConfig: { categoryTheme: {}, layer3: { enabled: false }, layer4: { enabled: true, onlyOnVictory: true } },
  effectiveBgUrl: 'background-fiction.png', effectiveLayer3Url: 'disabled-fiction.mp4', effectiveLayer4Url: 'victory-fiction.mp4',
  showStudioLayer3: true, showStudioLayer4: true, contentType: 'matches', displayedMatches: [], displayedResults: [], aspectRatio: '4:5',
}));
assert.doesNotMatch(hiddenLayers, /disabled-fiction|victory-fiction/);
const videoMedia = renderToStaticMarkup(React.createElement(PosterMedia, { src: '/uploads/fiction.mp4', alt: 'Calque test' }));
assert.match(videoMedia, /<video/);
assert.doesNotMatch(videoMedia, /<img/);
console.log('Audit follow-up: period captions, no invented scores, current-week birthday preview, empty states and calendar semantics OK');
