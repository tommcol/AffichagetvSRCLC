import React, { useMemo, useRef, useState } from 'react';
import { Copy, Eye, EyeOff, Layers, Plus, RotateCcw, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import {
  StudioCountOverride,
  StudioElement,
  StudioElementRole,
  StudioElementShape,
  StudioMatchesZone,
  StudioTemplate,
} from '../../../types';
import { AVAILABLE_FONTS } from '../../../utils/fontUtils';
import {
  STUDIO_MAX_ROWS,
  STUDIO_ROLES,
  STUDIO_ROLE_SAMPLES,
  STUDIO_SHAPES,
  clampStudioValue,
  computeStudioRowBoxes,
  createStudioElement,
  getEffectiveStudioZone,
  getFormatRatio,
  newStudioId,
} from '../../../utils/studioTemplateHelpers';
import { StudioElementView } from './StudioElementView';

// Éditeur d'un template : aperçu au centre, réglages de l'élément choisi à droite.
// Mode « Affiche » : le décor + la zone des matchs. Mode « Ligne de match » : le modèle d'UNE ligne,
// répété automatiquement de 1 à 6 fois.

export interface StudioTemplateEditorProps {
  template: StudioTemplate;
  onChange: (next: StudioTemplate) => void;
}

type EditorMode = 'poster' | 'row';

interface DragState {
  kind: 'element' | 'zone';
  id?: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  width: number;
  height: number;
}

const inputClass =
  'w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500';
const labelClass = 'text-[10px] font-bold text-slate-400 uppercase';

function NumberSlider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const { label, value, min, max, step = 0.5, onChange } = props;
  return (
    <label className="block space-y-0.5">
      <span className="flex items-center justify-between">
        <span className={labelClass}>{label}</span>
        <input
          type="number"
          value={Math.round(value * 10) / 10}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(clampStudioValue(parseFloat(e.target.value), min, max))}
          className="w-16 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-[11px] text-white text-right"
        />
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-sky-500"
      />
    </label>
  );
}

function ColorField(props: { label: string; value: string; onChange: (value: string) => void; allowNone?: boolean }) {
  const { label, value, onChange, allowNone } = props;
  const isNone = value === 'transparent';
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
  return (
    <div className="space-y-0.5">
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
        />
        {allowNone && (
          <label className="flex items-center gap-1 text-[11px] text-slate-300">
            <input type="checkbox" checked={isNone} onChange={(e) => onChange(e.target.checked ? 'transparent' : safe)} />
            sans couleur
          </label>
        )}
      </div>
    </div>
  );
}

