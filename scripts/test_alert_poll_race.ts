import assert from 'node:assert/strict';
import { getAlerts } from '../worker/alerts';
const now=Date.now();
const old={id:'old',expiresAt:now-1};
const active={id:'victory',triggeredBy:'ffbb',matchId:'ffbb-1',expiresAt:now+60000};
const loss={id:'new-loss',triggeredBy:'ffbb',matchId:'ffbb-2',isWin:false,expiresAt:now+60000};
let persisted=[old,active];let writes=0;
const env:any={AFFICHAGE_KV:{get:async()=>{
 const stale=JSON.stringify(persisted);
 // The cron publishes a loss while a TV request still has the old snapshot.
 persisted=[loss,active];return stale;
},put:async(_key:string,raw:string)=>{writes++;persisted=JSON.parse(raw);}}};
const response=await getAlerts(env);const body:any=await response.json();
assert.deepEqual(body.alerts,[active]);assert.equal(body.count,1);
assert.equal(writes,0,'GET must never write a stale snapshot');
assert.ok(persisted.some(a=>a.id===loss.id),'Concurrent loss survives TV polling');
const fresh=await getAlerts({AFFICHAGE_KV:{get:async()=>JSON.stringify([loss,active,active,old])}} as any);
assert.equal((await fresh.json() as any).count,2,'Expired and duplicate alerts stay filtered without writes');
console.log('Alert polling: concurrent loss retained, read-only GET, expired/duplicate response filtering OK');
