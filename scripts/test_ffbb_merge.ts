import { MatchItem } from '../src/types';
import { mergeMatchItems, getFfbbKey, normalizeFfbbNumber } from '../src/utils/ffbbMergeUtils';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ÉCHEC ASSERTION : ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ PASSED: ${message}`);
}

console.log('=== DÉBUT DES TESTS UNITAIRES DE FUSION FFBB ===\n');

// -----------------------------------------------------------------------------
// TEST 1 : Horaire / Date FFBB déplacé
// -----------------------------------------------------------------------------
console.log('--- TEST 1 : Horaire / Date FFBB déplacé ---');
const existing1: MatchItem[] = [{
  id: 'ffbb-101',
  ffbbMatchNumber: '101',
  date: '2026-10-03',
  time: '18:00',
  category: 'U15 M1',
  competition: 'D1',
  teamHome: 'SRC Basket',
  teamAway: 'Charnay',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
  selectedForWeekend: true,
}];
const incoming1: MatchItem[] = [{
  id: 'ffbb-101',
  ffbbMatchNumber: '101',
  date: '2026-10-04', // Date déplacée au dimanche par la FFBB
  time: '15:30',      // Heure déplacée
  category: 'U15 M1',
  competition: 'D1',
  teamHome: 'SRC Basket',
  teamAway: 'Charnay',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];
const res1 = mergeMatchItems(existing1, incoming1);
assert(res1.length === 1, '1 seul match présent après fusion');
assert(res1[0].date === '2026-10-04', 'La date officielle FFBB a bien été mise à jour à 2026-10-04');
assert(res1[0].time === '15:30', 'L\'heure officielle FFBB a bien été mise à jour à 15:30');

// -----------------------------------------------------------------------------
// TEST 2 : Score corrigé manuellement
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2 : Score corrigé manuellement ---');
const existing2: MatchItem[] = [{
  id: 'ffbb-102',
  ffbbMatchNumber: '102',
  date: '2026-09-27',
  time: 'Terminé',
  category: 'Seniors M1',
  competition: 'PNM',
  teamHome: 'SRC Basket',
  teamAway: 'Prissé',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  homeScore: 78,
  awayScore: 75,
  status: 'finished',
  result: 'win',
  isScoreManual: true, // Score corrigé à la main par le club
}];
const incoming2: MatchItem[] = [{
  id: 'ffbb-102',
  ffbbMatchNumber: '102',
  date: '2026-09-27',
  time: 'Terminé',
  category: 'Seniors M1',
  competition: 'PNM',
  teamHome: 'SRC Basket',
  teamAway: 'Prissé',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  homeScore: 70, // PV FFBB avec erreur de saisie
  awayScore: 75,
  status: 'finished',
  result: 'loss',
}];
const res2 = mergeMatchItems(existing2, incoming2);
assert(res2[0].homeScore === 78, 'Score domicile reste 78');
assert(res2[0].awayScore === 75, 'Score extérieur reste 75');
assert(res2[0].result === 'win', 'Statut Victoire préservé');

// -----------------------------------------------------------------------------
// TEST 3 : Match amical local
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3 : Match amical local ---');
const existing3: MatchItem[] = [{
  id: 'match-m-999',
  date: '2026-10-10',
  time: '20:00',
  category: 'Seniors M1',
  competition: 'Amical',
  teamHome: 'SRC Basket',
  teamAway: 'Chalon Amical',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
  isManualMatch: true,
}];
const incoming3: MatchItem[] = [{
  id: 'ffbb-103',
  ffbbMatchNumber: '103',
  date: '2026-10-11',
  time: '15:00',
  category: 'U13 M1',
  competition: 'D2',
  teamHome: 'SRC Basket',
  teamAway: 'Mâcon',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];
const res3 = mergeMatchItems(existing3, incoming3);
assert(res3.length === 2, 'Les 2 matchs sont présents dans la liste');
assert(Boolean(res3.find(m => m.id === 'match-m-999')), 'Le match amical local n\'a pas été effacé');

// -----------------------------------------------------------------------------
// TEST 4 : Sélection TV individuelle hors période
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4 : Sélection TV individuelle hors période ---');
const existing4: MatchItem[] = [{
  id: 'ffbb-104',
  ffbbMatchNumber: '104',
  date: '2026-11-20',
  time: '20:30',
  category: 'U18 M1',
  competition: 'R2',
  teamHome: 'SRC Basket',
  teamAway: 'Autun',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
  selectedForWeekend: false, // Décoché manuellement
}];
const incoming4: MatchItem[] = [{
  id: 'ffbb-104',
  ffbbMatchNumber: '104',
  date: '2026-11-20',
  time: '20:30',
  category: 'U18 M1',
  competition: 'R2',
  teamHome: 'SRC Basket',
  teamAway: 'Autun',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];
const res4 = mergeMatchItems(existing4, incoming4);
assert(res4[0].selectedForWeekend === false, 'selectedForWeekend: false préservé lors d\'une synchro simple');

// -----------------------------------------------------------------------------
// TEST 5 : Nouvelle rencontre et synchronisations successives (anti-doublon)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 5 : Anti-doublons lors de synchros répétées ---');
const existing5: MatchItem[] = [];
const incoming5: MatchItem[] = [{
  id: 'ffbb-105',
  ffbbMatchNumber: '105',
  date: '2026-10-18',
  time: '14:00',
  category: 'U11 M1',
  competition: 'D3',
  teamHome: 'SRC Basket',
  teamAway: 'Digoin',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];
const res5a = mergeMatchItems(existing5, incoming5);
assert(res5a.length === 1, 'Premier téléchargement : 1 match ajouté');
const res5b = mergeMatchItems(res5a, incoming5);
assert(res5b.length === 1, 'Second téléchargement : toujours 1 match, aucun doublon créé');

// -----------------------------------------------------------------------------
// TEST 6 : Compatibilité anciens identifiants (id: "ffbb-123" vs ffbbMatchNumber: "FFBB-123")
// -----------------------------------------------------------------------------
console.log('\n--- TEST 6 : Compatibilité des anciens identifiants FFBB ---');
const legacyExisting: MatchItem[] = [{
  id: 'ffbb-123', // Ancien format sans champ ffbbMatchNumber explicite
  date: '2026-10-01',
  time: '18:00',
  category: 'U17 M1',
  competition: 'R1',
  teamHome: 'SRC Basket',
  teamAway: 'Élan Chalon',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];
const newIncoming: MatchItem[] = [{
  id: 'ffbb-123',
  ffbbMatchNumber: 'FFBB-123', // Nouveau format avec préfixe FFBB-
  date: '2026-10-01',
  time: '18:00',
  category: 'U17 M1',
  competition: 'Régionale 1 M', // Nom officiel mis à jour
  teamHome: 'SRC Basket',
  teamAway: 'Élan Chalon',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];
const res6 = mergeMatchItems(legacyExisting, newIncoming);
assert(res6.length === 1, '1 seule rencontre résultante (anciens et nouveaux IDs FFBB reconnus comme identiques)');
assert(res6[0].competition === 'Régionale 1 M', 'Nom de compétition mis à jour à Régionale 1 M');

// -----------------------------------------------------------------------------
// TEST 7 : Modification officielle de compétition (champ non modifié manuellement)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 7 : Modification officielle de compétition ---');
const existing7: MatchItem[] = [{
  id: 'ffbb-201',
  ffbbMatchNumber: '201',
  date: '2026-10-15',
  time: '20:30',
  category: 'Seniors M1',
  competition: 'Pré-Nationale M', // Ancien nom de poule/compétition
  teamHome: 'SRC Basket',
  teamAway: 'Curgy',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];
const incoming7: MatchItem[] = [{
  id: 'ffbb-201',
  ffbbMatchNumber: '201',
  date: '2026-10-15',
  time: '20:30',
  category: 'Seniors M1',
  competition: 'Nationale 3 M', // Compétition mise à jour par la FFBB
  poule: 'Poule G',
  pouleId: '98765',
  teamHome: 'SRC Basket',
  teamAway: 'Curgy',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];
const res7 = mergeMatchItems(existing7, incoming7);
assert(res7[0].competition === 'Nationale 3 M', 'La compétition a été mise à jour vers Nationale 3 M');
assert(res7[0].poule === 'Poule G', 'La poule a bien été ajoutée à la rencontre');

// -----------------------------------------------------------------------------
// TEST 8 : Édition manuelle d'un match par l'utilisateur
// -----------------------------------------------------------------------------
console.log('\n--- TEST 8 : Édition manuelle d\'un match et drapeaux de protection ---');
const origMatch: MatchItem = {
  id: 'ffbb-301',
  ffbbMatchNumber: '301',
  date: '2026-10-25',
  time: '15:00',
  category: 'U15 F1',
  competition: 'D1',
  teamHome: 'SRC Basket',
  teamAway: 'Sancé',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
};

// Simulation d'une édition manuelle par l'utilisateur (changement du gymnase et de l'heure)
const userEditedMatch: MatchItem = {
  ...origMatch,
  time: '16:00', // Modifié par l'utilisateur
  gymnasium: 'Salle Annexe', // Modifié par l'utilisateur
  isTimeManual: true,
  isGymnasiumManual: true,
};

// Arrivée d'une synchro FFBB proposant d'autres valeurs
const incomingSync: MatchItem[] = [{
  id: 'ffbb-301',
  ffbbMatchNumber: '301',
  date: '2026-10-25',
  time: '15:00', // FFBB a toujours 15:00
  category: 'U15 F1',
  competition: 'D1 Fille', // Compétition modifiée par FFBB
  teamHome: 'SRC Basket',
  teamAway: 'Sancé',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase la Clayette',
  city: 'La Clayette',
  status: 'upcoming',
}];

const res8 = mergeMatchItems([userEditedMatch], incomingSync);
assert(res8[0].time === '16:00', 'Heure modifiée manuellement (16:00) conservée');
assert(res8[0].gymnasium === 'Salle Annexe', 'Gymnase modifié manuellement (Salle Annexe) conservé');
assert(res8[0].competition === 'D1 Fille', 'Compétition officielle FFBB (D1 Fille) mise à jour car non éditée manuellement');

// -----------------------------------------------------------------------------
// TEST 9 : Conservation du nom personnalisé sans remplacement par le nom FFBB
// -----------------------------------------------------------------------------
console.log('\n--- TEST 9 : Conservation du nom personnalisé lors d\'une synchronisation FFBB ---');
const customNamesMap: Record<string, string> = {
  'team-200000005363355': 'U9 Mixte',
  'U9 Mixte': 'U9 Mixte',
};

const existingMatchCustom: MatchItem[] = [{
  id: 'ffbb-901',
  ffbbMatchNumber: '901',
  ffbbTeamId: 'team-200000005363355',
  rawFfbbCategory: 'U9 M1',
  date: '2026-10-18',
  time: '14:00',
  category: 'U9 Mixte', // Nom personnalisé choisi par l'utilisateur
  competition: 'Plateaux Mini-Basket',
  teamHome: 'SRC Basket',
  teamAway: 'Charnay',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  status: 'upcoming',
}];

const incomingFromFfbb: MatchItem[] = [{
  id: 'ffbb-901',
  ffbbMatchNumber: '901',
  ffbbTeamId: 'team-200000005363355',
  rawFfbbCategory: 'U9 M1',
  date: '2026-10-18',
  time: '14:30', // Heure décalée par la FFBB
  category: 'U9 M1', // Nom brut officiel FFBB entrant
  competition: 'Plateaux Mini-Basket U9 - Secteur Charolais',
  teamHome: 'SRC Basket',
  teamAway: 'Charnay',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  status: 'upcoming',
}];

const res9 = mergeMatchItems(existingMatchCustom, incomingFromFfbb, customNamesMap);
assert(res9.length === 1, '1 seul match présent après fusion FFBB');
assert(res9[0].category === 'U9 Mixte', 'Le nom personnalisé "U9 Mixte" est STRICTEMENT conservé (non écrasé par "U9 M1")');
assert(res9[0].time === '14:30', 'L\'heure officielle FFBB a bien été actualisée');
assert(res9[0].competition === 'Plateaux Mini-Basket U9 - Secteur Charolais', 'La compétition FFBB a bien été actualisée');
assert(res9[0].ffbbTeamId === 'team-200000005363355', 'L\'identifiant de rattachement FFBB est conservé');

// -----------------------------------------------------------------------------
// TEST 10 : Changement de nom personnalisé sans création de doublon
// -----------------------------------------------------------------------------
console.log('\n--- TEST 10 : Changement de nom personnalisé sans création de doublon ---');
const updatedCustomMap: Record<string, string> = {
  'team-200000005363355': 'U9 Garçons & Filles',
};

const res10 = mergeMatchItems(res9, incomingFromFfbb, updatedCustomMap);
assert(res10.length === 1, 'Aucun doublon créé même si le nom personnalisé change');
assert(res10[0].category === 'U9 Garçons & Filles', 'Le nouveau nom personnalisé "U9 Garçons & Filles" est appliqué');
assert(res10[0].ffbbTeamId === 'team-200000005363355', 'Identifiant FFBB toujours intact pour relier les matchs');

console.log('\n=============================================================');
console.log('🎉 TOUTES LES ASSERTIONS DE FUSION FFBB SONT VALIDÉES AVEC SUCCÈS ! (10/10)');
console.log('=============================================================\n');
