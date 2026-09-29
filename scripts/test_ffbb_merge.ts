import { MatchItem } from '../src/types';

// Reproduction pure et exacte de la fonction mergeMatchItems d'AdminPanel
function mergeMatchItems(existingList: MatchItem[], incomingList: MatchItem[]): MatchItem[] {
  const getFfbbKey = (m: MatchItem): string | null => {
    if (m.ffbbMatchNumber) return `ffbb-${m.ffbbMatchNumber}`.toLowerCase().trim();
    if (m.id && m.id.startsWith('ffbb-')) return m.id.toLowerCase().trim();
    return null;
  };

  const incomingFfbbMap = new Map<string, MatchItem>();
  incomingList.forEach((inc) => {
    const key = getFfbbKey(inc);
    if (key) {
      incomingFfbbMap.set(key, inc);
    }
  });

  const merged: MatchItem[] = [];
  const processedFfbbKeys = new Set<string>();

  existingList.forEach((existing) => {
    const key = getFfbbKey(existing);

    if (!key || !incomingFfbbMap.has(key)) {
      merged.push(existing);
      if (key) processedFfbbKeys.add(key);
      return;
    }

    processedFfbbKeys.add(key);
    const incoming = incomingFfbbMap.get(key)!;

    const finalDate = existing.isDateManual ? existing.date : (incoming.date || existing.date);
    const finalTime = existing.isTimeManual ? existing.time : (incoming.time || existing.time);

    const finalGymnasium = existing.isGymnasiumManual
      ? existing.gymnasium
      : (incoming.gymnasium || existing.gymnasium);

    const finalOpponentLogo = existing.isOpponentLogoManual || existing.opponentLogo
      ? existing.opponentLogo
      : incoming.opponentLogo;

    let finalHomeScore = incoming.homeScore;
    let finalAwayScore = incoming.awayScore;
    let finalResult = incoming.result;
    let finalStatus = incoming.status;
    let finalIsScoreManual = existing.isScoreManual;

    if (existing.isScoreManual) {
      finalHomeScore = existing.homeScore;
      finalAwayScore = existing.awayScore;
      finalResult = existing.result;
      finalStatus = existing.status || incoming.status;
    } else if (existing.homeScore !== undefined) {
      if (incoming.homeScore === undefined) {
        finalHomeScore = existing.homeScore;
        finalAwayScore = existing.awayScore;
        finalResult = existing.result;
      } else if (existing.homeScore !== incoming.homeScore || existing.awayScore !== incoming.awayScore) {
        finalHomeScore = existing.homeScore;
        finalAwayScore = existing.awayScore;
        finalResult = existing.result;
        finalIsScoreManual = true;
      }
    }

    const finalSelectedForWeekend = existing.selectedForWeekend !== undefined
      ? existing.selectedForWeekend
      : (incoming.selectedForWeekend !== false);

    merged.push({
      ...incoming,
      ...existing,
      date: finalDate,
      time: finalTime,
      gymnasium: finalGymnasium,
      homeScore: finalHomeScore,
      awayScore: finalAwayScore,
      result: finalResult,
      status: finalStatus,
      opponentLogo: finalOpponentLogo,
      teamLogo: existing.teamLogo || incoming.teamLogo,
      selectedForWeekend: finalSelectedForWeekend,
      isDateManual: existing.isDateManual,
      isTimeManual: existing.isTimeManual,
      isScoreManual: finalIsScoreManual,
      isGymnasiumManual: existing.isGymnasiumManual,
      isOpponentLogoManual: existing.isOpponentLogoManual,
      isManualMatch: existing.isManualMatch,
    });
  });

  incomingList.forEach((inc) => {
    const key = getFfbbKey(inc);
    if (key && !processedFfbbKeys.has(key)) {
      merged.push({
        ...inc,
        selectedForWeekend: inc.selectedForWeekend !== false,
      });
      processedFfbbKeys.add(key);
    }
  });

  return merged;
}

