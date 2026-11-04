import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MatchesSlide } from '../src/components/slides/MatchesSlide';
import { ResultsSlide } from '../src/components/slides/ResultsSlide';
import { getAdaptivePosterCardSizing } from '../src/utils/posterAdaptiveSizing';
import { formatTeamNameForBadge } from '../src/utils/posterFormattingHelpers';
import type { MatchItem, ClubSettings } from '../src/types';
const club={name:'Club Exemple',shortName:'EXEMPLE'} as ClubSettings;
const opponent='ASSOCIATION SPORTIVE DE LA VALLÉE ET DES MONTAGNES - 2';
for(const count of [1,2,3,4,6,10]){
 const matches:MatchItem[]=Array.from({length:count},(_,i)=>({id:String(i),date:'2030-11-09',time:'20:30',category:`U${11+i} F1`,competition:'Championnat',gymnasium:'',city:'',isHomeMatch:i%2===0,ourClubName:club.name,teamHome:i%2?opponent:club.name,teamAway:i%2?club.name:opponent,status:'upcoming',selectedForWeekend:true}));
 const results:MatchItem[]=matches.map(m=>({...m,status:'finished',homeScore:m.isHomeMatch?104:98,awayScore:m.isHomeMatch?98:104,result:'win'}));
 const original=JSON.stringify({matches,results});
 for(const kind of ['matches','results'] as const){
  const Component=kind==='matches'?MatchesSlide:ResultsSlide;
  const html=renderToStaticMarkup(React.createElement(Component as any,{[kind]:kind==='matches'?matches:results,clubSettings:club,onDownloadVisual:()=>{},hideShareButton:true,theme:{visualStyle:'poster-red',resultDisplayMode:'both'}}));
  assert.equal((html.match(/data-tv-team="/g)||[]).length,count*2,'Every team name must use a measured box');
  assert.equal((html.match(new RegExp(formatTeamNameForBadge(opponent),'g'))||[]).length,count,'Long name must remain visible, without ellipsis');
  assert.ok(html.includes(`height:${getAdaptivePosterCardSizing(count,'16:9').pillHeight}px`),'Same pill geometry as social posters');
  if(kind==='results'){assert.ok(!html.includes('novembre'),'No date on results');assert.equal((html.match(/104 - 98/g)||[]).length,count,'Club score stays first for away fixtures too');}
 }
 assert.equal(JSON.stringify({matches,results}),original,'Rendering never changes stored match data');
}
assert.ok(getAdaptivePosterCardSizing(2,'16:9').pillHeight>getAdaptivePosterCardSizing(4,'16:9').pillHeight);
assert.ok(getAdaptivePosterCardSizing(4,'16:9').pillHeight>getAdaptivePosterCardSizing(6,'16:9').pillHeight);
console.log('TV poster fitting: 1/2/3/4/6/10 rows, full names, shared sizing, away scores and immutable data OK.');
