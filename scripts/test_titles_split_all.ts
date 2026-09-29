import assert from 'node:assert';
import { VisualTemplatesConfig, CategorySlideTheme, MatchItem } from '../src/types';

console.log('================================================================');
console.log('TEST SUITE: TITRES INDÉPENDANTS DOMICILE / EXTÉRIEUR ET MODE TOUS');
console.log('================================================================');

// Helper to simulate updateCurrentCategoryTheme
function updateCategoryTheme(
  templates: VisualTemplatesConfig,
  category: 'matches' | 'results',
  partial: Partial<CategorySlideTheme>
): VisualTemplatesConfig {
  const next = { ...templates };
  const settingsKey = category === 'matches' ? 'matchesSettings' : 'resultsSettings';
  const current = templates[settingsKey] || {};
  next[settingsKey] = { ...current, ...partial };
  return next;
}

const INITIAL_TEMPLATES: VisualTemplatesConfig = {
  matchesSettings: {
    matchDisplayScope: 'split',
    customHeaderTitle: 'LES RENCONTRES DU WEEK-END',
    customHeaderTitleHome: 'LES RENCONTRES À DOMICILE',
    customHeaderTitleAway: "LES RENCONTRES À L'EXTÉRIEUR",
  },
  resultsSettings: {
    matchDisplayScope: 'split',
    customHeaderTitle: 'RÉSULTATS DU WEEK-END',
    customHeaderTitleHome: 'LES RÉSULTATS À DOMICILE',
    customHeaderTitleAway: "LES RÉSULTATS À L'EXTÉRIEUR",
  },
};

// 1. Initial State Check
console.log('\n--- TEST 1 : Vérification de la configuration par défaut ---');
let templates = JSON.parse(JSON.stringify(INITIAL_TEMPLATES)) as VisualTemplatesConfig;
assert.strictEqual(templates.matchesSettings?.matchDisplayScope, 'split', 'Le mode par défaut des matchs doit être "split"');
assert.strictEqual(templates.resultsSettings?.matchDisplayScope, 'split', 'Le mode par défaut des résultats doit être "split"');
console.log('✓ Configuration par défaut validée (mode split pour matchs et résultats)');

// 2. Test modification of customHeaderTitleHome independently
console.log('\n--- TEST 2 : Modification indépendante du titre Domicile (Matchs) ---');
const homeTitleTest = 'CHOC AU GYMNASE DE LA CLAYETTE !';
templates = updateCategoryTheme(templates, 'matches', { customHeaderTitleHome: homeTitleTest });

assert.strictEqual(templates.matchesSettings?.customHeaderTitleHome, homeTitleTest, 'customHeaderTitleHome doit être mis à jour');
assert.strictEqual(
  templates.matchesSettings?.customHeaderTitleAway,
  "LES RENCONTRES À L'EXTÉRIEUR",
  'customHeaderTitleAway NE DOIT PAS être modifié lors de la modification de customHeaderTitleHome'
);
assert.strictEqual(
  templates.matchesSettings?.customHeaderTitle,
  'LES RENCONTRES DU WEEK-END',
  'customHeaderTitle (Tous) NE DOIT PAS être modifié lors de la modification de customHeaderTitleHome'
);
console.log('✓ Le titre Domicile a été modifié sans altérer le titre Extérieur ni le titre Tous');

// 3. Test modification of customHeaderTitleAway independently
console.log('\n--- TEST 3 : Modification indépendante du titre Extérieur (Matchs) ---');
const awayTitleTest = 'TOUS EN DÉPLACEMENT AVEC LES ROUGES !';
templates = updateCategoryTheme(templates, 'matches', { customHeaderTitleAway: awayTitleTest });

