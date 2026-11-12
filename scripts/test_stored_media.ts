import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mediaStorage } from '../worker/mediaStorage';
import { localMediaStorage } from '../server/mediaStorageHelpers';
import { getStoredMediaUsages, storedMediaKey } from '../src/utils/storedMedia';

const origin = 'https://club.example';
let data: any = { version: 7, sponsors: [{ logoUrl: origin + '/api/media/used.png?x=1', enabled: false }],
  visualTemplates: { mediaBank: [{ url: '/uploads/old.png' }] } };
const kv = new Map<string,string>([['app-data', JSON.stringify(data)], ['media:old.png', 'backup'], ['media:used.png', 'used'], ['unrelated','keep']]);
const r2 = new Map([['old.png', 2048], ['used.png', 4096]]);
let deletes = 0;
const env: any = { AFFICHAGE_KV: { get: async (key: string) => kv.get(key) ?? null,
  delete: async (key: string) => { deletes++; kv.delete(key); },
  list: async () => ({ keys: [...kv.keys()].filter(k => k.startsWith('media:')).map(name => ({ name })), list_complete: true }) },
  AFFICHAGE_R2: { list: async () => ({ objects: [...r2].map(([key,size]) => ({key,size})), truncated: false }),
    delete: async (key: string) => { deletes++; r2.delete(key); } } };
const call = (key: string, confirm = true) => mediaStorage(new Request(origin + '/api/media-storage', { method: 'DELETE',
  headers: {'Content-Type': 'application/json'}, body: JSON.stringify({key,confirm}) }), env);
assert.equal(storedMediaKey('https://foreign.example/uploads/used.png', origin), null);
assert.deepEqual(getStoredMediaUsages('used.png', data, [], origin), ['Sponsors']);
assert.deepEqual(getStoredMediaUsages('old.png', data, [], origin), []);
assert.equal((await call('used.png')).status, 409, 'Même désactivé, un sponsor conserve une référence');
assert.equal((await call('../app-data')).status, 400);
assert.equal((await call('old.png', false)).status, 400);
assert.equal(deletes, 0);
env.ADMIN_PASSWORD = 'fixture-password';
assert.equal((await call('old.png')).status, 401);
assert.equal((await mediaStorage(new Request(origin + '/api/media-storage'), env)).status, 401);
delete env.ADMIN_PASSWORD;
const listing = await (await mediaStorage(new Request(origin + '/api/media-storage'), env)).json() as any;
assert.equal(listing.files.find((f: any) => f.key === 'old.png').size, 2048);
assert.deepEqual(listing.files.find((f: any) => f.key === 'used.png').usages, ['Sponsors']);
const before = kv.get('app-data');
assert.equal((await call('old.png')).status, 200);
assert.equal(r2.has('old.png'), false); assert.equal(kv.has('media:old.png'), false);
assert.equal(r2.has('used.png'), true); assert.equal(kv.get('unrelated'), 'keep');
assert.equal(kv.get('app-data'), before, 'Aucune réécriture des données partagées');
kv.set('app-data', '{invalid');
assert.equal((await call('used.png')).status, 503);
kv.set('app-data', before!);
kv.set('alerts', JSON.stringify([{expiresAt: Date.now()+60000,customImageUrl:'/uploads/alert.png'}]));
assert.equal((await call('alert.png')).status, 409);
kv.set('alerts','bad'); assert.equal((await call('used.png')).status,503); kv.delete('alerts');
// Pagination R2 / KV transmise sans supposer qu’une page est complète.
env.AFFICHAGE_R2.list = async ({cursor}: any) => ({objects:[],truncated:true,cursor: cursor ? 'next2' : 'next1'});
assert.equal(((await (await mediaStorage(new Request(origin+'/api/media-storage?cursor=next1'), env)).json()) as any).cursor, 'next2');
env.AFFICHAGE_KV.list = async () => ({keys:[{name:'media:used.png'}],list_complete:false,cursor:'kv-next'});
assert.equal(((await (await mediaStorage(new Request(origin+'/api/media-storage?source=kv'), env)).json()) as any).cursor, 'kv-next');
// Même opération sur un vrai fichier temporaire local, jamais sur la banque du club.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'club-media-test-'));
try {
 fs.writeFileSync(path.join(dir,'unused.png'),'fixture'); fs.writeFileSync(path.join(dir,'used.png'),'keep');
 const local = (key: string) => localMediaStorage(new Request(origin+'/api/media-storage',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,confirm:true})}),[dir],data,[]);
 assert.equal((await local('used.png')).status,409);
 assert.equal((await local('unused.png')).status,200);
 assert.equal(fs.existsSync(path.join(dir,'unused.png')),false); assert.equal(fs.readFileSync(path.join(dir,'used.png'),'utf8'),'keep');
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
console.log('Stored media: auth, aliases, usage protection, confirmations, real R2/KV adapter calls, pagination, failures and isolated local deletion OK');
