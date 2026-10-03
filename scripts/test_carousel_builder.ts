import { buildCarouselPlaylist } from '../src/utils/carouselPlaylistBuilder';
import {
  CategoryConfig,
  ClubSettings,
  MatchItem,
  SponsorItem,
  ClubLogoItem,
  ClubPhotoItem,
  ClubEventItem,
  BirthdayItem,
  ActiveMatchAlert,
  VisualTemplatesConfig,
} from '../src/types';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION CAROUSEL PLAYLIST BUILDER');
  console.log('================================================================');

  const mockClubSettings: ClubSettings = {
    name: 'SRC Basket Test',
    shortName: 'SRC',
    codeFFBB: 'BFC0071024',
    logoUrl: '',
    primaryColor: '#ea580c',
    secondaryColor: '#ffffff',
    city: 'La Clayette',
    gymnasiumDefault: 'COSEC',
    victoryNotificationMinutes: 60,
    tickerText: 'Bienvenue',
    showClock: false,
    autoPlayCarousel: true,
    balancedLoopMode: true,
  };

  const mockCategories: CategoryConfig[] = [
    { id: 'sponsors', label: 'Partenaires', shortLabel: 'Sponsors', enabled: true, durationSeconds: 6, icon: '', description: '' },
    { id: 'matches', label: 'Matchs', shortLabel: 'Matchs', enabled: true, durationSeconds: 8, icon: '', description: '' },
    { id: 'results', label: 'Résultats', shortLabel: 'Résultats', enabled: true, durationSeconds: 8, icon: '', description: '' },
  ];

  const mockVisualTemplates: VisualTemplatesConfig = {
    matchesSettings: { matchDisplayScope: 'all' },
    resultsSettings: { matchDisplayScope: 'all' },
  };

  // TEST 1 : Fallback standby en l'absence de contenu
  console.log('\n--- TEST 1 : Fallback standby quand aucun contenu ---');
  const playlistEmpty = buildCarouselPlaylist({
    activeAlerts: [],
    categories: mockCategories,
    sponsors: [],
    logos: [],
    photos: [],
    events: [],
    matches: [],
    results: [],
    birthdays: [],
    clubSettings: mockClubSettings,
    visualTemplates: mockVisualTemplates,
  });

  if (playlistEmpty.length === 1 && playlistEmpty[0].id === 'fallback-standby') {
    console.log('✓ Réussi : Diapositive de secours fallback-standby retournée');
  } else {
    console.error('❌ Échec : Fallback non généré');
    process.exit(1);
  }

  // TEST 2 : Sponsors avec passes selon le niveau (gold=3, silver=2, bronze=1)
  console.log('\n--- TEST 2 : Diapositives sponsors avec niveaux (Passes) ---');
  const mockSponsors: SponsorItem[] = [
    { id: 'sp-gold', name: 'Sponsor Or', tier: 'gold', logoUrl: 'logo1.png' },
    { id: 'sp-silver', name: 'Sponsor Argent', tier: 'silver', logoUrl: 'logo2.png' },
    { id: 'sp-bronze', name: 'Sponsor Bronze', tier: 'bronze', logoUrl: 'logo3.png' },
  ];

  const playlistSponsors = buildCarouselPlaylist({
    activeAlerts: [],
    categories: mockCategories,
    sponsors: mockSponsors,
    logos: [],
    photos: [],
    events: [],
    matches: [],
    results: [],
    birthdays: [],
    clubSettings: mockClubSettings,
    visualTemplates: mockVisualTemplates,
  });

  const goldCount = playlistSponsors.filter((s) => s.sponsor?.id === 'sp-gold').length;
  const silverCount = playlistSponsors.filter((s) => s.sponsor?.id === 'sp-silver').length;
  const bronzeCount = playlistSponsors.filter((s) => s.sponsor?.id === 'sp-bronze').length;

  if (goldCount === 3 && silverCount === 2 && bronzeCount === 1) {
    console.log(`✓ Réussi : Passes Or (${goldCount}), Argent (${silverCount}), Bronze (${bronzeCount}) respectées`);
  } else {
    console.error(`❌ Échec : Mauvais nombre de passes sponsors (${goldCount}, ${silverCount}, ${bronzeCount})`);
    process.exit(1);
  }

  // TEST 3 : Génération des matchs en mode 'all'
  console.log('\n--- TEST 3 : Génération des matchs (mode "all") ---');
  const mockMatches: MatchItem[] = [
    { id: 'm1', date: '2026-10-03', time: '20:00', category: 'SG1', competition: 'R2', teamHome: 'SRC', teamAway: 'Opponent', isHomeMatch: true, ourClubName: 'SRC', gymnasium: 'COSEC', city: 'La Clayette', status: 'upcoming' },
  ];

  const playlistMatchesAll = buildCarouselPlaylist({
    activeAlerts: [],
    categories: mockCategories,
    sponsors: [],
    logos: [],
    photos: [],
    events: [],
    matches: mockMatches,
    results: [],
    birthdays: [],
    clubSettings: mockClubSettings,
    visualTemplates: { matchesSettings: { matchDisplayScope: 'all' } },
  });

  if (playlistMatchesAll.some((s) => s.id === 'cat-matches-all')) {
    console.log('✓ Réussi : Slide cat-matches-all générée correctement');
  } else {
    console.error('❌ Échec : Slide cat-matches-all absente');
    process.exit(1);
  }

  // TEST 4 : Génération des matchs en mode 'split'
  console.log('\n--- TEST 4 : Génération des matchs (mode "split") ---');
  const mockSplitMatches: MatchItem[] = [
    { id: 'm1', date: '2026-10-03', time: '20:00', category: 'SG1', competition: 'R2', teamHome: 'SRC', teamAway: 'Opponent1', isHomeMatch: true, ourClubName: 'SRC', gymnasium: 'COSEC', city: 'La Clayette', status: 'upcoming' },
    { id: 'm2', date: '2026-10-04', time: '15:00', category: 'SF1', competition: 'R3', teamHome: 'Opponent2', teamAway: 'SRC', isHomeMatch: false, ourClubName: 'SRC', gymnasium: 'Autre', city: 'Autre Ville', status: 'upcoming' },
  ];

  const playlistMatchesSplit = buildCarouselPlaylist({
    activeAlerts: [],
    categories: mockCategories,
    sponsors: [],
    logos: [],
    photos: [],
    events: [],
    matches: mockSplitMatches,
    results: [],
    birthdays: [],
    clubSettings: mockClubSettings,
    visualTemplates: { matchesSettings: { matchDisplayScope: 'split' } },
  });

  const hasHome = playlistMatchesSplit.some((s) => s.id === 'cat-matches-home');
  const hasAway = playlistMatchesSplit.some((s) => s.id === 'cat-matches-away');

  if (hasHome && hasAway) {
    console.log('✓ Réussi : Slides cat-matches-home et cat-matches-away générées séparément');
  } else {
    console.error('❌ Échec : Mode split incomplet');
    process.exit(1);
  }

  // TEST 5 : Génération des alertes
  console.log('\n--- TEST 5 : Génération des alertes actives ---');
  const mockAlerts: ActiveMatchAlert[] = [
    { id: 'a1', team: 'Seniors Garçons 1', isWin: true, triggeredBy: 'manual', timestamp: Date.now(), expiresAt: Date.now() + 3600000 },
  ];

  const playlistAlerts = buildCarouselPlaylist({
    activeAlerts: mockAlerts,
    categories: mockCategories,
    sponsors: [],
    logos: [],
    photos: [],
    events: [],
    matches: [],
    results: [],
    birthdays: [],
    clubSettings: mockClubSettings,
    visualTemplates: mockVisualTemplates,
  });

  if (playlistAlerts.some((s) => s.id === 'alert-a1')) {
    console.log('✓ Réussi : Slide d\'alerte alert-a1 présente dans la playlist');
  } else {
    console.error('❌ Échec : Slide d\'alerte non générée');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('🎉 TOUS LES TESTS DE CAROUSEL PLAYLIST BUILDER SONT PASSÉS ! (5/5)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur exécution tests carousel playlist builder:', err);
  process.exit(1);
});
