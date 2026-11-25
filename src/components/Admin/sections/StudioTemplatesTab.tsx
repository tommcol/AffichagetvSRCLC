// StudioTemplatesTab — section « Studio templates » de l'AdminPanel.
// Permet de créer, dessiner et enregistrer des templates (trames) pour chaque catégorie de visuel.
// Les templates sont rangés dans visualTemplates.studioTemplates.

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Copy, LayoutTemplate, Pencil, Plus, Save, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { StudioTemplate, StudioTemplateCategory, StudioTemplateFormat, VisualTemplatesConfig } from '../../../types';
import {
  STUDIO_CATEGORIES,
  STUDIO_FORMATS,
  createBlankStudioTemplate,
  createExampleResultsTemplate,
  newStudioId,
} from '../../../utils/studioTemplateHelpers';
import { StudioTemplateEditor } from '../studio/StudioTemplateEditor';

export interface StudioTemplatesTabProps {
  visualTemplates: VisualTemplatesConfig;
  onUpdateVisualTemplates: (newTemplates: VisualTemplatesConfig) => void;
}

const fieldClass =
  'bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500';

export function StudioTemplatesTab({ visualTemplates, onUpdateVisualTemplates }: StudioTemplatesTabProps) {
  const saved: StudioTemplate[] = useMemo(() => visualTemplates.studioTemplates ?? [], [visualTemplates.studioTemplates]);

  const [draft, setDraft] = useState<StudioTemplate | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<StudioTemplateCategory>('matches');
  const [newFormat, setNewFormat] = useState<StudioTemplateFormat>('16:9');

  const savedVersion = draft ? saved.find((t) => t.id === draft.id) : undefined;
  const dirty = Boolean(draft) && JSON.stringify(draft) !== JSON.stringify(savedVersion);

  const writeAll = (next: StudioTemplate[]) => {
    onUpdateVisualTemplates({ ...visualTemplates, studioTemplates: next });
  };

  const saveDraft = () => {
    if (!draft) return;
    const stamped = { ...draft, updatedAt: new Date().toISOString() };
    const exists = saved.some((t) => t.id === stamped.id);
    writeAll(exists ? saved.map((t) => (t.id === stamped.id ? stamped : t)) : [...saved, stamped]);
    setDraft(stamped);
  };

  const cancelDraft = () => {
    if (savedVersion) setDraft(savedVersion);
  };

  const closeEditor = () => {
    if (dirty && !window.confirm('Des changements ne sont pas enregistrés. Quitter quand même ?')) return;
    setDraft(null);
  };

  const createTemplate = () => {
    const name = newName.trim() || 'Nouveau template';
    const tpl = createBlankStudioTemplate(name, newCategory, newFormat);
    writeAll([...saved, tpl]);
    setDraft(tpl);
    setNewName('');
  };

  const createExample = () => {
    const tpl = createExampleResultsTemplate();
    writeAll([...saved, tpl]);
    setDraft(tpl);
  };

  const duplicateTemplate = (tpl: StudioTemplate) => {
    const copy: StudioTemplate = {
      ...JSON.parse(JSON.stringify(tpl)),
      id: newStudioId('tpl'),
      name: `${tpl.name} (copie)`,
      updatedAt: new Date().toISOString(),
    };
    writeAll([...saved, copy]);
  };

  const deleteTemplate = (tpl: StudioTemplate) => {
    if (!window.confirm(`Supprimer le template « ${tpl.name} » ?`)) return;
    writeAll(saved.filter((t) => t.id !== tpl.id));
    if (draft?.id === tpl.id) setDraft(null);
  };

  // ----- Vue éditeur -----
  if (draft) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
          <button
            type="button"
            onClick={closeEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Liste
          </button>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className={`${fieldClass} font-bold min-w-[180px]`}
            aria-label="Nom du template"
          />
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as StudioTemplateCategory })}
            className={fieldClass}
            aria-label="Catégorie"
          >
            {STUDIO_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select
            value={draft.format}
            onChange={(e) => setDraft({ ...draft, format: e.target.value as StudioTemplateFormat })}
            className={fieldClass}
            aria-label="Format"
          >
            {STUDIO_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            {dirty && <span className="text-xs font-bold text-amber-300">Non enregistré</span>}
            <button
              type="button"
              onClick={cancelDraft}
              disabled={!dirty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold disabled:opacity-40"
            >
              <Undo2 className="w-3.5 h-3.5" /> Annuler
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={!dirty}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-black disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" /> Enregistrer
            </button>
          </div>
        </div>

        <StudioTemplateEditor template={draft} onChange={setDraft} />
      </div>
    );
  }

  // ----- Vue liste -----
  return (
    <div className="space-y-5">
      <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-bebas tracking-wide">STUDIO DE TEMPLATES</h3>
            <p className="text-xs text-slate-400">
              Dessine tes trames (formes, traits, pastilles, textes), enregistre-les, puis réutilise-les.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 pt-1">
          <label className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Nom</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex : Matchs 16:9 rouge"
              className={`${fieldClass} min-w-[200px]`}
            />
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Catégorie</span>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as StudioTemplateCategory)} className={fieldClass}>
              {STUDIO_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Format</span>
            <select value={newFormat} onChange={(e) => setNewFormat(e.target.value as StudioTemplateFormat)} className={fieldClass}>
              {STUDIO_FORMATS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={createTemplate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm text-white font-black"
          >
            <Plus className="w-4 h-4" /> Créer un template
          </button>
          <button
            type="button"
            onClick={createExample}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-sm text-white font-bold"
            title="Crée un template qui reproduit l'affiche « Résultats à l'extérieur »"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Créer l'exemple Résultats
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {saved.length === 0 && (
          <p className="text-sm text-slate-400 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
            Aucun template pour le moment. Crée-en un ci-dessus.
          </p>
        )}
        {saved.map((tpl) => (
          <div key={tpl.id} className="flex flex-wrap items-center gap-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white truncate">{tpl.name}</p>
              <p className="text-[11px] text-slate-400">
                {STUDIO_CATEGORIES.find((c) => c.id === tpl.category)?.label} · {tpl.format} · {tpl.decor.length + tpl.rowElements.length} élément(s)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDraft(JSON.parse(JSON.stringify(tpl)))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs text-white font-bold"
            >
              <Pencil className="w-3.5 h-3.5" /> Modifier
            </button>
            <button
              type="button"
              onClick={() => duplicateTemplate(tpl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold"
            >
              <Copy className="w-3.5 h-3.5" /> Dupliquer
            </button>
            <button
              type="button"
              onClick={() => deleteTemplate(tpl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs text-red-100 font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
