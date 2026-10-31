import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MatchItem } from '../../types';
import { GraphicTemplate, GraphicTextStyle, GraphicBox, ClubFont } from '../../utils/graphicTemplates';
import { POSTER_DIMENSIONS, PosterAspectRatio } from '../../utils/posterExporter';
import { getClubFirstMatchPresentation } from '../../utils/clubFirstMatchPresentation';
import { formatTeamCalendarDate, TeamCalendarRow } from '../../utils/teamCalendarHelpers';
import { isExemptItem } from '../../utils/socialCaptionGenerator';
import { loadClubFont } from '../../utils/clubFonts';
import { PosterMedia } from '../posterSections/PosterMedia';

const position=(b:GraphicBox):React.CSSProperties=>({position:'absolute',left:`${b.x}%`,top:`${b.y}%`,width:`${b.width}%`,height:`${b.height}%`});
function TextBox({text,style,box,fontRevision}:{text:string;style:GraphicTextStyle;box:GraphicBox;fontRevision:number}) {
  const ref=useRef<HTMLDivElement>(null);
  const [overflow,setOverflow]=useState(false);
  useLayoutEffect(()=>{
    const el=ref.current;if(!el) return;
    const fit=()=>{
      let size=style.size;el.style.fontSize=`${size}px`;
      while(size>style.minSize && (el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1)) {size--;el.style.fontSize=`${size}px`;}
      setOverflow(el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1);
    };
    fit();const observer=new ResizeObserver(fit);observer.observe(el);return()=>observer.disconnect();
  },[text,style,box,fontRevision]);
  return <div style={{...position(box),background:style.shape==='text'||style.shape==='outline'?'transparent':style.background,
    color:style.color,border:style.shape==='text'?'none':`${style.borderWidth}px solid ${style.borderColor}`,
    borderRadius:style.shape==='pill'?999:style.shape==='rounded'?18:0,opacity:style.opacity,
    display:'flex',alignItems:'center',padding:'8px 12px',outline:overflow?'3px solid #f59e0b':undefined}}>
    <div ref={ref} data-template-overflow={overflow?'true':undefined} style={{width:'100%',maxHeight:'100%',overflow:'hidden',fontFamily:`"${style.font}", sans-serif`,fontSize:style.size,fontWeight:style.font.startsWith('clubfont_')?400:700,lineHeight:1.12,whiteSpace:'pre-line',overflowWrap:'anywhere',textAlign:style.align}}>{text}</div>
  </div>;
}
export function GraphicTemplateRenderer({model,format,title,matches,results=false,calendarRows,clubName,shortName,backgroundUrl,fonts=[]}:{
  model:GraphicTemplate;format:PosterAspectRatio;title:string;matches:MatchItem[];results?:boolean;calendarRows?:TeamCalendarRow[];clubName?:string;shortName?:string;backgroundUrl?:string;fonts?:ClubFont[];
}) {
  const l=model.layouts[format], dims=POSTER_DIMENSIONS[format];
  const [fontState,setFontState]=useState({ready:false,error:'',revision:0});
  const fontKey=JSON.stringify(Object.values(model.styles).map(s=>s.font));
  const libraryKey=JSON.stringify(fonts);
  useEffect(()=>{
    let cancelled=false;setFontState(s=>({...s,ready:false,error:''}));
    const families=[...new Set(Object.values(model.styles).map(s=>s.font))];
    Promise.all(families.map(async family=>{
      if(family.startsWith('clubfont_')) {
        const font=fonts.find(f=>f.family===family);if(!font) throw new Error('Une police du modèle manque dans la bibliothèque.');await loadClubFont(font);
      }else await document.fonts.load(`700 32px "${family}"`);
    })).then(()=>{if(!cancelled)setFontState(s=>({ready:true,error:'',revision:s.revision+1}));}).catch(error=>{if(!cancelled)setFontState(s=>({...s,ready:false,error:String(error.message||error)}));});
    return()=>{cancelled=true;};
  },[fontKey,libraryKey]);
  const rows=calendarRows || matches;
  const height=Math.min(l.maxRowHeight,(dims.height*l.area.height/100-Math.max(0,rows.length-1)*l.gap)/Math.max(1,rows.length));
  return <div data-graphic-template={model.id} data-template-pending={!fontState.ready?'true':undefined} style={{position:'absolute',inset:0,background:model.background,color:'#fff'}}>
    {model.useClubBackground && backgroundUrl && <PosterMedia src={backgroundUrl} alt="Fond du modèle" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>}
    {model.useClubBackground && <div style={{position:'absolute',inset:0,background:model.background,opacity:model.backgroundOpacity}}/>}
    <TextBox text={title} style={model.styles.title} box={l.title} fontRevision={fontState.revision}/>
    <div style={{...position(l.area),display:'flex',flexDirection:'column',justifyContent:'center',gap:l.gap}}>
      {rows.map((row,index)=>{
        let values:Record<'team'|'opponent'|'score'|'date',string>;
        if(calendarRows){
          const pair=row as TeamCalendarRow;
          const date=(m?:MatchItem)=>m?`${getClubFirstMatchPresentation(m,clubName,shortName).isHome?'DOMICILE':'EXTÉRIEUR'}\n${formatTeamCalendarDate(m.date)}`:'';
          values={team:date(pair.first),score:pair.opponent,opponent:date(pair.second),date:''};
        }else{
          const match=row as MatchItem;
          const p=getClubFirstMatchPresentation(match,clubName,shortName,isExemptItem(match));
          values={team:p.teamLeft,opponent:p.teamRight,score:isExemptItem(match)?'—':results?(p.scoreText||'À confirmer'):(match.time && match.time!=='00:00'?match.time:'À confirmer'),date:`${formatTeamCalendarDate(match.date)} · ${p.isHome?'Domicile':'Extérieur'}`};
        }
        return <div key={row.id||index} style={{position:'relative',height,flexShrink:0}} data-template-row="true">
          {(Object.keys(values) as (keyof typeof values)[]).map(field=><TextBox key={field} text={values[field]} style={model.styles[field]} box={l.fields[field]} fontRevision={fontState.revision}/>)}
        </div>;
      })}
    </div>
    {!fontState.ready && <div role="status" style={{position:'absolute',bottom:10,left:20,right:20,padding:12,background:'#451a03',color:'#fff',fontSize:24}}>{fontState.error||'Chargement des polices…'}</div>}
  </div>;
}
