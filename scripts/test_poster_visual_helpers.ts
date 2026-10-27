import {
  resolvePosterBackgroundUrl,
  resolveLayerMediaUrl,
} from '../src/utils/posterVisualHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER VISUAL HELPERS');
  console.log('================================================================');

  const defaultBg = 'assets/default_bg.jpg';

  // --- TEST 1 : Fond personnalisé ---
  console.log('\n--- TEST 1 : Fond personnalisé prioritaire ---');
  const customRes = resolvePosterBackgroundUrl({
    customBgImage: 'custom.jpg',
    bgSource: 'studio',
    categoryBackgroundUrl: 'studio.jpg',
    visualTemplates: { matchesBackgroundUrl: 'global.jpg' },
    defaultPosterBg: defaultBg,
  });
  if (customRes === 'custom.jpg') {
    console.log('✓ Réussi : customBgImage est prioritaire ("custom.jpg")');
  } else {
    console.error('❌ Échec : customBgImage non respecté', customRes);
    process.exit(1);
  }

  // --- TEST 2 : Fond Studio ---
  console.log('\n--- TEST 2 : Fond Studio (bgSource = "studio") ---');
  const studioRes = resolvePosterBackgroundUrl({
    customBgImage: null,
    bgSource: 'studio',
    categoryBackgroundUrl: 'studio.jpg',
    visualTemplates: { matchesBackgroundUrl: 'global.jpg' },
    defaultPosterBg: defaultBg,
  });
  if (studioRes === 'studio.jpg') {
    console.log('✓ Réussi : categoryBackgroundUrl sélectionné ("studio.jpg")');
  } else {
    console.error('❌ Échec : Fond studio non respecté', studioRes);
    process.exit(1);
  }

  // --- TEST 3 : Fond global ---
  console.log('\n--- TEST 3 : Fond global (visualTemplates.matchesBackgroundUrl) ---');
  const globalRes = resolvePosterBackgroundUrl({
    customBgImage: null,
    bgSource: 'default',
    categoryBackgroundUrl: 'studio.jpg',
    visualTemplates: { matchesBackgroundUrl: 'global.jpg' },
    defaultPosterBg: defaultBg,
  });
  if (globalRes === 'global.jpg') {
    console.log('✓ Réussi : matchesBackgroundUrl sélectionné ("global.jpg")');
  } else {
    console.error('❌ Échec : Fond global non respecté', globalRes);
    process.exit(1);
  }

  // --- TEST 4 : Fallback defaultPosterBg ---
  console.log('\n--- TEST 4 : Fallback par défaut (defaultPosterBg) ---');
  const defaultRes = resolvePosterBackgroundUrl({
    customBgImage: null,
    bgSource: 'default',
    categoryBackgroundUrl: undefined,
    visualTemplates: undefined,
    defaultPosterBg: defaultBg,
  });
  if (defaultRes === defaultBg) {
    console.log(`✓ Réussi : Fallback appliqué ("${defaultBg}")`);
  } else {
    console.error('❌ Échec : Fallback non respecté', defaultRes);
    process.exit(1);
  }

  // --- TEST 5 : Calque 3 (custom vs configuré) ---
  console.log('\n--- TEST 5 : Calque 3 (custom > configuré) ---');
  const layer3Custom = resolveLayerMediaUrl('layer3_custom.png', 'layer3_studio.png');
  const layer3Studio = resolveLayerMediaUrl(null, 'layer3_studio.png');
  if (layer3Custom === 'layer3_custom.png' && layer3Studio === 'layer3_studio.png') {
    console.log('✓ Réussi : Calque 3 priorise le custom, puis le studio');
  } else {
    console.error('❌ Échec : Calque 3 résolution incorrecte', { layer3Custom, layer3Studio });
    process.exit(1);
  }

  // --- TEST 6 : Calque 4 (custom vs configuré) ---
  console.log('\n--- TEST 6 : Calque 4 (custom > configuré) ---');
  const layer4Custom = resolveLayerMediaUrl('layer4_custom.png', 'layer4_studio.png');
  const layer4Studio = resolveLayerMediaUrl(null, 'layer4_studio.png');
  if (layer4Custom === 'layer4_custom.png' && layer4Studio === 'layer4_studio.png') {
    console.log('✓ Réussi : Calque 4 priorise le custom, puis le studio');
  } else {
    console.error('❌ Échec : Calque 4 résolution incorrecte', { layer4Custom, layer4Studio });
    process.exit(1);
  }

  // --- TEST 7 : Aucun média (retourne '') ---
  console.log('\n--- TEST 7 : Chaine vide si aucun média ---');
  const emptyRes = resolveLayerMediaUrl(null, undefined);
  if (emptyRes === '') {
    console.log('✓ Réussi : Retourne une chaine vide ""');
  } else {
    console.error('❌ Échec : Attendu "" mais reçu', emptyRes);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER VISUAL HELPERS SONT PASSÉS ! (7/7)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
