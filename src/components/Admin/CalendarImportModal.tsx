import React, { useMemo, useRef, useState } from 'react';
import type { ClubSettings, FFBBTeamItem, MatchItem } from '../../types';
import { calendarClub, calendarText } from '../../utils/calendarImportIdentity';
import { CalendarPreview, parseCalendarRows, rowSquadKey, guessCalendarCategory, calendarRowToMatch, mergeExcelCalendar } from '../../utils/excelMatchParser';
interface Props {
    matches: MatchItem[];
    results: MatchItem[];
    teams: FFBBTeamItem[];
    clubSettings: ClubSettings;
    onConfirm: (matches: MatchItem[], results: MatchItem[], message: string) => void;
    onClose: () => void;
}
export function CalendarImportModal({ matches, results, teams, clubSettings, onConfirm, onClose }: Props) {
    const [preview, setPreview] = useState<CalendarPreview | null>(null), [club, setClub] = useState('');
    const [mapping, setMapping] = useState<Record<string, string>>({}), [excluded, setExcluded] = useState<number[]>([]);
    const [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const request = useRef(0);
    const close = () => { request.current++; onClose(); };
    const read = async (file?: File) => {
        if (!file)
            return;
        const token = ++request.current;
        setBusy(true);
        setError('');
        setPreview(null);
        try {
            if (file.size > 10 * 1024 * 1024)
                throw new Error('Fichier trop volumineux (maximum 10 Mo).');
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
            let found: CalendarPreview | null = null;
            for (const name of workbook.SheetNames) {
                try {
                    found = parseCalendarRows(XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '', raw: true }));
                    break;
                }
                catch { }
            }
            if (!found)
                throw new Error('Aucun calendrier FFBB reconnu. Le fichier doit contenir Division, N° de match, Equipe 1, Equipe 2, Date de rencontre, Heure et Salle.');
            if (request.current !== token)
                return;
            const known = found.clubs.find(c => [clubSettings.name, clubSettings.shortName].some(n => calendarText(c) === calendarText(n)));
            setPreview(found);
            setClub(known || found.clubs[0] || '');
            setMapping({});
            setExcluded([]);
        }
        catch (e) {
            if (request.current === token)
                setError(e instanceof Error ? e.message : 'Lecture impossible.');
        }
        finally {
            if (request.current === token)
                setBusy(false);
        }
    };
    const relevant = useMemo(() => preview?.rows.filter(r => [r.home, r.away].some(t => calendarText(calendarClub(t)) === calendarText(club))) || [], [preview, club]);
    const groups = useMemo(() => Array.from(new Map(relevant.map(r => [rowSquadKey(r, club), r])).entries()), [relevant, club]);
    const category = (r: typeof relevant[number]) => mapping[rowSquadKey(r, club)] ?? guessCalendarCategory(r, club, teams);
    const options = Array.from(new Set([...teams.map(t => t.category), ...relevant.map(r => guessCalendarCategory(r, club, teams)).filter(Boolean)]));
    const selected = relevant.filter(r => !excluded.includes(r.line));
    const valid = selected.length > 0 && selected.every(r => !r.error && category(r));
    const incoming = valid ? selected.map(r => calendarRowToMatch(r, club, category(r), teams, clubSettings.customTeamNames)) : [];
    const plan = valid ? mergeExcelCalendar(matches, results, incoming) : null;
    return <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-labelledby="calendar-import-title">
    <div className="bg-slate-900 text-slate-100 border border-slate-600 rounded-2xl p-5 w-full max-w-6xl max-h-[92vh] overflow-y-auto space-y-4">
      <div className="flex justify-between gap-3"><h2 id="calendar-import-title" className="font-bold text-xl">Importer un calendrier Excel</h2><button type="button" onClick={close} className="px-3 py-2 bg-slate-700 rounded-lg">Fermer</button></div>
      <p className="text-sm text-slate-300">Import Excel de secours — les données de l’API FFBB restent prioritaires. Rien n’est enregistré avant votre confirmation.</p>
      <label className="block">Fichier exporté de la plateforme FFBB<input type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/csv" disabled={busy} onChange={e => { void read(e.target.files?.[0]); e.target.value = ''; }} className="block mt-2 w-full"/></label>
      <details className="text-sm text-slate-300">
        <summary className="cursor-pointer py-2">Fichier grisé sur téléphone ? Choisir sans filtre</summary>
        <label className="block mt-2">Choisissez votre calendrier Excel ou CSV
          <input type="file" aria-label="Choisir le calendrier sans filtre" disabled={busy} onChange={e => { void read(e.target.files?.[0]); e.target.value = ''; }} className="block mt-2 w-full"/>
        </label>
        <p className="mt-2">Ce sélecteur affiche tous les fichiers. Le calendrier sera vérifié après sélection ; rien ne sera enregistré avant votre confirmation.</p>
      </details>
      {busy && <p role="status">Lecture du fichier…</p>}{error && <p role="alert" className="text-red-300">{error}</p>}
      {preview && <>
        <label className="block text-sm">Votre club dans le fichier<select value={club} onChange={e => { setClub(e.target.value); setMapping({}); setExcluded([]); }} className="block bg-slate-800 border border-slate-600 p-2 rounded-lg w-full mt-1">{preview.clubs.map(c => <option key={c}>{c}</option>)}</select></label>
        <p className="text-sm">{relevant.length} rencontre(s) de ce club. Vérifiez les équipes ci-dessous ; les rencontres des autres clubs sont exclues.</p>
        <div className="grid sm:grid-cols-2 gap-3">{groups.map(([key, r]) => <label key={key} className="text-sm bg-slate-800 p-3 rounded-lg">{r.division} — équipe {key.split('|').pop()}<select aria-label={`Équipe pour ${key}`} value={category(r)} onChange={e => setMapping({ ...mapping, [key]: e.target.value })} className="block bg-slate-950 border border-slate-600 p-2 rounded-lg w-full mt-1"><option value="">Choisir l’équipe du club</option>{options.map(c => <option key={c} value={c}>{teams.find(t => t.category === c)?.customName || c}</option>)}</select></label>)}</div>
        <div className="overflow-auto max-h-[38vh] border border-slate-700 rounded-lg"><table className="text-xs w-full text-left"><thead className="sticky top-0 bg-slate-800"><tr>{['Importer', 'Date', 'Heure', 'Équipe du club', 'Domicile', 'Extérieur', 'Salle / Contrôle'].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{relevant.map(r => <tr key={r.line} className="border-t border-slate-700"><td className="p-2"><input type="checkbox" aria-label={`Importer la ligne ${r.line}`} checked={!excluded.includes(r.line)} onChange={e => setExcluded(e.target.checked ? excluded.filter(n => n !== r.line) : [...excluded, r.line])}/></td><td className="p-2 whitespace-nowrap">{r.date || 'Date invalide'}</td><td className="p-2">{r.time || 'À confirmer'}</td><td className="p-2">{category(r) || 'À choisir'}</td><td className="p-2">{r.home}</td><td className="p-2">{r.away}</td><td className="p-2">{r.error ? <span className="text-red-300">Ligne {r.line} : {r.error}</span> : r.gym}{r.homeScore !== undefined && <span> — {r.homeScore} / {r.awayScore}</span>}</td></tr>)}</tbody></table></div>
        <p className="text-sm text-slate-300">Les nouvelles rencontres seront décochées pour la TV. Vous choisirez ensuite celles à diffuser dans la liste habituelle. Un import ne supprime jamais les anciennes rencontres.</p>
        {!valid && <p className="text-amber-300 text-sm">Choisissez les équipes manquantes et décochez les lignes signalées en erreur pour continuer.</p>}
        {plan && <p role="status">{plan.added} ajout(s), {plan.updated} mise(s) à jour Excel, {plan.skipped} rencontre(s) déjà suivie(s) conservée(s) sans changement.</p>}
        <div className="flex justify-end gap-3"><button type="button" onClick={close} className="px-4 py-2 bg-slate-700 rounded-lg">Annuler</button><button type="button" disabled={!valid || busy} onClick={() => { if (!valid)
            return; const latest = mergeExcelCalendar(matches, results, incoming); onConfirm(latest.matches, latest.results, `Import Excel : ${latest.added} ajout(s), ${latest.updated} mise(s) à jour, ${latest.skipped} rencontre(s) conservée(s).`); close(); }} className="px-4 py-2 bg-orange-600 disabled:opacity-40 rounded-lg font-bold">Confirmer l’import ({selected.length})</button></div>
      </>}
    </div>
  </div>;
}
