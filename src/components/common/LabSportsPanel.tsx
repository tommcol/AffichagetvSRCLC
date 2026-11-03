import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LabSport, SportsFeed } from '../../utils/sportsFeeds';
import { sportsMatchForPoster } from '../../utils/sportsFeeds';
import { GRAPHIC_PRESETS, TEMPLATE_FORMATS, templateCapacity } from '../../utils/graphicTemplates';
import type { GraphicLibrary, PosterAspectRatio } from '../../utils/graphicTemplates';
import { POSTER_DIMENSIONS, safeExportPosterToDataUrl } from '../../utils/posterExporter';
import { GraphicTemplateRenderer } from '../templates/GraphicTemplateRenderer';
import { recordDiagnostic } from '../../utils/labDiagnostics';

const button='rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white disabled:opacity-40';
const input='rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white w-full';
const labels:Record<LabSport,string>={football:'Football',handball:'Handball',volleyball:'Volley-ball'};
const sites:Record<LabSport,string>={football:'https://epreuves.fff.fr/',handball:'https://www.ffhandball.fr/competitions/',volleyball:'https://www.ffvbbeach.org/ffvbapp/resu/vbspo_home.php'};

export function LabSportsPanel(){
  const [open,setOpen]=useState(false);
  return <><button type="button" className="bg-slate-950 text-white px-3 py-1 rounded-lg ml-3" onClick={()=>setOpen(true)}>Essais autres sports</button>
    {open&&createPortal(<SportsDialog onClose={()=>setOpen(false)}/>,document.body)}</>;
}
function SportsDialog({onClose}:{onClose:()=>void}){
  const [sport,setSport]=useState<LabSport>('handball'),[source,setSource]=useState('');
  const [feed,setFeed]=useState<SportsFeed|null>(null),[teamId,setTeamId]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[exporting,setExporting]=useState(false);
  const [kind,setKind]=useState<'matches'|'results'>('matches');
  const [start,setStart]=useState(''),[end,setEnd]=useState(''),[page,setPage]=useState(0);
  const [format,setFormat]=useState<PosterAspectRatio>('4:5'),[modelId,setModelId]=useState(GRAPHIC_PRESETS[1].id);
  const [library,setLibrary]=useState<GraphicLibrary|null>(null),[width,setWidth]=useState(320);
  const preview=useRef<HTMLDivElement>(null),frame=useRef<HTMLDivElement>(null),controller=useRef<AbortController|null>(null);
  useEffect(()=>{
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const abort=new AbortController();
    fetch('/api/get-app-data',{signal:abort.signal}).then(async r=>{if(r.ok){const envelope=await r.json();setLibrary(envelope.data?.visualTemplates?.graphicLibrary||null);}}).catch(()=>{});
    return()=>{document.body.style.overflow=overflow;abort.abort();controller.current?.abort();};
  },[]);
  useEffect(()=>{const el=frame.current;if(!el)return;const update=()=>setWidth(Math.min(el.clientWidth,600));const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();},[feed]);
  const team=feed?.teams.find(t=>t.id===teamId);
  const all=useMemo(()=>feed?.matches.filter(m=>(m.home.id===teamId||m.away.id===teamId)&&(!start||(m.date&&m.date>=start))&&(!end||(m.date&&m.date<=end))).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.time.localeCompare(b.time))||[],[feed,teamId,start,end]);
  const shown=all.filter(m=>m.played===(kind==='results'));
  const models=[...GRAPHIC_PRESETS,...(library?.models||[])], model=models.find(m=>m.id===modelId)||GRAPHIC_PRESETS[1];
  const capacity=templateCapacity(model,format),pages=Math.max(1,Math.ceil(shown.filter(m=>m.date).length/capacity));
  const validPage=Math.min(page,pages-1), batch=shown.filter(m=>m.date).slice(validPage*capacity,(validPage+1)*capacity);
  const dims=POSTER_DIMENSIONS[format],scale=width/dims.width;
  const posterMatches=team?batch.map(m=>sportsMatchForPoster(m,team)):[];
  async function load(){
    controller.current?.abort();const abort=new AbortController();controller.current=abort;
    setBusy(true);setError('');setFeed(null);setTeamId('');setPage(0);
    try{
      const r=await fetch(`/api/lab/sports?${new URLSearchParams({sport,source:source.trim()})}`,{signal:abort.signal});
      const data=await r.json();if(!r.ok)throw new Error(data.error||'Chargement impossible.');
      setFeed(data);setTeamId(data.teams[0]?.id||'');
      recordDiagnostic('info','Autres sports',`${labels[sport]} : ${data.matches.length} rencontres reçues, sans modification des données du club.`);
    }catch(e){if(abort.signal.aborted)return;const message=e instanceof Error?e.message:'Connexion impossible.';setError(message);recordDiagnostic('warning','Autres sports',`${labels[sport]} : ${message}`);}
    finally{if(!abort.signal.aborted)setBusy(false);}
  }
  async function download(){
    if(!preview.current)return;setExporting(true);setError('');
    try{const url=await safeExportPosterToDataUrl(preview.current,format);const a=document.createElement('a');a.href=url;a.download=`${sport}-${kind}-${validPage+1}.png`;a.click();}
    catch(e){const message=e instanceof Error?e.message:'Export impossible.';setError(message);recordDiagnostic('warning','Export multisports',message);}
    finally{setExporting(false);}
  }
  return <div role="dialog" aria-modal="true" aria-label="Essais autres sports" className="fixed inset-0 z-[190] bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-auto text-left font-normal">
    <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">Laboratoire multisports</h2><button autoFocus type="button" className={button} onClick={onClose}>Fermer les essais sports</button></header>
    <p className="mt-3 mb-5 text-slate-300">Chargez un calendrier fédéral, choisissez votre équipe, puis examinez l’affiche. Les rencontres restent dans cet écran : les matchs, résultats et images du club ne sont pas remplacés. Aucun abonnement payant ni clé API nécessaire pour ces essais.</p>
    <form onSubmit={e=>{e.preventDefault();void load();}} className="grid sm:grid-cols-[180px_1fr_auto] gap-3 items-end bg-slate-900 border border-slate-700 rounded-xl p-4">
      <label>Sport<select aria-label="Sport à tester" className={input} disabled={busy} value={sport} onChange={e=>{setSport(e.target.value as LabSport);setSource('');setFeed(null);setTeamId('');setError('');setStart('');setEnd('');setPage(0);}}>{Object.entries(labels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      <label>{sport==='football'?'Numéro interne du club FFF (cl_no)':sport==='handball'?'Lien de la page de votre équipe FFHandball':'Lien du calendrier de poule FFVolley'}<input className={input} aria-label="Source fédérale" required maxLength={800} value={source} disabled={busy} onChange={e=>setSource(e.target.value)} inputMode={sport==='football'?'numeric':'url'} placeholder={sport==='football'?'Numéro cl_no, différent du numéro d’affiliation':'https://…'}/></label>
      <button type="submit" disabled={busy||!source.trim()} className={button}>{busy?'Lecture de la fédération…':'Charger les rencontres'}</button>
    </form>
    <p className="my-3 text-sm text-slate-300"><a className="underline text-sky-300" href={sites[sport]} target="_blank" rel="noopener noreferrer">Ouvrir le site fédéral {labels[sport]}</a> · {sport==='handball'?'Choisissez une équipe : son lien finit par « equipe-… ».':sport==='volleyball'?'Choisissez une poule : copiez le lien contenant « vbspo_calendrier.php ».':'Le connecteur FFF est expérimental. Le serveur peut refuser l’accès ; aucun contournement n’est tenté.'} Les sources non officielles peuvent changer. Une réponse peut être conservée cinq minutes pour limiter les appels.</p>
    {error&&<p role="alert" className="my-4 rounded-lg bg-red-950 border border-red-500 p-4">{error}</p>}
    {feed&&<>
      <p role="status" className="bg-emerald-950 border border-emerald-700 rounded-lg p-3">{feed.matches.length} rencontre(s) reçue(s) · {feed.teams.length} équipe(s) disponible(s) · {feed.source} · lecture du {new Date(feed.fetchedAt).toLocaleString('fr-FR')}</p>
      {feed.warnings.map(w=><p key={w} className="text-amber-300 my-2">{w}</p>)}
      <div className="flex flex-wrap items-end gap-3 my-4">
        <label className="min-w-0 max-w-full">Notre équipe<select aria-label="Équipe du sport" className={input} value={teamId} onChange={e=>{setTeamId(e.target.value);setPage(0);}}>{feed.teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label>Du<input aria-label="Début de période sport" type="date" className={input} value={start} onChange={e=>{setStart(e.target.value);setPage(0);}}/></label>
        <label>Au<input aria-label="Fin de période sport" type="date" className={input} value={end} min={start} onChange={e=>{setEnd(e.target.value);setPage(0);}}/></label>
        <button className={button} onClick={()=>{setStart('');setEnd('');setPage(0);}}>Toute la saison reçue</button>
        <label>Afficher<select className={input} value={kind} onChange={e=>{setKind(e.target.value as 'matches'|'results');setPage(0);}}><option value="matches">Rencontres sans résultat confirmé</option><option value="results">Résultats confirmés</option></select></label>
      </div>
      {shown.some(m=>!m.date)&&<p className="text-amber-300">Les rencontres sans date restent dans la liste ; elles ne figurent pas dans l’affiche.</p>}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="min-w-0"><h3 className="font-bold text-lg mb-2">{shown.length} rencontre(s) pour cette sélection</h3><div className="max-h-[620px] overflow-auto rounded-xl border border-slate-700"><table className="w-full text-sm"><thead className="bg-slate-800"><tr><th className="p-3">Date</th><th className="p-3">Rencontre</th><th className="p-3">Heure / score</th></tr></thead><tbody>{shown.map(m=><tr key={m.id} className="border-t border-slate-800"><td className="p-3">{m.date||'À confirmer'}</td><td className="p-3 break-words">{m.home.name}<br/><span className="text-slate-400">contre {m.away.name}</span>{m.label&&<span className="block text-amber-300">{m.label}</span>}</td><td className="p-3">{m.played?`${m.homeScore} – ${m.awayScore}`:m.time&&m.time!=='00:00'?m.time:'À confirmer'}</td></tr>)}</tbody></table>{!shown.length&&<p className="p-4">Aucune rencontre pour ce choix dans la réponse reçue.</p>}</div><p className="text-xs text-slate-400 mt-2">Scores officiels domicile–extérieur dans la liste ; notre équipe à gauche sur l’affiche. Au volley, le score indique les sets gagnés. Les égalités sont conservées.</p></section>
        <section className="min-w-0"><h3 className="font-bold text-lg mb-2">Aperçu du nouveau studio</h3><div className="flex flex-wrap gap-3 mb-3"><label>Modèle<select className={input} aria-label="Modèle multisports" value={modelId} onChange={e=>{setModelId(e.target.value);setPage(0);}}>{models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label>Format<select className={input} aria-label="Format multisports" value={format} onChange={e=>{setFormat(e.target.value as PosterAspectRatio);setPage(0);}}>{TEMPLATE_FORMATS.map(f=><option key={f}>{f}</option>)}</select></label></div>
          <div ref={frame} className="w-full min-h-1">
            {posterMatches.length>0&&<div style={{width,height:dims.height*scale,position:'relative',overflow:'hidden',margin:'0 auto'}}><div ref={preview} style={{position:'relative',width:dims.width,height:dims.height,transform:`scale(${scale})`,transformOrigin:'top left'}}><GraphicTemplateRenderer model={model} format={format} title={`${kind==='results'?'RÉSULTATS':'MATCHS'} · ${labels[sport].toUpperCase()}`} matches={posterMatches} results={kind==='results'} clubName={team?.name} shortName={team?.name} fonts={library?.fonts||[]}/></div></div>}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3"><button className={button} disabled={validPage===0} onClick={()=>setPage(validPage-1)}>Précédent</button><span>Affiche {validPage+1}/{pages}</span><button className={button} disabled={validPage+1>=pages} onClick={()=>setPage(validPage+1)}>Suivant</button><button className={button} disabled={!posterMatches.length||exporting} onClick={()=>void download()}>{exporting?'Export…':'Télécharger cette affiche PNG'}</button></div>
          <p className="text-xs text-slate-400 mt-3">Les dix modèles et vos modèles enregistrés au laboratoire sont réutilisés. Aucun logo de club n’est importé automatiquement. Ces essais ne pilotent pas encore le carrousel TV ni une synchronisation automatique.</p>
        </section>
      </div>
    </>}
  </div>;
}
