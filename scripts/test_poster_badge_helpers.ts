import { getPosterBadgeTitle } from '../src/utils/posterBadgeHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER BADGE HELPERS');
  console.log('================================================================');

  // --- TEST 1 : Titre personnalisé (trim & majuscules) ---
  console.log('\n--- TEST 1 : Titre personnalisé ("  Affiche Spéciale  ") ---');
  const custom = getPosterBadgeTitle({
    customBadgeTitle: '  Affiche Spéciale  ',
    contentType: 'matches',
    posterFilter: 'home',
  });
  if (custom === 'AFFICHE SPÉCIALE') {
    console.log('✓ Réussi : Trimé et converti en majuscules ("AFFICHE SPÉCIALE")');
  } else {
    console.error('❌ Échec : Titre personnalisé incorrect', custom);
    process.exit(1);
  }

  // --- TEST 2 : Résultats ---
  console.log('\n--- TEST 2 : Titres des badges Résultats ---');
  const resHome = getPosterBadgeTitle({ contentType: 'results', posterFilter: 'home' });
  const resAway = getPosterBadgeTitle({ contentType: 'results', posterFilter: 'away' });
  const resExempt = getPosterBadgeTitle({ contentType: 'results', posterFilter: 'exempt' });
  const resAll = getPosterBadgeTitle({ contentType: 'results', posterFilter: 'all' });

  if (
    resHome === 'RÉSULTATS DOMICILE' &&
    resAway === 'RÉSULTATS EXTÉRIEUR' &&
    resExempt === 'EXEMPT' &&
    resAll === 'RÉSULTATS'
  ) {
    console.log('✓ Réussi : RÉSULTATS DOMICILE, RÉSULTATS EXTÉRIEUR, EXEMPT, RÉSULTATS');
  } else {
    console.error('❌ Échec : Titres des résultats incorrects', { resHome, resAway, resExempt, resAll });
    process.exit(1);
  }

  // --- TEST 3 : Notifications ---
  console.log('\n--- TEST 3 : Titres des badges Notification ---');
  const notifWin = getPosterBadgeTitle({ contentType: 'notification', posterFilter: 'all', isWin: true });
  const notifFinish = getPosterBadgeTitle({ contentType: 'notification', posterFilter: 'all', isWin: false });

  if (notifWin === 'VICTOIRE !' && notifFinish === 'FIN DE MATCH') {
    console.log('✓ Réussi : "VICTOIRE !" et "FIN DE MATCH"');
  } else {
    console.error('❌ Échec : Titres notification incorrects', { notifWin, notifFinish });
    process.exit(1);
  }

  // --- TEST 4 : Matchs ---
  console.log('\n--- TEST 4 : Titres des badges Matchs ---');
  const matchHome = getPosterBadgeTitle({ contentType: 'matches', posterFilter: 'home' });
  const matchAway = getPosterBadgeTitle({ contentType: 'matches', posterFilter: 'away' });
  const matchExempt = getPosterBadgeTitle({ contentType: 'matches', posterFilter: 'exempt' });
  const matchAll = getPosterBadgeTitle({ contentType: 'matches', posterFilter: 'all' });

  if (
    matchHome === 'DOMICILE' &&
    matchAway === 'EXTÉRIEUR' &&
    matchExempt === 'EXEMPT' &&
    matchAll === 'MATCHDAY'
  ) {
    console.log('✓ Réussi : DOMICILE, EXTÉRIEUR, EXEMPT, MATCHDAY');
  } else {
    console.error('❌ Échec : Titres matchs incorrects', { matchHome, matchAway, matchExempt, matchAll });
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER BADGE HELPERS SONT PASSÉS ! (4/4)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
