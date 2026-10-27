import {
  calculatePosterPreviewScale,
  calculateInitialPosterPreviewScale,
} from '../src/utils/posterPreviewHelpers';

function assertEqual(actual: number, expected: number, message: string) {
  if (Math.abs(actual - expected) > 0.000001) {
    console.error(`❌ ${message}: attendu ${expected}, obtenu ${actual}`);
    process.exit(1);
  }
}

assertEqual(
  calculatePosterPreviewScale(1080, 1000, 1080, 1350),
  480 / 1080,
  'la largeur maximale doit être plafonnée à 480px'
);

assertEqual(
  calculatePosterPreviewScale(300, 1000, 1080, 1350),
  292 / 1080,
  'la largeur disponible doit être respectée'
);

assertEqual(
  calculatePosterPreviewScale(0, 1000, 1080, 1350),
  0.12,
  'une largeur nulle doit conserver le minimum'
);

console.log('🎉 TOUS LES TESTS POSTER PREVIEW HELPERS SONT PASSÉS ! (6/6)');


function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

assert(calculateInitialPosterPreviewScale(0) === 0.35, 'zero width uses safe fallback');
assert(calculateInitialPosterPreviewScale(1000) === 460 / 1080, 'wide viewport is capped at 460px');
assert(calculateInitialPosterPreviewScale(200) === 168 / 1080, 'small viewport uses available width');
