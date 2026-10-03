import { MatchItem } from '../src/types';
import {
  getWeekendMatches,
  getWeekendResults,
  getPosterItemCounts,
  filterPosterItems,
  getMaxDisplayMatches,
  getTotalPages,
  paginatePosterItems,
} from '../src/utils/posterDataHelpers';
import { isExemptItem } from '../src/utils/socialCaptionGenerator';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER DATA HELPERS');
  console.log('================================================================');

  const dummyMatches: MatchItem[] = [
    {
      id: '1',
      category: 'Seniors 1',
      teamHome: 'SRC Basket',
      teamAway: 'CTC Mâcon',
      isHomeMatch: true,
      date: '2026-10-10',
      time: '20:00',
      selectedForWeekend: true,
    },
    {
      id: '2',
      category: 'U15 Garçons',
      teamHome: 'Elan Chalon',
      teamAway: 'SRC Basket',
      isHomeMatch: false,
      date: '2026-10-11',
      time: '14:00',
      selectedForWeekend: true,
    },
    {
      id: '3',
      category: 'U13 Filles',
      teamHome: 'SRC Basket',
      teamAway: 'EXEMPT',
      isHomeMatch: true,
      date: '2026-10-10',
      time: '13:00',
      selectedForWeekend: false,
    },
    {
      id: '4',
      category: 'U11 Mixte',
      teamHome: 'SRC Basket',
      teamAway: 'Prissé',
      isHomeMatch: true,
      date: '2026-10-10',
      time: '10:00',
      selectedForWeekend: true,
    },
  ];

  // --- TEST 1 : getWeekendMatches ---
  console.log('\n--- TEST 1 : getWeekendMatches respecte selectedForWeekend ---');
  const weekendMatches = getWeekendMatches(dummyMatches);
  if (weekendMatches.length === 3 && !weekendMatches.some((m) => m.id === '3')) {
    console.log('✓ Réussi : 3 matchs sélectionnés sur le week-end (l\'élément désélectionné id=3 est ignoré)');
  } else {
    console.error('❌ Échec : getWeekendMatches a échoué', weekendMatches);
    process.exit(1);
  }

  // --- TEST 2 : getWeekendResults ---
  console.log('\n--- TEST 2 : getWeekendResults respecte selectedForWeekend ---');
  const weekendResults = getWeekendResults(dummyMatches);
  if (weekendResults.length === 3) {
    console.log('✓ Réussi : 3 résultats de week-end conservés');
  } else {
    console.error('❌ Échec : getWeekendResults a échoué');
    process.exit(1);
  }

  // --- TEST 3 : Filtre Domicile ---
  console.log('\n--- TEST 3 : Filtre Domicile ---');
  const homeFiltered = filterPosterItems(dummyMatches, 'home', isExemptItem);
  if (homeFiltered.every((m) => m.isHomeMatch)) {
    console.log(`✓ Réussi : ${homeFiltered.length} matchs à domicile filtrés`);
  } else {
    console.error('❌ Échec : Filtre domicile incorrect');
    process.exit(1);
  }

  // --- TEST 4 : Filtre Extérieur ---
  console.log('\n--- TEST 4 : Filtre Extérieur ---');
  const awayFiltered = filterPosterItems(dummyMatches, 'away', isExemptItem);
  if (awayFiltered.every((m) => !m.isHomeMatch)) {
    console.log(`✓ Réussi : ${awayFiltered.length} matchs à l'extérieur filtrés`);
  } else {
    console.error('❌ Échec : Filtre extérieur incorrect');
    process.exit(1);
  }

  // --- TEST 5 : Filtre Exempt ---
  console.log('\n--- TEST 5 : Filtre Exempt ---');
  const exemptFiltered = filterPosterItems(dummyMatches, 'exempt', isExemptItem);
  if (exemptFiltered.length === 1 && exemptFiltered[0].id === '3') {
    console.log('✓ Réussi : 1 match exempt trouvé (id=3 avec "EXEMPT")');
  } else {
    console.error('❌ Échec : Filtre exempt incorrect', exemptFiltered);
    process.exit(1);
  }

  // --- TEST 6 : Filtre ALL ---
  console.log('\n--- TEST 6 : Filtre "all" retourne l\'ensemble des éléments ---');
  const allFiltered = filterPosterItems(dummyMatches, 'all', isExemptItem);
  if (allFiltered.length === dummyMatches.length) {
    console.log('✓ Réussi : Tous les matchs retournés');
  } else {
    console.error('❌ Échec : Filtre ALL incorrect');
    process.exit(1);
  }

  // --- TEST 7 : Tri chronologique conservé ---
  console.log('\n--- TEST 7 : Tri chronologique conservé ---');
  if (allFiltered[0].time === '10:00' && allFiltered[allFiltered.length - 1].date === '2026-10-11') {
    console.log('✓ Réussi : Tri chronologique bien appliqué (10h00 le 10 avant 14h00 le 11)');
  } else {
    console.error('❌ Échec : Tri chronologique non respecté', allFiltered);
    process.exit(1);
  }

  // --- TEST 8 : Compteurs domicile / extérieur / exempt ---
  console.log('\n--- TEST 8 : Compteurs domicile / extérieur / exempt ---');
  const counts = getPosterItemCounts(dummyMatches, isExemptItem);
  if (counts.home === 3 && counts.away === 1 && counts.exempt === 1) {
    console.log('✓ Réussi : Compteurs exacts (home=3, away=1, exempt=1)');
  } else {
    console.error('❌ Échec : Compteurs incorrects', counts);
    process.exit(1);
  }

  // --- TEST 9 : Limits / Ratios getMaxDisplayMatches ---
  console.log('\n--- TEST 9 : Limites selon le ratio et mode manuel ---');
  const limit916 = getMaxDisplayMatches('9:16', 'auto');
  const limit45 = getMaxDisplayMatches('4:5', 'auto');
  const limit11 = getMaxDisplayMatches('1:1', 'auto');
  const limit169 = getMaxDisplayMatches('16:9', 'auto');
  const limitManual = getMaxDisplayMatches('4:5', 3);

  if (limit916 === 6 && limit45 === 6 && limit11 === 4 && limit169 === 6 && limitManual === 3) {
    console.log('✓ Réussi : Limites par ratio (9:16 -> 6, 4:5 -> 6, 1:1 -> 4, 16:9 -> 6, Manuel 3 -> 3)');
  } else {
    console.error('❌ Échec : Limites incorrectes', { limit916, limit45, limit11, limit169, limitManual });
    process.exit(1);
  }

  // --- TEST 10 : Pagination (getTotalPages & paginatePosterItems) ---
  console.log('\n--- TEST 10 : Pagination (10 éléments, 6 par page = 2 pages) ---');
  const tenItems = Array.from({ length: 10 }, (_, i) => ({
    id: `m-${i}`,
    category: `U${i}`,
    teamHome: 'A',
    teamAway: 'B',
  })) as MatchItem[];

  const pages = getTotalPages(tenItems.length, 6);
  const page1 = paginatePosterItems(tenItems, 1, 6);
  const page2 = paginatePosterItems(tenItems, 2, 6);

  if (pages === 2 && page1.length === 6 && page2.length === 4) {
    console.log('✓ Réussi : Pagination correcte (Page 1 = 6 items, Page 2 = 4 items, Total = 2 pages)');
  } else {
    console.error('❌ Échec : Pagination incorrecte', { pages, p1Length: page1.length, p2Length: page2.length });
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER DATA HELPERS SONT PASSÉS ! (10/10)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
