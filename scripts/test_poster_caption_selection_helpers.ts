import { MatchItem } from '../src/types';
import {
  getPosterItemKey,
  filterCaptionItems,
  toggleCaptionItemSelection,
} from '../src/utils/posterCaptionSelectionHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER CAPTION SELECTION HELPERS');
  console.log('================================================================');

  const itemWithId: Partial<MatchItem> = {
    id: 'm101',
    category: 'U15',
    teamHome: 'SRC Basket',
    teamAway: 'Mâcon',
  };

  const itemWithoutId: Partial<MatchItem> = {
    category: 'Seniors',
    teamHome: 'SRC Basket',
    teamAway: 'Chalon',
  };

  const emptyItem: Partial<MatchItem> = {};

  // --- TEST 1 : Élément avec ID ---
  console.log('\n--- TEST 1 : Élément avec ID ---');
  const key1 = getPosterItemKey(itemWithId, 0);
  if (key1 === 'm101') {
    console.log('✓ Réussi : Clé "m101" retournée à partir de item.id');
  } else {
    console.error('❌ Échec : Clé ID incorrecte', key1);
    process.exit(1);
  }

  // --- TEST 2 & 3 : Élément sans ID et fallback ---
  console.log('\n--- TEST 2 & 3 : Élément sans ID et clé fallback ---');
  const key2 = getPosterItemKey(itemWithoutId, 1);
  const keyEmpty = getPosterItemKey(emptyItem, 2);

  if (key2 === 'Seniors-SRC Basket-Chalon-1' && keyEmpty === 'cat-home-away-2') {
    console.log('✓ Réussi : Fallback construit ("Seniors-SRC Basket-Chalon-1" et "cat-home-away-2")');
  } else {
    console.error('❌ Échec : Clé fallback incorrecte', { key2, keyEmpty });
    process.exit(1);
  }

  // --- TEST 4 : Sélection null = tous les éléments ---
  console.log('\n--- TEST 4 : Sélection null = tous les éléments filtrés ---');
  const itemsList = [itemWithId, itemWithoutId];
  const filteredAll = filterCaptionItems(itemsList, null);
  if (filteredAll.length === 2) {
    console.log('✓ Réussi : Tous les éléments retournés quand selection === null');
  } else {
    console.error('❌ Échec : Sélection null filtrée incorrectement', filteredAll);
    process.exit(1);
  }

  // --- TEST 5 : Désélection d\'un élément depuis état null ---
  console.log('\n--- TEST 5 : Désélection d\'un élément depuis état null ---');
  const allKeys = ['m101', 'Seniors-SRC Basket-Chalon-1'];
  const nextAfterDeselect = toggleCaptionItemSelection('m101', allKeys, null);
  if (
    Array.isArray(nextAfterDeselect) &&
    nextAfterDeselect.length === 1 &&
    nextAfterDeselect[0] === 'Seniors-SRC Basket-Chalon-1'
  ) {
    console.log('✓ Réussi : Désélection de "m101" produit ["Seniors-SRC Basket-Chalon-1"]');
  } else {
    console.error('❌ Échec : Désélection depuis null incorrecte', nextAfterDeselect);
    process.exit(1);
  }

  // --- TEST 6 : Sélection d\'un élément précédemment désélectionné ---
  console.log('\n--- TEST 6 : Sélection d\'un élément (ajout) ---');
  const currentSelected = ['Seniors-SRC Basket-Chalon-1'];
  const nextAfterSelect = toggleCaptionItemSelection('m101', allKeys, currentSelected);

  // --- TEST 7 : Retour à null quand TOUS les éléments sont sélectionnés ---
  console.log('\n--- TEST 7 : Quand TOUS les éléments sont sélectionnés, retour à null ---');
  if (nextAfterSelect === null) {
    console.log('✓ Réussi : toggleCaptionItemSelection a retourné null car 2/2 clés sont désormais sélectionnées');
  } else {
    console.error('❌ Échec : Attendu null mais reçu', nextAfterSelect);
    process.exit(1);
  }

  // --- TEST 8 : Liste vide ---
  console.log('\n--- TEST 8 : Liste vide ---');
  const emptyFiltered = filterCaptionItems([], ['m101']);
  const emptyToggle = toggleCaptionItemSelection('k1', [], null);
  if (emptyFiltered.length === 0 && Array.isArray(emptyToggle) && emptyToggle.length === 0) {
    console.log('✓ Réussi : Liste vide gérée sans erreur');
  } else {
    console.error('❌ Échec : Gestion de liste vide incorrecte', { emptyFiltered, emptyToggle });
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER CAPTION SELECTION HELPERS SONT PASSÉS ! (8/8)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
