import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Circle,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Minus,
  Pencil,
  RectangleHorizontal,
  RotateCcw,
  Settings2,
  Star,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import {
  StudioCountOverride,
  StudioElement,
  StudioElementRole,
  StudioElementShape,
  StudioMatchesZone,
  StudioTemplate,
  VisualTemplatesConfig,
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
  createStudioMatchRow,
  getEffectiveStudioZone,
  getFormatRatio,
  newStudioId,
} from '../../../utils/studioTemplateHelpers';
import { StudioElementView } from './StudioElementView';
import { PosterMedia } from '../../posterSections/PosterMedia';
import { MediaBankSelectorModal } from '../MediaBankSelectorModal';

// Éditeur d'un template, pensé pour être utilisé sans explication :
// - on voit l'affiche, on clique sur un élément pour le modifier, on le glisse pour le déplacer ;
// - un petit menu apparaît juste à côté de l'élément choisi ;
// - un bouton permet de dessiner la ligne de match qui sera répétée pour chaque match.

export interface StudioTemplateEditorProps {
  clubLogoUrl?: string;
  template: StudioTemplate;
  onChange: (next: StudioTemplate) => void;
  visualTemplates: VisualTemplatesConfig;
}

type EditorMode = 'poster' | 'row';

interface MoveState {
  kind: 'element' | 'zone';
  id?: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  width: number;
  height: number;
}

interface ResizeState {
  kind: 'element' | 'zone';
  id?: string;
  startX: number;
  startY: number;
  origW: number;
  origH: number;
  width: number;
  height: number;
}

const inputClass =
  'w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500';
const labelClass = 'text-[10px] font-bold text-slate-400 uppercase';
const MENU_WIDTH = 270;

const ADD_BUTTONS: { shape: StudioElementShape; label: string; icon: React.ReactNode }[] = [
  { shape: 'pill', label: 'Pastille', icon: <RectangleHorizontal className="w-4 h-4" /> },
  { shape: 'rounded', label: 'Rectangle', icon: <RectangleHorizontal className="w-4 h-4" /> },
  { shape: 'circle', label: 'Rond', icon: <Circle className="w-4 h-4" /> },
  { shape: 'star', label: 'Étoile', icon: <Star className="w-4 h-4" /> },
  { shape: 'line', label: 'Trait', icon: <Minus className="w-4 h-4" /> },
  { shape: 'text', label: 'Texte', icon: <Type className="w-4 h-4" /> },
];

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
            aucune
          </label>
        )}
      </div>
    </div>
  );
}

