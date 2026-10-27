import { getPosterClubDisplayNames } from '../src/utils/posterClubHelpers';

function assert(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    console.error(`❌ ${message}: attendu ${String(expected)}, obtenu ${String(actual)}`);
    process.exit(1);
  }
}

const full = getPosterClubDisplayNames({
  shortName: ' CLUB ',
  name: ' Club Basket ',
  gymnasiumDefault: ' Gymnase Municipal ',
});
assert(full.shortName, 'CLUB', 'shortName nettoyé');
assert(full.name, 'Club Basket', 'name nettoyé');
assert(full.gymnasium, 'Gymnase Municipal', 'gymnase nettoyé');

const fallback = getPosterClubDisplayNames({ name: ' Club ' });
assert(fallback.shortName, 'Club', 'fallback shortName');
assert(fallback.name, 'Club', 'fallback name');

console.log('🎉 TOUS LES TESTS POSTER CLUB HELPERS SONT PASSÉS ! (5/5)');
