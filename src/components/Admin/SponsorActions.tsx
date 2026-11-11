import { useState } from 'react';
import { SponsorItem } from '../../types';

interface SponsorActionsProps {
  sponsor: SponsorItem;
  onToggle: () => void;
  onDelete: () => void;
}

export function SponsorActions({ sponsor, onToggle, onDelete }: SponsorActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const active = sponsor.enabled !== false;

  return (
    <div className="mt-3 w-full space-y-2 text-xs">
      <p className={active ? 'text-emerald-400' : 'text-slate-400'}>
        {active ? 'Diffusé sur la TV' : 'Désactivé — conservé dans la liste'}
      </p>
      <button type="button" onClick={onToggle} aria-label={`${active ? 'Désactiver' : 'Réactiver'} ${sponsor.name}`}
        className="w-full min-h-10 rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 font-bold text-white">
        {active ? 'Désactiver' : 'Réactiver'}
      </button>
      {confirmDelete ? (
        <div role="group" aria-label={`Confirmer la suppression de ${sponsor.name}`} className="rounded-lg border border-red-500 p-2 space-y-2">
          <p className="text-white break-words">Supprimer définitivement la fiche « {sponsor.name} » ? Son fichier reste dans la banque de médias.</p>
          <button type="button" onClick={onDelete} className="w-full min-h-10 rounded-lg bg-red-600 px-2 py-2 font-bold text-white">Confirmer la suppression</button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="w-full min-h-10 rounded-lg bg-slate-800 px-2 py-2 text-white">Annuler</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmDelete(true)} aria-label={`Supprimer ${sponsor.name}`}
          className="w-full min-h-10 rounded-lg border border-red-700 px-2 py-2 font-bold text-red-300">Supprimer</button>
      )}
    </div>
  );
}
