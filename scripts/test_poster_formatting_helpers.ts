import {
  formatPosterMatchDate,
  formatTeamNameForBadge,
} from '../src/utils/posterFormattingHelpers';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE : EXTRACTION POSTER FORMATTING HELPERS');
  console.log('================================================================');

  // --- TEST 1 : formatPosterMatchDate (ISO YYYY-MM-DD) ---
  console.log('\n--- TEST 1 : formatPosterMatchDate avec date ISO 2026-10-03 et heure 18:30 ---');
  const resIso = formatPosterMatchDate('2026-10-03', '18:30');
  if (resIso === 'Samedi 3 octobre | 18h30') {
    console.log('✓ Réussi : "Samedi 3 octobre | 18h30"');
  } else {
    console.error('❌ Échec : Résultat ISO incorrect', resIso);
    process.exit(1);
  }

  // --- TEST 2 : formatPosterMatchDate (Euro DD/MM/YYYY) ---
  console.log('\n--- TEST 2 : formatPosterMatchDate avec date Euro 03/10/2026 et heure 18:30 ---');
  const resEuro = formatPosterMatchDate('03/10/2026', '18:30');
  if (resEuro === 'Samedi 3 octobre | 18h30') {
    console.log('✓ Réussi : "Samedi 3 octobre | 18h30"');
  } else {
    console.error('❌ Échec : Résultat Euro incorrect', resEuro);
    process.exit(1);
  }

  // --- TEST 3 : formatPosterMatchDate (Date vide) ---
  console.log('\n--- TEST 3 : formatPosterMatchDate sans date ---');
  const resEmpty = formatPosterMatchDate('', '18:30');
  if (resEmpty === 'Samedi | 18h30') {
    console.log('✓ Réussi : "Samedi | 18h30"');
  } else {
    console.error('❌ Échec : Résultat date vide incorrect', resEmpty);
    process.exit(1);
  }

  // --- TEST 4 : formatTeamNameForBadge (Nom court <= 22 char) ---
  console.log('\n--- TEST 4 : formatTeamNameForBadge sur nom court ---');
  const shortName = 'SRC Basket';
  const resShort = formatTeamNameForBadge(shortName);
  if (resShort === 'SRC Basket') {
    console.log('✓ Réussi : Le nom court reste inchangé ("SRC Basket")');
  } else {
    console.error('❌ Échec : Le nom court a été altéré', resShort);
    process.exit(1);
  }

  // --- TEST 5 : formatTeamNameForBadge (Remplacements de termes longs) ---
  console.log('\n--- TEST 5 : formatTeamNameForBadge sur abréviations de noms longs ---');
  const testsCases = [
    { input: 'ASSOCIATION SAINT DENIS BASKETBALL', expected: 'ASS. ST DENIS BASKET' },
    { input: 'BASKET CLUB SPORTS REUNIS CLUB BASKET', expected: 'BC S.R. CB' },
    { input: 'ENTENTE ETOILE SPORTIVE SAINTE', expected: 'ENT. E.S. STE' },
    { input: 'AMICALE LAIQUE SAINT MARCEL', expected: 'A.L. ST MARCEL' },
  ];

  for (const tc of testsCases) {
    const res = formatTeamNameForBadge(tc.input);
    if (res === tc.expected) {
      console.log(`✓ Réussi : "${tc.input}" -> "${res}"`);
    } else {
      console.error(`❌ Échec pour "${tc.input}" : attendu "${tc.expected}", reçu "${res}"`);
      process.exit(1);
    }
  }

  console.log('================================================================');
  console.log('🎉 TOUS LES TESTS DE POSTER FORMATTING HELPERS SONT PASSÉS ! (5/5)');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
