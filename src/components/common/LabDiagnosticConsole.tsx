import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { clearDiagnostics, diagnosticSnapshot, installLabDiagnostics, recordDiagnostic, subscribeDiagnostics } from '../../utils/labDiagnostics';

export function LabDiagnosticConsole() {
  const [open,setOpen]=useState(false),[filter,setFilter]=useState('all'),[copied,setCopied]=useState('');
  useEffect(()=>installLabDiagnostics(),[]);
  const entries=useSyncExternalStore(subscribeDiagnostics,diagnosticSnapshot,diagnosticSnapshot);
  const problems=entries.filter(e=>e.level!=='info').length;
  return <>
    <button type="button" className="bg-slate-950 text-white px-3 py-1 rounded-lg ml-3" onClick={()=>setOpen(true)}>Console de diagnostic ({problems})</button>
    {open && createPortal(<div role="dialog" aria-modal="true" aria-label="Console de diagnostic" className="fixed inset-0 z-[200] bg-slate-950 text-white p-4 sm:p-8 overflow-auto">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="text-2xl font-bold">Console de diagnostic du laboratoire</h2><button autoFocus className="p-2 rounded bg-slate-700" onClick={()=>setOpen(false)}>Fermer la console</button></div>
      <p className="text-sm text-slate-300 my-4">Erreurs JavaScript, appels API en échec, médias indisponibles et avertissements détectés dans ce navigateur. Ce journal ne détecte pas tous les défauts visuels. Il reste sur cet appareil : 150 entrées maximum, conservées 24 heures.</p>
      <div className="flex flex-wrap gap-3 my-4">
        <select className="bg-slate-800 rounded p-2" aria-label="Filtrer le diagnostic" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Tout</option><option value="error">Erreurs</option><option value="warning">Avertissements</option><option value="info">Informations</option></select>
        <button className="bg-slate-800 rounded p-2" onClick={()=>recordDiagnostic('info','Vérification','La console de diagnostic fonctionne.')}>Vérifier la console</button>
        <button className="bg-slate-800 rounded p-2" onClick={async()=>{try{await navigator.clipboard.writeText(JSON.stringify({generatedAt:new Date().toISOString(),entries},null,2));setCopied('Diagnostic copié.');}catch{setCopied('Copie indisponible. Utilisez le téléchargement.');}}}>Copier le diagnostic</button>
        <button className="bg-slate-800 rounded p-2" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({generatedAt:new Date().toISOString(),entries},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='diagnostic-laboratoire.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Télécharger le diagnostic</button>
        <button className="bg-slate-800 rounded p-2" onClick={()=>{clearDiagnostics();setCopied('Journal vidé ; les données et images sont conservées.');}}>Vider uniquement le journal</button>
      </div>
      {copied&&<p role="status">{copied}</p>}
      {!entries.length&&<p className="p-4 border border-emerald-800 rounded">Aucune erreur enregistrée pour le moment.</p>}
      <ol className="space-y-3 mt-4">{entries.filter(e=>filter==='all'||e.level===filter).slice().reverse().map(entry=><li key={entry.id} className={`border rounded p-3 ${entry.level==='error'?'border-red-600':entry.level==='warning'?'border-amber-500':'border-sky-700'}`}><p className="text-sm text-slate-300">{new Date(entry.time).toLocaleString('fr-FR')} · {entry.level==='error'?'Erreur':entry.level==='warning'?'Avertissement':'Information'} · {entry.source}{entry.count>1?` · ${entry.count} fois`:''}</p><pre className="whitespace-pre-wrap break-words text-sm mt-2 font-mono">{entry.message}</pre></li>)}</ol>
    </div>,document.body)}
  </>;
}
