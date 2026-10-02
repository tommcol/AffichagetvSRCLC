/**
 * Test unitaire et d'intégration : Contrôle de concurrence optimiste (Optimistic Concurrency Control)
 * et Versionnage du document app-data.
 */

import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('TEST SUITE : CONTRÔLE DE CONCURRENCE OPTIMISTE & VERSIONNAGE');
console.log('================================================================');

// 1. Simulation de la logique serveur (identique à worker/index.ts et server.ts)
interface StorageDocument {
  version?: number;
  [key: string]: any;
}

let simulatedKV: Record<string, string> = {};

function kvGet(key: string): StorageDocument | null {
  const raw = simulatedKV[key];
  if (!raw) return null;
  return JSON.parse(raw);
}

function kvPut(key: string, data: StorageDocument): void {
  simulatedKV[key] = JSON.stringify(data);
}

function serverGetAppData() {
  const data = kvGet('app-data');
  const currentVersion = data && typeof data.version === 'number' ? data.version : 0;
  if (data && typeof data.version !== 'number') {
    data.version = currentVersion;
  }
  return { data, version: currentVersion };
}

function serverSaveAppData(body: { data: any; version?: number }) {
  const { data, version: bodyVersion } = body || {};
  if (!data) {
    return { status: 400, error: 'Champ data requis' };
  }

  const currentData = kvGet('app-data');
  let currentVersion = 0;
  if (currentData && typeof currentData.version === 'number') {
    currentVersion = currentData.version;
  }

  const clientVersion = typeof bodyVersion === 'number'
    ? bodyVersion
    : (typeof data.version === 'number' ? data.version : undefined);

  // Détection de conflit de concurrence
  const isConflict = (clientVersion !== undefined && clientVersion !== currentVersion) ||
                     (clientVersion === undefined && currentVersion > 0);

  if (isConflict) {
    return {
      status: 409,
      ok: false,
      success: false,
      error: "Les données ont été modifiées ailleurs. Rechargez les données avant de sauvegarder à nouveau.",
      code: "CONCURRENCY_CONFLICT",
      serverVersion: currentVersion,
      clientVersion: clientVersion ?? null,
    };
  }

  const nextVersion = currentVersion + 1;
  data.version = nextVersion;
  kvPut('app-data', data);

  return { status: 200, ok: true, success: true, version: nextVersion };
}

// -------------------------------------------------------------
// TEST 1 : Données initiales sans version -> version initialisée à 0
// -------------------------------------------------------------
console.log('\n--- TEST 1 : Rétrocompatibilité données sans version ---');
simulatedKV['app-data'] = JSON.stringify({ clubSettings: { name: 'SRC Basket' } });
const getRes1 = serverGetAppData();
if (getRes1.version !== 0 || getRes1.data.version !== 0) {
  throw new Error(`Attendu version 0 pour document sans version, obtenu ${getRes1.version}`);
}
console.log('✓ Réussi : Document legacy initialisé à version 0 sans erreur.');

// -------------------------------------------------------------
// TEST 2 : Première sauvegarde avec version 0 -> Acceptée, version passe à 1
// -------------------------------------------------------------
console.log('\n--- TEST 2 : Première sauvegarde valide (version 0 -> 1) ---');
const clientA_save1 = serverSaveAppData({
  version: 0,
  data: { clubSettings: { name: 'SRC Basket' }, sponsors: ['Sponsor 1'] },
});
if (clientA_save1.status !== 200 || clientA_save1.version !== 1) {
  throw new Error(`Attendu status 200 et version 1, obtenu status ${clientA_save1.status}, version ${clientA_save1.version}`);
}
console.log('✓ Réussi : Première sauvegarde acceptée et version incrémentée à 1.');

