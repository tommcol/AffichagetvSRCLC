import { buildPosterColorSettings } from '../src/utils/posterColorHelpers';

const full = buildPosterColorSettings('#111111', '#ffffff', '#222222', '#eeeeee');
if (
  full.primaryColor !== '#111111' ||
  full.textColor !== '#ffffff' ||
  full.badgeBgColor !== '#222222' ||
  full.badgeTextColor !== '#eeeeee'
) throw new Error('full color settings failed');

const partial = buildPosterColorSettings(undefined, '#fff');
if (Object.keys(partial).length !== 1 || partial.textColor !== '#fff') {
  throw new Error('partial color settings failed');
}

console.log('posterColorHelpers: 2/2 tests passed');
