import assert from 'node:assert/strict';
import { footballMatches, handballBlocks, sportsMatchForPoster, sportsSourceUrl, volleyballTable } from '../src/utils/sportsFeeds';
import { sportsLab } from '../worker/sportsLab';
import worker from '../worker/index';

const handUrl='https://www.ffhandball.fr/competitions/saison-2030-2031-26/regional/region-exemple/championnat-exemple/equipe-123/';
assert.equal(sportsSourceUrl('handball',handUrl+'?ignored=yes').search,'');
const volleyUrl='https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php?saison=2030/2031&codent=TEST&poule=PNF';
assert.equal(sportsSourceUrl('volleyball',volleyUrl).searchParams.get('calend'),'COMPLET');
for(const bad of ['http://www.ffhandball.fr/competitions/','https://www.ffhandball.fr.evil.invalid/competitions/','https://www.ffhandball.fr@evil.invalid/competitions/','https://127.0.0.1/','https://www.ffhandball.fr:4430/competitions/']) assert.throws(()=>sportsSourceUrl('handball',bad));
assert.throws(()=>sportsSourceUrl('football','../secrets'));
assert.throws(()=>sportsSourceUrl('volleyball',volleyUrl.replace('PNF','https://evil.invalid')));
const selected={selected_equipe:{id:'1',libelle:'Notre club & équipe'}};
const entries={rencontres:[
  {id:'a',equipe1Id:'1',equipe2Id:'2',equipe1Libelle:'Notre club & équipe',equipe2Libelle:'Adversaire',date:'2030-11-03T20:30:00+01:00',equipe1Score:'27',equipe2Score:'27'},
  {id:'b',equipe1Id:'2',equipe2Id:'1',equipe1Libelle:'Adversaire',equipe2Libelle:'Notre club & équipe',date:null,equipe1Score:null,equipe2Score:null},
  {id:'c',equipe1Id:'4',equipe2Id:'5',equipe1Libelle:'Autre club',equipe2Libelle:'Autre'}
]};
const tag=(name:string,value:unknown)=>`<smartfire-component name='${name}' attributes="${JSON.stringify(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></smartfire-component>`;
const html=tag('competitions---poule-selector',selected)+tag('competitions---rencontre-list',entries);
const hand=handballBlocks(html);
assert.equal(hand.matches.length,2);assert.equal(hand.matches[0].time,'20:30');assert.equal(hand.matches[0].played,true);assert.equal(hand.matches[0].homeScore,27);assert.equal(hand.matches[1].date,'');
assert.equal(hand.teams[0].name,'Notre club & équipe');
assert.throws(()=>handballBlocks('<html>Access denied</html>'));
const cells=(values:string[])=>'<tr>'+values.map(v=>`<td>${v}</td>`).join('')+'</tr>';
const volley=volleyballTable('<table>'+cells(['A001','03/11/30','15:00','Équipe A','','Équipe B','0','3','20:25, 21:25, 17:25'])+cells(['A002','10/11/30','00:00','Équipe B','','Équipe A','<input type="image">','','Salle'])+'</table>');
assert.equal(volley.matches[0].homeScore,0);assert.equal(volley.matches[0].awayScore,3);assert.equal(volley.matches[1].played,false);assert.equal(volley.matches[1].date,'2030-11-10');
assert.equal(volley.teams.length,2);
assert.throws(()=>volleyballTable('<html>No games</html>'));
const home={code:'001',short_name:'Équipe locale',club:{cl_no:'123'}},away={code:'002',short_name:'Adversaire',club:{cl_no:'999'}};
const foot=footballMatches([
  {id:'a',home,away,date:'2030-10-01T15:00:00+02:00',home_score:0,away_score:0,status_label:'Terminé'},
  {id:'b',home,away,date:'2031-10-01T15:00:00+02:00',home_score:0,away_score:0,status_label:'À jouer'},
  {id:'c',home:{...home,club:{cl_no:'777'}},away,date:'2030-10-01'},
], '123',Date.parse('2030-11-03T00:00:00Z'));
assert.equal(foot.skipped,1);assert.equal(foot.matches[0].played,true);assert.equal(foot.matches[1].played,false);assert.equal(foot.matches[1].homeScore,undefined);assert.equal(foot.teams.length,1);
const poster=sportsMatchForPoster(hand.matches[1],hand.teams[0]);assert.equal(poster.isHomeMatch,false);assert.equal(poster.teamAway,'Notre club & équipe');assert.equal(poster.ffbbTeamId,undefined);

const originalFetch=globalThis.fetch;let calls=0;
try{
  globalThis.fetch=async(url,init)=>{calls++;assert.equal(new URL(String(url)).hostname,'www.ffhandball.fr');assert.equal(init?.redirect,'manual');assert.equal(init?.method,'GET');return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});};
  const request=new Request('https://example.invalid/api/lab/sports?'+new URLSearchParams({sport:'handball',source:handUrl}));
  assert.equal((await worker.fetch(request,{APP_DEMO:'0'} as any)).status,404);assert.equal(calls,0);
  assert.equal((await sportsLab(new Request(request.url,{method:'POST'}),{APP_DEMO:'1'} as any)).status,405);assert.equal(calls,0);
  const response=await worker.fetch(request,{APP_DEMO:'1'} as any);assert.equal(response.status,200);const feed=await response.json() as any;assert.equal(feed.matches.length,2);assert.equal(calls,1);assert.ok(!JSON.stringify(feed).includes('arbitre'));
  globalThis.fetch=async()=>new Response(null,{status:302,headers:{Location:'https://other.invalid/'}});
  const redirect=await sportsLab(request,{APP_DEMO:'1'} as any);assert.equal(redirect.status,502);assert.match((await redirect.json() as any).error,/redirige/);
  globalThis.fetch=async()=>new Response('Denied',{status:403});
  const denied=await sportsLab(request,{APP_DEMO:'1'} as any);assert.equal(denied.status,502);assert.match((await denied.json() as any).error,/403/);
  globalThis.fetch=async()=>new Response('x'.repeat(2_000_001));
  const huge=await sportsLab(request,{APP_DEMO:'1'} as any);assert.equal(huge.status,502);assert.match((await huge.json() as any).error,/volumineuse/);
  console.log('Sports laboratory: fixed sources, lab-only GET, club/team ownership, ties, unknown dates, volley sets, bounded payloads and explicit failures OK.');
}finally{globalThis.fetch=originalFetch;}
