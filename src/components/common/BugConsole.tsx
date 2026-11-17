import React, { useEffect, useRef, useState } from 'react';
import { Bug, X } from 'lucide-react';
import { bugReport, clearBugJournal, readBugJournal, subscribeBugJournal } from '../../utils/bugJournal';

export function BugConsole() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(readBugJournal);
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => subscribeBugJournal(() => { setEntries(readBugJournal()); setManual(null); setStatus(''); }), []);
  useEffect(() => { if (open) closeButton.current?.focus(); }, [open]);
  const close = () => { setOpen(false); setManual(null); setStatus(''); trigger.current?.focus(); };
  const copy = async () => {
    const report = bugReport();
    try { await navigator.clipboard.writeText(report); setStatus('Rapport copié : collez-le dans votre conversation avec l’IA.'); }
    catch { setManual(report); setStatus('Copie automatique indisponible. Sélectionnez et copiez le texte ci-dessous.'); }
  };
  return <>
    <button ref={trigger} type="button" aria-expanded={open} aria-controls="bug-console" onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:text-white" title="Journal local des erreurs">
      <Bug className="h-3.5 w-3.5" aria-hidden="true" /> Bugs {entries.length > 0 && <span>({entries.length})</span>}
    </button>
    {open && <section id="bug-console" aria-label="Console de bugs" onKeyDown={e => { if (e.key === 'Escape') close(); }} className="fixed bottom-3 left-3 right-3 z-[150] mx-auto max-w-3xl rounded-xl border border-slate-600 bg-slate-950 p-4 text-slate-200 shadow-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-sm">Console de bugs · {entries.length}/100</h2><button ref={closeButton} type="button" onClick={close} aria-label="Fermer la console de bugs" className="p-2"><X className="h-4 w-4" /></button></div>
      <p className="text-xs text-slate-400 mt-1">Erreurs de ce navigateur, conservées après rechargement. Les erreurs internes du serveur et les défauts visuels ne sont pas tous détectables ici.</p>
      <div className="flex flex-wrap gap-2 my-3"><button type="button" onClick={copy} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white">Copier pour l’IA</button><button type="button" disabled={!entries.length} onClick={() => { clearBugJournal(); setStatus('Journal effacé sur cet appareil.'); }} className="rounded-lg bg-slate-800 px-3 py-2 text-xs disabled:opacity-40">Effacer le journal</button></div>
      <p role="status" className="text-xs text-emerald-300">{status}</p>
      {manual !== null && <textarea aria-label="Rapport à copier manuellement" readOnly value={manual} onFocus={e => e.target.select()} className="mt-2 w-full h-40 bg-slate-900 p-2 font-mono text-xs" />}
      {entries.length === 0 ? <p className="py-4 text-sm text-slate-400">Aucune erreur enregistrée.</p> : <ol className="space-y-2 mt-3">{entries.map((e, i) => <li key={`${e.at}-${i}`} className="rounded-lg bg-slate-900 p-3"><p className="text-xs text-amber-300"><time dateTime={new Date(e.at).toISOString()}>{new Date(e.at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</time> · {e.source}</p><pre className="mt-1 whitespace-pre-wrap break-words text-xs font-mono">{e.message}</pre></li>)}</ol>}
    </section>}
  </>;
}