export function StudioTemplateEditor({ template, onChange, visualTemplates, clubLogoUrl }: StudioTemplateEditorProps) {
  const [mode, setMode] = useState<EditorMode>('poster');
  const [matchCount, setMatchCount] = useState(3);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(matchCount / STUDIO_MAX_ROWS));
  const previewCount = Math.min(STUDIO_MAX_ROWS, matchCount - (page - 1) * STUDIO_MAX_ROWS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showFrameOptions, setShowFrameOptions] = useState<boolean>(false);
  const [bgModalOpen, setBgModalOpen] = useState<boolean>(false);
  const [copyTarget, setCopyTarget] = useState<number>(1);

  const posterRef = useRef<HTMLDivElement | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const moveRef = useRef<MoveState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  const ratio = getFormatRatio(template.format);
  const listKey: 'decor' | 'rowElements' = mode === 'poster' ? 'decor' : 'rowElements';
  const elements = template[listKey];
  const selected = elements.find((el) => el.id === selectedId) ?? null;
  const previewBgColor = template.previewBgColor ?? '#374151';

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
    setShowAdvanced(false);
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

  // --- Cadre des matchs (réglage commun, ou réglage manuel pour le nombre choisi) ---
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

  const setManual = (on: boolean) => {
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

  // --- Déplacer et redimensionner à la souris / au doigt ---
  const currentContainer = (): HTMLElement | null => (mode === 'poster' ? posterRef.current : rowRef.current);

  const beginMove = (
    e: React.PointerEvent<HTMLElement>,
    kind: MoveState['kind'],
    origX: number,
    origY: number,
    id?: string
  ) => {
    const container = currentContainer();
    if (!container) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = container.getBoundingClientRect();
    moveRef.current = {
      kind,
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX,
      origY,
      width: rect.width || 1,
      height: rect.height || 1,
    };
    setSelectedId(kind === 'element' && id ? id : null);
  };

  const doMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = moveRef.current;
    if (!d) return;
    const x = Math.round(clampStudioValue(d.origX + ((e.clientX - d.startX) / d.width) * 100, -50, 150) * 10) / 10;
    const y = Math.round(clampStudioValue(d.origY + ((e.clientY - d.startY) / d.height) * 100, -50, 150) * 10) / 10;
    if (d.kind === 'zone') setZonePatch({ x, y });
    else if (d.id) updateElement(d.id, { x, y });
  };

  const endMove = () => {
    moveRef.current = null;
  };

  const beginResize = (
    e: React.PointerEvent<HTMLElement>,
    kind: ResizeState['kind'],
    origW: number,
    origH: number,
    id?: string
  ) => {
    const container = currentContainer();
    if (!container) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = container.getBoundingClientRect();
    resizeRef.current = {
      kind,
      id,
      startX: e.clientX,
      startY: e.clientY,
      origW,
      origH,
      width: rect.width || 1,
      height: rect.height || 1,
    };
  };

  const doResize = (e: React.PointerEvent<HTMLElement>) => {
    const r = resizeRef.current;
    if (!r) return;
    const w = Math.round(clampStudioValue(r.origW + ((e.clientX - r.startX) / r.width) * 100, 1, 150) * 10) / 10;
    const h = Math.round(clampStudioValue(r.origH + ((e.clientY - r.startY) / r.height) * 100, 1, 150) * 10) / 10;
    if (r.kind === 'zone') setZonePatch({ w, h });
    else if (r.id) updateElement(r.id, { w, h });
  };

  const endResize = () => {
    resizeRef.current = null;
  };

  const rowCanvasRatio = Math.max(1, (template.zone.w / Math.max(1, template.zone.maxRowHeight)) * ratio);
  const activeRatio = mode === 'poster' ? ratio : rowCanvasRatio;

  const sampleText = (el: StudioElement): string | undefined =>
    el.role === 'decor' ? undefined : el.text || STUDIO_ROLE_SAMPLES[el.role];

  // Position du petit menu : sous l'élément, ou au-dessus s'il est en bas de l'affiche
  const menuStyle = (el: StudioElement): React.CSSProperties => {
    const below = el.y + el.h < 62;
    return {
      position: 'absolute',
      left: `clamp(0px, ${el.x}%, calc(100% - ${MENU_WIDTH}px))`,
      top: below ? `calc(${el.y + el.h}% + 10px)` : `calc(${el.y}% - 10px)`,
      transform: below ? undefined : 'translateY(-100%)',
      width: `${MENU_WIDTH}px`,
      pointerEvents: 'auto',
      zIndex: 20,
    };
  };

  const handleStyle = (leftPct: number, topPct: number): React.CSSProperties => ({
    position: 'absolute',
    left: `${leftPct}%`,
    top: `${topPct}%`,
    width: '16px',
    height: '16px',
    transform: 'translate(-50%, -50%)',
    borderRadius: '9999px',
    background: '#38bdf8',
    border: '2px solid #ffffff',
    cursor: 'nwse-resize',
    pointerEvents: 'auto',
    touchAction: 'none',
    zIndex: 15,
  });

  const helpText = (() => {
    if (mode === 'row') {
      return "Tu dessines ici UNE seule ligne de match. L'appli la copiera pour chaque match de l'affiche.";
    }
    if (selected) return 'Glisse l’élément pour le déplacer. Tire le point bleu pour changer sa taille.';
    return "Place le cadre bleu sur l’affiche. La même ligne se répète pour chaque match.";
  })();

  return (
    <div className="space-y-3">
      {/* Barre du haut */}
      <div className="flex flex-wrap items-center gap-2">
        {mode === 'poster' ? (
          <button
            type="button"
            onClick={() => { setMode('row'); setSelectedId(null); setShowAdvanced(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs text-white font-black"
          >
            <Pencil className="w-3.5 h-3.5" /> Modifier la ligne de match
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setMode('poster'); setSelectedId(null); setShowAdvanced(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs text-white font-black"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'affiche
          </button>
        )}

        <button
          type="button"
          onClick={() => setBgModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold"
        >
          <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
          {template.previewBgUrl ? 'Changer le fond' : 'Choisir un fond'}
        </button>
        {template.previewBgUrl && (
          <button
            type="button"
            onClick={() => commit({ previewBgUrl: '' })}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-bold"
          >
            <X className="w-3.5 h-3.5" /> Retirer le fond
          </button>
        )}

        {mode === 'poster' && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-200">
              Aperçu avec
              <select
                value={matchCount}
                onChange={(event) => { setMatchCount(Number(event.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white"
              >
                {Array.from({ length: 25 }, (_, count) => (
                  <option key={count} value={count}>{count} match{count === 1 ? '' : 's'}</option>
                ))}
              </select>
            </label>
            {pageCount > 1 && (
              <label className="flex items-center gap-2 text-xs text-slate-200">
                Page
                <select value={page} onChange={(event) => setPage(Number(event.target.value))}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-white">
                  {Array.from({ length: pageCount }, (_, index) => (
                    <option key={index} value={index + 1}>{index + 1} / {pageCount}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-sky-200/90 bg-sky-950/40 border border-sky-900/60 rounded-lg px-3 py-1.5">{helpText}</p>

      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-slate-300 uppercase">
          Ajouter {mode === 'poster' ? "à l'affiche" : 'à la ligne'} :
        </span>
        {mode === 'row' && elements.length === 0 && (
          <button type="button" onClick={() => setElements(createStudioMatchRow(template.category))}
            className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-600">
            Ajouter une ligne prête à modifier
          </button>
        )}
        {clubLogoUrl && mode === 'poster' && (
          <button type="button" onClick={() => {
            const logo = createStudioElement('text', { name: 'Logo du club', role: 'clubLogo', w: 12, h: 18 });
            setElements([...elements, logo]);
            setSelectedId(logo.id);
          }} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700">
            <ImageIcon className="w-4 h-4 text-sky-300" /> + Logo du club
          </button>
        )}
        {ADD_BUTTONS.map((b) => (
          <button
            key={b.shape}
            type="button"
            onClick={() => addElement(b.shape)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-700 border border-slate-700 text-xs text-white font-bold"
          >
            <span className="text-sky-300">{b.icon}</span>
            + {b.label}
          </button>
        ))}
      </div>

      {/* Affiche */}
      <div
        style={{ position: 'relative', width: `min(100%, ${70 * activeRatio}vh)`, margin: '0 auto' }}
      >
        <div
          ref={mode === 'poster' ? posterRef : rowRef}
          onPointerDown={() => { setSelectedId(null); }}
          style={{
            width: '100%',
            aspectRatio: String(activeRatio),
            containerType: 'size',
            position: 'relative',
            overflow: 'hidden',
            background: previewBgColor,
            borderRadius: '8px',
            border: '1px solid #475569',
            touchAction: 'none',
          }}
        >
          {mode === 'poster' && template.previewBgUrl && (
            <PosterMedia
              src={template.previewBgUrl}
              alt=""
              draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            />
          )}

          {mode === 'poster' ? (
            <>
              {/* Cadre des matchs */}
              <div
                style={{
                  position: 'absolute',
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.w}%`,
                  height: `${zone.h}%`,
                  border: '2px dashed rgba(56,189,248,0.9)',
                  background: 'rgba(56,189,248,0.07)',
                  cursor: 'move',
                  touchAction: 'none',
                }}
                title="Glisse pour déplacer le cadre des matchs"
                onPointerDown={(e) => beginMove(e, 'zone', zone.x, zone.y)}
                onPointerMove={doMove}
                onPointerUp={endMove}
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
                    <StudioElementView key={el.id} element={el} imageUrl={el.role === 'clubLogo' ? clubLogoUrl : undefined} textOverride={sampleText(el)} />
                  ))}
                </div>
              ))}
              {template.decor.map((el) => (
                <StudioElementView
                  key={el.id}
                  element={el}
                  selected={el.id === selectedId}
                  interactive
                  imageUrl={el.role === 'clubLogo' ? clubLogoUrl : undefined}
                  textOverride={sampleText(el)}
                  onPointerDown={(e) => beginMove(e, 'element', el.x, el.y, el.id)}
                  onPointerMove={doMove}
                  onPointerUp={endMove}
                />
              ))}
            </>
          ) : (
            template.rowElements.map((el) => (
              <StudioElementView
                key={el.id}
                element={el}
                selected={el.id === selectedId}
                interactive
                imageUrl={el.role === 'clubLogo' ? clubLogoUrl : undefined}
                textOverride={sampleText(el)}
                onPointerDown={(e) => beginMove(e, 'element', el.x, el.y, el.id)}
                onPointerMove={doMove}
                onPointerUp={endMove}
              />
            ))
          )}
        </div>

        {/* Poignées et petit menu (au-dessus de l'affiche, non coupés par ses bords) */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {mode === 'poster' && (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  transform: 'translateY(-100%)',
                  background: '#0284c7',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px 6px 0 0',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Liste des matchs · {previewCount} sur cette page
              </div>
              <div
                style={handleStyle(zone.x + zone.w, zone.y + zone.h)}
                title="Tire pour agrandir ou réduire le cadre des matchs"
                onPointerDown={(e) => beginResize(e, 'zone', zone.w, zone.h)}
                onPointerMove={doResize}
                onPointerUp={endResize}
              />
            </>
          )}

          {selected && (
            <>
              <div
                style={handleStyle(selected.x + selected.w, selected.y + selected.h)}
                title="Tire pour changer la taille"
                onPointerDown={(e) => beginResize(e, 'element', selected.w, selected.h, selected.id)}
                onPointerMove={doResize}
                onPointerUp={endResize}
              />

              <div
                style={menuStyle(selected)}
                className="bg-slate-900 border border-sky-600 rounded-xl shadow-2xl p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-black text-sky-300 truncate">{selected.name}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={duplicateSelected} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white" title="Dupliquer">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={deleteSelected} className="p-1 rounded bg-red-900/70 hover:bg-red-800 text-red-100" title="Supprimer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setSelectedId(null)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white" title="Fermer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <label className="block space-y-0.5">
                  <span className={labelClass}>Ce que ça affiche</span>
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

                {selected.shape !== 'line' && (
                  <label className="block space-y-0.5">
                    <span className={labelClass}>{selected.role === 'decor' ? 'Texte' : "Texte d'exemple"}</span>
                    <input
                      className={inputClass}
                      value={selected.text}
                      onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                    />
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <ColorField label="Fond" value={selected.fill} allowNone onChange={(v) => updateElement(selected.id, { fill: v })} />
                  {selected.shape !== 'line' && (
                    <ColorField label="Texte" value={selected.textColor} onChange={(v) => updateElement(selected.id, { textColor: v })} />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-white font-bold"
                >
                  <Settings2 className="w-3.5 h-3.5" /> {showAdvanced ? "Cacher les options" : "Plus d'options"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Options du cadre des matchs */}
      {mode === 'poster' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
          <button
            type="button"
            onClick={() => setShowFrameOptions((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-black text-sky-300 uppercase"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Réglages avancés de la liste {showFrameOptions ? '▾' : '▸'}
          </button>
          {showFrameOptions && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setManual(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!manual ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'}`}
                >
                  Les lignes se placent toutes seules
                </button>
                <button
                  type="button"
                  disabled={previewCount === 0}
                  onClick={() => setManual(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${manual ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'}`}
                >
                  Je règle moi-même pour {previewCount}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Déplace et agrandis le cadre bleu directement sur l'affiche. Ici tu règles l'espace et la taille des lignes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NumberSlider label="Espace entre les lignes" value={zone.gap} min={0} max={10} step={0.1} onChange={(v) => setZonePatch({ gap: v })} />
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
                    label="Hauteur maximum d'une ligne"
                    value={template.zone.maxRowHeight}
                    min={3}
                    max={60}
                    step={0.1}
                    onChange={(v) => commit({ zone: { ...template.zone, maxRowHeight: v } })}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">Copier ce réglage pour</span>
                <select
                  value={copyTarget}
                  onChange={(e) => setCopyTarget(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-xs text-white"
                >
                  {Array.from({ length: STUDIO_MAX_ROWS }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} match{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={previewCount === 0}
                  onClick={() => copySettingsTo(copyTarget)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold"
                >
                  Copier
                </button>
                {template.countOverrides && Object.keys(template.countOverrides).length > 0 && (
                  <button
                    type="button"
                    onClick={() => commit({ countOverrides: {} })}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white font-bold"
                  >
                    <RotateCcw className="w-3 h-3" /> Tout remettre en automatique
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plus d'options de l'élément choisi */}
      {selected && showAdvanced && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-3">
          <span className="text-xs font-black text-sky-300 uppercase">Plus d'options : {selected.name}</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="block space-y-0.5">
                <span className={labelClass}>Nom</span>
                <input className={inputClass} value={selected.name} onChange={(e) => updateElement(selected.id, { name: e.target.value })} />
              </label>
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
            </div>
            <div className="space-y-2">
              <ColorField label="Couleur du contour" value={selected.stroke} onChange={(v) => updateElement(selected.id, { stroke: v })} />
              <NumberSlider label="Épaisseur du contour" value={selected.strokeWidth} min={0} max={20} step={0.5} onChange={(v) => updateElement(selected.id, { strokeWidth: v })} />
              <NumberSlider label="Visibilité (100 = pleine)" value={Math.round(selected.opacity * 100)} min={0} max={100} step={1} onChange={(v) => updateElement(selected.id, { opacity: v / 100 })} />
              <NumberSlider label="Rotation (degrés)" value={selected.rotation} min={-180} max={180} step={1} onChange={(v) => updateElement(selected.id, { rotation: v })} />
              <label className="flex items-center gap-2 text-xs text-slate-200">
                <input type="checkbox" checked={selected.shadow} onChange={(e) => updateElement(selected.id, { shadow: e.target.checked })} />
                Ombre
              </label>
            </div>
            <div className="space-y-2">
              <NumberSlider label="Position gauche" value={selected.x} min={-20} max={120} onChange={(v) => updateElement(selected.id, { x: v })} />
              <NumberSlider label="Position haut" value={selected.y} min={-20} max={120} onChange={(v) => updateElement(selected.id, { y: v })} />
              <NumberSlider label="Largeur" value={selected.w} min={0.5} max={120} onChange={(v) => updateElement(selected.id, { w: v })} />
              <NumberSlider label="Hauteur" value={selected.h} min={0.5} max={120} onChange={(v) => updateElement(selected.id, { h: v })} />
              <div className="flex items-center gap-1.5 pt-1">
                <button type="button" onClick={() => moveLayer(1)} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-white font-bold">
                  <ArrowUp className="w-3 h-3" /> Mettre devant
                </button>
                <button type="button" onClick={() => moveLayer(-1)} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-white font-bold">
                  <ArrowDown className="w-3 h-3" /> Mettre derrière
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des éléments */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 space-y-1">
        <span className={`${labelClass} flex items-center gap-1`}>
          <Layers className="w-3 h-3" /> Tous les éléments ({elements.length})
        </span>
        {elements.length === 0 && <p className="text-xs text-slate-500">Rien pour le moment : utilise les boutons « + » au-dessus de l’affiche.</p>}
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

      <MediaBankSelectorModal
        isOpen={bgModalOpen}
        title="Choisir le fond du modèle"
        filterType="all"
        visualTemplates={visualTemplates}
        onClose={() => setBgModalOpen(false)}
        onSelect={(url) => {
          commit({ previewBgUrl: url });
          setBgModalOpen(false);
        }}
      />
    </div>
  );
}
