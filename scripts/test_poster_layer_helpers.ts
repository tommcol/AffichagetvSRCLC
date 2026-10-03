import {
  getLayer3PositionClass,
  getLayer3TransformOrigin,
  getLayer3Transform,
  getLayer4PositionClass,
  getLayer4TransformOrigin,
  readFileAsDataUrl,
} from '../src/utils/posterLayerHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER LAYER HELPERS (CALQUES 3 ET 4)');
  console.log('================================================================');

  // --- TEST 1 : Position CSS Calque 3 ---
  console.log('\n--- TEST 1 : Position CSS Calque 3 ---');
  const l3BR = getLayer3PositionClass('bottom-right');
  const l3BL = getLayer3PositionClass('bottom-left');
  const l3TR = getLayer3PositionClass('top-right');
  const l3Center = getLayer3PositionClass('center');

  if (
    l3BR === 'bottom-8 right-8' &&
    l3BL === 'bottom-8 left-8' &&
    l3TR === 'top-32 right-8' &&
    l3Center === 'bottom-16 left-1/2 -translate-x-1/2'
  ) {
    console.log('✓ Réussi : Toutes les classes CSS du Calque 3 sont exactes');
  } else {
    console.error('❌ Échec : Classes CSS du Calque 3 incorrectes', { l3BR, l3BL, l3TR, l3Center });
    process.exit(1);
  }

  // --- TEST 2 : TransformOrigin Calque 3 ---
  console.log('\n--- TEST 2 : TransformOrigin Calque 3 ---');
  const origin3BR = getLayer3TransformOrigin('bottom-right');
  const origin3BL = getLayer3TransformOrigin('bottom-left');
  const origin3Center = getLayer3TransformOrigin('center');

  if (
    origin3BR === 'bottom right' &&
    origin3BL === 'bottom left' &&
    origin3Center === 'center center'
  ) {
    console.log('✓ Réussi : TransformOrigin du Calque 3 exacts');
  } else {
    console.error('❌ Échec : TransformOrigin du Calque 3 incorrects', { origin3BR, origin3BL, origin3Center });
    process.exit(1);
  }

  // --- TEST 3 : Transform Calque 3 sans flip ---
  console.log('\n--- TEST 3 : Transform Calque 3 (flipHorizontal = false) ---');
  const transformNormal = getLayer3Transform(0.85, false);
  if (transformNormal.trim() === 'scale(0.85)') {
    console.log('✓ Réussi : scale(0.85) sans miroir');
  } else {
    console.error('❌ Échec : Transform normal incorrect', transformNormal);
    process.exit(1);
  }

  // --- TEST 4 : Transform Calque 3 avec flip ---
  console.log('\n--- TEST 4 : Transform Calque 3 (flipHorizontal = true) ---');
  const transformFlipped = getLayer3Transform(0.85, true);
  if (transformFlipped.includes('scale(0.85)') && transformFlipped.includes('scaleX(-1)')) {
    console.log('✓ Réussi : scale(0.85) avec miroir scaleX(-1)');
  } else {
    console.error('❌ Échec : Transform miroir incorrect', transformFlipped);
    process.exit(1);
  }

  // --- TEST 5 : Position CSS Calque 4 ---
  console.log('\n--- TEST 5 : Position CSS Calque 4 ---');
  const l4TR = getLayer4PositionClass('top-right');
  const l4BL = getLayer4PositionClass('bottom-left');
  const l4BR = getLayer4PositionClass('bottom-right');
  const l4Center = getLayer4PositionClass('center');

  if (
    l4TR === 'top-8 right-8' &&
    l4BL === 'bottom-8 left-8' &&
    l4BR === 'bottom-8 right-8' &&
    l4Center === 'top-8 left-8'
  ) {
    console.log('✓ Réussi : Toutes les classes CSS du Calque 4 sont exactes');
  } else {
    console.error('❌ Échec : Classes CSS du Calque 4 incorrectes', { l4TR, l4BL, l4BR, l4Center });
    process.exit(1);
  }

  // --- TEST 6 : TransformOrigin Calque 4 ---
  console.log('\n--- TEST 6 : TransformOrigin Calque 4 ---');
  const origin4Right = getLayer4TransformOrigin('top-right');
  const origin4Left = getLayer4TransformOrigin('bottom-left');

  if (origin4Right === 'top right' && origin4Left === 'top left') {
    console.log('✓ Réussi : TransformOrigin du Calque 4 exacts (top right / top left)');
  } else {
    console.error('❌ Échec : TransformOrigin Calque 4 incorrects', { origin4Right, origin4Left });
    process.exit(1);
  }

  // --- TEST 7 : Lecture de fichier avec readFileAsDataUrl ---
  console.log('\n--- TEST 7 : Lecture de fichier avec readFileAsDataUrl ---');
  const dummyFile = new File(['hello world'], 'test.txt', { type: 'text/plain' });
  try {
    const dataUrl = await readFileAsDataUrl(dummyFile);
    if (dataUrl.startsWith('data:text/plain;base64,')) {
      console.log('✓ Réussi : Fichier correctement lu en Data URL');
    } else {
      console.error('❌ Échec : Format Data URL invalide', dataUrl);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Échec : Erreur lors de la lecture du fichier', err);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER LAYER HELPERS SONT PASSÉS ! (7/7)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
