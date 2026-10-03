import { readFileAsDataUrl } from '../src/utils/fileReaderHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION FILE READER HELPERS');
  console.log('================================================================');

  // --- TEST 1 & 2 : Fichier simulé transformé en Data URL (String) ---
  console.log('\n--- TEST 1 & 2 : File simulé transformé en Data URL ---');
  const dummyFile = new File(['fake image content'], 'test.png', { type: 'image/png' });

  try {
    const dataUrl = await readFileAsDataUrl(dummyFile);
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,')) {
      console.log('✓ Réussi : La chaîne Data URL valide a été générée avec succès');
    } else {
      console.error('❌ Échec : Format de Data URL non conforme', dataUrl);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Échec : Exception imprévue lors de la lecture', err);
    process.exit(1);
  }

  // --- TEST 3 : Erreur de lecture rejetée ---
  console.log('\n--- TEST 3 : Rejet d\'erreur de lecture ---');
  const faultyBlob = {
    type: 'image/png',
    arrayBuffer: () => Promise.reject(new Error('Erreur disque simulée')),
  } as unknown as File;

  try {
    await readFileAsDataUrl(faultyBlob);
    console.error('❌ Échec : La promesse aurait dû être rejetée');
    process.exit(1);
  } catch (err: any) {
    if (err && err.message) {
      console.log('✓ Réussi : L\'erreur de lecture a été rejetée correctement :', err.message);
    } else {
      console.error('❌ Échec : Rejet sans message d\'erreur', err);
      process.exit(1);
    }
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE FILE READER HELPERS SONT PASSÉS ! (3/3)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
