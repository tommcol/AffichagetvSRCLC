import assert from 'node:assert/strict';
import { getAlertMediaCandidates } from '../src/utils/alertMedia';
import { runScheduledFfbbSync } from '../worker/ffbb';
import { fixtureFfbbFetch } from './fixtures/ffbbFixtureFetch';

const templates: any = {
  commonVictoryVisuals: ['/api/media/win-a.mp4', '/api/media/win-b.mp4'],
  commonDefeatVisuals: ['/api/media/loss.png'],
  defaultVictoryBackgroundUrl: '/api/media/default-win.png',
  defaultDefeatBackgroundUrl: '/api/media/default-loss.png',
  visualTitleConfigs: { '/api/media/loss.png': { customTitle: 'On continue !', isCustomized: true } },
};
const original = JSON.stringify(templates);
const legacy = { id: 'legacy-alert', isWin: true };
const candidates = getAlertMediaCandidates(legacy, undefined, templates);
assert.ok(templates.commonVictoryVisuals.includes(candidates[0]), 'Existing FFBB alert uses the victory bank');
assert.deepEqual(getAlertMediaCandidates(legacy, undefined, templates), candidates, 'Stable selection on refresh');
assert.equal(getAlertMediaCandidates({ ...legacy, customImageUrl: '/custom.png' }, undefined, templates)[0], '/custom.png');
assert.equal(getAlertMediaCandidates(legacy, undefined, templates, '/override.png')[0], '/override.png');
assert.deepEqual(getAlertMediaCandidates({ ...legacy, isWin: false }, undefined, templates), ['/api/media/loss.png', '/api/media/default-loss.png']);
assert.deepEqual(getAlertMediaCandidates(legacy), [], 'No media keeps the built-in background');
assert.deepEqual(getAlertMediaCandidates(legacy, undefined, { commonVictoryVisuals: ['', '/a', '/a'] } as any), ['/a']);

const originalFetch = globalThis.fetch;
try {
  for (const isWin of [true, false]) {
    const base = { id: 'ffbb-900001', ffbbMatchNumber: 'FFBB-900001', category: 'Seniors F1', date: '2030-11-09', time: '20:30', teamHome: 'CLUB EXEMPLE', teamAway: 'ADVERSAIRE FICTIF', isHomeMatch: true, selectedForWeekend: false };
    const store = new Map([['app-data', JSON.stringify({ version: 1, clubSettings: { codeFFBB: '999999' }, matches: [base], results: [], visualTemplates: templates })]]);
    const env: any = { AFFICHAGE_KV: { get: async (key: string) => store.get(key) || null, put: async (key: string, value: string) => { store.set(key, value); } } };
    const rows = [{ ffbbMatchId: '900001', dateISO: base.date, time: base.time, team: 'Seniors Filles 1', competition: 'Seniors Féminin', opponent: base.teamAway, isHome: true, scoreLocal: isWin ? 68 : 65, scoreOpponent: isWin ? 65 : 68 }];
    globalThis.fetch = fixtureFfbbFetch(() => rows, 'Seniors Féminin');
    await runScheduledFfbbSync(env);
    const alerts = JSON.parse(store.get('alerts') || '[]');
    assert.equal(alerts.length, 1);
    const alert = alerts[0];
    assert.equal(alert.isWin, isWin);
    assert.ok((isWin ? templates.commonVictoryVisuals : templates.commonDefeatVisuals).includes(alert.customImageUrl), 'Cron selects the correct bank');
    assert.equal(alert.ourScore, rows[0].scoreLocal);
    assert.equal(alert.expiresAt - alert.timestamp, 60 * 60 * 1000, 'One-hour lifetime preserved');
    if (!isWin) assert.deepEqual(alert.titleConfig, templates.visualTitleConfigs[alert.customImageUrl]);
    const saved = JSON.parse(store.get('app-data')!);
    assert.deepEqual(saved.visualTemplates, templates, 'Media bank never changed');
    await runScheduledFfbbSync(env);
    assert.equal(JSON.parse(store.get('alerts')!).length, 1, 'No duplicate alert');
  }
} finally { globalThis.fetch = originalFetch; }
assert.equal(JSON.stringify(templates), original);
console.log('Alert media: victory/loss cron, legacy alerts, overrides, stable fallback, title, duration and bank preservation OK');
