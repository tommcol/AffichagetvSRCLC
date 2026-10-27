import { getPosterContentItems } from '../src/utils/posterContentHelpers';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('❌ ' + message);
    process.exit(1);
  }
}

const matches = [{ id: 'm1' }, { id: 'm2' }];
const results = [{ id: 'r1' }];

assert(
  getPosterContentItems('matches', matches, results) === matches,
  'matches doit retourner la collection des matchs'
);

assert(
  getPosterContentItems('results', matches, results) === results,
  'results doit retourner la collection des résultats'
);

assert(
  getPosterContentItems('notification', matches, results) === matches,
  'notification doit conserver le comportement historique des matchs'
);

console.log('🎉 TOUS LES TESTS POSTER CONTENT HELPERS SONT PASSÉS ! (3/3)');
