import { VisualTemplatesConfig, CategorySlideTheme } from '../src/types';
import {
  getLayer2Settings,
  mergeLayer2TemplateSetting,
} from '../src/utils/posterLayer2Helpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER LAYER 2 HELPERS');
  console.log('================================================================');

  // --- TEST 1 : Lecture des réglages complets ---
  console.log('\n--- TEST 1 : Lecture des réglages complets ---');
  const fullTheme: CategorySlideTheme = {
    primaryColor: '#ff0000',
    textColor: '#ffffff',
    badgeBgColor: '#000000',
    badgeTextColor: '#eeeeee',
    fontFamilyHeader: 'Bebas Neue',
    fontFamilyBody: 'Montserrat',
    resultDisplayMode: 'both',
  };

  const settings1 = getLayer2Settings(fullTheme);
  if (
    settings1.primaryColor === '#ff0000' &&
    settings1.textColor === '#ffffff' &&
    settings1.badgeBgColor === '#000000' &&
    settings1.badgeTextColor === '#eeeeee' &&
    settings1.fontFamilyHeader === 'Bebas Neue' &&
    settings1.fontFamilyBody === 'Montserrat' &&
    settings1.resultDisplayMode === 'both'
  ) {
    console.log('✓ Réussi : Tous les réglages du Calque 2 correctement extraits');
  } else {
    console.error('❌ Échec : Réglages extraits incorrects', settings1);
    process.exit(1);
  }

  // --- TEST 2 : Fallback badgeBgColor vers primaryColor ---
  console.log('\n--- TEST 2 : Fallback badgeBgColor vers primaryColor ---');
  const themeWithPrimaryOnly: CategorySlideTheme = {
    primaryColor: '#00ff00',
  };
  const settings2 = getLayer2Settings(themeWithPrimaryOnly);
  if (settings2.badgeBgColor === '#00ff00') {
    console.log('✓ Réussi : badgeBgColor est fallback sur primaryColor ("#00ff00")');
  } else {
    console.error('❌ Échec : Fallback badgeBgColor non respecté', settings2);
    process.exit(1);
  }

  // --- TEST 3 : Priorité badgeBgColor ---
  console.log('\n--- TEST 3 : Priorité badgeBgColor si défini ---');
  const themeWithBoth: CategorySlideTheme = {
    primaryColor: '#00ff00',
    badgeBgColor: '#0000ff',
  };
  const settings3 = getLayer2Settings(themeWithBoth);
  if (settings3.badgeBgColor === '#0000ff') {
    console.log('✓ Réussi : badgeBgColor ("#0000ff") a bien priorité sur primaryColor');
  } else {
    console.error('❌ Échec : Priorité badgeBgColor non respectée', settings3);
    process.exit(1);
  }

  // --- TEST 4 : Fusion matches ---
  console.log('\n--- TEST 4 : Fusion des réglages Matches ---');
  const initialTemplates: VisualTemplatesConfig = {
    matchesBackgroundUrl: 'bg.jpg',
    matchesSettings: { primaryColor: '#111111' },
    resultsSettings: { primaryColor: '#222222' },
  };

  const mergedMatches = mergeLayer2TemplateSetting(
    initialTemplates,
    'matches',
    { primaryColor: '#999999', fontFamilyHeader: 'Impact' }
  );

  if (
    mergedMatches.matchesSettings?.primaryColor === '#999999' &&
    mergedMatches.matchesSettings?.fontFamilyHeader === 'Impact' &&
    mergedMatches.resultsSettings?.primaryColor === '#222222' &&
    mergedMatches.matchesBackgroundUrl === 'bg.jpg'
  ) {
    console.log('✓ Réussi : Fusion matchesSettings isolée sans altérer resultsSettings ou le reste');
  } else {
    console.error('❌ Échec : Fusion matchesSettings incorrecte', mergedMatches);
    process.exit(1);
  }

  // --- TEST 5 : Fusion results ---
  console.log('\n--- TEST 5 : Fusion des réglages Results ---');
  const mergedResults = mergeLayer2TemplateSetting(
    initialTemplates,
    'results',
    { primaryColor: '#888888', resultDisplayMode: 'score' }
  );

  if (
    mergedResults.resultsSettings?.primaryColor === '#888888' &&
    mergedResults.resultsSettings?.resultDisplayMode === 'score' &&
    mergedResults.matchesSettings?.primaryColor === '#111111'
  ) {
    console.log('✓ Réussi : Fusion resultsSettings isolée sans altérer matchesSettings');
  } else {
    console.error('❌ Échec : Fusion resultsSettings incorrecte', mergedResults);
    process.exit(1);
  }

  // --- TEST 6 : Immutabilité ---
  console.log('\n--- TEST 6 : Immutabilité du template d\'origine ---');
  if (
    initialTemplates.matchesSettings?.primaryColor === '#111111' &&
    initialTemplates.resultsSettings?.primaryColor === '#222222'
  ) {
    console.log('✓ Réussi : L\'objet d\'origine n\'a pas été muté directement');
  } else {
    console.error('❌ Échec : L\'objet d\'origine a été muté');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER LAYER 2 HELPERS SONT PASSÉS ! (6/6)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
