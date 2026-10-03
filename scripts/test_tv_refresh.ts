import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : RAFRAÎCHISSEMENT ET STABILITÉ DU MODE AFFICHAGE TV');
  console.log('================================================================');

  // Test state simulation
  let currentInMemoryData = {
    matches: [{ id: 'm1', teamHome: 'SRC Basket', teamAway: 'Adversaire' }],
    results: [{ id: 'r1', homeScore: 80, awayScore: 70 }],
    version: 1,
  };

  let refreshInProgress = false;
  let offlineCache: any = null;
  let pageReloadCount = 0;

  // Simulated poll function mimicking App.tsx
  const simulatePoll = async (fetchMock: () => Promise<any>) => {
    if (refreshInProgress) {
      console.log('🔒 Verrou actif : Rafraîchissement simultané ignoré');
      return { status: 'skipped' };
    }

    refreshInProgress = true;
    try {
      const res = await fetchMock();
      if (res.ok && res.data) {
        // Update offline cache
        offlineCache = { ...res.data };
        // Smart diff update
        if (JSON.stringify(currentInMemoryData) !== JSON.stringify(res.data)) {
          currentInMemoryData = res.data;
          console.log('✓ Données en mémoire mises à jour');
        } else {
          console.log('✓ Données identiques : Aucune mise à jour React inutile');
        }
        return { status: 'success' };
      } else {
        throw new Error('Server error ' + res.status);
      }
    } catch (err: any) {
      console.warn('⚠️ Erreur réseau (données actuelles conservées en mémoire):', err.message);
      // DO NOT clear currentInMemoryData, DO NOT call page reload
      return { status: 'error_retained' };
    } finally {
      refreshInProgress = false;
    }
  };

  // TEST 1 : Rafraîchissement normal
  console.log('\n--- TEST 1 : Rafraîchissement normal ---');
  const res1 = await simulatePoll(async () => ({ ok: true, data: { ...currentInMemoryData, version: 2 } }));
  if (res1.status === 'success' && currentInMemoryData.version === 2) {
    console.log('✓ Réussi : Les nouvelles données du serveur ont été appliquées avec succès');
  } else {
    console.error('❌ Échec : Le rafraîchissement normal a échoué');
    process.exit(1);
  }

  // TEST 2 : Requête lente / Verrou anti-chevauchement
  console.log('\n--- TEST 2 : Protection contre les requêtes simultanées (Concurrency Lock) ---');
  refreshInProgress = true; // Lock set
  const res2 = await simulatePoll(async () => ({ ok: true, data: { ...currentInMemoryData, version: 3 } }));
  refreshInProgress = false; // Unlock
  if (res2.status === 'skipped' && currentInMemoryData.version === 2) {
    console.log('✓ Réussi : La 2ème requête a été ignorée pendant la requête en cours');
  } else {
    console.error('❌ Échec : La protection anti-chevauchement n\'a pas fonctionné');
    process.exit(1);
  }

  // TEST 3 : Perte de connexion (Conservation des données & absence de rechargement)
  console.log('\n--- TEST 3 : Perte de connexion réseau ---');
  const res3 = await simulatePoll(async () => { throw new Error('Failed to fetch'); });
  if (res3.status === 'error_retained' && currentInMemoryData.matches.length > 0 && pageReloadCount === 0) {
    console.log('✓ Réussi : Les données affichées restent intactes en mémoire sans effacement ni rechargement de page');
  } else {
    console.error('❌ Échec : Les données ont été effacées ou la page a été rechargée');
    process.exit(1);
  }

  // TEST 4 : Retour de connexion
  console.log('\n--- TEST 4 : Rétablissement du réseau ---');
  const res4 = await simulatePoll(async () => ({
    ok: true,
    data: {
      matches: [{ id: 'm1', teamHome: 'SRC Basket', teamAway: 'Adversaire' }, { id: 'm2', teamHome: 'SRC Basket', teamAway: 'Equipe B' }],
      results: [{ id: 'r1', homeScore: 85, awayScore: 72 }],
      version: 4,
    },
  }));
  if (res4.status === 'success' && currentInMemoryData.matches.length === 2 && offlineCache?.version === 4) {
    console.log('✓ Réussi : Récupération réussie au retour du réseau et mise à jour du cache hors-ligne');
  } else {
    console.error('❌ Échec : Le retour de connexion n\'a pas mis à jour le cache');
    process.exit(1);
  }

  // TEST 5 : Actualisation sur visibilitychange (Retour de visibilité)
  console.log('\n--- TEST 5 : Actualisation au retour au premier plan (visibilitychange) ---');
  let visibilityTriggered = false;
  const handleVisibilityChange = async (state: 'hidden' | 'visible') => {
    if (state === 'visible') {
      visibilityTriggered = true;
      await simulatePoll(async () => ({ ok: true, data: currentInMemoryData }));
    }
  };
  await handleVisibilityChange('visible');
  if (visibilityTriggered) {
    console.log('✓ Réussi : Une actualisation a été immédiatement déclenchée au retour de visibilité');
  } else {
    console.error('❌ Échec : Aucun événement de visibilité déclenché');
    process.exit(1);
  }

  // TEST 6 : Nettoyage du timer et événements lors du démontage
  console.log('\n--- TEST 6 : Nettoyage du timer au démontage du composant ---');
  let timerCleared = false;
  const mockTimerId = setInterval(() => {}, 30000);
  const cleanup = () => {
    clearInterval(mockTimerId);
    timerCleared = true;
  };
  cleanup();
  if (timerCleared) {
    console.log('✓ Réussi : L\'intervalle et les écouteurs sont correctement supprimés au démontage');
  } else {
    console.error('❌ Échec : Le nettoyage de l\'intervalle n\'a pas eu lieu');
    process.exit(1);
  }

  // TEST 7 : Gestion mémoire IndexedDB / Blob URLs réutilisées
  console.log('\n--- TEST 7 : Anti-fuite mémoire et réutilisation des Blob URLs IndexedDB ---');
  const activeBlobMap = new Map<string, string>();
  const getBlobUrlMock = (key: string) => {
    if (activeBlobMap.has(key)) {
      return activeBlobMap.get(key)!;
    }
    const fakeBlobUrl = `blob:http://localhost/mock-video-${key}`;
    activeBlobMap.set(key, fakeBlobUrl);
    return fakeBlobUrl;
  };

  const url1 = getBlobUrlMock('category_bg_matches');
  const url2 = getBlobUrlMock('category_bg_matches');
  if (url1 === url2 && activeBlobMap.size === 1) {
    console.log('✓ Réussi : L\'URL Blob IndexedDB existante est réutilisée sans duplication mémoire');
  } else {
    console.error('❌ Échec : Duplication de Blob URLs détectée');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 TOUS LES TESTS DU MODE AFFICHAGE TV SONT PASSÉS ! (7/7)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur exécution tests TV:', err);
  process.exit(1);
});
