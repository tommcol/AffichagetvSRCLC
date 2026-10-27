import { getInitialPosterContentType } from '../src/utils/posterContentTypeHelpers';

function assert(actual: string, expected: string, message: string) {
  if (actual !== expected) {
    console.error(`❌ ${message}: attendu ${expected}, obtenu ${actual}`);
    process.exit(1);
  }
}

assert(getInitialPosterContentType('matches'), 'matches', 'matches');
assert(getInitialPosterContentType('results'), 'results', 'results');
assert(getInitialPosterContentType('victory'), 'notification', 'victory');
assert(getInitialPosterContentType('defeat'), 'notification', 'defeat');

console.log('🎉 TOUS LES TESTS POSTER CONTENT TYPE SONT PASSÉS ! (4/4)');