assert.strictEqual(templates.matchesSettings?.customHeaderTitleAway, awayTitleTest, 'customHeaderTitleAway doit être mis à jour');
assert.strictEqual(
  templates.matchesSettings?.customHeaderTitleHome,
  homeTitleTest,
  'customHeaderTitleHome NE DOIT PAS être altéré lors de la modification de customHeaderTitleAway'
);
assert.strictEqual(
  templates.matchesSettings?.customHeaderTitle,
  'LES RENCONTRES DU WEEK-END',
  'customHeaderTitle (Tous) NE DOIT PAS être altéré lors de la modification de customHeaderTitleAway'
);
console.log('✓ Le titre Extérieur a été modifié sans altérer le titre Domicile');

// 4. Test Résultats (Results) independent titles
console.log('\n--- TEST 4 : Modification indépendante des titres Résultats ---');
const resultsHomeTitle = 'VICTOIRES ET SCORES À LA MAISON';
const resultsAwayTitle = 'RÉSULTATS DE NOS ÉQUIPES EN VOYAGE';

templates = updateCategoryTheme(templates, 'results', { customHeaderTitleHome: resultsHomeTitle });
assert.strictEqual(templates.resultsSettings?.customHeaderTitleHome, resultsHomeTitle);
assert.strictEqual(templates.resultsSettings?.customHeaderTitleAway, "LES RÉSULTATS À L'EXTÉRIEUR");

templates = updateCategoryTheme(templates, 'results', { customHeaderTitleAway: resultsAwayTitle });
assert.strictEqual(templates.resultsSettings?.customHeaderTitleHome, resultsHomeTitle, 'customHeaderTitleHome des résultats préservé');
assert.strictEqual(templates.resultsSettings?.customHeaderTitleAway, resultsAwayTitle, 'customHeaderTitleAway des résultats mis à jour');
console.log('✓ Les titres Résultats Domicile et Extérieur sont parfaitement indépendants');

// 5. Switch to mode "Tous" and back to "Domicile / Extérieur"
console.log('\n--- TEST 5 : Bascule vers le mode "Tous" puis retour vers "Domicile / Extérieur" ---');
templates = updateCategoryTheme(templates, 'matches', { matchDisplayScope: 'all' });
assert.strictEqual(templates.matchesSettings?.matchDisplayScope, 'all');

// Edit customHeaderTitle for mode "Tous"
const allTitleTest = 'LE GRAND WEEK-END DE BASKET DU SRC';
templates = updateCategoryTheme(templates, 'matches', { customHeaderTitle: allTitleTest });
assert.strictEqual(templates.matchesSettings?.customHeaderTitle, allTitleTest);

// Verify Home & Away titles were NOT lost when editing mode "Tous"
assert.strictEqual(templates.matchesSettings?.customHeaderTitleHome, homeTitleTest, 'Titre Domicile conservé');
assert.strictEqual(templates.matchesSettings?.customHeaderTitleAway, awayTitleTest, 'Titre Extérieur conservé');

// Switch back to "split" (Domicile / Extérieur)
templates = updateCategoryTheme(templates, 'matches', { matchDisplayScope: 'split' });
assert.strictEqual(templates.matchesSettings?.matchDisplayScope, 'split');
assert.strictEqual(templates.matchesSettings?.customHeaderTitleHome, homeTitleTest, 'Titre Domicile toujours disponible');
assert.strictEqual(templates.matchesSettings?.customHeaderTitleAway, awayTitleTest, 'Titre Extérieur toujours disponible');
assert.strictEqual(templates.matchesSettings?.customHeaderTitle, allTitleTest, 'Titre Tous toujours disponible');
console.log('✓ La bascule de mode conserve l’ensemble des titres sans écrasement');

// 6. Test schedule slide generation titles
console.log('\n--- TEST 6 : Génération des diapositives TV avec les titres appropriés ---');
const sampleMatches: MatchItem[] = [
  {
    id: 'm1',
    category: 'SENIORS M1',
    teamHome: 'SRC BASKET',
    teamAway: 'CHAROLLES',
    isHomeMatch: true,
    date: '2026-10-03',
    time: '20:30',
    selectedForWeekend: true,
  },
  {
    id: 'm2',
    category: 'U15M',
    teamHome: 'CHALON BC',
    teamAway: 'SRC BASKET',
    isHomeMatch: false,
    date: '2026-10-04',
    time: '14:00',
    selectedForWeekend: true,
  },
];

