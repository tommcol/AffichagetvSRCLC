import { buildPosterShareFilename } from '../src/utils/posterShareFilenameHelpers';

async function runTests() {
  const cases = [
    ['SRC Basket', 'DOMICILE', 'src_basket_affiche_domicile.png'],
    ['  SRC   Basket  ', 'RÉSULTATS', 'src_basket_affiche_résultats.png'],
    ['SRC Basket', '', 'src_basket_affiche_.png'],
  ];

  for (const [club, badge, expected] of cases) {
    const actual = buildPosterShareFilename(club, badge);
    if (actual !== expected) {
      console.error('❌ Échec:', { club, badge, expected, actual });
      process.exit(1);
    }
  }

  console.log('🎉 Tous les tests poster share filename sont passés ! (3/3)');
}

runTests().catch((err) => {
  console.error('Erreur lors de l\'exécution des tests :', err);
  process.exit(1);
});
