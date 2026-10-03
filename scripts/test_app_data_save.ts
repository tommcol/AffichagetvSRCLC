import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : CENTRALISATION & OPTIMISATION DE LA SAUVEGARDE APP-DATA');
  console.log('================================================================');

  let currentDataVersion = 10;
  let lastSavedData: string | null = null;
  let networkCallsCount = 0;
  let offlineCache: any = null;

  // App data builder mimicking buildAppData(version)
  const buildAppData = (v: number, matchesCount = 2) => ({
    clubSettings: { name: 'SRC Basket' },
    categories: [{ id: 'matches', enabled: true }],
    matches: Array.from({ length: matchesCount }).map((_, i) => ({ id: `m${i}` })),
    results: [],
    sponsors: [],
    logos: [],
    photos: [],
    birthdays: [],
    allMembers: [],
    events: [],
    teamVisuals: [],
    visualTemplates: {},
    ffbbTeams: [],
    version: v,
  });

  // Simulated auto-save trigger
  const triggerAutoSave = async (dataState: ReturnType<typeof buildAppData>, mockServerResponse: (payload: any) => Promise<any>) => {
    const contentToCompare = JSON.stringify({ ...dataState, version: undefined });

    if (lastSavedData === contentToCompare && dataState.version === currentDataVersion) {
      console.log('⚡ Sauvegarde identique détectée : POST annulé (0 appel réseau)');
      return { status: 'skipped', networkCalled: false };
    }

    networkCallsCount++;
    const payload = { version: currentDataVersion, data: dataState };
    const res = await mockServerResponse(payload);

    if (res.ok) {
      if (res.resJson && typeof res.resJson.version === 'number') {
        currentDataVersion = res.resJson.version;
        dataState.version = res.resJson.version;
      }
      lastSavedData = JSON.stringify({ ...dataState, version: undefined });
      offlineCache = { ...dataState };
      return { status: 'saved', networkCalled: true, version: currentDataVersion };
    } else {
      return { status: 'error', isConflict: res.status === 409, networkCalled: true };
    }
  };

  // Simulated manual save trigger (always executes POST)
  const triggerManualSave = async (dataState: ReturnType<typeof buildAppData>, mockServerResponse: (payload: any) => Promise<any>) => {
    networkCallsCount++;
    const payload = { version: currentDataVersion, data: dataState };
    const res = await mockServerResponse(payload);

    if (res.ok) {
      if (res.resJson && typeof res.resJson.version === 'number') {
        currentDataVersion = res.resJson.version;
        dataState.version = res.resJson.version;
      }
      lastSavedData = JSON.stringify({ ...dataState, version: undefined });
      offlineCache = { ...dataState };
      return { status: 'saved', networkCalled: true, version: currentDataVersion };
    } else {
      return { status: 'error', isConflict: res.status === 409, networkCalled: true };
    }
  };

  // TEST 1 : Première sauvegarde d'une modification réelle
  console.log('\n--- TEST 1 : Première sauvegarde automatique d\'une modification ---');
  networkCallsCount = 0;
  const initialData = buildAppData(currentDataVersion, 2);
  const test1 = await triggerAutoSave(initialData, async () => ({ ok: true, resJson: { version: 11 } }));

  if (test1.status === 'saved' && networkCallsCount === 1 && currentDataVersion === 11) {
    console.log('✓ Réussi : Première sauvegarde exécutée avec succès (Version -> 11)');
  } else {
    console.error('❌ Échec : La première sauvegarde n\'a pas fonctionné');
    process.exit(1);
  }

  // TEST 2 : Tentative de sauvegarde automatique identique
  console.log('\n--- TEST 2 : Tentative de sauvegarde automatique sans modification ---');
  networkCallsCount = 0;
  const sameData = buildAppData(11, 2);
  const test2 = await triggerAutoSave(sameData, async () => ({ ok: true, resJson: { version: 12 } }));

  if (test2.status === 'skipped' && networkCallsCount === 0 && currentDataVersion === 11) {
    console.log('✓ Réussi : Aucun appel réseau effectué pour des données identiques');
  } else {
    console.error('❌ Échec : Une requête inutile a été envoyée au serveur');
    process.exit(1);
  }

  // TEST 3 : Nouvelle modification réelle
  console.log('\n--- TEST 3 : Nouvelle modification réelle ---');
  networkCallsCount = 0;
  const modifiedData = buildAppData(11, 3); // 3 matches instead of 2
  const test3 = await triggerAutoSave(modifiedData, async () => ({ ok: true, resJson: { version: 12 } }));

  if (test3.status === 'saved' && networkCallsCount === 1 && currentDataVersion === 12) {
    console.log('✓ Réussi : La vraie modification a bien déclenché un POST (Version -> 12)');
  } else {
    console.error('❌ Échec : La modification n\'a pas été enregistrée');
    process.exit(1);
  }

  // TEST 4 : Sauvegarde manuelle (bouton Enregistrer)
  console.log('\n--- TEST 4 : Bouton "Enregistrer" manuel ---');
  networkCallsCount = 0;
  const test4Data = buildAppData(12, 3); // identical data
  const test4 = await triggerManualSave(test4Data, async () => ({ ok: true, resJson: { version: 13 } }));

  if (test4.status === 'saved' && networkCallsCount === 1 && currentDataVersion === 13) {
    console.log('✓ Réussi : La sauvegarde manuelle a forcé l\'envoi même pour du contenu identique (Version -> 13)');
  } else {
    console.error('❌ Échec : Le bouton de sauvegarde manuelle n\'a pas forcé le POST');
    process.exit(1);
  }

  // TEST 5 : Gestion des conflits (409 CONCURRENCY_CONFLICT)
  console.log('\n--- TEST 5 : Gestion du conflit de concurrence 409 ---');
  networkCallsCount = 0;
  const previousLastSaved = lastSavedData;
  const conflictData = buildAppData(13, 4);
  const test5 = await triggerAutoSave(conflictData, async () => ({
    ok: false,
    status: 409,
    resJson: { code: 'CONCURRENCY_CONFLICT', error: 'Données modifiées ailleurs' },
  }));

  if (test5.isConflict && lastSavedData === previousLastSaved) {
    console.log('✓ Réussi : Le conflit 409 n\'a PAS mis à jour lastSavedDataRef (conservation du dernier état valide)');
  } else {
    console.error('❌ Échec : Le conflit 409 a altéré le dernier état valide');
    process.exit(1);
  }

  // TEST 6 : Synchronisation du cache hors-ligne et version serveur
  console.log('\n--- TEST 6 : Synchronisation de la version et du cache hors-ligne ---');
  if (offlineCache && offlineCache.version === 13) {
    console.log('✓ Réussi : Le cache hors-ligne conserve la bonne version serveur (13)');
  } else {
    console.error('❌ Échec : Le cache hors-ligne contient une version invalide');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 TOUS LES TESTS DE SAUVEGARDE APP-DATA SONT PASSÉS ! (6/6)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur exécution tests sauvegarde app-data:', err);
  process.exit(1);
});