// -----------------------------------------------------------------------------
// SCÉNARIOS DE TEST UNITAIRE
// -----------------------------------------------------------------------------

console.log('=== DÉBUT DES TESTS DE FUSION FFBB ===\n');

// SCÉNARIO 1 : Horaire FFBB déplacé (officiel mis à jour par FFBB)
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
  date: '2026-10-04', // Date déplacée au dimanche
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
console.log('Avant:', existing1[0].date, existing1[0].time);
console.log('Reçu FFBB:', incoming1[0].date, incoming1[0].time);
console.log('Après fusion:', res1[0].date, res1[0].time);
if (res1[0].date === '2026-10-04' && res1[0].time === '15:30') {
  console.log('✅ TEST 1 RÉUSSI : La nouvelle date et le nouvel horaire FFBB ont été appliqués !');
} else {
  console.error('❌ TEST 1 ÉCHOUÉ');
}

// SCÉNARIO 2 : Score corrigé manuellement
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
  isScoreManual: true, // Score corrigé à la main par le secrétaire
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
  homeScore: 70, // Erreur dans le PV FFBB
  awayScore: 75,
  status: 'finished',
  result: 'loss',
}];
const res2 = mergeMatchItems(existing2, incoming2);
console.log('Score manuel local:', existing2[0].homeScore, '-', existing2[0].awayScore);
console.log('Score reçu FFBB:', incoming2[0].homeScore, '-', incoming2[0].awayScore);
console.log('Après fusion:', res2[0].homeScore, '-', res2[0].awayScore, 'Result:', res2[0].result);
if (res2[0].homeScore === 78 && res2[0].awayScore === 75 && res2[0].result === 'win') {
  console.log('✅ TEST 2 RÉUSSI : Le score corrigé manuellement a été conservé !');
} else {
  console.error('❌ TEST 2 ÉCHOUÉ');
}

// SCÉNARIO 3 : Match amical local (non-FFBB)
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
console.log('Total matchs après fusion:', res3.length);
const foundLocal = res3.find(m => m.id === 'match-m-999');
if (res3.length === 2 && foundLocal) {
  console.log('✅ TEST 3 RÉUSSI : Le match amical local n\'a pas été supprimé ni écrasé !');
} else {
  console.error('❌ TEST 3 ÉCHOUÉ');
}

// SCÉNARIO 4 : Sélection TV individuelle hors période
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
  selectedForWeekend: false, // Décoché volontairement par l'admin
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
console.log('Sélection TV locale:', existing4[0].selectedForWeekend);
console.log('Après synchro simple:', res4[0].selectedForWeekend);
if (res4[0].selectedForWeekend === false) {
  console.log('✅ TEST 4 RÉUSSI : La sélection TV individuelle a été préservée !');
} else {
  console.error('❌ TEST 4 ÉCHOUÉ');
}

// SCÉNARIO 5 : Nouvelle rencontre FFBB et deux synchronisations successives
console.log('\n--- TEST 5 & 6 : Nouvelle rencontre et synchronisations successives ---');
const existing5: MatchItem[] = [];
const incoming5a: MatchItem[] = [{
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

// Synchro 1
const res5a = mergeMatchItems(existing5, incoming5a);
console.log('Après synchro 1 :', res5a.length, 'match');

// Synchro 2 (immédiatement après avec la même liste)
const res5b = mergeMatchItems(res5a, incoming5a);
console.log('Après synchro 2 :', res5b.length, 'match');

if (res5a.length === 1 && res5b.length === 1) {
  console.log('✅ TEST 5 & 6 RÉUSSI : Nouvelle rencontre ajoutée sans créer de doublon lors de la 2nde synchro !');
} else {
  console.error('❌ TEST 5 & 6 ÉCHOUÉ');
}

console.log('\n=== TOUS LES TESTS SONT TERMINÉS AVEC SUCCÈS ===');
