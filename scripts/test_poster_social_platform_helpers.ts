import { getSocialCaptionForPlatform } from '../src/utils/posterSocialPlatformHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER SOCIAL PLATFORM HELPERS');
  console.log('================================================================');

  const mockCaptions = {
    instagram: 'Texte Instagram #basket',
    tiktok: 'Texte TikTok #fyp',
    facebook: 'Texte Facebook du club',
  };

  // --- TEST 1 : Instagram ---
  console.log('\n--- TEST 1 : Instagram avec texte ---');
  const resInsta = getSocialCaptionForPlatform('instagram', mockCaptions);
  if (resInsta === 'Texte Instagram #basket') {
    console.log('✓ Réussi : "Texte Instagram #basket"');
  } else {
    console.error('❌ Échec : Texte Instagram incorrect', resInsta);
    process.exit(1);
  }

  // --- TEST 2 : TikTok ---
  console.log('\n--- TEST 2 : TikTok avec texte ---');
  const resTiktok = getSocialCaptionForPlatform('tiktok', mockCaptions);
  if (resTiktok === 'Texte TikTok #fyp') {
    console.log('✓ Réussi : "Texte TikTok #fyp"');
  } else {
    console.error('❌ Échec : Texte TikTok incorrect', resTiktok);
    process.exit(1);
  }

  // --- TEST 3 : Facebook ---
  console.log('\n--- TEST 3 : Facebook avec texte ---');
  const resFb = getSocialCaptionForPlatform('facebook', mockCaptions);
  if (resFb === 'Texte Facebook du club') {
    console.log('✓ Réussi : "Texte Facebook du club"');
  } else {
    console.error('❌ Échec : Texte Facebook incorrect', resFb);
    process.exit(1);
  }

  // --- TEST 4 : Plateforme sans texte (retourne '') ---
  console.log('\n--- TEST 4 : Plateforme sans texte ---');
  const emptyCaptions = {};
  const resEmpty = getSocialCaptionForPlatform('tiktok', emptyCaptions);
  if (resEmpty === '') {
    console.log('✓ Réussi : Chaine vide "" retournée pour des légendes absentes');
  } else {
    console.error('❌ Échec : Attendu "" mais reçu', resEmpty);
    process.exit(1);
  }

  // --- TEST 5 : Plateforme inconnue fallback vers instagram ---
  console.log('\n--- TEST 5 : Plateforme fallback ---');
  const resFallback = getSocialCaptionForPlatform('unknown', mockCaptions);
  if (resFallback === 'Texte Instagram #basket') {
    console.log('✓ Réussi : Fallback vers Instagram');
  } else {
    console.error('❌ Échec : Fallback incorrect', resFallback);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER SOCIAL PLATFORM HELPERS SONT PASSÉS ! (5/5)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