// -------------------------------------------------------------
// TEST 3 : Deuxième sauvegarde valide du même client (version 1 -> 2)
// -------------------------------------------------------------
console.log('\n--- TEST 3 : Deuxième sauvegarde valide (version 1 -> 2) ---');
const clientA_save2 = serverSaveAppData({
  version: 1,
  data: { clubSettings: { name: 'SRC Basket' }, sponsors: ['Sponsor 1', 'Sponsor 2'] },
});
if (clientA_save2.status !== 200 || clientA_save2.version !== 2) {
  throw new Error(`Attendu status 200 et version 2, obtenu status ${clientA_save2.status}, version ${clientA_save2.version}`);
}
console.log('✓ Réussi : Deuxième sauvegarde acceptée et version incrémentée à 2.');

// -------------------------------------------------------------
// TEST 4 : Conflit de concurrence ! Client B tente de sauvegarder avec l'ancienne version 1
// -------------------------------------------------------------
console.log('\n--- TEST 4 : Conflit de concurrence (Client B en retard avec version 1) ---');
const clientB_conflictSave = serverSaveAppData({
  version: 1, // Client B n'a pas vu la sauvegarde 2 de Client A !
  data: { clubSettings: { name: 'SRC Basket' }, sponsors: ['Sponsor B Ecrasement'] },
});

if (clientB_conflictSave.status !== 409 || clientB_conflictSave.code !== 'CONCURRENCY_CONFLICT') {
  throw new Error(`La sauvegarde concurrente avec version obsolète DOIT être rejetée avec 409 Conflict. Obtenu ${clientB_conflictSave.status}`);
}
console.log(`✓ Réussi : Sauvegarde concurrente rejetée avec 409 CONFLICT : "${clientB_conflictSave.error}"`);

// -------------------------------------------------------------
// TEST 5 : Vérification de non-écrasement des données serveur
// -------------------------------------------------------------
console.log('\n--- TEST 5 : Vérification de l\'intégrité des données serveur après conflit ---');
const currentServerData = kvGet('app-data')!;
if (currentServerData.version !== 2) {
  throw new Error(`La version sur le serveur doit rester 2. Obtenu ${currentServerData.version}`);
}
if (!Array.isArray(currentServerData.sponsors) || currentServerData.sponsors.includes('Sponsor B Ecrasement')) {
  throw new Error('Les données du serveur ONT ÉTÉ ÉCRASÉES par le conflit !');
}
console.log('✓ Réussi : Les données du serveur sont restées intactes (sponsors protégés).');

// -------------------------------------------------------------
// TEST 6 : Client B recharge les données et sauvegarde avec la bonne version 2
// -------------------------------------------------------------
console.log('\n--- TEST 6 : Rechargement et sauvegarde avec la version à jour (2 -> 3) ---');
const clientB_refreshed = serverGetAppData();
const clientB_validSave = serverSaveAppData({
  version: clientB_refreshed.version, // 2
  data: { ...clientB_refreshed.data, matches: ['Match 1'] },
});
if (clientB_validSave.status !== 200 || clientB_validSave.version !== 3) {
  throw new Error(`Attendu status 200 et version 3 après rechargement, obtenu ${clientB_validSave.status}`);
}
console.log('✓ Réussi : Après rechargement, la sauvegarde est acceptée et passe à version 3.');

// -------------------------------------------------------------
// TEST 7 : Vérification statique dans worker/index.ts et server.ts
// -------------------------------------------------------------
console.log('\n--- TEST 7 : Vérification de conformité dans worker/index.ts et server.ts ---');
const workerContent = fs.readFileSync(path.join(process.cwd(), 'worker', 'index.ts'), 'utf-8');
const serverContent = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf-8');

if (!workerContent.includes('CONCURRENCY_CONFLICT') || !workerContent.includes('status: 409')) {
  throw new Error('worker/index.ts doit contenir la gestion CONCURRENCY_CONFLICT avec statut 409');
}
if (!serverContent.includes('CONCURRENCY_CONFLICT') || !serverContent.includes('status(409)')) {
  throw new Error('server.ts doit contenir la gestion CONCURRENCY_CONFLICT avec statut 409');
}
console.log('✓ Réussi : worker/index.ts et server.ts appliquent la vérification stricte 409.');

console.log('\n================================================================');
console.log('🎉 TOUS LES TESTS DE CONCURRENCE OPTIMISTE SONT PASSÉS ! (7/7)');
console.log('================================================================\n');
