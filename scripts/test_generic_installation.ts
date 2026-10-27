import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_CLUB_SETTINGS, DEFAULT_MATCHES, DEFAULT_RESULTS, DEFAULT_REAL_FFBB_TEAMS, DEFAULT_CLUB_MEMBERS } from '../src/data/defaultData';
import { runScheduledFfbbSync, resolveOrganismeId } from '../worker/ffbb';

assert.equal(DEFAULT_CLUB_SETTINGS.codeFFBB, '');
assert.equal(DEFAULT_CLUB_SETTINGS.city, '');
for (const list of [DEFAULT_MATCHES, DEFAULT_RESULTS, DEFAULT_REAL_FFBB_TEAMS, DEFAULT_CLUB_MEMBERS]) assert.equal(list.length, 0);
const configuration = JSON.parse(readFileSync('wrangler.json', 'utf8'));
assert.equal(configuration.kv_namespaces[0].id, 'REMPLACER_PAR_VOTRE_ID_KV');
assert.ok(configuration.secrets.required.includes('ADMIN_PASSWORD'));
for (const file of ['AGENTS.md','docs/CONTEXTE_IA.md','docs/INSTALLATION_CLOUDFLARE.md','COMPTE_RENDU_MODIFICATIONS.txt']) assert.ok(readFileSync(file, 'utf8').length > 100);

const originalFetch = globalThis.fetch;
const calls: string[] = [];
globalThis.fetch = (async (input: any) => {
 const url = String(input); calls.push(url);
 if (url.includes('/next-match?')) return Response.json({status:'ambiguous',club_resolu:{organisme_id:'123456'},candidates:[]});
 if (url.includes('/matches?')) return Response.json({matches:[],total:0});
 if (url.endsWith('/teams')) return Response.json({teams:[]});
 return Response.json({nom:'Club Exemple'});
}) as any;
try {
 assert.equal(await resolveOrganismeId('CODE-FICTIF'), '123456');
 calls.length = 0;
 for (const code of ['', '123456', '654321']) {
  const data = new Map([['app-data', JSON.stringify({clubSettings:{codeFFBB:code},matches:[],results:[]})]]);
  const env:any = {AFFICHAGE_KV:{get:async (key:string)=>data.get(key)||null,put:async(key:string,value:string)=>{data.set(key,value);}}};
  const before = calls.length;
  await runScheduledFfbbSync(env);
  if (!code) assert.equal(calls.length,before,'Unconfigured installation must not contact FFBB');
  else assert.ok(calls.slice(before).some(url=>url.includes(`/club/${code}/matches?`)), 'Cron must use this installation’s configured club');
 }
 console.log('Generic installation: empty defaults, own resources, no implicit club, two distinct clubs OK');
} finally {globalThis.fetch = originalFetch;}
