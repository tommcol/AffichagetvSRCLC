import { buildPosterAiCaptionRequestPayload } from '../src/utils/posterAiCaptionHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER AI CAPTION HELPERS');
  console.log('================================================================');

  const dummyMatches = [{ id: 'm1' }];
  const dummyResults = [{ id: 'r1' }];

  // --- TEST 1, 2, 3 : Plateformes ---
  console.log('\n--- TEST 1, 2, 3 : Verification des plateformes (instagram, tiktok, facebook) ---');
  const payloadInsta = buildPosterAiCaptionRequestPayload({
    platform: 'instagram',
    contentType: 'matches',
    matches: dummyMatches,
    results: [],
    clubName: 'SRC Basket',
    shortClub: 'SRC',
    gymnasium: 'Gymnase Municipal',
    tone: 'supporter',
    extraContext: 'Ambiance de folie',
  });

  const payloadTikTok = buildPosterAiCaptionRequestPayload({
    platform: 'tiktok',
    contentType: 'matches',
    matches: dummyMatches,
    results: [],
    clubName: 'SRC Basket',
    shortClub: 'SRC',
    gymnasium: 'Gymnase Municipal',
    tone: 'supporter',
    extraContext: 'Ambiance de folie',
  });

  const payloadFB = buildPosterAiCaptionRequestPayload({
    platform: 'facebook',
    contentType: 'matches',
    matches: dummyMatches,
    results: [],
    clubName: 'SRC Basket',
    shortClub: 'SRC',
    gymnasium: 'Gymnase Municipal',
    tone: 'supporter',
    extraContext: 'Ambiance de folie',
  });

  if (
    payloadInsta.platform === 'instagram' &&
    payloadTikTok.platform === 'tiktok' &&
    payloadFB.platform === 'facebook'
  ) {
    console.log('✓ Réussi : Les plateformes sont correctement renseignées');
  } else {
    console.error('❌ Échec : Plateformes incorrectes', {
      insta: payloadInsta.platform,
      tiktok: payloadTikTok.platform,
      fb: payloadFB.platform,
    });
    process.exit(1);
  }

  // --- TEST 4, 5, 6 : ContentTypes ---
  console.log('\n--- TEST 4, 5, 6 : Conversion de contentType vers type (results -> results, matches/notification -> matches) ---');
  const payloadResults = buildPosterAiCaptionRequestPayload({
    platform: 'instagram',
    contentType: 'results',
    matches: [],
    results: dummyResults,
    clubName: 'SRC Basket',
    shortClub: 'SRC',
    gymnasium: 'Gymnase',
    tone: 'officiel',
    extraContext: '',
  });

  const payloadMatches = buildPosterAiCaptionRequestPayload({
    platform: 'instagram',
    contentType: 'matches',
    matches: dummyMatches,
    results: [],
    clubName: 'SRC Basket',
    shortClub: 'SRC',
    gymnasium: 'Gymnase',
    tone: 'officiel',
    extraContext: '',
  });

  const payloadNotif = buildPosterAiCaptionRequestPayload({
    platform: 'instagram',
    contentType: 'notification',
    matches: [],
    results: [],
    clubName: 'SRC Basket',
    shortClub: 'SRC',
    gymnasium: 'Gymnase',
    tone: 'officiel',
    extraContext: '',
  });

  if (
    payloadResults.type === 'results' &&
    payloadMatches.type === 'matches' &&
    payloadNotif.type === 'matches'
  ) {
    console.log('✓ Réussi : Conversions de type exactes (results -> results, matches/notif -> matches)');
  } else {
    console.error('❌ Échec : ContentType conversion incorrecte', {
      res: payloadResults.type,
      mat: payloadMatches.type,
      notif: payloadNotif.type,
    });
    process.exit(1);
  }

  // --- TEST 7 & 8 : Intégrité des données matches, results, club, etc. ---
  console.log('\n--- TEST 7 & 8 : Conservation sans altération des tableaux et metadonnées ---');
  if (
    payloadInsta.matches === dummyMatches &&
    payloadInsta.clubName === 'SRC Basket' &&
    payloadInsta.shortClub === 'SRC' &&
    payloadInsta.gymnasium === 'Gymnase Municipal' &&
    payloadInsta.tone === 'supporter' &&
    payloadInsta.extraContext === 'Ambiance de folie'
  ) {
    console.log('✓ Réussi : Toutes les métadonnées et références sont rigoureusement préservées');
  } else {
    console.error('❌ Échec : Intégrité du payload non respectée', payloadInsta);
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER AI CAPTION HELPERS SONT PASSÉS ! (8/8)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
