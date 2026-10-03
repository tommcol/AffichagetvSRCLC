import { generateSocialCaptions, isExemptItem } from '../src/utils/socialCaptionGenerator';
import { MatchItem, ClubSettings, FinishedMatchNotification } from '../src/types';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION SOCIAL CAPTION GENERATOR');
  console.log('================================================================');

  const mockClubSettings: ClubSettings = {
    name: 'Sports Réunis Clayettois',
    shortName: 'SRC Basket',
    codeFFBB: 'BFC0071024',
    logoUrl: '',
    primaryColor: '#ea580c',
    secondaryColor: '#ffffff',
    city: 'La Clayette',
    gymnasiumDefault: 'COSEC',
    victoryNotificationMinutes: 60,
    tickerText: '',
    showClock: false,
    autoPlayCarousel: true,
    instagramHandle: '@srcbasket',
    facebookPage: 'SRC Basket Officiel',
  };

  const safeShortName = 'SRC Basket';
  const safeClubName = 'Sports Réunis Clayettois';
  const safeGymnasium = 'COSEC';

  const mockMatches: MatchItem[] = [
    {
      id: 'm1',
      date: '2026-10-03',
      time: '20:30',
      category: 'Seniors Garçons 1',
      competition: 'Régionale 2',
      teamHome: 'SRC Basket',
      teamAway: 'AL Charnay',
      isHomeMatch: true,
      ourClubName: 'SRC Basket',
      gymnasium: 'COSEC',
      city: 'La Clayette',
      status: 'upcoming',
    },
  ];

  const mockResults: MatchItem[] = [
    {
      id: 'r1',
      date: '2026-09-27',
      time: '18:00',
      category: 'Seniors Filles 1',
      competition: 'Régionale 3',
      teamHome: 'SRC Basket',
      teamAway: 'CS Louhans',
      isHomeMatch: true,
      ourClubName: 'SRC Basket',
      gymnasium: 'COSEC',
      city: 'La Clayette',
      homeScore: 78,
      awayScore: 62,
      status: 'finished',
      result: 'win',
    },
  ];

  // TEST 1 : Légende Instagram pour Matchs
  console.log('\n--- TEST 1 : Légende Instagram Matchs ---');
  const res1 = generateSocialCaptions({
    contentType: 'matches',
    badgeTitle: 'MATCHS DU WEEK-END',
    captionMatches: mockMatches,
    captionResults: [],
    captionStyleProposal: 'standard',
    customCaptions: {},
    isCustomCaptionEdited: {},
    clubSettings: mockClubSettings,
    safeShortName,
    safeClubName,
    safeGymnasium,
  });

  if (res1.instagram.includes('PROGRAMME MATCHS DU WEEK-END') && res1.instagram.includes('#SRC' || '#SRCBasket')) {
    console.log('✓ Réussi : Texte Instagram généré avec succès');
  } else {
    console.error('❌ Échec : Mauvais texte Instagram pour les matchs');
    process.exit(1);
  }

  // TEST 2 : Légende TikTok pour Matchs
  console.log('\n--- TEST 2 : Légende TikTok Matchs ---');
  if (res1.tiktok.includes('#fyp') && res1.tiktok.includes('#basketball')) {
    console.log('✓ Réussi : Texte TikTok généré avec succès avec hashtags #fyp et #basketball');
  } else {
    console.error('❌ Échec : Mauvais texte TikTok');
    process.exit(1);
  }

  // TEST 3 : Légende Facebook pour Résultats
  console.log('\n--- TEST 3 : Légende Facebook Résultats ---');
  const res3 = generateSocialCaptions({
    contentType: 'results',
    badgeTitle: 'RÉSULTATS DU WEEK-END',
    captionMatches: [],
    captionResults: mockResults,
    captionStyleProposal: 'standard',
    customCaptions: {},
    isCustomCaptionEdited: {},
    clubSettings: mockClubSettings,
    safeShortName,
    safeClubName,
    safeGymnasium,
  });

  if (res3.facebook.includes('BILAN DES RENCONTRES') && res3.facebook.includes('1 victoires sur 1')) {
    console.log('✓ Réussi : Texte Facebook Résultats généré avec le bon bilan de victoires');
  } else {
    console.error('❌ Échec : Mauvais texte Facebook Résultats');
    process.exit(1);
  }

  // TEST 4 : Style Short
  console.log('\n--- TEST 4 : Style "short" ---');
  const resShort = generateSocialCaptions({
    contentType: 'matches',
    badgeTitle: 'WEEK-END',
    captionMatches: mockMatches,
    captionResults: [],
    captionStyleProposal: 'short',
    customCaptions: {},
    isCustomCaptionEdited: {},
    clubSettings: mockClubSettings,
    safeShortName,
    safeClubName,
    safeGymnasium,
  });

  if (resShort.instagram.includes('⚡ AGENDA WEEK-END')) {
    console.log('✓ Réussi : Style "short" génère le préfixe ⚡ AGENDA');
  } else {
    console.error('❌ Échec : Style short invalide');
    process.exit(1);
  }

  // TEST 5 : Style Hype
  console.log('\n--- TEST 5 : Style "hype" ---');
  const resHype = generateSocialCaptions({
    contentType: 'matches',
    badgeTitle: 'WEEK-END',
    captionMatches: mockMatches,
    captionResults: [],
    captionStyleProposal: 'hype',
    customCaptions: {},
    isCustomCaptionEdited: {},
    clubSettings: mockClubSettings,
    safeShortName,
    safeClubName,
    safeGymnasium,
  });

  if (resHype.instagram.includes('GAMEDAY ! TOUS ENSEMBLE')) {
    console.log('✓ Réussi : Style "hype" génère le préfixe GAMEDAY ! TOUS ENSEMBLE');
  } else {
    console.error('❌ Échec : Style hype invalide');
    process.exit(1);
  }

  // TEST 6 : Équipe EXEMPT
  console.log('\n--- TEST 6 : Équipe EXEMPT ---');
  const exemptMatch: MatchItem = {
    ...mockMatches[0],
    category: 'U13 Filles',
    teamAway: 'EXEMPT',
  };

  const resExempt = generateSocialCaptions({
    contentType: 'matches',
    badgeTitle: 'WEEK-END',
    captionMatches: [exemptMatch],
    captionResults: [],
    captionStyleProposal: 'standard',
    customCaptions: {},
    isCustomCaptionEdited: {},
    clubSettings: mockClubSettings,
    safeShortName,
    safeClubName,
    safeGymnasium,
  });

  if (resExempt.instagram.includes('EXEMPT ce week-end') && isExemptItem(exemptMatch)) {
    console.log('✓ Réussi : Équipe EXEMPT reconnue et formatée avec ⏸️ EXEMPT');
  } else {
    console.error('❌ Échec : Équipe EXEMPT non traitée correctement');
    process.exit(1);
  }

  // TEST 7 : Notification Victoire
  console.log('\n--- TEST 7 : Notification Victoire ---');
  const winNotif: FinishedMatchNotification = {
    id: 'n1',
    team: 'Seniors Garçons 1',
    isWin: true,
    ourScore: 82,
    opponentScore: 74,
    opponent: 'AL Charnay',
    triggeredBy: 'manual',
    timestamp: Date.now(),
    expiresAt: Date.now() + 3600000,
  };

  const resWinNotif = generateSocialCaptions({
    contentType: 'notification',
    badgeTitle: 'VICTOIRE',
    captionMatches: [],
    captionResults: [],
    captionStyleProposal: 'standard',
    customCaptions: {},
    isCustomCaptionEdited: {},
    specificNotification: winNotif,
    clubSettings: mockClubSettings,
    safeShortName,
    safeClubName,
    safeGymnasium,
  });

  if (resWinNotif.instagram.includes('VICTOIRE ÉCLATANTE') && resWinNotif.instagram.includes('82 - 74')) {
    console.log('✓ Réussi : Notification de victoire générée avec score 82 - 74');
  } else {
    console.error('❌ Échec : Notification de victoire invalide');
    process.exit(1);
  }

  // TEST 8 : Notification Défaite
  console.log('\n--- TEST 8 : Notification Défaite ---');
  const lossNotif: FinishedMatchNotification = {
    ...winNotif,
    isWin: false,
    ourScore: 68,
    opponentScore: 72,
  };

  const resLossNotif = generateSocialCaptions({
    contentType: 'notification',
    badgeTitle: 'DÉFAITE',
    captionMatches: [],
    captionResults: [],
    captionStyleProposal: 'standard',
    customCaptions: {},
    isCustomCaptionEdited: {},
    specificNotification: lossNotif,
    clubSettings: mockClubSettings,
    safeShortName,
    safeClubName,
    safeGymnasium,
  });

  if (resLossNotif.instagram.includes('FIN DU MATCH') && resLossNotif.instagram.includes('68 - 72')) {
    console.error ? console.log('✓ Réussi : Notification de défaite générée correctement') : null;
  } else {
    console.error('❌ Échec : Notification de défaite invalide');
    process.exit(1);
  }

  // TEST 9 : Légende personnalisée éditée conservée
  console.log('\n--- TEST 9 : Légende personnalisée conservée quand modifiée ---');
  const resCustom = generateSocialCaptions({
    contentType: 'matches',
    badgeTitle: 'WEEK-END',
    captionMatches: mockMatches,
    captionResults: [],
    captionStyleProposal: 'standard',
    customCaptions: { instagram: 'Mon texte personnalisé Instagram !' },
    isCustomCaptionEdited: { instagram: true },
    clubSettings: mockClubSettings,
    safeShortName,
    safeClubName,
    safeGymnasium,
  });

  if (resCustom.instagram === 'Mon texte personnalisé Instagram !') {
    console.log('✓ Réussi : La légende personnalisée remplace bien la légende automatique');
  } else {
    console.error('❌ Échec : La légende personnalisée n\'a pas été conservée');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 TOUS LES TESTS DE SOCIAL CAPTION GENERATOR SONT PASSÉS ! (9/9)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur exécution tests social caption generator:', err);
  process.exit(1);
});
