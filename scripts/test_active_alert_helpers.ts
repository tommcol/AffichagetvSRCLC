import {
  filterActiveAlerts,
  hasSameActiveAlerts,
  mergeActiveAlert,
  removeActiveAlert,
} from '../src/utils/activeAlertHelpers';

const now = 1_000;
const active = { id: 'a', expiresAt: 2_000 } as any;
const expired = { id: 'b', expiresAt: 900 } as any;

const filtered = filterActiveAlerts([active, expired], now);
if (filtered.length !== 1 || filtered[0].id !== 'a') throw new Error('alert filtering failed');

const merged = mergeActiveAlert(filtered, { id: 'c', expiresAt: 3_000 } as any);
if (merged.length !== 2 || merged[0].id !== 'c') throw new Error('alert merge failed');

const replaced = mergeActiveAlert(merged, { id: 'a', expiresAt: 4_000 } as any);
if (replaced.length !== 2 || replaced[1].id !== 'a') throw new Error('alert replacement failed');

const removed = removeActiveAlert(replaced, 'c');
if (removed.length !== 1 || removed[0].id !== 'a') throw new Error('alert removal failed');

if (!hasSameActiveAlerts(removed, removed)) throw new Error('alert equality failed');

console.log('active alert helpers: 5/5 OK');
