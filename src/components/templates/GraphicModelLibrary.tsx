import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { VisualTemplatesConfig, MatchItem } from '../../types';
import { GraphicTemplateRenderer } from './GraphicTemplateRenderer';
import { GraphicTemplate, GraphicLibrary, TemplateField, TemplateShape, GraphicBox, FIELD_LABELS, GRAPHIC_PRESETS, TEMPLATE_FORMATS, readGraphicLibrary, saveGraphicModel, templateCapacity, validateGraphicModel } from '../../utils/graphicTemplates';
import { PosterAspectRatio, POSTER_DIMENSIONS } from '../../utils/posterExporter';
import { AVAILABLE_FONTS } from '../../utils/fontUtils';
import { importClubFont } from '../../utils/clubFonts';

const button='px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-white text-sm disabled:opacity-40';
const input='w-full rounded-lg border border-slate-600 bg-slate-950 text-white p-2 text-sm';
const sample=(count:number):MatchItem[]=>Array.from({length:count},(_,i)=>({id:`template-demo-${i}`,category:i===1?'Seniors féminines 2':'U18 M1',date:`2030-11-${String(10+i).padStart(2,'0')}`,time:'18:30',teamHome:'Club exemple',teamAway:i===0?'Association sportive de la vallée et des montagnes - 2':`Basket exemple ${i+1}`,isHomeMatch:true,ourClubName:'Club exemple',homeScore:81,awayScore:75,status:'upcoming',gymnasium:'',city:'',competition:'Démonstration'}));
function Miniature({model}:{model:GraphicTemplate}) {
  return <div aria-hidden="true" style={{background:model.background,color:model.styles.title.color,height:105,padding:12,borderRadius:8,overflow:'hidden'}}>
    <div style={{background:model.styles.title.background,textAlign:'center',fontWeight:900,fontSize:14,padding:4}}>MATCHS DU CLUB</div>
    {[0,1].map(i=><div key={i} style={{display:'flex',gap:5,marginTop:10,fontSize:10}}>{['ÉQUIPE','18:30','ADVERSAIRE'].map((s,j)=><span key={s} style={{flex:j===1?1:2,padding:5,textAlign:'center',background:model.styles.team.shape==='text'||model.styles.team.shape==='outline'?'transparent':j===0?model.styles.team.background:model.styles.opponent.background,color:j===0?model.styles.team.color:model.styles.opponent.color,border:model.styles.team.shape==='text'?'none':`1px solid ${model.styles.team.borderColor}`,borderRadius:model.styles.team.shape==='pill'?20:model.styles.team.shape==='rounded'?5:0}}>{s}</span>)}</div>)}
  </div>;
}
export function GraphicModelLibrary({config,onChange,kind,format,disabled=false}:{config:VisualTemplatesConfig;onChange:(v:VisualTemplatesConfig)=>void;kind:'matches'|'results';format:PosterAspectRatio;disabled?:boolean}) {
  const [expanded,setExpanded]=useState(false);
  const [draft,setDraft]=useState<GraphicTemplate|null>(null);
  const [editFormat,setEditFormat]=useState(format);
  const [field,setField]=useState<TemplateField>('team');
  const [count,setCount]=useState(4);
  const [history,setHistory]=useState<GraphicTemplate[]>([]),[redo,setRedo]=useState<GraphicTemplate[]>([]);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [rights,setRights]=useState(false);
  const picker=useRef<HTMLInputElement>(null);
  const draftRef=useRef(draft);draftRef.current=draft;
  // Keep the latest server-fed configuration when an asynchronous upload completes.
  const latest=useRef(config);latest.current=config;
  const supported=!config.graphicLibrary || config.graphicLibrary.schemaVersion===1;
  if(!supported) return <p role="alert">Ces modèles nécessitent une version plus récente de l’application. Aucun modèle ne sera écrasé.</p>;
  const library=readGraphicLibrary(config.graphicLibrary);
  const selected=library.models.find(m=>m.id===library.selected[kind]);
  const commitLibrary=(next:GraphicLibrary)=>onChange({...latest.current,graphicLibrary:next});
  const open=(model:GraphicTemplate,duplicate=false)=>{
    setDraft({...structuredClone(model),id:duplicate?`model-${crypto.randomUUID()}`:model.id,name:duplicate?`${model.name} — copie`:model.name});
    setHistory([]);setRedo([]);setError('');setEditFormat(format);
  };
  const change=(fn:(m:GraphicTemplate)=>void)=>{
    const current=draftRef.current;if(!current)return;
    setHistory(h=>[...h.slice(-39),structuredClone(current)]);setRedo([]);
    const next=structuredClone(current);fn(next);setDraft(next);
  };
  const number=(label:string,value:number,min:number,max:number,action:(v:number)=>void,step=1)=><label className="text-xs text-slate-300">{label}<input className={input} type="number" min={min} max={max} step={step} value={value} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n))action(Math.max(min,Math.min(max,n)));}}/></label>;
  const colors=(label:string,value:string,action:(v:string)=>void)=><label className="text-xs text-slate-300 flex items-center justify-between gap-2">{label}<input aria-label={label} type="color" value={value} onChange={e=>action(e.target.value)}/></label>;
  const layout=draft?.layouts[editFormat];
  const b=layout && (field==='title'?layout.title:layout.fields[field]);
  const boxControls=(value:GraphicBox,action:(key:keyof GraphicBox,n:number)=>void)=><div className="grid grid-cols-2 gap-2">{(['x','y','width','height'] as const).map((key,i)=><React.Fragment key={key}>{number(['Gauche (%)','Haut (%)','Largeur (%)','Hauteur (%)'][i],value[key],key==='x'||key==='y'?0:1,100,v=>action(key,v))}</React.Fragment>)}</div>;
  const errors=draft?validateGraphicModel(draft):[];
  return <section className="w-full rounded-xl border border-sky-800 bg-slate-900 p-3 text-white">
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm font-bold">Modèle de l’affiche <select aria-label="Modèle de l’affiche" className={input} value={selected?.id||''} disabled={disabled} onChange={e=>commitLibrary({...library,selected:{...library.selected,[kind]:e.target.value}})}><option value="">Classique — présentation actuelle</option>{library.models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <button className={button} disabled={disabled} onClick={()=>setExpanded(!expanded)}>{expanded?'Fermer la bibliothèque':'Mes modèles · 10 inspirations'}</button>
      {selected && <button className={button} disabled={disabled} onClick={()=>open(selected)}>Modifier ce modèle</button>}
      <span className="text-xs text-slate-300">Affiches uniquement. Les réglages TV restent indépendants.</span>
    </div>
    {expanded && <div className="mt-4 space-y-3"><p className="text-sm">Choisissez une base, personnalisez-la, puis validez votre modèle. Les vignettes sont indicatives ; l’éditeur affiche le rendu réel.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">{[...library.models,...GRAPHIC_PRESETS].map(m=><article key={m.id} className="border border-slate-600 rounded-lg p-2"><Miniature model={m}/><p className="font-bold my-2">{m.name}</p><button className={button} disabled={disabled} onClick={()=>open(m,m.id.startsWith('preset-'))}>{m.id.startsWith('preset-')?'Créer à partir de ce modèle':'Modifier'}</button>{!m.id.startsWith('preset-') && <button className={button} onClick={()=>open(m,true)}>Dupliquer</button>}</article>)}</div>
    </div>}
    {draft && layout && b && <StudioDialog busy={busy} onCancel={()=>{setDraft(null);setError('');}}>
      <div className="flex flex-wrap items-center gap-2 mb-4 sticky top-0 z-10 bg-slate-950 p-2 border-b border-slate-700">
        <strong>Mes modèles — brouillon</strong>
        <button className={button} disabled={busy} onClick={()=>{setDraft(null);setError('');}}>Annuler les modifications</button>
        <button className={button} disabled={!history.length||busy} onClick={()=>{setRedo(r=>[...r,structuredClone(draft)]);setDraft(history[history.length-1]);setHistory(h=>h.slice(0,-1));}}>Annuler</button>
        <button className={button} disabled={!redo.length||busy} onClick={()=>{setHistory(h=>[...h,structuredClone(draft)]);setDraft(redo[redo.length-1]);setRedo(r=>r.slice(0,-1));}}>Rétablir</button>
        <button className={`${button} !bg-emerald-700`} disabled={busy||errors.length>0} onClick={()=>{const next=saveGraphicModel(readGraphicLibrary(latest.current.graphicLibrary),draft);commitLibrary({...next,selected:{...next.selected,[kind]:draft.id}});setDraft(null);}}>Valider et utiliser le modèle</button>
      </div>
      <p className="mb-4 text-sm text-slate-300">Le modèle reste un brouillon jusqu’à validation. Couleurs et polices sont communes aux formats ; positions et dimensions sont propres à chaque format. Une police importée est ajoutée immédiatement à la bibliothèque du club.</p>
      <div className="grid lg:grid-cols-[minmax(300px,1fr)_minmax(320px,1fr)] gap-6">
        <div className="space-y-4 min-w-0">
          <label>Nom du modèle<input className={input} maxLength={80} value={draft.name} onChange={e=>change(m=>{m.name=e.target.value;})}/></label>
          <div className="flex flex-wrap gap-2">{TEMPLATE_FORMATS.map(f=><button className={`${button} ${editFormat===f?'!bg-sky-700':''}`} key={f} onClick={()=>setEditFormat(f)}>{f}</button>)}</div>
          <div className="flex gap-2 items-center">Tester : {[2,4,6].map(n=><button key={n} className={`${button} ${count===n?'!bg-sky-700':''}`} onClick={()=>setCount(n)}>{n} rencontres</button>)}</div>
          <div className="w-full overflow-hidden rounded-xl border border-slate-700" style={{aspectRatio:editFormat.replace(':','/')}}>
            <ScaledPreview model={draft} format={editFormat} count={Math.min(count,templateCapacity(draft,editFormat))} fonts={library.fonts} results={kind==='results'}/>
          </div>
          <p className="text-sm text-sky-200">Données fictives, dont un nom long. Capacité : {templateCapacity(draft,editFormat)} rencontres par page. {count>templateCapacity(draft,editFormat)?`${Math.ceil(count/templateCapacity(draft,editFormat))} pages seront nécessaires.`:'Toutes tiennent sur une page.'} Un cadre orange indique un texte trop long à corriger.</p>
          {errors.length>0 && <ul role="alert" className="text-amber-300 text-sm list-disc pl-5">{errors.map(e=><li key={e}>{e}</li>)}</ul>}
        </div>
        <div className="space-y-5">
          <fieldset disabled={busy} className="border border-slate-700 rounded-xl p-3 space-y-3"><legend>Préréglages de polices</legend>
            <p className="text-xs text-slate-300">Applique une association de polices. Vous pouvez ensuite régler chaque élément, y compris avec vos polices importées.</p>
            <div className="flex flex-wrap gap-2">{[
              {name:'Sport',title:'Bebas Neue',body:'Oswald',score:'Teko'},
              {name:'Sobre',title:'Montserrat',body:'Outfit',score:'Montserrat'},
              {name:'Impact',title:'Anton',body:'Kanit',score:'Russo One'},
            ].map(p=><button key={p.name} className={button} onClick={()=>change(m=>{m.styles.title.font=p.title;m.styles.team.font=p.body;m.styles.opponent.font=p.body;m.styles.date.font='Montserrat';m.styles.score.font=p.score;})}>{p.name}</button>)}</div>
          </fieldset>
          <fieldset disabled={busy} className="border border-slate-700 rounded-xl p-3 space-y-3"><legend>Élément à personnaliser</legend>
            <select className={input} aria-label="Élément à personnaliser" value={field} onChange={e=>setField(e.target.value as TemplateField)}>{Object.entries(FIELD_LABELS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
            <label className="block text-sm">Police<select className={input} value={draft.styles[field].font} onChange={e=>change(m=>{m.styles[field].font=e.target.value;})}>{AVAILABLE_FONTS.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}{library.fonts.map(f=><option key={f.id} value={f.family}>{f.name} (importée)</option>)}</select></label>
            <div className="grid grid-cols-2 gap-2">{number('Taille souhaitée',draft.styles[field].size,20,160,v=>change(m=>{m.styles[field].size=v;m.styles[field].minSize=Math.min(m.styles[field].minSize,v);} ))}{number('Taille minimale',draft.styles[field].minSize,20,draft.styles[field].size,v=>change(m=>{m.styles[field].minSize=v;}))}</div>
            <label className="block text-sm">Forme<select className={input} value={draft.styles[field].shape} onChange={e=>change(m=>{m.styles[field].shape=e.target.value as TemplateShape;})}>{Object.entries({rectangle:'Rectangle',rounded:'Angles arrondis',pill:'Pastille',outline:'Contour seulement',text:'Texte sans fond'}).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">{colors('Texte',draft.styles[field].color,v=>change(m=>{m.styles[field].color=v;}))}{colors('Fond',draft.styles[field].background,v=>change(m=>{m.styles[field].background=v;}))}{colors('Bordure',draft.styles[field].borderColor,v=>change(m=>{m.styles[field].borderColor=v;}))}{number('Épaisseur de bordure',draft.styles[field].borderWidth,0,12,v=>change(m=>{m.styles[field].borderWidth=v;}))}{number('Opacité',draft.styles[field].opacity,.1,1,v=>change(m=>{m.styles[field].opacity=v;}),.05)}</div>
            <label className="block text-sm">Alignement<select className={input} value={draft.styles[field].align} onChange={e=>change(m=>{m.styles[field].align=e.target.value as 'left'|'center'|'right';})}><option value="left">Gauche</option><option value="center">Centré</option><option value="right">Droite</option></select></label>
            <p className="text-xs text-slate-300">Position dans {field==='title'?'l’affiche':'la ligne type répétée pour chaque rencontre'} — format {editFormat}.</p>
            {boxControls(b,(key,v)=>change(m=>{(field==='title'?m.layouts[editFormat].title:m.layouts[editFormat].fields[field])[key]=v;}))}
          </fieldset>
          <fieldset disabled={busy} className="border border-slate-700 rounded-xl p-3 space-y-3"><legend>Zone des rencontres — {editFormat}</legend>
            {boxControls(layout.area,(key,v)=>change(m=>{m.layouts[editFormat].area[key]=v;}))}
            <div className="grid grid-cols-2 gap-2">{number('Espacement',layout.gap,0,80,v=>change(m=>{m.layouts[editFormat].gap=v;}))}{number('Maximum par page',layout.capacity,1,10,v=>change(m=>{m.layouts[editFormat].capacity=v;}))}{number('Hauteur minimale',layout.minRowHeight,120,500,v=>change(m=>{m.layouts[editFormat].minRowHeight=v;m.layouts[editFormat].maxRowHeight=Math.max(v,m.layouts[editFormat].maxRowHeight);} ))}{number('Hauteur maximale',layout.maxRowHeight,layout.minRowHeight,700,v=>change(m=>{m.layouts[editFormat].maxRowHeight=v;}))}</div>
          </fieldset>
          <fieldset disabled={busy} className="border border-slate-700 rounded-xl p-3 space-y-3"><legend>Fond</legend>{colors('Couleur générale',draft.background,v=>change(m=>{m.background=v;}))}<label className="flex gap-2"><input type="checkbox" checked={draft.useClubBackground} onChange={e=>change(m=>{m.useClubBackground=e.target.checked;})}/> Utiliser le fond sélectionné dans l’affiche</label>{number('Voile sur le fond',draft.backgroundOpacity,0,1,v=>change(m=>{m.backgroundOpacity=v;}),.05)}</fieldset>
          <fieldset disabled={busy} className="border border-slate-700 rounded-xl p-3 space-y-3"><legend>Importer une police</legend>
            <p className="text-sm">WOFF2 recommandé, WOFF, TTF ou OTF. Maximum 5 Mo. Chaque fichier représente une variante (normal, gras…). La police reste propre à cette installation.</p>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)}/> Je dispose des droits nécessaires pour utiliser et intégrer cette police.</label>
            <input ref={picker} type="file" className="hidden" accept=".woff2,.woff,.ttf,.otf,font/*,application/font-sfnt,application/x-font-ttf,application/x-font-opentype,application/font-woff,application/octet-stream" onChange={async e=>{
              const file=e.target.files?.[0];e.target.value='';if(!file)return;setBusy(true);setError('');
              try{const font=await importClubFont(file);const lib=readGraphicLibrary(latest.current.graphicLibrary);commitLibrary({...lib,fonts:[...lib.fonts,font]});change(m=>{m.styles[field].font=font.family;});}
              catch(err){setError(err instanceof Error?err.message:'Import impossible.');}finally{setBusy(false);}
            }}/>
            <button className={button} disabled={!rights||busy} onClick={()=>picker.current?.click()}>{busy?'Import en cours…':'Choisir et importer une police'}</button>
            {error && <p role="alert" className="text-amber-300">{error}</p>}
          </fieldset>
        </div>
      </div>
    </StudioDialog>}
  </section>;
}
function ScaledPreview({model,format,count,fonts,results}:{model:GraphicTemplate;format:PosterAspectRatio;count:number;fonts:GraphicLibrary['fonts'];results:boolean}){
  const ref=useRef<HTMLDivElement>(null);const [width,setWidth]=useState(300);
  React.useLayoutEffect(()=>{if(!ref.current)return;const obs=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));obs.observe(ref.current);return()=>obs.disconnect();},[]);
  const dims=POSTER_DIMENSIONS[format];
  return <div ref={ref} style={{position:'relative',width:'100%',height:'100%'}}><div style={{position:'absolute',width:dims.width,height:dims.height,transform:`scale(${width/dims.width})`,transformOrigin:'top left'}}><GraphicTemplateRenderer model={model} format={format} title={results?'RÉSULTATS DU WEEK-END':'MATCHS DU WEEK-END'} matches={sample(count)} results={results} fonts={fonts}/></div></div>;
}

function StudioDialog({children,onCancel,busy}:{children:React.ReactNode;onCancel:()=>void;busy:boolean}) {
  const ref=useRef<HTMLDivElement>(null);
  React.useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    ref.current?.focus();
    return()=>{document.body.style.overflow=overflow;previous?.focus();};
  },[]);
  return createPortal(<div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Modifier un modèle d’affiche" className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-y-auto p-3 sm:p-6" onKeyDown={event=>{
    if(event.key==='Escape'){event.stopPropagation();if(!busy)onCancel();}
    if(event.key==='Tab'){
      const els=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type="hidden"]),select:not(:disabled),[tabindex="0"]')||[]).filter(el=>el.getClientRects().length);
      const first=els[0],last=els[els.length-1];
      if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){event.preventDefault();first?.focus();}
    }
  }}>{children}</div>,document.body);
}
