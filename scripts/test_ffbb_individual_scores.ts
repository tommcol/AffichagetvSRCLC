import assert from 'node:assert/strict';
import { isAwaitingOfficialScore, shouldPollFfbb } from '../src/utils/ffbbMatchDays';
import { createFfbbDataSource } from '../src/utils/ffbbMobileApi';
const now = new Date('2026-11-15T10:00:00Z');
const m = { id:'ffbb-123',date:'2026-11-14',time:'15:00',teamHome:'A',teamAway:'B',status:'finished' };
assert.equal(shouldPollFfbb([m],now),true,'Retry the next day, even marked finished');
assert.equal(isAwaitingOfficialScore({...m,homeScore:0,awayScore:24},now),false);
for (const changes of [{status:'cancelled'},{status:'postponed'},{isScoreManual:true},{teamAway:'Exempt'},{time:''},{id:'excel-123'},{date:'2026-11-16'}]) {
 assert.equal(isAwaitingOfficialScore({...m,...changes},now),false,JSON.stringify(changes));
}
let mode='valid', details=0;
const fetcher: typeof fetch = async input => {
 const u=new URL(String(input));
 if(u.hostname==='ffbb-api.desimone.fr')return Response.json({matches:[]});
 if(u.pathname.endsWith('/configuration'))return Response.json({data:{key_dh:'fixture'}});
 if(u.pathname.endsWith('/organismes/99') || u.pathname.endsWith('/ffbbserver_organismes/99'))return Response.json({data:{id:'99',nom:'A',engagements:[{id:'e1',idPoule:'p1',numeroEquipe:1,idCompetition:{nom:'U13'}}]}});
 if(u.pathname.endsWith('/ffbbserver_rencontres'))return Response.json({data:[{id:'123',idOrganismeEquipe1:'88',idOrganismeEquipe2:'99',idEngagementEquipe2:'e1',nomEquipe1:'B',nomEquipe2:'A',date_rencontre:'2020-01-01T15:00:00',resultatEquipe1:null,resultatEquipe2:null}]});
 if(u.pathname.endsWith('/ffbbserver_rencontres/123')){
  details++;
  if(mode==='failure') return new Response('',{status:503});
  return Response.json({data:{id:'123',idOrganismeEquipe1:'88',idOrganismeEquipe2:mode==='foreign'?'77':'99',idEngagementEquipe2:'e1',resultatEquipe1:mode==='partial'?null:'26',resultatEquipe2:'42'}});
 }
 throw new Error('Unexpected fixture route');
};
const load=()=>createFfbbDataSource(fetcher).get('/api/v1/club/99/matches');
let r=await load();assert.equal(details,1);assert.equal(r.matches[0].scoreEquipe1,26);assert.equal(r.matches[0].scoreEquipe2,42,'Away orientation preserved');
const before=details;
await createFfbbDataSource(fetcher,[{id:'ffbb-123',homeScore:26,awayScore:42}]).get('/api/v1/club/99/matches');
assert.equal(details,before,'Stop individual calls after stored score');
for (const next of ['failure','partial','foreign']) {mode=next;r=await load();assert.equal(r.matches[0].scoreEquipe1,undefined,next);}
console.log('Individual FFBB scores: stale list, next-day retry, identity, complete pair, failures and exclusions OK');
