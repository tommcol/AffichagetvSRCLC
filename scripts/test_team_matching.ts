import { matchTelegramTeam, DEFAULT_CANONICAL_TEAMS } from '../src/utils/telegramTeamMatcher';

console.log('================================================================');
console.log('TEST SUITE: RECONNAISSANCE INTELLIGENTE DES ÉQUIPES TELEGRAM');
console.log('================================================================');

// 1. Test des U9 Garçons / Mixte reliées à la même équipe
console.log('\n--- TEST 1 : U9 Garçons et U9 Mixte reliées à la même équipe ---');
const u9GarconsRes = matchTelegramTeam('U9 Garçons', DEFAULT_CANONICAL_TEAMS);
const u9MixteRes = matchTelegramTeam('U9 Mixte', DEFAULT_CANONICAL_TEAMS);
const u9ShortRes = matchTelegramTeam('U9', DEFAULT_CANONICAL_TEAMS);
const u9GRes = matchTelegramTeam('u9g', DEFAULT_CANONICAL_TEAMS);
const u9MRes = matchTelegramTeam('U9M', DEFAULT_CANONICAL_TEAMS);

if (!u9GarconsRes.matched || !u9MixteRes.matched || !u9ShortRes.matched || !u9GRes.matched || !u9MRes.matched) {
  throw new Error('Toutes les appellations U9 Garçons et Mixte doivent être reconnues');
}

if (
  u9GarconsRes.teamName !== u9MixteRes.teamName ||
  u9GarconsRes.teamName !== u9ShortRes.teamName ||
  u9GarconsRes.teamName !== u9GRes.teamName ||
  u9GarconsRes.teamName !== u9MRes.teamName
) {
  throw new Error('U9 Garçons et U9 Mixte doivent pointer vers la même équipe : ' + u9GarconsRes.teamName);
}
console.log(`✓ Réussi : "${u9GarconsRes.teamName}" est résolu pour U9 Garçons, U9 Mixte, U9, u9g et U9M`);

// 2. Test tolérance accents, casse, tirets, espaces et abréviations
console.log('\n--- TEST 2 : Tolérance casse, accents, espaces et abréviations ---');
const testsSG = [
  'Seniors Garçons 1',
  'seniors garcons 1',
  'SENIORS GARÇONS 1',
  'Séniors Garçons 1',
  'sg1',
  'SG 1',
  'sm1',
  'SM 1',
  'seniors 1',
];

for (const t of testsSG) {
  const res = matchTelegramTeam(t, DEFAULT_CANONICAL_TEAMS);
  if (!res.matched || res.teamName !== 'Seniors Garçons 1') {
    throw new Error(`Échec pour "${t}": attendu "Seniors Garçons 1", obtenu "${res.teamName}"`);
  }
}
console.log('✓ Réussi : Seniors Garçons 1 reconnu sous toutes ses variantes (SG1, SG 1, SM1, sans accents...)');

const testsSF = [
  'Seniors Filles 1',
  'seniors filles',
  'seniors f',
  'sf1',
  'SF 1',
  'SF',
  'Seniors Féminines',
  'seniors feminines 1',
];

for (const t of testsSF) {
  const res = matchTelegramTeam(t, DEFAULT_CANONICAL_TEAMS);
  if (!res.matched || res.teamName !== 'Seniors Filles 1') {
    throw new Error(`Échec pour "${t}": attendu "Seniors Filles 1", obtenu "${res.teamName}"`);
  }
}
console.log('✓ Réussi : Seniors Filles 1 reconnu sous toutes ses variantes (SF1, SF, Féminines...)');

