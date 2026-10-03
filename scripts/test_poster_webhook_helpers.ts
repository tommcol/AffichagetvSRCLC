import { buildPosterSocialWebhookPayload } from '../src/utils/posterWebhookHelpers';
function assert(condition: boolean, message: string) { if (!condition) { console.error('❌ ' + message); process.exit(1); } }
const matches = [{ id: 'm1' }]; const results = [{ id: 'r1' }];
const a = buildPosterSocialWebhookPayload({ platform: 'instagram', contentType: 'matches', badgeTitle: 'MATCH', shortClubName: 'SRC', caption: 'Texte', matches, results, totalPages: 2, webhookUrl: 'x' });
assert(a.matches === matches && a.results.length === 0 && a.itemsCount === 1 && a.title === 'SRC • MATCH', 'matches');
const b = buildPosterSocialWebhookPayload({ platform: 'facebook', contentType: 'results', badgeTitle: 'RESULTATS', shortClubName: 'SRC', caption: 'Texte', matches, results, totalPages: 1, webhookUrl: '' });
assert(b.results === results && b.matches.length === 0 && b.itemsCount === 1, 'results');
const d = buildPosterSocialWebhookPayload({ platform: 'tiktok', contentType: 'notification', badgeTitle: 'INFO', shortClubName: 'SRC', caption: 'Texte', matches, results, totalPages: 1, webhookUrl: '' });
assert(d.matches.length === 0 && d.results.length === 0 && d.itemsCount === 0, 'notification');
console.log('🎉 TOUS LES TESTS POSTER WEBHOOK HELPERS SONT PASSÉS ! (7/7)');
