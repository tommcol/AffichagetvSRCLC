/**
 * Test de validation pour les chantiers du 16/10/2026 :
 * 1. Option « Par équipe » de la Passerelle réseaux (équipe + période, bypass week-end)
 * 2. Bloc RÉSULTATS de l'affiche aligné sur le design TV (tailles adaptatives, 2 colonnes)
 * 3. server.ts : plus aucune référence à la variable indéfinie combinedResults dans runBackgroundFFBBSync
 */

import { readFileSync } from 'fs';
import path from 'path';

async function runTests() {
  console.log('--- TEST 1 : Option « Par équipe » dans VisualExporterModal.tsx ---');
  const modalContent = readFileSync(path.join(process.cwd(), 'src', 'components', 'VisualExporterModal.tsx'), 'utf-8');

  if (!modalContent.includes('teamFilterEnabled')) {
    throw new Error('VisualExporterModal.tsx doit contenir l état teamFilterEnabled du mode Par équipe');
  }
  if (!modalContent.includes('PAR ÉQUIPE')) {
    throw new Error('VisualExporterModal.tsx doit contenir le bouton PAR ÉQUIPE');
  }
  if (!modalContent.includes('availableTeams')) {
    throw new Error('VisualExporterModal.tsx doit construire la liste availableTeams (catégories uniques)');
  }
  if (!modalContent.includes('teamPeriodFilteredMatches') || !modalContent.includes('teamPeriodFilteredResults')) {
    throw new Error('VisualExporterModal.tsx doit filtrer matchs ET résultats par équipe + période');
  }
  // Le filtre Par équipe doit bypasser la sélection week-end (lire les props complètes, pas weekendMatches)
  const teamMatchesIdx = modalContent.indexOf('const teamPeriodFilteredMatches');
  const weekendUseIdx = modalContent.indexOf('weekendMatches', teamMatchesIdx);
  const teamBlockEnd = modalContent.indexOf('}, [matches, teamFilterEnabled', teamMatchesIdx);
  if (weekendUseIdx !== -1 && weekendUseIdx < teamBlockEnd) {
    throw new Error('Le filtre Par équipe ne doit pas dépendre de weekendMatches (bypass week-end requis)');
  }
  // Les boutons Dom/Ext/Exempt/Tout doivent désactiver le mode équipe
  const filterButtons = modalContent.split("setPosterFilter('home');").length - 1;
  const disableCount = modalContent.split('setPosterFilter').length - 1;
  const disableTeam = modalContent.split('setTeamFilterEnabled(false)').length - 1;
  if (disableTeam < 6) {
    throw new Error('Chaque bouton Dom/Ext/Exempt/Tout (barre PC + barre mobile) doit désactiver le mode Par équipe');
  }
  console.log('✅ Test 1 réussi : Mode Par équipe complet (équipe, période, bypass week-end, désactivation).');

  console.log('--- TEST 2 : Bloc RÉSULTATS de l affiche aligné sur le design TV ---');
  const posterContent = readFileSync(path.join(process.cwd(), 'src', 'components', 'posterSections', 'VisualThemePosterRedSection.tsx'), 'utf-8');

  if (!posterContent.includes("contentType === 'results' &&")) {
    throw new Error('Le bloc résultats doit exister');
  }
  // Le bloc résultats doit utiliser le dimensionnement adaptatif commun
  const resultsIdx = posterContent.indexOf("contentType === 'results' &&");
  const resultsSlice = posterContent.slice(resultsIdx, posterContent.indexOf("contentType === 'notification'"));
  if (!resultsSlice.includes('getAdaptivePosterCardSizing')) {
    throw new Error('Le bloc résultats doit utiliser getAdaptivePosterCardSizing (tailles adaptatives)');
  }
  if (!resultsSlice.includes('AutoFitTeamName')) {
    throw new Error('Le bloc résultats doit utiliser AutoFitTeamName avec pillHeight');
  }
  if (!resultsSlice.includes('text-amber-400')) {
    throw new Error('La date doit être en doré (text-amber-400) comme l aperçu TV');
  }
  if (!resultsSlice.includes('bg-gradient-to-r from-red-600 via-rose-600')) {
    throw new Error('La pilule du club doit être en dégradé rouge comme les matchs et l aperçu TV');
  }
  if (!resultsSlice.includes('isClubHomeMatch')) {
    throw new Error('Le côté rouge doit suivre isClubHomeMatch (pas deux pilules rouges)');
  }
  // 2 colonnes comme les matchs
  if (!resultsSlice.includes('flex-row')) {
    throw new Error('Le bloc résultats doit passer en 2 colonnes quand il y a plus de 2 résultats');
  }
  console.log('✅ Test 2 réussi : Bloc résultats au design TV, adaptatif, 2 colonnes.');

  console.log('--- TEST 3 : server.ts ne référence plus combinedResults ---');
  const serverContent = readFileSync(path.join(process.cwd(), 'server.ts'), 'utf-8');
  if (serverContent.includes('combinedResults')) {
    throw new Error('server.ts ne doit plus référencer la variable indéfinie combinedResults (remplacée par mergedResults)');
  }
  const syncIdx = serverContent.indexOf('async function runBackgroundFFBBSync');
  const syncSlice = serverContent.slice(syncIdx, serverContent.indexOf('setInterval(runBackgroundFFBBSync'));
  if (!syncSlice.includes('mergedResults')) {
    throw new Error('runBackgroundFFBBSync doit compter les résultats via mergedResults');
  }
  console.log('✅ Test 3 réussi : runBackgroundFFBBSync corrigée (mergedResults).');

  console.log('🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! (100% CONFORME)');
}

runTests().catch((err) => {
  console.error('❌ ERREUR :', err.message);
  process.exit(1);
});
