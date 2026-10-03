import { copyTextToClipboard } from '../src/utils/clipboardHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION CLIPBOARD HELPERS');
  console.log('================================================================');

  // Save original navigator
  const originalNavigator = globalThis.navigator;

  // --- TEST 1 : copyTextToClipboard appelle navigator.clipboard.writeText ---
  console.log('\n--- TEST 1 : Enregistrement du texte via navigator.clipboard.writeText ---');
  let copiedValue = '';
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: {
        writeText: async (text: string) => {
          copiedValue = text;
        },
      },
    },
    writable: true,
    configurable: true,
  });

  try {
    await copyTextToClipboard('Légende SRC Basket');
    if (copiedValue === 'Légende SRC Basket') {
      console.log('✓ Réussi : "Légende SRC Basket" a bien été copié dans le presse-papiers');
    } else {
      console.error('❌ Échec : Texte non copié', copiedValue);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Échec : Exception inattendue lors de la copie', err);
    process.exit(1);
  }

  // --- TEST 2 : Une erreur de writeText est bien propagée ---
  console.log('\n--- TEST 2 : Erreur de writeText correctement propagée ---');
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: {
        writeText: async () => {
          throw new Error('Permission denied');
        },
      },
    },
    writable: true,
    configurable: true,
  });

  try {
    await copyTextToClipboard('Test Erreur');
    console.error('❌ Échec : L\'erreur aurait dû être propagée');
    process.exit(1);
  } catch (err: any) {
    if (err && err.message === 'Permission denied') {
      console.log('✓ Réussi : L\'erreur "Permission denied" a été propagée');
    } else {
      console.error('❌ Échec : Erreur non conforme', err);
      process.exit(1);
    }
  }

  // --- TEST 3 : Absence de Clipboard API provoque une erreur ---
  console.log('\n--- TEST 3 : Absence de Clipboard API déclenche une erreur ---');
  Object.defineProperty(globalThis, 'navigator', {
    value: {},
    writable: true,
    configurable: true,
  });

  try {
    await copyTextToClipboard('Test No Clipboard');
    console.error('❌ Échec : L\'absence de Clipboard API aurait dû provoquer une erreur');
    process.exit(1);
  } catch (err: any) {
    if (err && err.message === 'Clipboard API unavailable') {
      console.log('✓ Réussi : L\'erreur "Clipboard API unavailable" a été déclenchée');
    } else {
      console.error('❌ Échec : Erreur incorrecte pour API absente', err);
      process.exit(1);
    }
  }

  // Restore navigator
  Object.defineProperty(globalThis, 'navigator', {
    value: originalNavigator,
    writable: true,
    configurable: true,
  });

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE CLIPBOARD HELPERS SONT PASSÉS ! (3/3)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