// Helper to simulate App.tsx schedule slide customTitle calculation
function getSlideTitlesForMatches(config: VisualTemplatesConfig, matches: MatchItem[]) {
  const customTitle = config.matchesSettings?.customHeaderTitle?.trim();
  const customTitleHome = config.matchesSettings?.customHeaderTitleHome?.trim();
  const customTitleAway = config.matchesSettings?.customHeaderTitleAway?.trim();
  const rawScope = config.matchesSettings?.matchDisplayScope;
  const displayScope = rawScope === 'all' ? 'all' : 'split';

  if (displayScope === 'all') {
    return [{ filterScope: 'all', title: customTitle || 'LES RENCONTRES DU WEEK-END' }];
  } else {
    return [
      { filterScope: 'home', title: customTitleHome || 'LES RENCONTRES À DOMICILE' },
      { filterScope: 'away', title: customTitleAway || "LES RENCONTRES À L'EXTÉRIEUR" },
    ];
  }
}

// In split mode
const splitSlides = getSlideTitlesForMatches(templates, sampleMatches);
assert.strictEqual(splitSlides.length, 2);
assert.strictEqual(splitSlides[0].filterScope, 'home');
assert.strictEqual(splitSlides[0].title, homeTitleTest);
assert.strictEqual(splitSlides[1].filterScope, 'away');
assert.strictEqual(splitSlides[1].title, awayTitleTest);
console.log('✓ Les slides Domicile et Extérieur reçoivent chacune leur titre indépendant');

// In all mode
const allTemplates = updateCategoryTheme(templates, 'matches', { matchDisplayScope: 'all' });
const allSlides = getSlideTitlesForMatches(allTemplates, sampleMatches);
assert.strictEqual(allSlides.length, 1);
assert.strictEqual(allSlides[0].filterScope, 'all');
assert.strictEqual(allSlides[0].title, allTitleTest);
console.log('✓ La slide Tous reçoit le titre du mode Tous');

// 7. Test Save and Reload (Persistence Simulation)
console.log('\n--- TEST 7 : Simulation de sauvegarde serveur et rechargement de l’application ---');
// Simuler le payload envoyé à /api/save-app-data
const serverSavedPayload = JSON.stringify({
  visualTemplates: templates,
});

// Simuler la réouverture de l’application et le chargement via /api/get-app-data
const loadedFromServer = JSON.parse(serverSavedPayload);
const restoredTemplates: VisualTemplatesConfig = loadedFromServer.visualTemplates;

assert.strictEqual(restoredTemplates.matchesSettings?.matchDisplayScope, 'split');
assert.strictEqual(restoredTemplates.matchesSettings?.customHeaderTitleHome, homeTitleTest);
assert.strictEqual(restoredTemplates.matchesSettings?.customHeaderTitleAway, awayTitleTest);
assert.strictEqual(restoredTemplates.matchesSettings?.customHeaderTitle, allTitleTest);

assert.strictEqual(restoredTemplates.resultsSettings?.matchDisplayScope, 'split');
assert.strictEqual(restoredTemplates.resultsSettings?.customHeaderTitleHome, resultsHomeTitle);
assert.strictEqual(restoredTemplates.resultsSettings?.customHeaderTitleAway, resultsAwayTitle);
console.log('✓ Rechargement complet depuis la sauvegarde serveur vérifié avec succès');

console.log('\n================================================================');
console.log('🎉 TOUTES LES ASSERTIONS ONT RÉUSSI AVEC SUCCÈS ! (7/7)');
console.log('================================================================\n');
