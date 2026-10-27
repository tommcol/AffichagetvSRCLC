import fs from 'node:fs';
import path from 'node:path';
process.env.APP_DEMO = '1';
const dir = path.join(process.cwd(), '.demo-data');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'saved-app-data.json');
if (!fs.existsSync(file)) {
  const today = new Date();
  const date = (days: number) => { const d = new Date(today); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
  const visual = (label: string, color: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="${color}"/><text x="960" y="540" fill="white" text-anchor="middle" font-size="100" font-family="sans-serif">${label}</text></svg>`);
  const background = visual('CLUB DÉMONSTRATION', '#172554');
  const matches = [0, 1, 1, 2, 7, 8].map((days, i) => ({ id: `fixture-senior-${i}`, category: i % 2 ? 'Seniors F1' : 'Seniors M1',
    date: date(days), time: '20:00', teamHome: i % 2 ? 'ASSOCIATION DÉMONSTRATION SAINT-MARTIN BASKET - 2' : 'Club Démonstration', teamAway: i % 2 ? 'Club Démonstration' : 'ENTENTE SPORTIVE DÉMONSTRATION DU GRAND VILLAGE - 1',
    isHomeMatch: i % 2 === 0, selectedForWeekend: true, gymnasium: 'Salle de démonstration' }));
  fs.writeFileSync(file, JSON.stringify({ version: 0, clubSettings: { name: 'Club Démonstration', shortName: 'DÉMO', codeFFBB: '',
    primaryColor: '#c8102e', secondaryColor: '#0f172a', city: 'Ville fictive', logoUrl: visual('DÉMO', '#991b1b'), autoPlayCarousel: true,
    matchesFilterStart: date(0), matchesFilterEnd: date(2), resultsFilterStart: date(-7), resultsFilterEnd: date(-5) },
    matches, results: [{ ...matches[0], id: 'fixture-result', date: date(-7), result: 'win', homeScore: 72, awayScore: 60 }],
    sponsors: [{ id: 'fixture-sponsor', name: 'Partenaire fictif', tier: 'gold', logoUrl: visual('PARTENAIRE FICTIF', '#14532d') }],
    logos: [{ id: 'fixture-logo', name: 'Logo fictif', logoUrl: visual('LOGO FICTIF', '#991b1b'), category: 'club' }],
    photos: [{ id: 'fixture-photo', title: 'Image fictive', imageUrl: visual('IMAGE DE TEST', '#164e63') }], events: [], birthdays: [],
    allMembers: [{ id: 'fixture-member-current', firstName: 'Camille Démo', teamCategory: 'Seniors F1', birthDate: '1990-' + date(0).slice(5) },
      { id: 'fixture-member-next', firstName: 'Alex Démo', teamCategory: 'Seniors M1', birthDate: '1990-' + date(7).slice(5) }],
    ffbbTeams: [], teamVisuals: [], visualTemplates: { matchesBackgroundUrl: background, resultsBackgroundUrl: background, birthdaysBackgroundUrl: background,
      defaultVictoryBackgroundUrl: background, defaultDefeatBackgroundUrl: background, matchesSettings: { matchDisplayScope: 'split', backgroundUrl: background },
      resultsSettings: { matchDisplayScope: 'split', backgroundUrl: background }, birthdaysSettings: { backgroundUrl: background } } }, null, 2));
}
await import('../server.ts');
