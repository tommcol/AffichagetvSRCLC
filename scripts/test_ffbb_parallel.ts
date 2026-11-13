import assert from 'node:assert/strict';
import { createFfbbDataSource } from '../src/utils/ffbbMobileApi';
import { isClubMatchDay } from '../src/utils/ffbbMatchDays';
import { prepareExcelApiHandoff } from '../src/utils/calendarImportIdentity';
import { mergeMatchItems } from '../src/utils/ffbbMergeUtils';
import { inFixtureScope } from '../src/components/Admin/FixtureScopeFilter';
import worker from '../worker/index';

const club = {id:'99',nom:'CLUB FICTIF',engagements:[{id:'e1',numeroEquipe:'1',idPoule:{id:'p1'},idCompetition:{nom:'U9 Masculin'}}]};
let officialScore: number[] | null = null;
let secondaryScore: number[] | null = [60,55];
let officialFails=false, secondaryFails=false;
let secondaryStarted=false;
const mock: typeof fetch = async (input) => {
 const url=new URL(String(input));
 if(url.hostname==='ffbb-api.desimone.fr'){
  secondaryStarted=true;if(secondaryFails) return new Response('down',{status:503});
  return Response.json({matches:[{ffbbMatchId:'100',scoreLocal:secondaryScore?.[0],scoreOpponent:secondaryScore?.[1],isHome:true,team:'WRONG CLUB',opponent:'WRONG OPPONENT'},
   {ffbbMatchId:'101',team:'FOREIGN CLUB',scoreLocal:80,scoreOpponent:70}]});
 }
 if(url.pathname.endsWith('/configuration')) return Response.json({data:{key_dh:'fixture-token'}});
 if(url.pathname.includes('organismes/99')) return Response.json({data:club});
 if(url.pathname.endsWith('/ffbbserver_rencontres')){
  assert.ok(secondaryStarted,'La seconde requête démarre avant le calendrier officiel');
  if(officialFails) return new Response('down',{status:503});
  const row={id:'100',idOrganismeEquipe1:'99',idOrganismeEquipe2:'88',idEngagementEquipe1:'e1',nomEquipe1:'CLUB FICTIF',nomEquipe2:'ADVERSAIRE',date_rencontre:'2026-11-14T15:00:00',resultatEquipe1:officialScore?.[0]??null,resultatEquipe2:officialScore?.[1]??null};
  if(url.searchParams.has('filter[id][_in]'))return Response.json({data:[{id:'101',idOrganismeEquipe1:'77',idOrganismeEquipe2:'88'}]});
  return Response.json({data:[row]});
 }
 throw new Error('Unexpected route');
};
const load=()=>createFfbbDataSource(mock).get('/api/v1/club/99/matches');
let response=await load();
assert.equal(response.matches.length,1,'Aucun match étranger importé');
assert.equal(response.matches[0].scoreEquipe1,60);assert.equal(response.matches[0].team,'CLUB FICTIF');
officialScore=[61,55];response=await load();assert.equal(response.matches[0].scoreEquipe1,61,'Officiel prioritaire sur un score différent');
secondaryScore=null;response=await load();assert.equal(response.matches[0].scoreEquipe1,61);
secondaryFails=true;response=await load();assert.equal(response.matches[0].scoreEquipe1,61);
officialFails=true;await assert.rejects(load());

const base:any={id:'excel-demo',calendarSource:'excel',ffbbTeamId:'team-e1',category:'U9 M1',date:'2026-11-14',teamHome:'CLUB FICTIF',teamAway:'ADVERSAIRE',isHomeMatch:true,selectedForWeekend:true};
const fresh:any={...base,id:'ffbb-100',ffbbMatchNumber:'FFBB-100',calendarSource:undefined,category:'U9 M2',selectedForWeekend:false};
let handoff=prepareExcelApiHandoff([base,fresh],[],[fresh],[]);
assert.equal(handoff.matches.length,1,'Import Excel + API rapprochés par engagement malgré la catégorie');
assert.equal(mergeMatchItems(handoff.matches,[fresh]).length,1);
const bye={...base,category:'U13 F2',teamAway:'Exempt'};
const unknown={...fresh,category:'U13 F2',teamAway:'Adversaire Inconnu'};
handoff=prepareExcelApiHandoff([bye,unknown],[],[unknown],[]);
assert.equal(handoff.matches.length,1);assert.equal(handoff.matches[0].teamAway,'Exempt');
assert.equal(mergeMatchItems(handoff.matches,[unknown])[0].teamAway,'Exempt','Exemption conservée à la synchronisation suivante');
const phaseBye={...bye,ffbbTeamId:'team-phase1'};
const phaseFresh={...unknown,ffbbTeamId:'team-phase2'};
const grouped:any=[{id:'team-phase1',engagementIds:['team-phase1','team-phase2']}];
const phaseHandoff=prepareExcelApiHandoff([phaseBye,phaseFresh],[],[phaseFresh],[],grouped);
assert.equal(phaseHandoff.matches.length,1,'Alias vérifiés des engagements entre phases');
assert.equal(phaseHandoff.matches[0].teamAway,'Exempt');
assert.equal(prepareExcelApiHandoff([phaseBye],[],[phaseFresh],[]).matches[0].calendarSource,'excel','Sans preuve de correspondance des engagements : ne pas deviner');
assert.equal(prepareExcelApiHandoff([base],[],[fresh,{...fresh,id:'ffbb-101',ffbbMatchNumber:'FFBB-101'}],[]).matches[0].calendarSource,'excel','Ambiguïté : pas de rapprochement forcé');
const corrected={...fresh,homeScore:75,awayScore:70,result:'win',isScoreManual:true,selectedForWeekend:true,isTimeManual:true,time:'18:00'};
const protectedMatch=mergeMatchItems([corrected],[{...fresh,homeScore:61,awayScore:55,time:'15:00'}])[0];
assert.equal(protectedMatch.homeScore,75);assert.equal(protectedMatch.time,'18:00');assert.equal(protectedMatch.selectedForWeekend,true);
assert.equal(isClubMatchDay([base],new Date('2026-11-13T23:30:00Z')),true,'Minuit heure de Paris');
assert.equal(isClubMatchDay([base],new Date('2026-11-13T10:00:00Z')),false);
assert.equal(isClubMatchDay([bye],new Date('2026-11-14T10:00:00Z')),false);
assert.equal(inFixtureScope(bye,'exempt'),true);assert.equal(inFixtureScope(bye,'home'),false);assert.equal(inFixtureScope(bye,'away'),false);
let pending:Promise<unknown>|undefined;let writes=0;
await worker.scheduled({} as any,{AFFICHAGE_KV:{get:async()=>JSON.stringify({matches:[],results:[]}),put:async()=>{writes++;}}} as any,{waitUntil:(p:Promise<unknown>)=>{pending=p;}} as any);await pending;assert.equal(writes,0);
console.log('FFBB parallèle : priorité scores, club, dédoublonnage Excel/API, exemptions, réglages manuels, jours et filtres OK');
