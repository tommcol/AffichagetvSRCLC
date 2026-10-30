import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
import {getClubFirstMatchPresentation} from '../src/utils/clubFirstMatchPresentation';
import {VisualThemePosterRedSection} from '../src/components/posterSections/VisualThemePosterRedSection';
import {MatchesSlide} from '../src/components/slides/MatchesSlide';
import {ResultsSlide} from '../src/components/slides/ResultsSlide';
import type {MatchItem} from '../src/types';
(globalThis as any).React=React;
const clubSettings:any={name:'Club Exemple',shortName:'Exemple',primaryColor:'#c8102e',secondaryColor:'#111111'};
const settings={effectiveCategoryConfig:{},effectiveBgUrl:'/icon.svg',layer1Brightness:1,layer1Blur:0,layer1Scale:1,layer2PrimaryColor:'#ff0000',layer2BadgeBgColor:'#ff0000',layer2BadgeTextColor:'#ffffff',layer2TextColor:'#ffffff',layer2FontHeader:'bebas',layer2FontBody:'montserrat',badgeTitle:'Programme',safeClubName:'Club Exemple',safeShortName:'Exemple'};
const text=(html:string)=>html.replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ');
for(const isHome of [true,false]){
 const match:MatchItem={id:'fixture',category:'U18 M1',date:'2030-11-08',time:'20:30',teamHome:isHome?'Club Exemple':'Adversaire Exemple',teamAway:isHome?'Adversaire Exemple':'Club Exemple',isHomeMatch:isHome,status:'upcoming',competition:'Championnat',ourClubName:'Club Exemple',gymnasium:'Salle',city:''};
 const result:MatchItem={...match,status:'finished',homeScore:isHome?72:60,awayScore:isHome?60:72,result:'win'};
 const raw=JSON.stringify(result);
 assert.equal(getClubFirstMatchPresentation(result).scoreText,'72 - 60');
 assert.equal(getClubFirstMatchPresentation(result).teamLeft,'U18 M1');
 assert.equal(getClubFirstMatchPresentation(result).teamRight,'Adversaire Exemple');
 for(const aspectRatio of ['4:5','9:16','1:1','16:9'])for(const type of ['matches','results']){
  const fixture=type==='matches'?match:result;
  const html=renderToStaticMarkup(React.createElement(VisualThemePosterRedSection,{...settings,aspectRatio,contentType:type,displayedMatches:[fixture],matches:[fixture],displayedResults:[result],results:[result],posterFilter:isHome?'home':'away',resultDisplayMode:'score'}));
  const t=text(html); assert.ok(t.indexOf('U18 M1')<t.indexOf('Adversaire Exemple'),`${type} ${aspectRatio}: club first`);
  assert.equal((t.match(/U18 M1/g)||[]).length,1);
  assert.equal((t.match(/20:30/g)||[]).length,type==='matches'?1:0,'time only in the centre pill');
  assert.ok(!t.includes('20h30'),'no time beside date');
  assert.ok(t.includes('novembre'),'date retained');
  if(type==='results')assert.ok(t.includes('72 - 60'),'our score first at away games');
  assert.ok(html.includes('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'),'symmetrical date header');
 }
 for(const [Component,props] of [[MatchesSlide,{matches:[match]}],[ResultsSlide,{results:[result]}]] as const){
  const html=renderToStaticMarkup(React.createElement(Component as any,{...props,clubSettings,onDownloadVisual:()=>{},theme:{visualStyle:'poster-red',resultDisplayMode:'score'}}));
  const t=text(html); assert.ok(t.indexOf('U18 M1')<t.indexOf('Adversaire Exemple'),'TV club first');assert.ok(!t.includes('à 20:30'),'TV date without time');
  if(Component===ResultsSlide)assert.ok(t.includes('72 - 60'),'TV away score order');
 }
 assert.equal(JSON.stringify(result),raw,'display must not mutate official data');
}
const exempt:any={category:'U9 Mixte',isHomeMatch:false,teamHome:'Exempt'};
assert.equal(getClubFirstMatchPresentation(exempt,undefined,undefined,true).teamRight,'Exempt');
console.log('Club-first posters: home/away, 4 formats, centred date without duplicated time, result score order and TV render OK');
