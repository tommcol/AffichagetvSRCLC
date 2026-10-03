import {
  getPosterExportFilterLabel,
  getPosterExportRatioLabel,
  getPosterExportPageSuffix,
} from '../src/utils/posterExportNamingHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER EXPORT NAMING HELPERS');
  console.log('================================================================');

  // --- TEST 1 : Filter labels ---
  console.log('\n--- TEST 1 : Filter labels (matches+home, matches+away, results, notification) ---');
  const labelMatchesHome = getPosterExportFilterLabel('matches', 'home');
  const labelMatchesAway = getPosterExportFilterLabel('matches', 'away');
  const labelResults = getPosterExportFilterLabel('results', 'home');
  const labelNotif = getPosterExportFilterLabel('notification', 'all');

  if (
    labelMatchesHome === 'home' &&
    labelMatchesAway === 'away' &&
    labelResults === 'results' &&
    labelNotif === 'notification'
  ) {
    console.log('✓ Réussi : Filter labels exacts ("home", "away", "results", "notification")');
  } else {
    console.error('❌ Échec : Filter labels incorrects', { labelMatchesHome, labelMatchesAway, labelResults, labelNotif });
    process.exit(1);
  }

  // --- TEST 2 : Ratio labels ---
  console.log('\n--- TEST 2 : Ratio labels (4:5 -> 4_5, 16:9 -> 16_9) ---');
  const ratio45 = getPosterExportRatioLabel('4:5');
  const ratio169 = getPosterExportRatioLabel('16:9');
  const ratio916 = getPosterExportRatioLabel('9:16');

  if (ratio45 === '4_5' && ratio169 === '16_9' && ratio916 === '9_16') {
    console.log('✓ Réussi : Ratio labels exacts ("4_5", "16_9", "9_16")');
  } else {
    console.error('❌ Échec : Ratio labels incorrects', { ratio45, ratio169, ratio916 });
    process.exit(1);
  }

  // --- TEST 3 : Page suffixes ---
  console.log('\n--- TEST 3 : Page suffixes (1/1 -> vide, 2/3 -> _affiche2_sur_3) ---');
  const singlePageSuffix = getPosterExportPageSuffix(1, 1);
  const multiPageSuffix = getPosterExportPageSuffix(2, 3);

  if (singlePageSuffix === '' && multiPageSuffix === '_affiche2_sur_3') {
    console.log('✓ Réussi : Suffixe de page exact ("" et "_affiche2_sur_3")');
  } else {
    console.error('❌ Échec : Suffixe de page incorrect', { singlePageSuffix, multiPageSuffix });
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER EXPORT NAMING HELPERS SONT PASSÉS ! (3/3)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
