import { DEFAULT_CLUB_SETTINGS, DEFAULT_CATEGORIES } from '../src/data/defaultData';
/** Fictional seed for a new isolated installation. Never merge into an existing club. */
export function createStudioDemoData(today = new Date()) {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const date = (days: number) => new Date(start.getTime() + days * 86400000).toISOString().slice(0, 10);
  const saturday = (6 - start.getUTCDay() + 7) % 7;
  const visual = (label: string, color: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="${color}"/><text x="960" y="540" fill="white" text-anchor="middle" font-size="90" font-family="sans-serif">${label}</text></svg>`);
  const background = visual('CLUB DÉMONSTRATION', '#172554');
  const matches = [saturday, saturday, saturday + 1, saturday + 7, saturday + 7, saturday + 8].map((day, i) => ({
    id: `studio-demo-match-${i}`, category: i % 2 ? 'Seniors F1' : 'Seniors M1',
    competition: 'Championnat fictif', date: date(day), time: i % 2 ? '18:30' : '20:00',
    teamHome: i % 2 ? 'ENTENTE SPORTIVE DU GRAND VILLAGE - 2' : 'Club Démonstration',
    teamAway: i % 2 ? 'Club Démonstration' : 'ASSOCIATION DÉMONSTRATION SAINT-MARTIN BASKET - 1',
    isHomeMatch: i % 2 === 0, ourClubName: 'Club Démonstration', selectedForWeekend: true,
    isManualMatch: true, status: 'upcoming', gymnasium: 'Salle de démonstration', city: 'Ville fictive',
  }));
  const results = matches.slice(0, 2).map((m, i) => ({ ...m, id: `studio-demo-result-${i}`, date: date(saturday - 7),
    status: 'finished', homeScore: i ? 76 : 82, awayScore: i ? 70 : 74, result: i ? 'loss' : 'win' }));
  return {
    version: 0, clubSettings: { ...structuredClone(DEFAULT_CLUB_SETTINGS), name: 'Club Démonstration', shortName: 'DÉMO', codeFFBB: '', city: 'Ville fictive',
      primaryColor: '#c8102e', secondaryColor: '#0f172a', logoUrl: visual('DÉMO', '#991b1b'), autoPlayCarousel: true,
      matchesFilterStart: date(saturday), matchesFilterEnd: date(saturday + 1),
      resultsFilterStart: date(saturday - 7), resultsFilterEnd: date(saturday - 6) },
    matches, results, categories: structuredClone(DEFAULT_CATEGORIES),
    sponsors: [{ id: 'studio-demo-sponsor', name: 'Partenaire fictif', tier: 'gold', logoUrl: visual('PARTENAIRE FICTIF', '#14532d') }],
    logos: [{ id: 'studio-demo-logo', name: 'Logo fictif', logoUrl: visual('LOGO FICTIF', '#991b1b'), category: 'club' }],
    photos: [{ id: 'studio-demo-photo', title: 'Image fictive', date: date(0), imageUrl: visual('IMAGE DE TEST', '#164e63') }],
    allMembers: [{ id: 'studio-demo-member', firstName: 'Camille Démo', teamCategory: 'Seniors F1', birthDate: '1990-' + date(1).slice(5) }],
    birthdays: [], events: [], ffbbTeams: [], teamVisuals: [],
    visualTemplates: { matchesBackgroundUrl: background, resultsBackgroundUrl: background, birthdaysBackgroundUrl: background,
      defaultVictoryBackgroundUrl: background, defaultDefeatBackgroundUrl: background,
      matchesSettings: { matchDisplayScope: 'split', backgroundUrl: background },
      resultsSettings: { matchDisplayScope: 'split', backgroundUrl: background },
      birthdaysSettings: { backgroundUrl: background } },
  };
}
