import { getServerDataVersion, normalizeLoadedVisualTemplates } from '../src/utils/appDataHelpers';

const data = { version: 7 };
if (getServerDataVersion(data, 9) !== 7) throw new Error('data version priority failed');
if (getServerDataVersion({}, 9) !== 9) throw new Error('response version fallback failed');
if (getServerDataVersion({}, undefined) !== 0) throw new Error('default version failed');

const normalized = normalizeLoadedVisualTemplates({
  matchesSettings: { matchDisplayScope: 'home' },
  resultsSettings: { matchDisplayScope: 'away' },
} as any);

if (normalized.matchesSettings?.matchDisplayScope !== 'split') throw new Error('matches scope normalization failed');
if (normalized.resultsSettings?.matchDisplayScope !== 'split') throw new Error('results scope normalization failed');

console.log('app data helpers: 4/4 OK');
