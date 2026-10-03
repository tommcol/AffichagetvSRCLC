import { buildPosterShareTitle } from '../src/utils/posterShareTextHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER SHARE TEXT HELPERS');
  console.log('================================================================');

  // --- TEST 1 : Titre complet avec badge et club ---
  console.log('\n--- TEST 1 : Titre de partage complet ---');
  const title1 = buildPosterShareTitle('DOMICILE', 'SRC Basket');
  if (title1 === 'Affiche DOMICILE - SRC Basket') {
    console.log('✓ Réussi : "Affiche DOMICILE - SRC Basket"');
  } else {
    console.error('❌ Échec : Titre complet incorrect', title1);
    process.exit(1);
  }

  // --- TEST 2 : Badge vide ---
  console.log('\n--- TEST 2 : Titre de partage sans badge ---');
  const title2 = buildPosterShareTitle('   ', 'SRC Basket');
  if (title2 === 'SRC Basket') {
    console.log('✓ Réussi : "SRC Basket"');
  } else {
    console.error('❌ Échec : Titre sans badge incorrect', title2);
    process.exit(1);
  }

  // --- TEST 3 : Club vide ---
  console.log('\n--- TEST 3 : Titre de partage sans nom de club ---');
  const title3 = buildPosterShareTitle('RÉSULTATS', '');
  if (title3 === 'Affiche RÉSULTATS') {
    console.log('✓ Réussi : "Affiche RÉSULTATS"');
  } else {
    console.error('❌ Échec : Titre sans club incorrect', title3);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER SHARE TEXT HELPERS SONT PASSÉS ! (3/3)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
