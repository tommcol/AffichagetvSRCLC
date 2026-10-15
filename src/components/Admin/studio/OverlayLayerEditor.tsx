// ToggleSwitch + OverlayLayerEditor — sous-composants du StudioGraphiqueWorkbench.
// Extrait automatiquement lors du découpage : aucune logique modifiée.

import React, { useState } from 'react';
import { Layers, Type, Upload, Maximize2, Move, HelpCircle, Film, XCircle } from 'lucide-react';
import { OverlayLayerItem } from '../../../types';
import { normalizeLayerName } from '../../../utils/themeUtils';

// Composant standardisé pour les interrupteurs ON / OFF
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  sublabel?: string;
  info?: string;
  accent?: 'amber' | 'emerald' | 'purple' | 'orange' | 'sky';
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  sublabel,
  info,
  accent = 'amber',
  disabled = false,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const activeBg = {
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    sky: 'bg-sky-500',
  }[accent];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        {label && (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-200 truncate">{label}</span>
            {info && (
              <button
                type="button"
                onClick={() => setShowInfo((prev) => !prev)}
                className={`p-0.5 rounded transition-colors ${showInfo ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
                title="Afficher l'aide"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none shrink-0 ${
            checked ? activeBg : 'bg-slate-800'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {sublabel && <p className="text-[10px] text-slate-400 leading-tight">{sublabel}</p>}

      {showInfo && info && (
        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed animate-fadeIn">
          {info}
        </div>
      )}
    </div>
  );
};

// Composant réutilisable pour éditer Calque 3 et Calque 4
interface OverlayLayerEditorProps {
  layerNumber: 3 | 4;
  layer: OverlayLayerItem;
  category: 'matches' | 'results' | 'birthdays';
  onChange: (updated: OverlayLayerItem) => void;
  isSelected: boolean;
  onSelect: () => void;
  onOpenMediaBank?: () => void;
  onRegisterMediaInBank?: (media: { name: string; url: string; mediaType: 'image' | 'video'; size?: number }) => void;
}

export const OverlayLayerEditor: React.FC<OverlayLayerEditorProps> = ({
  layerNumber,
  layer,
  category,
  onChange,
  isSelected,
  onSelect,
  onOpenMediaBank,
  onRegisterMediaInBank,
}) => {
  const accentColor = layerNumber === 3 ? 'emerald' : 'purple';
  const badgeColorClass =
    layerNumber === 3
      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
      : 'bg-purple-600/20 text-purple-400 border-purple-500/30';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);

    if (isVideo || file.size > 2 * 1024 * 1024) {
      try {
        const uploadUrl = `/api/upload?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type || 'video/mp4')}`;
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'X-Filename': encodeURIComponent(file.name),
          },
          body: file,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            onRegisterMediaInBank?.({
              name: file.name,
              url: data.url,
              mediaType: isVideo ? 'video' : 'image',
              size: file.size,
            });
            onChange({
              ...layer,
              mediaUrl: data.url,
              mediaType: isVideo ? 'video' : 'image',
              enabled: true,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('PUT upload failed, fallback to POST:', err);
      }
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onRegisterMediaInBank?.({
            name: file.name,
            url: data.url,
            mediaType: isVideo ? 'video' : 'image',
            size: file.size,
          });
          onChange({
            ...layer,
            mediaUrl: data.url,
            mediaType: isVideo ? 'video' : 'image',
            enabled: true,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Direct upload failed:', err);
    }

    if (isVideo) {
      onChange({
        ...layer,
        mediaUrl: URL.createObjectURL(file),
        mediaType: 'video',
        enabled: true,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        onChange({
          ...layer,
          mediaUrl: ev.target.result,
          mediaType: 'image',
          enabled: true,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-3xl border transition-all space-y-4 ${
        isSelected
          ? layerNumber === 3
            ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
            : 'bg-purple-950/20 border-purple-500/60 shadow-lg shadow-purple-500/10'
          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* En-tête du Calque */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border shrink-0 ${badgeColorClass}`}>
            Calque {layerNumber}
          </span>
          <input
            type="text"
            value={normalizeLayerName(layer.name, layerNumber)}
            onChange={(e) => onChange({ ...layer, name: e.target.value })}
            className="bg-transparent border-0 text-sm font-bold text-white hover:bg-slate-900/60 px-2 py-1 rounded-lg focus:ring-1 focus:ring-slate-700 flex-1 min-w-0"
            placeholder={layerNumber === 3 ? 'Élément 1' : 'Élément 2'}
          />
        </div>

        <ToggleSwitch
          checked={layer.enabled}
          onChange={(val) => onChange({ ...layer, enabled: val })}
          label={layer.enabled ? 'Actif' : 'Masqué'}
          accent={layerNumber === 3 ? 'emerald' : 'purple'}
        />
      </div>

      {/* Sélection Média */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
          <span>Fichier Média (Image PNG/GIF ou Vidéo MP4/WebM)</span>
          <span className="text-slate-500 text-[10px]">
            {layer.mediaType === 'video' ? 'Format : Vidéo' : 'Format : Image'}
          </span>
        </label>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            value={layer.mediaUrl}
            onChange={(e) => {
              const val = e.target.value;
              const isVid = Boolean(val.match(/\.(mp4|webm|mov)(\?.*)?$/i) || val.startsWith('data:video/'));
              onChange({
                ...layer,
                mediaUrl: val,
                mediaType: isVid ? 'video' : layer.mediaType,
              });
            }}
            placeholder="URL image ou vidéo..."
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
          />
          <label
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all shrink-0 ${
              layerNumber === 3
                ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/30'
            }`}
            title="Importer un nouveau fichier depuis votre appareil"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importer</span>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          {onOpenMediaBank && (
            <button
              type="button"
              onClick={onOpenMediaBank}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all shrink-0 cursor-pointer shadow-sm"
              title="Choisir dans la Banque Médias commune"
            >
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Banque Médias</span>
            </button>
          )}
          {Boolean(layer.mediaUrl && layer.mediaUrl.trim()) && (
            <button
              type="button"
              onClick={() => {
                if (layer.mediaUrl) {
                  onRegisterMediaInBank?.({
                    name: layer.name,
                    url: layer.mediaUrl,
                    mediaType: layer.mediaType,
                  });
                }
                onChange({
                  ...layer,
                  mediaUrl: '',
                  enabled: false,
                });
              }}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-800 text-amber-300/90 hover:text-amber-200 border border-amber-500/30 transition-all shrink-0 cursor-pointer"
              title="Retirer ce média du calque sans le supprimer de la Banque Médias"
            >
              <XCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Retirer du calque</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 MODES D'AFFICHAGE DU CALQUE (Segmented Control) */}
      <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2.5">
        <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          <Layers className={`w-3.5 h-3.5 ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`} />
          <span>Mode d'Affichage du Calque</span>
        </label>

        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              onChange({
                ...layer,
                fullScreen: false,
                motionTrajectory: 'none',
              });
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !layer.fullScreen && (!layer.motionTrajectory || layer.motionTrajectory === 'none')
                ? layerNumber === 3
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Position Fixe</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange({
                ...layer,
                fullScreen: false,
                motionTrajectory:
                  layer.motionTrajectory && layer.motionTrajectory !== 'none'
                    ? layer.motionTrajectory
                    : 'right-to-left',
                motionDuration: layer.motionDuration || 12,
                y: layer.y && layer.y > 60 ? layer.y : 78,
              });
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !layer.fullScreen && layer.motionTrajectory && layer.motionTrajectory !== 'none'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏃</span>
            <span>Traversée</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChange({
                ...layer,
                fullScreen: true,
                objectFit: 'cover',
                motionTrajectory: 'none',
              });
            }}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              layer.fullScreen
                ? layerNumber === 3
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Plein Écran</span>
          </button>
        </div>

        {/* Détails du mode 1 : Pleine Page 16:9 */}
        {layer.fullScreen && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-300 font-bold">Cadrage Plein Écran :</span>
              <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => onChange({ ...layer, objectFit: 'cover' })}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${
                    (layer.objectFit || 'cover') === 'cover'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Couvrir (Cover)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...layer, objectFit: 'contain' })}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${
                    layer.objectFit === 'contain'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Proportionnel (Contain)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Détails du mode 2 : Traversée Animée */}
        {!layer.fullScreen && layer.motionTrajectory && layer.motionTrajectory !== 'none' && (
          <div className="pt-2.5 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-300">Sens :</span>
              <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => onChange({ ...layer, motionTrajectory: 'right-to-left' })}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${
                    layer.motionTrajectory === 'right-to-left'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ◀ Droite vers Gauche
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...layer, motionTrajectory: 'left-to-right' })}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${
                    layer.motionTrajectory === 'left-to-right'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gauche vers Droite ▶
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Vitesse ({layer.motionDuration ?? 12}s)</span>
                <span className="text-[10px] text-slate-400">Rapide (6s) ➔ Lente (24s)</span>
              </div>
              <input
                type="range"
                min="6"
                max="24"
                step="1"
                value={layer.motionDuration ?? 12}
                onChange={(e) => onChange({ ...layer, motionDuration: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Hauteur Sol Y ({layer.y ?? 78}%)</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="1"
                value={layer.y ?? 78}
                onChange={(e) => onChange({ ...layer, y: parseInt(e.target.value, 10) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <ToggleSwitch
              checked={layer.flipHorizontal ?? false}
              onChange={(val) => onChange({ ...layer, flipHorizontal: val })}
              label="Effet Miroir Horizontal"
              accent="sky"
            />
          </div>
        )}

        {/* Détails du mode 3 : Position Fixe (X / Y) */}
        {!layer.fullScreen && (!layer.motionTrajectory || layer.motionTrajectory === 'none') && (
          <div className="pt-2.5 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Coordonnées sur l'Écran</span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                X: {layer.x}% | Y: {layer.y}%
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Axe X (Horizontal : 0% Gauche ➔ 100% Droite)</span>
                <span className={`font-mono text-xs ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`}>
                  {layer.x}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={layer.x ?? 50}
                onChange={(e) => onChange({ ...layer, x: parseInt(e.target.value, 10) })}
                className={`w-full cursor-pointer ${layerNumber === 3 ? 'accent-emerald-500' : 'accent-purple-500'}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Axe Y (Vertical : 0% Haut ➔ 100% Bas)</span>
                <span className={`font-mono text-xs ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`}>
                  {layer.y}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={layer.y ?? 50}
                onChange={(e) => onChange({ ...layer, y: parseInt(e.target.value, 10) })}
                className={`w-full cursor-pointer ${layerNumber === 3 ? 'accent-emerald-500' : 'accent-purple-500'}`}
              />
            </div>

            <div className="pt-1 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => onChange({ ...layer, x: 88, y: 80 })}
                className="text-[10px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                ↘ Bas-Droite
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...layer, x: 12, y: 80 })}
                className="text-[10px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                ↙ Bas-Gauche
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...layer, x: 88, y: 20 })}
                className="text-[10px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                ↗ Haut-Droite
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...layer, x: 12, y: 20 })}
                className="text-[10px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                ↖ Haut-Gauche
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...layer, x: 50, y: 50 })}
                className="text-[10px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              >
                ⏺ Centre
              </button>
            </div>

            <ToggleSwitch
              checked={layer.flipHorizontal ?? false}
              onChange={(val) => onChange({ ...layer, flipHorizontal: val })}
              label="Effet Miroir Horizontal"
              accent={layerNumber === 3 ? 'emerald' : 'purple'}
            />
          </div>
        )}
      </div>

      {/* Taille & Opacité */}
      <div className="space-y-3">
        {!layer.fullScreen && (
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span>Taille / Échelle de l'élément</span>
              <span className={`font-mono text-xs font-black ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`}>
                {Math.round((layer.scale ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.05"
              value={layer.scale ?? 1.0}
              onChange={(e) => onChange({ ...layer, scale: parseFloat(e.target.value) })}
              className={`w-full cursor-pointer ${layerNumber === 3 ? 'accent-emerald-500' : 'accent-purple-500'}`}
            />
          </div>
        )}

        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>Opacité</span>
            <span className={`font-mono text-xs font-bold ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`}>
              {Math.round((layer.opacity ?? 1.0) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={layer.opacity ?? 1.0}
            onChange={(e) => onChange({ ...layer, opacity: parseFloat(e.target.value) })}
            className={`w-full cursor-pointer ${layerNumber === 3 ? 'accent-emerald-500' : 'accent-purple-500'}`}
          />
        </div>
      </div>

      {/* Découpe Fond Vert (Chroma Key) */}
      <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-3">
        <ToggleSwitch
          checked={layer.useChromaKey ?? false}
          onChange={(val) => onChange({ ...layer, useChromaKey: val })}
          label="Suppression Fond Vert (Chroma Key)"
          info="Activez cette option uniquement si votre média possède un fond vert ou monochrome à rendre transparent. Laissez désactivé pour les photos avec décor naturel."
          accent={layerNumber === 3 ? 'emerald' : 'purple'}
        />

        {layer.useChromaKey && (
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={layer.chromaKeyColor || '#00ff00'}
                onChange={(e) => onChange({ ...layer, chromaKeyColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-slate-300">
                Couleur clé : {layer.chromaKeyColor || '#00ff00'}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1 font-bold">
                <span>Tolérance</span>
                <span className="font-mono">{Math.round((layer.chromaTolerance ?? 0.35) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.02"
                value={layer.chromaTolerance ?? 0.35}
                onChange={(e) => onChange({ ...layer, chromaTolerance: parseFloat(e.target.value) })}
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Option exclusive Résultats : Victoire uniquement */}
      {category === 'results' && (
        <div className="bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20">
          <ToggleSwitch
            checked={layer.onlyOnVictory ?? false}
            onChange={(val) => onChange({ ...layer, onlyOnVictory: val })}
            label="Afficher UNIQUEMENT en cas de Victoire"
            sublabel="Reste masqué si le club perd la rencontre."
            accent="amber"
          />
        </div>
      )}
    </div>
  );
};

