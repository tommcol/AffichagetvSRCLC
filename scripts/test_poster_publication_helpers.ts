import { getPosterPublicationItems } from '../src/utils/posterPublicationHelpers';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('❌ ' + message);
    process.exit(1);
  }
}

const matches = [{ id: 'm1' }] as any;
const results = [{ id: 'r1' }] as any;

const matchPayload = getPosterPublicationItems('matches', matches, results);
assert(matchPayload.matches === matches && matchPayload.results.length === 0, 'matches');

const resultPayload = getPosterPublicationItems('results', matches, results);
assert(resultPayload.results === results && resultPayload.matches.length === 0, 'results');

const notificationPayload = getPosterPublicationItems('notification', matches, results);
assert(notificationPayload.matches.length === 0 && notificationPayload.results.length === 0, 'notification');

console.log('🎉 TOUS LES TESTS POSTER PUBLICATION HELPERS SONT PASSÉS ! (3/3)');
