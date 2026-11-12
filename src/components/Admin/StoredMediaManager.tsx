import { useState } from 'react';
import { VisualTemplatesConfig } from '../../types';
import { getStoredMediaUsages, storedMediaKey, StoredMediaFile } from '../../utils/storedMedia';

interface Props {
  visualTemplates: VisualTemplatesConfig;
  onUpdateVisualTemplates: (next: VisualTemplatesConfig) => void;
}

export function StoredMediaManager({ visualTemplates, onUpdateVisualTemplates }: Props) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('r2');
  const [files, setFiles] = useState<StoredMediaFile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<StoredMediaFile | null>(null);
  const localUsages = (key: string) => getStoredMediaUsages(key, { visualTemplates }, [], window.location.origin);
  const load = async (nextSource: string, nextCursor?: string) => {
    setBusy(true); setMessage('');
    try {
      const res = await fetch(`/api/media-storage?source=${nextSource}${nextCursor ? `&cursor=${encodeURIComponent(nextCursor)}` : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chargement impossible');
      setFiles(prev => nextCursor ? [...prev, ...data.files] : data.files);
      setCursor(data.cursor);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Chargement impossible'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!pending || busy) return;
    const used = localUsages(pending.key);
    if (used.length) { setMessage(`Encore utilisé : ${used.join(', ')}`); setPending(null); return; }
    setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/media-storage', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: pending.key, confirm: true }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error([data.error || 'Suppression impossible', ...(data.usages || [])].join(' — '));
      const key = pending.key;
      // Seul l’index est nettoyé. Aucun autre média ni calque n’est supprimé.
      onUpdateVisualTemplates({ ...visualTemplates, mediaBank: (visualTemplates.mediaBank || []).filter(m => storedMediaKey(m.url, window.location.origin) !== key) });
      setFiles(prev => prev.filter(f => f.key !== key));
      setMessage(`Fichier définitivement supprimé du stockage : ${key}`);
      setPending(null);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Suppression impossible'); }
    finally { setBusy(false); }
  };

  return <section className="rounded-2xl border border-amber-700 bg-slate-950 p-4 space-y-3 text-white">
    <button type="button" aria-expanded={open} className="font-bold text-amber-300 min-h-10"
      onClick={() => { if (!open) void load(source); setOpen(!open); }}>Fichiers stockés — libérer de l’espace (R2 / KV)</button>
    {open && <>
      <p className="text-sm text-slate-300">Cette liste montre les vrais fichiers, y compris ceux qui ne figurent plus dans les fiches. Supprimer ici efface le fichier du stockage R2 et son éventuelle copie KV. Les fichiers encore utilisés doivent d’abord être retirés des rubriques indiquées, puis les modifications enregistrées.</p>
      <div className="flex flex-wrap gap-3 items-center">
        <label>Stockage <select aria-label="Stockage des fichiers" value={source} disabled={busy} className="bg-slate-800 rounded p-2"
          onChange={e => { setSource(e.target.value); setFiles([]); setCursor(null); void load(e.target.value); }}>
          <option value="r2">R2 / fichiers locaux en démonstration</option><option value="kv">KV — anciens médias</option>
        </select></label>
        <button type="button" disabled={busy} className="bg-slate-800 rounded p-2" onClick={() => void load(source)}>Actualiser les fichiers</button>
      </div>
      <p className="text-xs text-slate-400">{files.length} fichier(s) affiché(s). Taille connue de cette liste : {(files.reduce((sum, f) => sum + (f.size || 0), 0) / 1024 / 1024).toFixed(2)} Mo. La taille KV n’est pas disponible ici. Ceci n’est pas un relevé de facturation.</p>
      {message && <p role="status" className="text-amber-300 break-words">{message}</p>}
      {busy && <p role="status">Opération en cours…</p>}
      {!files.length && !busy && !message && <p>Aucun fichier dans ce stockage.</p>}
      <ul className="space-y-2">{files.map(file => {
        const usages = [...new Set([...file.usages, ...localUsages(file.key)])];
        return <li key={file.key} className="border border-slate-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1"><p className="break-all font-bold">{file.key}</p>
            <p className="text-xs text-slate-400">{typeof file.size === 'number' ? `${(file.size / 1024 / 1024).toFixed(2)} Mo` : 'Taille inconnue'} — {usages.length ? `Utilisé : ${usages.join(', ')}` : 'Aucune utilisation détectée dans les réglages actuels'}</p></div>
          <button type="button" disabled={busy || usages.length > 0} aria-label={`Supprimer le fichier ${file.key}`}
            className="bg-red-700 rounded-lg p-3 text-xs font-bold disabled:opacity-50" onClick={() => setPending(file)}>Supprimer du stockage</button>
        </li>;
      })}</ul>
      {cursor && <button type="button" disabled={busy} className="bg-slate-800 rounded p-3" onClick={() => void load(source, cursor)}>Afficher les fichiers suivants</button>}
      {pending && <div role="dialog" aria-modal="true" aria-label="Suppression définitive du fichier" className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl border border-red-600 p-5 max-w-lg space-y-4">
          <h3 className="font-bold">Supprimer définitivement ce fichier ?</h3><p className="break-all">{pending.key}</p>
          <p>Le fichier sera effacé de R2 et du KV s’il y existe. Cette action libère son stockage et ne peut pas être annulée. Les sauvegardes des réglages ne permettent pas de récupérer un fichier supprimé.</p>
          <div className="flex gap-3"><button type="button" disabled={busy} className="bg-slate-700 p-3 rounded-lg" onClick={() => setPending(null)}>Annuler</button>
            <button type="button" disabled={busy} className="bg-red-600 p-3 rounded-lg" onClick={() => void remove()}>Effacer définitivement le fichier</button></div>
        </div>
      </div>}
    </>}
  </section>;
}