export function StudioTemplateEditor({ template, onChange }: StudioTemplateEditorProps) {
  const [mode, setMode] = useState<EditorMode>('poster');
  const [previewCount, setPreviewCount] = useState<number>(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewBg, setPreviewBg] = useState<string>('#374151');
  const [copyTarget, setCopyTarget] = useState<number>(1);

  const posterRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const ratio = getFormatRatio(template.format);
  const listKey: 'decor' | 'rowElements' = mode === 'poster' ? 'decor' : 'rowElements';
  const elements = template[listKey];
  const selected = elements.find((el) => el.id === selectedId) ?? null;

  const override: StudioCountOverride | undefined = template.countOverrides?.[previewCount];
  const manual = Boolean(override);
  const zone = getEffectiveStudioZone(template, previewCount);
  const rowBoxes = useMemo(() => computeStudioRowBoxes(template, previewCount), [template, previewCount]);

  const commit = (patch: Partial<StudioTemplate>) => {
    onChange({ ...template, ...patch, updatedAt: new Date().toISOString() });
  };

  const setElements = (next: StudioElement[]) => commit({ [listKey]: next } as Partial<StudioTemplate>);

  const updateElement = (id: string, patch: Partial<StudioElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...patch } : el)));
  };

  const addElement = (shape: StudioElementShape) => {
    const base: Partial<StudioElement> =
      mode === 'row' ? { x: 10, y: 15, w: shape === 'line' ? 30 : 25, h: shape === 'line' ? 4 : 60 } : {};
    const el = createStudioElement(shape, base);
    setElements([...elements, el]);
    setSelectedId(el.id);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy: StudioElement = {
      ...selected,
      id: newStudioId('el'),
      name: `${selected.name} (copie)`,
      x: clampStudioValue(selected.x + 2, -50, 150),
      y: clampStudioValue(selected.y + 2, -50, 150),
    };
    setElements([...elements, copy]);
    setSelectedId(copy.id);
  };

  const deleteSelected = () => {
    if (!selected) return;
    setElements(elements.filter((el) => el.id !== selected.id));
    setSelectedId(null);
  };

  const moveLayer = (direction: -1 | 1) => {
    if (!selected) return;
    const index = elements.findIndex((el) => el.id === selected.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= elements.length) return;
    const next = [...elements];
    [next[index], next[target]] = [next[target], next[index]];
    setElements(next);
  };

  // --- Zone des matchs (réglage commun ou réglage manuel pour le nombre choisi) ---
  const setZonePatch = (patch: Partial<StudioMatchesZone>) => {
    if (manual) {
      commit({
        countOverrides: {
          ...(template.countOverrides ?? {}),
          [previewCount]: { ...override, zone: { ...(override?.zone ?? {}), ...patch } },
        },
      });
    } else {
      commit({ zone: { ...template.zone, ...patch } });
    }
  };

  const setRowHeightOverride = (value: number) => {
    commit({
      countOverrides: {
        ...(template.countOverrides ?? {}),
        [previewCount]: { ...(override ?? {}), rowHeight: value },
      },
    });
  };

  const toggleManual = (on: boolean) => {
    const next = { ...(template.countOverrides ?? {}) };
    if (on) {
      next[previewCount] = { zone: {}, rowHeight: rowBoxes[0]?.h };
    } else {
      delete next[previewCount];
    }
    commit({ countOverrides: next });
  };

  const copySettingsTo = (target: number) => {
    if (target === previewCount) return;
    commit({
      countOverrides: {
        ...(template.countOverrides ?? {}),
        [target]: { zone: { ...zone }, rowHeight: rowBoxes[0]?.h },
      },
    });
  };

  // --- Déplacement à la souris / au doigt ---
  const beginDrag = (
    e: React.PointerEvent<HTMLDivElement>,
    kind: DragState['kind'],
    origX: number,
    origY: number,
    container: HTMLElement | null,
    id?: string
  ) => {
    if (!container) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = container.getBoundingClientRect();
    dragRef.current = {
      kind,
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX,
      origY,
      width: rect.width || 1,
      height: rect.height || 1,
    };
    if (kind === 'element' && id) setSelectedId(id);
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const x = clampStudioValue(d.origX + ((e.clientX - d.startX) / d.width) * 100, -50, 150);
    const y = clampStudioValue(d.origY + ((e.clientY - d.startY) / d.height) * 100, -50, 150);
    if (d.kind === 'zone') {
      setZonePatch({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    } else if (d.id) {
      updateElement(d.id, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const canvasWidthStyle = (r: number): React.CSSProperties => ({
    width: `min(100%, ${70 * r}vh)`,
    aspectRatio: String(r),
    containerType: 'size',
    position: 'relative',
    overflow: 'hidden',
    background: previewBg,
    borderRadius: '8px',
    border: '1px solid #475569',
    margin: '0 auto',
    touchAction: 'none',
  });

  // Une ligne = proportions de la zone à hauteur maximale
  const rowCanvasRatio = Math.max(1, (template.zone.w / Math.max(1, template.zone.maxRowHeight)) * ratio);

  const renderElement = (el: StudioElement, container: React.RefObject<HTMLDivElement | null>) => (
    <StudioElementView
      key={el.id}
      element={el}
      selected={el.id === selectedId}
      interactive
      textOverride={el.role === 'decor' ? undefined : el.text || STUDIO_ROLE_SAMPLES[el.role]}
      onPointerDown={(e) => beginDrag(e, 'element', el.x, el.y, container.current, el.id)}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
    />
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
      {/* Aperçu */}
      <div className="space-y-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('poster'); setSelectedId(null); }}
              className={`px-3 py-1 rounded text-xs font-bold ${mode === 'poster' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Affiche
            </button>
            <button
              type="button"
              onClick={() => { setMode('row'); setSelectedId(null); }}
              className={`px-3 py-1 rounded text-xs font-bold ${mode === 'row' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Ligne de match
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span className={labelClass}>Aperçu :</span>
            {Array.from({ length: STUDIO_MAX_ROWS }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPreviewCount(n)}
                className={`w-7 h-7 rounded-lg text-xs font-black border ${
                  previewCount === n
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : template.countOverrides?.[n]
                      ? 'bg-slate-800 border-amber-500/60 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={template.countOverrides?.[n] ? `${n} match(s) : réglé à la main` : `${n} match(s) : automatique`}
              >
                {n}
              </button>
            ))}
            <span className="text-[10px] text-slate-500">match(s)</span>
          </div>

          <label className="flex items-center gap-1 ml-auto text-[10px] text-slate-400">
            Fond d'aperçu
            <input
              type="color"
              value={previewBg}
              onChange={(e) => setPreviewBg(e.target.value)}
              className="w-7 h-6 rounded border border-slate-700 bg-transparent"
            />
          </label>
        </div>

        {mode === 'poster' ? (
          <div ref={posterRef} style={canvasWidthStyle(ratio)} onPointerDown={() => setSelectedId(null)}>
            {/* Zone des matchs : on peut la déplacer à la souris */}
            <div
              style={{
                position: 'absolute',
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.w}%`,
                height: `${zone.h}%`,
                border: '1.5px dashed rgba(56,189,248,0.8)',
                background: 'rgba(56,189,248,0.06)',
                cursor: 'move',
                touchAction: 'none',
              }}
              title="Zone des matchs : glisse pour la déplacer"
              onPointerDown={(e) => beginDrag(e, 'zone', zone.x, zone.y, posterRef.current)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
            />
            {rowBoxes.map((box) => (
              <div
                key={box.index}
                style={{
                  position: 'absolute',
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                  containerType: 'size',
                  pointerEvents: 'none',
                }}
              >
                {template.rowElements.map((el) => (
                  <StudioElementView
                    key={el.id}
                    element={el}
                    textOverride={el.role === 'decor' ? undefined : el.text || STUDIO_ROLE_SAMPLES[el.role]}
                  />
                ))}
              </div>
            ))}
            {template.decor.map((el) => renderElement(el, posterRef))}
          </div>
        ) : (
          <div>
            <div ref={rowRef} style={canvasWidthStyle(rowCanvasRatio)} onPointerDown={() => setSelectedId(null)}>
              {template.rowElements.map((el) => renderElement(el, rowRef))}
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-1">
              Dessine ici UNE seule ligne : l'appli la copie autant de fois qu'il y a de matchs.
            </p>
          </div>
        )}

        {/* Ajouter un élément */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
          <span className={labelClass}>
            Ajouter {mode === 'poster' ? "à l'affiche" : 'à la ligne de match'} :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {STUDIO_SHAPES.map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => addElement(shape.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold"
              >
                <Plus className="w-3 h-3 text-sky-400" />
                {shape.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des éléments */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 space-y-1">
          <span className={`${labelClass} flex items-center gap-1`}>
            <Layers className="w-3 h-3" /> Éléments ({elements.length})
          </span>
          {elements.length === 0 && <p className="text-xs text-slate-500">Aucun élément pour le moment.</p>}
          {[...elements].reverse().map((el) => (
            <div
              key={el.id}
              onClick={() => setSelectedId(el.id)}
              className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-xs ${
                el.id === selectedId ? 'bg-sky-900/40 border border-sky-600' : 'bg-slate-950/60 border border-slate-800 hover:border-slate-600'
              }`}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }}
                className="text-slate-400 hover:text-white"
                title={el.visible ? 'Cacher' : 'Afficher'}
              >
                {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <span className="text-white font-bold truncate flex-1">{el.name}</span>
              {el.role !== 'decor' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                  {STUDIO_ROLES.find((r) => r.id === el.role)?.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Réglages */}
      <div className="space-y-3">
        {mode === 'poster' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
            <span className="text-xs font-black text-sky-300 uppercase">Zone des matchs ({previewCount})</span>
            <label className="flex items-center gap-2 text-xs text-slate-200">
              <input type="checkbox" checked={manual} onChange={(e) => toggleManual(e.target.checked)} />
              Régler à la main pour {previewCount} match{previewCount > 1 ? 's' : ''}
            </label>
            {!manual && (
              <p className="text-[11px] text-slate-500">
                Automatique : les lignes se placent et se redimensionnent toutes seules.
              </p>
            )}
            <NumberSlider label="Position gauche" value={zone.x} min={-10} max={100} onChange={(v) => setZonePatch({ x: v })} />
            <NumberSlider label="Position haut" value={zone.y} min={-10} max={100} onChange={(v) => setZonePatch({ y: v })} />
            <NumberSlider label="Largeur" value={zone.w} min={10} max={110} onChange={(v) => setZonePatch({ w: v })} />
            <NumberSlider label="Hauteur" value={zone.h} min={5} max={110} onChange={(v) => setZonePatch({ h: v })} />
            <NumberSlider label="Espace entre lignes" value={zone.gap} min={0} max={10} step={0.1} onChange={(v) => setZonePatch({ gap: v })} />
            {manual ? (
              <NumberSlider
                label="Hauteur d'une ligne"
                value={override?.rowHeight ?? rowBoxes[0]?.h ?? 10}
                min={2}
                max={60}
                step={0.1}
                onChange={setRowHeightOverride}
              />
            ) : (
              <NumberSlider
                label="Hauteur max d'une ligne"
                value={template.zone.maxRowHeight}
                min={3}
                max={60}
                step={0.1}
                onChange={(v) => commit({ zone: { ...template.zone, maxRowHeight: v } })}
              />
            )}
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">Copier ce réglage vers</span>
              <select
                value={copyTarget}
                onChange={(e) => setCopyTarget(parseInt(e.target.value, 10))}
                className="bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-xs text-white"
              >
                {Array.from({ length: STUDIO_MAX_ROWS }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => copySettingsTo(copyTarget)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold"
              >
                Copier
              </button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
          {!selected ? (
            <p className="text-xs text-slate-500">Clique sur un élément pour régler sa forme, ses couleurs et son texte.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-sky-300 uppercase">Élément choisi</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveLayer(1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white" title="Mettre devant">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => moveLayer(-1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white" title="Mettre derrière">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={duplicateSelected} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white" title="Dupliquer">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={deleteSelected} className="p-1 rounded bg-red-900/60 hover:bg-red-800 text-red-200" title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <label className="block space-y-0.5">
                <span className={labelClass}>Nom</span>
                <input className={inputClass} value={selected.name} onChange={(e) => updateElement(selected.id, { name: e.target.value })} />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-0.5">
                  <span className={labelClass}>Forme</span>
                  <select
                    className={inputClass}
                    value={selected.shape}
                    onChange={(e) => updateElement(selected.id, { shape: e.target.value as StudioElementShape })}
                  >
                    {STUDIO_SHAPES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-0.5">
                  <span className={labelClass}>Contenu</span>
                  <select
                    className={inputClass}
                    value={selected.role}
                    onChange={(e) => {
                      const role = e.target.value as StudioElementRole;
                      updateElement(selected.id, { role, text: selected.text || STUDIO_ROLE_SAMPLES[role] });
                    }}
                  >
                    {STUDIO_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              {selected.role !== 'decor' && (
                <p className="text-[11px] text-emerald-300/80">
                  Le vrai contenu (score, nom…) remplacera le texte d'exemple automatiquement.
                </p>
              )}

              {selected.shape !== 'line' && (
                <>
                  <label className="block space-y-0.5">
                    <span className={labelClass}>{selected.role === 'decor' ? 'Texte' : "Texte d'exemple"}</span>
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={selected.text}
                      onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-0.5">
                    <span className={labelClass}>Police</span>
                    <select
                      className={inputClass}
                      value={selected.fontFamily}
                      onChange={(e) => updateElement(selected.id, { fontFamily: e.target.value as StudioElement['fontFamily'] })}
                    >
                      {AVAILABLE_FONTS.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </label>
                  <NumberSlider label="Taille du texte" value={selected.fontSize} min={5} max={100} step={1} onChange={(v) => updateElement(selected.id, { fontSize: v })} />
                  <ColorField label="Couleur du texte" value={selected.textColor} onChange={(v) => updateElement(selected.id, { textColor: v })} />
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <ColorField label="Couleur de fond" value={selected.fill} allowNone onChange={(v) => updateElement(selected.id, { fill: v })} />
                <ColorField label="Couleur du contour" value={selected.stroke} onChange={(v) => updateElement(selected.id, { stroke: v })} />
              </div>
              <NumberSlider label="Épaisseur du contour" value={selected.strokeWidth} min={0} max={20} step={0.5} onChange={(v) => updateElement(selected.id, { strokeWidth: v })} />
              <NumberSlider label="Transparence (100 = visible)" value={Math.round(selected.opacity * 100)} min={0} max={100} step={1} onChange={(v) => updateElement(selected.id, { opacity: v / 100 })} />
              <label className="flex items-center gap-2 text-xs text-slate-200">
                <input type="checkbox" checked={selected.shadow} onChange={(e) => updateElement(selected.id, { shadow: e.target.checked })} />
                Ombre
              </label>

              <div className="pt-1 border-t border-slate-800 space-y-1.5">
                <NumberSlider label="Position gauche" value={selected.x} min={-20} max={120} onChange={(v) => updateElement(selected.id, { x: v })} />
                <NumberSlider label="Position haut" value={selected.y} min={-20} max={120} onChange={(v) => updateElement(selected.id, { y: v })} />
                <NumberSlider label="Largeur" value={selected.w} min={0.5} max={120} onChange={(v) => updateElement(selected.id, { w: v })} />
                <NumberSlider label="Hauteur" value={selected.h} min={0.5} max={120} onChange={(v) => updateElement(selected.id, { h: v })} />
                <NumberSlider label="Rotation (degrés)" value={selected.rotation} min={-180} max={180} step={1} onChange={(v) => updateElement(selected.id, { rotation: v })} />
              </div>
            </>
          )}
        </div>

        {mode === 'poster' && template.countOverrides && Object.keys(template.countOverrides).length > 0 && (
          <button
            type="button"
            onClick={() => commit({ countOverrides: {} })}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Tout remettre en automatique
          </button>
        )}
      </div>
    </div>
  );
}