// 3. Test distinction des équipes numérotées (U13F-1 vs U13F-2)
console.log('\n--- TEST 3 : Distinction U13 Filles 1 vs U13 Filles 2 ---');
const u13f1 = matchTelegramTeam('U13F1', DEFAULT_CANONICAL_TEAMS);
const u13f2 = matchTelegramTeam('u13f-2', DEFAULT_CANONICAL_TEAMS);
if (!u13f1.matched || u13f1.teamName !== 'U13 Filles 1') {
  throw new Error('U13F1 doit être reconnu comme U13 Filles 1');
}
if (!u13f2.matched || u13f2.teamName !== 'U13 Filles 2') {
  throw new Error('u13f-2 doit être reconnu comme U13 Filles 2');
}
console.log('✓ Réussi : U13 Filles 1 et U13 Filles 2 reconnus distinctement');

// 4. Test d\'ambiguïté : ne jamais choisir automatiquement
console.log('\n--- TEST 4 : Ambiguïté sans numéro d\'équipe ---');
const u13fAmbiguous = matchTelegramTeam('U13 Filles', DEFAULT_CANONICAL_TEAMS);
if (u13fAmbiguous.matched) {
  throw new Error('Une saisie ambiguë ("U13 Filles") ne doit PAS être sélectionnée automatiquement !');
}
if (!u13fAmbiguous.isAmbiguous) {
  throw new Error('u13fAmbiguous doit avoir isAmbiguous = true');
}
if (!u13fAmbiguous.suggestions.includes('U13 Filles 1') || !u13fAmbiguous.suggestions.includes('U13 Filles 2')) {
  throw new Error('Les suggestions doivent contenir les deux équipes candidates');
}
console.log(`✓ Réussi : Ambiguïté détectée pour "U13 Filles", suggestions : ${u13fAmbiguous.suggestions.join(', ')}`);

// 5. Test équipe inexistante / inconnue
console.log('\n--- TEST 5 : Équipe inconnue (Ne crée aucune alerte et propose 3 suggestions) ---');
const unknownRes = matchTelegramTeam('Poussins', DEFAULT_CANONICAL_TEAMS);
if (unknownRes.matched) {
  throw new Error('Une équipe non configurée ("Poussins") ne doit pas être validée');
}
if (unknownRes.suggestions.length === 0 || unknownRes.suggestions.length > 3) {
  throw new Error('Doit proposer jusqu\'à 3 équipes configurées proches');
}
console.log(`✓ Réussi : "Poussins" rejeté (aucune alerte), suggestions : ${unknownRes.suggestions.join(', ')}`);

const unknownRes2 = matchTelegramTeam('Real Madrid', DEFAULT_CANONICAL_TEAMS);
if (unknownRes2.matched) {
  throw new Error('Real Madrid ne doit pas être validé');
}
if (unknownRes2.suggestions.length === 0 || unknownRes2.suggestions.length > 3) {
  throw new Error('Doit proposer jusqu\'à 3 suggestions');
}
console.log(`✓ Réussi : "Real Madrid" rejeté, suggestions : ${unknownRes2.suggestions.join(', ')}`);

// 6. Test de toutes les catégories des U9 aux Seniors
console.log('\n--- TEST 6 : Couverture complète des U9 aux Seniors ---');
const expectedTeams = [
  'U9 Garçons / Mixte',
  'U9 Filles 1',
  'U11 Garçons 1',
  'U11 Filles 1',
  'U13 Garçons 1',
  'U13 Filles 1',
  'U13 Filles 2',
  'U15 Garçons 1',
  'U15 Filles 1',
  'U18 Garçons 1',
  'U18 Filles 1',
  'Seniors Garçons 1',
  'Seniors Garçons 2',
  'Seniors Filles 1',
];

for (const exp of expectedTeams) {
  const match = matchTelegramTeam(exp, DEFAULT_CANONICAL_TEAMS);
  if (!match.matched || match.teamName !== exp) {
    throw new Error(`Échec pour équipe canonique "${exp}"`);
  }
}
console.log(`✓ Réussi : Les ${expectedTeams.length} équipes canoniques des U9 aux Seniors sont reconnues à 100%`);

console.log('\n================================================================');
console.log('🎉 TOUS LES TESTS DE RECONNAISSANCE D\'ÉQUIPES SONT PASSÉS ! (6/6)');
console.log('================================================================');
