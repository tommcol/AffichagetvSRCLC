import { getAvailablePosterFilter } from '../src/utils/posterFilterHelpers';

function assert(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    console.error(`❌ ${message}: attendu ${String(expected)}, obtenu ${String(actual)}`);
    process.exit(1);
  }
}

const counts = { home: 2, away: 1, exempt: 0 };
assert(getAvailablePosterFilter('home', counts), 'home', 'home disponible');
assert(getAvailablePosterFilter('away', counts), 'away', 'away disponible');
assert(getAvailablePosterFilter('exempt', counts), 'all', 'exempt indisponible');
assert(getAvailablePosterFilter('all', counts), 'all', 'all reste all');

console.log('🎉 TOUS LES TESTS POSTER FILTER HELPERS SONT PASSÉS ! (4/4)');
