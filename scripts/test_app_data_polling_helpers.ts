import { getPolledAppDataVersion, getPolledCollections, hasChangedJson } from '../src/utils/appDataPollingHelpers';

const data = { version: 7, results: [], matches: [], categories: [] } as any;

if (getPolledAppDataVersion(data, 4) !== 7) throw new Error('data version failed');
if (getPolledAppDataVersion({} as any, 4) !== 4) throw new Error('response version failed');
if (!hasChangedJson([1], [2])) throw new Error('change detection failed');
const collections = getPolledCollections(data);
if (!Array.isArray(collections.results) || !Array.isArray(collections.matches)) throw new Error('collection extraction failed');

console.log('app data polling helpers: 4/4 OK');
