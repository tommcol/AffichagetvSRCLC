import {
  getOfflineAppData,
  getMemberPoolCache,
  getFfbbTeamsCache,
  getActiveAlertsCache,
} from '../src/utils/appStorageHelpers';

const originalLocalStorage = globalThis.localStorage;

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  },
});

store.set('src_app_data_offline_cache', JSON.stringify({ version: 3, matches: [] }));
if (getOfflineAppData()?.version !== 3) throw new Error('offline app data cache failed');

store.set('club_all_members_pool', JSON.stringify([{ name: 'Test' }]));
if (getMemberPoolCache()?.length !== 1) throw new Error('member cache failed');

store.set('ffbb_club_teams_cache', JSON.stringify([{ name: 'U15' }]));
if (getFfbbTeamsCache()?.[0]?.name !== 'U15') throw new Error('FFBB cache failed');

store.set('src_active_alerts_cache', JSON.stringify([
  { id: 'valid', expiresAt: Date.now() + 60_000 },
  { id: 'expired', expiresAt: Date.now() - 1 },
]));
const alerts = getActiveAlertsCache();
if (alerts.length !== 1 || alerts[0].id !== 'valid') throw new Error('alerts cache failed');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: originalLocalStorage,
});

console.log('app storage helpers: 4/4 OK');
