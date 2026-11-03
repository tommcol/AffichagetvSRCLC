import assert from 'node:assert/strict';
import worker from '../worker/index';
import { createDeploymentConfig } from './configure-cloudflare.mjs';
import { createStudioDemoData } from './studioDemoData';
import { readFileSync } from 'node:fs';
const base=JSON.parse(readFileSync('wrangler.json','utf8'));
const env={DEPLOY_WORKER_NAME:'example-studio-test',DEPLOY_KV_NAMESPACE_ID:'a'.repeat(32),DEPLOY_R2_BUCKET_NAME:'example-studio-test-media',DEPLOY_DO_MIGRATION_TAG:'app-data-v1',DEPLOY_DO_INSTANCE_NAME:'demo',DEPLOY_DEMO:'1'};
const demo=createDeploymentConfig(base,env);
assert.equal(demo.vars.APP_DEMO,'1');assert.deepEqual(demo.triggers.crons,[]);assert.deepEqual(demo.secrets.required,[]);
assert.throws(()=>createDeploymentConfig(base,{...env,DEPLOY_WORKER_NAME:'example-production'}),/distinct/);
const normal=createDeploymentConfig(base,{...env,DEPLOY_DEMO:undefined});
assert.deepEqual(normal.triggers,base.triggers);assert.deepEqual(normal.secrets,base.secrets);assert.equal(normal.vars.APP_DEMO,undefined);
let touched=false;
const isolated=new Proxy({APP_DEMO:'1'}, {get(target,key){if(key==='APP_DEMO')return '1';touched=true;throw Error('Integration or storage accessed');}}) as any;
for(const path of ['/api/ffbb/matches','/api/ffbb/search','/api/ffbb/debug','/api/telegram-webhook','/api/telegram/test','/api/telegram/connect','/api/telegram/disconnect','/api/generate-caption','/api/social/publish']) {
  const r=await worker.fetch(new Request('https://example.invalid'+path,{method:'POST'}),isolated);
  assert.equal(r.status,403,path);assert.equal((await r.json() as any).demo,true);
}
await worker.scheduled({} as any,isolated,{waitUntil(){touched=true;}} as any);assert.equal(touched,false);
const data=createStudioDemoData(new Date('2030-11-05T10:00:00Z'));
assert.equal(data.matches.length,6);assert.equal(data.results.length,2);assert.equal(data.ffbbTeams.length,0);assert.equal(data.clubSettings.codeFFBB,'');
assert.equal(new Set(data.matches.map(m=>m.id)).size,6);
assert.ok(data.matches.every(m=>m.category.startsWith('Seniors') && m.isManualMatch));
assert.equal(data.clubSettings.matchesFilterStart,'2030-11-09');assert.equal(data.clubSettings.matchesFilterEnd,'2030-11-10');
assert.ok(!/"https?:\/\//.test(JSON.stringify(data)));
console.log('Isolated lab: explicit config opt-in, no cron, external services blocked before storage, fictional seed OK.');
