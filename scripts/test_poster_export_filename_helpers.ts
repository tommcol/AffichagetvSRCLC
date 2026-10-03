import { buildPosterExportFilename } from '../src/utils/posterExportFilenameHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER EXPORT FILENAME HELPERS');
  console.log('================================================================');

  // --- TEST 1 : Nom normal ---
  console.log('\n--- TEST 1 : Nom normal ---');
  const filename1 = buildPosterExportFilename({
    shortClubName: 'SRC',
    filterLabel: 'matches',
    pageSuffix: '',
    ratioLabel: '16_9',
    timestamp: 123,
  });
  if (filename1 === 'src_affiche_matches_16_9_123.png') {
    console.log('✓ Réussi : "src_affiche_matches_16_9_123.png"');
  } else {
    console.error('❌ Échec : Nom normal incorrect', filename1);
    process.exit(1);
  }

  // --- TEST 2 & 3 : Minuscules & Espaces vers _ ---
  console.log('\n--- TEST 2 & 3 : Conversion minuscules et espaces vers underscores ---');
  const filename2 = buildPosterExportFilename({
    shortClubName: 'SRC BASKET LA CLAYETTE',
    filterLabel: 'home',
    pageSuffix: '_affiche1_sur_2',
    ratioLabel: '4_5',
    timestamp: 99999,
  });
  if (filename2.startsWith('src_basket_la_clayette_affiche_home')) {
    console.log('✓ Réussi : "src_basket_la_clayette..." généré correctement');
  } else {
    console.error('❌ Échec : Conversion de nom de club incorrecte', filename2);
    process.exit(1);
  }

  // --- TEST 4, 5, 6, 7 : Intégrité filter, pageSuffix, ratioLabel et timestamp ---
  console.log('\n--- TEST 4, 5, 6, 7 : Vérification complète de la structure du nom ---');
  const filenameFull = buildPosterExportFilename({
    shortClubName: 'Club',
    filterLabel: 'results',
    pageSuffix: '_affiche2_sur_3',
    ratioLabel: '9_16',
    timestamp: 1700000000000,
  });
  const expectedFull = 'club_affiche_results_affiche2_sur_3_9_16_1700000000000.png';

  if (filenameFull === expectedFull) {
    console.log(`✓ Réussi : "${expectedFull}"`);
  } else {
    console.error('❌ Échec : Structure de nom d\'exportation incorrecte', {
      received: filenameFull,
      expected: expectedFull,
    });
    process.exit(1);
  }

  // --- TEST 8 : Cas sans suffixe de page ---
  console.log('\n--- TEST 8 : Cas sans suffixe de page ---');
  const filenameNoPage = buildPosterExportFilename({
    shortClubName: 'Club',
    filterLabel: 'all',
    pageSuffix: '',
    ratioLabel: '1_1',
    timestamp: 555,
  });
  if (filenameNoPage === 'club_affiche_all_1_1_555.png') {
    console.log('✓ Réussi : "club_affiche_all_1_1_555.png" (sans suffixe)');
  } else {
    console.error('❌ Échec : Cas sans page suffix incorrect', filenameNoPage);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER EXPORT FILENAME HELPERS SONT PASSÉS ! (8/8)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
