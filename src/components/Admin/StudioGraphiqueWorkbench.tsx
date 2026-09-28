import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Layers,
  Palette,
  Type,
  Sparkles,
  Eye,
  RotateCcw,
  Upload,
  Sliders,
  Tv,
  Cake,
  Sun,
  Contrast,
  Trophy,
  Calendar,
  Maximize2,
  Minimize2,
  Move,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  Play,
  Pause,
  HelpCircle,
  Monitor,
  Video,
  Home,
  Plane,
  Film,
} from 'lucide-react';
import {
  VisualTemplatesConfig,
  CategorySlideTheme,
  OverlayLayerItem,
  MatchItem,
  BirthdayItem,
  ClubSettings,
} from '../../types';
import { MatchesSlide } from '../slides/MatchesSlide';
import { ResultsSlide } from '../slides/ResultsSlide';
import { BirthdaysSlide } from '../slides/BirthdaysSlide';
import { FixedCanvas169 } from '../common/FixedCanvas169';
import { MediaBankSelectorModal } from './MediaBankSelectorModal';
import { addMediaToBank } from '../../utils/mediaBankUtils';
import { AVAILABLE_FONTS } from '../../utils/fontUtils';
import { isVideoMedia, registerVideoBlob } from '../../utils/mediaUtils';
import { saveMediaBlob, getMediaBlobUrl } from '../../utils/indexedDBStorage';
import { normalizeLayerName } from '../../utils/themeUtils';
import { isClubHomeMatch } from '../../utils/matchStatus';
import {
  getEffectiveCategoryConfig,
  DEFAULT_MATCHES_THEME,
  DEFAULT_RESULTS_THEME,
  DEFAULT_BIRTHDAYS_THEME,
  DEFAULT_OVERLAY_LAYER_3,
  DEFAULT_OVERLAY_LAYER_4,
} from '../../utils/themeUtils';

interface StudioGraphiqueWorkbenchProps {
  visualTemplates: VisualTemplatesConfig;
  onUpdateVisualTemplates: (config: VisualTemplatesConfig) => void;
  matches: MatchItem[];
  results: MatchItem[];
  birthdays: BirthdayItem[];
  clubSettings: ClubSettings;
  defaultCategory?: 'matches' | 'results' | 'birthdays';
  hideCategorySelector?: boolean;
  onNavigateToCategoryTab?: (tab: 'matches' | 'results' | 'excel') => void;
}

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

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
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

const OverlayLayerEditor: React.FC<OverlayLayerEditorProps> = ({
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
        <div className="flex gap-2">
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
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
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

export const StudioGraphiqueWorkbench: React.FC<StudioGraphiqueWorkbenchProps> = ({
  visualTemplates,
  onUpdateVisualTemplates,
  matches,
  results,
  birthdays,
  clubSettings,
  defaultCategory,
  hideCategorySelector = false,
  onNavigateToCategoryTab,
}) => {
  const [activeCategory, setActiveCategory] = useState<'matches' | 'results' | 'birthdays'>(
    defaultCategory || 'matches'
  );

  useEffect(() => {
    if (defaultCategory) {
      setActiveCategory(defaultCategory);
      setPreviewMode(defaultCategory);
    }
  }, [defaultCategory]);

  const [activeLayerTab, setActiveLayerTab] = useState<1 | 2 | 3 | 4>(1);
  const [previewMode, setPreviewMode] = useState<'matches' | 'results' | 'birthdays'>(
    defaultCategory || 'matches'
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenFillMode, setFullscreenFillMode] = useState<'fitted' | 'full'>('full');
  const [selectedLayerNum, setSelectedLayerNum] = useState<3 | 4 | null>(null);
  const [studioScope, setStudioScope] = useState<'home' | 'away' | 'all'>('all');
  const [mobileStudioTab, setMobileStudioTab] = useState<'preview' | 'controls'>('preview');
  const [mediaBankModal, setMediaBankModal] = useState<{
    isOpen: boolean;
    target: 'bg' | 'layer3' | 'layer4';
    title?: string;
  }>({ isOpen: false, target: 'bg' });

  const handleRegisterMediaInBank = (media: { name: string; url: string; mediaType: 'image' | 'video'; size?: number }) => {
    const updated = addMediaToBank(visualTemplates, media);
    onUpdateVisualTemplates(updated);
  };

  const matchesEffective = useMemo(
    () => getEffectiveCategoryConfig('matches', visualTemplates, clubSettings),
    [visualTemplates, clubSettings]
  );
  const resultsEffective = useMemo(
    () => getEffectiveCategoryConfig('results', visualTemplates, clubSettings),
    [visualTemplates, clubSettings]
  );
  const birthdaysEffective = useMemo(
    () => getEffectiveCategoryConfig('birthdays', visualTemplates, clubSettings),
    [visualTemplates, clubSettings]
  );

  const currentEffective = useMemo(() => {
    if (activeCategory === 'matches') return matchesEffective;
    if (activeCategory === 'results') return resultsEffective;
    return birthdaysEffective;
  }, [activeCategory, matchesEffective, resultsEffective, birthdaysEffective]);

  const updateCurrentCategoryTheme = (partial: Partial<CategorySlideTheme>) => {
    const nextTemplates = { ...visualTemplates };
    const settingsKey =
      activeCategory === 'matches'
        ? 'matchesSettings'
        : activeCategory === 'results'
        ? 'resultsSettings'
        : 'birthdaysSettings';

    const currentTheme =
      activeCategory === 'matches'
        ? matchesEffective.categoryTheme
        : activeCategory === 'results'
        ? resultsEffective.categoryTheme
        : birthdaysEffective.categoryTheme;

    const merged = { ...currentTheme, ...partial };
    nextTemplates[settingsKey] = merged;
    onUpdateVisualTemplates(nextTemplates);
  };

  const displayedMatches = useMemo(() => {
    const activeMatches = matches.filter((m) => m.selectedForWeekend !== false);
    if (studioScope === 'home') {
      return activeMatches.filter((m) => isClubHomeMatch(m, clubSettings.name, clubSettings.shortName));
    }
    if (studioScope === 'away') {
      return activeMatches.filter((m) => !isClubHomeMatch(m, clubSettings.name, clubSettings.shortName));
    }
    return activeMatches;
  }, [matches, studioScope, clubSettings]);

  const displayedResults = useMemo(() => {
    const activeResults = results.filter((r) => r.selectedForWeekend !== false);
    if (studioScope === 'home') {
      return activeResults.filter((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName));
    }
    if (studioScope === 'away') {
      return activeResults.filter((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName));
    }
    return activeResults;
  }, [results, studioScope, clubSettings]);

  const handleSelectCategory = (cat: 'matches' | 'results' | 'birthdays') => {
    setActiveCategory(cat);
    setPreviewMode(cat);
  };

  const handleLayerPositionChange = (layerNum: 3 | 4, x: number, y: number) => {
    const layerKey = layerNum === 3 ? 'layer3' : 'layer4';
    const currentLayer = currentEffective[layerKey];
    updateCurrentCategoryTheme({
      [layerKey]: {
        ...currentLayer,
        x,
        y,
        fullScreen: false,
        motionTrajectory: 'none',
      },
    });
  };

  const previewCanvasRef = useRef<HTMLDivElement>(null);

  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('src_studio_recent_colors');
      return saved ? JSON.parse(saved) : ['#ea580c', '#dc2626', '#2563eb', '#16a34a', '#eab308'];
    } catch {
      return ['#ea580c', '#dc2626', '#2563eb', '#16a34a', '#eab308'];
    }
  });

  const saveRecentColor = (hex: string) => {
    if (!hex || !hex.startsWith('#')) return;
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== hex.toLowerCase());
      const next = [hex, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('src_studio_recent_colors', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  return (
    <div className="space-y-6">
      {/* EN-TÊTE PRINCIPAL DU STUDIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white font-bebas tracking-wide flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-orange-400" />
            <span>
              {hideCategorySelector
                ? `STUDIO GRAPHIQUE — ${activeCategory === 'matches' ? 'MATCHS' : activeCategory === 'results' ? 'RÉSULTATS' : 'ANNIVERSAIRES'}`
                : `STUDIO GRAPHIQUE UNIFIÉ (4 CALQUES)`}
            </span>
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-3xl mt-1">
            {hideCategorySelector
              ? `Réglez les 4 calques de cette diapositive : Fond (Calque 1), Cartes & Données (Calque 2), et éléments libres (Calques 3 & 4).`
              : `Réglez chaque catégorie sur 4 calques superposés : Fond (Calque 1), Cartes et typographies (Calque 2), et deux éléments libres (Calques 3 & 4).`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Plein Écran TV</span>
          </button>
        </div>
      </div>

      {/* SÉLECTEUR DE CATÉGORIE PRINCIPALE (Masqué si dispatché directement dans la catégorie) */}
      {!hideCategorySelector && (
        <div className="grid grid-cols-3 gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800">
          <button
            onClick={() => handleSelectCategory('matches')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-black transition-all ${
              activeCategory === 'matches'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>🏀 Matchs du week-end</span>
          </button>

          <button
            onClick={() => handleSelectCategory('results')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-black transition-all ${
              activeCategory === 'results'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Résultats du week-end</span>
          </button>

          <button
            onClick={() => handleSelectCategory('birthdays')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs md:text-sm font-black transition-all ${
              activeCategory === 'birthdays'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cake className="w-4 h-4" />
            <span>🎂 Anniversaires du club</span>
          </button>
        </div>
      )}

      {/* BOUTONS NAVIGATION MOBILE */}
      <div className="flex xl:hidden items-center justify-between p-2 bg-slate-900/95 rounded-2xl border border-slate-800 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMobileStudioTab('preview')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
            mobileStudioTab === 'preview'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Aperçu TV 16:9</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileStudioTab('controls')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
            mobileStudioTab === 'controls'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Réglages des Calques</span>
        </button>
      </div>

      {/* GRILLE PRINCIPALE : APERÇU GRAND FORMAT À GAUCHE (7 cols), RÉGLAGES DU CALQUE ACTIF À DROITE (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* COLONNE GAUCHE (7 colonnes sur desktop) : APERÇU 16:9 INTERACTIF DIRECT */}
        <div className={`xl:col-span-7 space-y-3 sticky top-4 ${mobileStudioTab === 'preview' ? 'block' : 'hidden'} xl:block`}>
          <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Aperçu 16:9 TV
              </span>
            </div>

            {/* Sélecteur Domicile / Extérieur pour prévisualiser chaque slide */}
            {(previewMode === 'matches' || previewMode === 'results') && (
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setStudioScope('home')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    studioScope === 'home'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Voir la slide des rencontres à domicile"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Domicile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioScope('away')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    studioScope === 'away'
                      ? 'bg-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Voir la slide des rencontres à l'extérieur"
                >
                  <Plane className="w-3.5 h-3.5 -rotate-45" />
                  <span>Extérieur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioScope('all')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    studioScope === 'all'
                      ? 'bg-slate-700 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Voir tous les matchs"
                >
                  <span>Tous</span>
                </button>
              </div>
            )}
          </div>

          {/* CANEVAS 16:9 AVEC GESTION INTERACTIVE DU GLISSER-DÉPOSER */}
          <div
            ref={previewCanvasRef}
            className="relative w-full aspect-video rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-black select-none"
          >
            <FixedCanvas169>
              {previewMode === 'matches' ? (
                <MatchesSlide
                  matches={displayedMatches}
                  clubSettings={clubSettings}
                  backgroundUrl={matchesEffective.backgroundUrl}
                  onDownloadVisual={() => {}}
                  hideShareButton={true}
                  theme={matchesEffective.theme}
                  mascot={matchesEffective.mascot}
                  layer3={matchesEffective.layer3}
                  layer4={matchesEffective.layer4}
                  customHeaderTitle={matchesEffective.categoryTheme?.customHeaderTitle}
                  isInteractiveOverlay={true}
                  selectedLayerNum={selectedLayerNum}
                  onSelectLayer={(num) => {
                    setSelectedLayerNum(num);
                    setActiveLayerTab(num);
                  }}
                  onLayerPositionChange={handleLayerPositionChange}
                />
              ) : previewMode === 'results' ? (
                <ResultsSlide
                  results={displayedResults}
                  clubSettings={clubSettings}
                  backgroundUrl={resultsEffective.backgroundUrl}
                  onDownloadVisual={() => {}}
                  hideShareButton={true}
                  theme={resultsEffective.theme}
                  mascot={resultsEffective.mascot}
                  layer3={resultsEffective.layer3}
                  layer4={resultsEffective.layer4}
                  customHeaderTitle={resultsEffective.categoryTheme?.customHeaderTitle}
                  isInteractiveOverlay={true}
                  selectedLayerNum={selectedLayerNum}
                  onSelectLayer={(num) => {
                    setSelectedLayerNum(num);
                    setActiveLayerTab(num);
                  }}
                  onLayerPositionChange={handleLayerPositionChange}
                />
              ) : (
                <BirthdaysSlide
                  birthdays={birthdays}
                  clubSettings={clubSettings}
                  backgroundUrl={birthdaysEffective.backgroundUrl}
                  theme={birthdaysEffective.theme}
                  mascot={birthdaysEffective.mascot}
                  layer3={birthdaysEffective.layer3}
                  layer4={birthdaysEffective.layer4}
                  isInteractiveOverlay={true}
                  selectedLayerNum={selectedLayerNum}
                  onSelectLayer={(num) => {
                    setSelectedLayerNum(num);
                    setActiveLayerTab(num);
                  }}
                  onLayerPositionChange={handleLayerPositionChange}
                />
              )}
            </FixedCanvas169>

            {/* Indicateur de calques interactifs */}
            <div className="absolute top-3 left-3 z-40 flex items-center gap-2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>
                Glissez les calques 3 & 4 à la souris sur l'écran
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
            <div className="flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-orange-400" />
              <span>Repositionnement interactif en direct sur l'écran.</span>
            </div>
            <span className="font-mono text-emerald-400">✓ Synchronisé en direct</span>
          </div>

          {/* Raccourci vers réglages sur smartphone */}
          <div className="block xl:hidden pt-2">
            <button
              type="button"
              onClick={() => setMobileStudioTab('controls')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Sliders className="w-4 h-4 text-orange-400" />
              <span>Modifier les réglages des calques</span>
            </button>
          </div>
        </div>

        {/* COLONNE DROITE (5 colonnes sur desktop) : SÉLECTION DES CALQUES & RÉGLAGES */}
        <div className={`xl:col-span-5 space-y-4 ${mobileStudioTab === 'controls' ? 'block' : 'hidden'} xl:block`}>
          {/* SÉLECTEUR DES 4 CALQUES */}
          <div className="grid grid-cols-4 gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveLayerTab(1)}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeLayerTab === 1
                  ? 'bg-orange-600 text-white shadow ring-2 ring-orange-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Calque 1
              <span className="block text-[10px] opacity-75">Fond</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayerTab(2)}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeLayerTab === 2
                  ? 'bg-amber-600 text-white shadow ring-2 ring-amber-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Calque 2
              <span className="block text-[10px] opacity-75">Cartes</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLayerTab(3);
                setSelectedLayerNum(3);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeLayerTab === 3
                  ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Calque 3
              <span className="block text-[10px] opacity-75">Élément 1</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveLayerTab(4);
                setSelectedLayerNum(4);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeLayerTab === 4
                  ? 'bg-purple-600 text-white shadow ring-2 ring-purple-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Calque 4
              <span className="block text-[10px] opacity-75">Élément 2</span>
            </button>
          </div>

          {/* ONGLET CALQUE 1 : FOND & AMBIANCE */}
          {activeLayerTab === 1 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>Calque 1 : Fond & Ambiance ({activeCategory})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Image ou vidéo d'arrière-plan avec luminosité et flou
                </p>
              </div>

              {/* Source du fond */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Image ou Vidéo de Fond
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentEffective.categoryTheme.backgroundUrl || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isVid = isVideoMedia(val);
                      updateCurrentCategoryTheme({
                        backgroundUrl: val,
                        backgroundMediaType: isVid ? 'video' : currentEffective.categoryTheme.backgroundMediaType || 'image',
                      });
                    }}
                    placeholder="URL image ou vidéo..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 text-xs font-bold border border-orange-500/30 cursor-pointer transition-all shrink-0" title="Importer un fichier depuis votre appareil">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer</span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/*"
                      className="hidden"
                      onChange={async (e) => {
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
                                handleRegisterMediaInBank({
                                  name: file.name,
                                  url: data.url,
                                  mediaType: isVideo ? 'video' : 'image',
                                  size: file.size,
                                });
                                updateCurrentCategoryTheme({
                                  backgroundUrl: data.url,
                                  backgroundMediaType: isVideo ? 'video' : 'image',
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
                              handleRegisterMediaInBank({
                                name: file.name,
                                url: data.url,
                                mediaType: isVideo ? 'video' : 'image',
                                size: file.size,
                              });
                              updateCurrentCategoryTheme({
                                backgroundUrl: data.url,
                                backgroundMediaType: isVideo ? 'video' : 'image',
                              });
                              return;
                            }
                          }
                        } catch (err) {
                          console.warn('Direct upload failed:', err);
                        }

                        if (isVideo) {
                          const blobUrl = await saveMediaBlob(`category_bg_${activeCategory}`, file);
                          registerVideoBlob(blobUrl);
                          updateCurrentCategoryTheme({
                            backgroundUrl: blobUrl,
                            backgroundMediaType: 'video',
                          });
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (typeof ev.target?.result === 'string') {
                            updateCurrentCategoryTheme({
                              backgroundUrl: ev.target.result,
                              backgroundMediaType: 'image',
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setMediaBankModal({
                        isOpen: true,
                        target: 'bg',
                        title: `Choisir le Fond (${activeCategory})`,
                      })
                    }
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all shrink-0 cursor-pointer shadow-sm"
                    title="Choisir dans la Banque Médias commune"
                  >
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Banque Médias</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Type :</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ backgroundMediaType: 'image' })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        (currentEffective.categoryTheme.backgroundMediaType || (isVideoMedia(currentEffective.categoryTheme.backgroundUrl) ? 'video' : 'image')) === 'image'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentEffective.categoryTheme.backgroundUrl) {
                          registerVideoBlob(currentEffective.categoryTheme.backgroundUrl);
                        }
                        updateCurrentCategoryTheme({ backgroundMediaType: 'video' });
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        (currentEffective.categoryTheme.backgroundMediaType || (isVideoMedia(currentEffective.categoryTheme.backgroundUrl) ? 'video' : 'image')) === 'video'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Video className="w-3 h-3 text-white" />
                      <span>Vidéo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Luminosité Fond (5% à 200%) */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Luminosité du Fond</span>
                  </span>
                  <span className="font-mono text-amber-400">
                    {Math.round((currentEffective.categoryTheme.backgroundBrightness ?? 0.4) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="2.0"
                  step="0.05"
                  value={currentEffective.categoryTheme.backgroundBrightness ?? 0.4}
                  onChange={(e) =>
                    updateCurrentCategoryTheme({ backgroundBrightness: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Flou du fond */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Contrast className="w-3.5 h-3.5 text-slate-400" />
                    <span>Flou Optique du Fond</span>
                  </span>
                  <span className="font-mono text-orange-400">
                    {currentEffective.categoryTheme.backgroundBlur ?? 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={currentEffective.categoryTheme.backgroundBlur ?? 0}
                  onChange={(e) =>
                    updateCurrentCategoryTheme({ backgroundBlur: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Filigrane Logo du Club au centre */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <ToggleSwitch
                  checked={currentEffective.categoryTheme.showClubLogoWatermark ?? false}
                  onChange={(val) => updateCurrentCategoryTheme({ showClubLogoWatermark: val })}
                  label="Filigrane Logo du Club au centre"
                  sublabel="Affiche le logo du club en filigrane discret derrière les cartes."
                  accent="orange"
                />
              </div>
            </div>
          )}

          {/* ONGLET CALQUE 2 : CARTES, TYPOGRAPHIE & DONNÉES */}
          {activeLayerTab === 2 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>Calque 2 : Cartes & Typographie ({activeCategory})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Apparence des cartes vitrées (Glassmorphism), couleurs et polices
                </p>
              </div>

              {/* Titre / Entête personnalisée */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 text-amber-400">
                    <Type className="w-3.5 h-3.5" />
                    <span>Titre / Entête Personnalisée</span>
                  </span>
                  {currentEffective.categoryTheme.customHeaderTitle && (
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ customHeaderTitle: '' })}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={currentEffective.categoryTheme.customHeaderTitle || ''}
                  onChange={(e) => updateCurrentCategoryTheme({ customHeaderTitle: e.target.value })}
                  placeholder={
                    activeCategory === 'matches'
                      ? 'LES RENCONTRES DU WEEK-END'
                      : activeCategory === 'results'
                      ? 'RÉSULTATS DU WEEK-END'
                      : 'BON ANNIVERSAIRE'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold uppercase focus:outline-none focus:border-amber-500"
                />

                {/* Alignement du titre (Segmented Control) */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300">Alignement :</span>
                  <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ headerTitleAlignment: 'left' })}
                      className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                        (currentEffective.categoryTheme.headerTitleAlignment || 'left') === 'left'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⬅ Gauche
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ headerTitleAlignment: 'center' })}
                      className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                        currentEffective.categoryTheme.headerTitleAlignment === 'center'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⏺ Centré
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ headerTitleAlignment: 'right' })}
                      className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                        currentEffective.categoryTheme.headerTitleAlignment === 'right'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ➡ Droite
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode de regroupement TV */}
              {(activeCategory === 'matches' || activeCategory === 'results') && (
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Diffusion TV : Présentation des matchs</span>
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ matchDisplayScope: 'all' })}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all text-left flex items-center gap-1.5 ${
                        currentEffective.categoryTheme.matchDisplayScope === 'all'
                          ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                      title="Afficher ensemble les matchs à domicile et à l'extérieur sur une même diapositive"
                    >
                      <span>🏀</span>
                      <span>Tout</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ matchDisplayScope: 'split' })}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all text-left flex items-center gap-1.5 ${
                        (currentEffective.categoryTheme.matchDisplayScope || 'split') === 'split'
                          ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                      title="Créer une diapositive pour les Matchs Domicile puis une diapositive pour les Matchs Extérieur"
                    >
                      <span>🔄</span>
                      <span>Domicile & Extérieur séparés</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Couleurs Personnalisées */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                  <input
                    type="color"
                    value={currentEffective.categoryTheme.primaryColor || '#ea580c'}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCurrentCategoryTheme({ primaryColor: val });
                      saveRecentColor(val);
                    }}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                    title="Couleur d'accentuation générale"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">Accentuation</span>
                    <span className="text-[10px] font-mono text-orange-400 block truncate">
                      {currentEffective.categoryTheme.primaryColor || '#ea580c'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                  <input
                    type="color"
                    value={currentEffective.categoryTheme.textColor || '#ffffff'}
                    onChange={(e) => updateCurrentCategoryTheme({ textColor: e.target.value })}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                    title="Couleur du texte principal"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">Texte</span>
                    <span className="text-[10px] font-mono text-amber-400 block truncate">
                      {currentEffective.categoryTheme.textColor || '#ffffff'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                  <input
                    type="color"
                    value={currentEffective.categoryTheme.badgeBgColor || currentEffective.categoryTheme.primaryColor || '#dc2626'}
                    onChange={(e) => updateCurrentCategoryTheme({ badgeBgColor: e.target.value })}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                    title="Couleur de fond des pastilles"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">Pastilles</span>
                    <span className="text-[10px] font-mono text-sky-400 block truncate">
                      {currentEffective.categoryTheme.badgeBgColor || 'Auto'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mémoire des Couleurs (Accès rapide) */}
              {recentColors.length > 0 && (
                <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-400">Couleurs récentes :</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {recentColors.map((hex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          updateCurrentCategoryTheme({
                            primaryColor: hex,
                            badgeBgColor: hex,
                          })
                        }
                        className="w-6 h-6 rounded-lg border border-slate-700 hover:scale-110 transition-all shadow shrink-0"
                        style={{ backgroundColor: hex }}
                        title={`Appliquer ${hex}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Détourer les logos */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <ToggleSwitch
                  checked={currentEffective.categoryTheme.removeWhiteBgLogos !== false}
                  onChange={(val) => updateCurrentCategoryTheme({ removeWhiteBgLogos: val })}
                  label="Détourer automatiquement les logos"
                  sublabel="Masque les fonds blancs rectangulaires des logos d'équipes et partenaires."
                  accent="emerald"
                />
              </div>

              {/* Mode d'affichage des résultats */}
              {activeCategory === 'results' && (
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    Mode d'Affichage des Résultats :
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ resultDisplayMode: 'both' })}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                        (currentEffective.categoryTheme.resultDisplayMode || 'both') === 'both'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Score + Mention
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ resultDisplayMode: 'score' })}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                        currentEffective.categoryTheme.resultDisplayMode === 'score'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Score Seul
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ resultDisplayMode: 'status' })}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                        currentEffective.categoryTheme.resultDisplayMode === 'status'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Victoire / Défaite
                    </button>
                  </div>
                </div>
              )}

              {/* Opacité & Flou des cartes vitrées */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Transparence Cartes</span>
                    <span className="font-mono text-orange-400">
                      {Math.round((currentEffective.categoryTheme.cardOpacity ?? 0.85) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={currentEffective.categoryTheme.cardOpacity ?? 0.85}
                    onChange={(e) =>
                      updateCurrentCategoryTheme({ cardOpacity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Flou Vitré (Glass)</span>
                    <span className="font-mono text-orange-400">
                      {currentEffective.categoryTheme.cardBlur ?? 8}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="2"
                    value={currentEffective.categoryTheme.cardBlur ?? 8}
                    onChange={(e) =>
                      updateCurrentCategoryTheme({ cardBlur: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Typographie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-orange-400" />
                    <span>Police Titres</span>
                  </label>
                  <select
                    value={currentEffective.categoryTheme.fontFamilyHeader || 'Bebas Neue'}
                    onChange={(e) =>
                      updateCurrentCategoryTheme({ fontFamilyHeader: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl text-white px-3 py-2 text-xs font-bold"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-400" />
                    <span>Police Corps & Infos</span>
                  </label>
                  <select
                    value={currentEffective.categoryTheme.fontFamilyBody || 'Montserrat'}
                    onChange={(e) =>
                      updateCurrentCategoryTheme({ fontFamilyBody: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl text-white px-3 py-2 text-xs font-bold"
                  >
                    {AVAILABLE_FONTS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pour Résultats : Police Scores */}
              {activeCategory === 'results' && (
                <div className="bg-blue-950/30 p-3 rounded-2xl border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      <span>Police des SCORES</span>
                    </span>
                    <span className="text-xs font-mono text-blue-400 font-bold">
                      {currentEffective.categoryTheme.fontFamilyScore || 'Teko'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AVAILABLE_FONTS.filter((f) => ['Teko', 'Bebas Neue', 'Kanit', 'Anton', 'Russo One', 'Montserrat'].includes(f.id)).map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => updateCurrentCategoryTheme({ fontFamilyScore: font.id })}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          (currentEffective.categoryTheme.fontFamilyScore || 'Teko') === font.id
                            ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-300 block">{font.name}</span>
                        <span className={`text-lg font-black ${font.className} text-amber-400 block leading-tight`}>
                          84:76
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ONGLET CALQUE 3 : ÉLÉMENT LIBRE 1 */}
          {activeLayerTab === 3 && (
            <OverlayLayerEditor
              layerNumber={3}
              layer={currentEffective.layer3}
              category={activeCategory}
              isSelected={selectedLayerNum === 3}
              onSelect={() => setSelectedLayerNum(3)}
              onChange={(updated) => updateCurrentCategoryTheme({ layer3: updated })}
              onOpenMediaBank={() =>
                setMediaBankModal({
                  isOpen: true,
                  target: 'layer3',
                  title: `Choisir le Calque 3 (${activeCategory})`,
                })
              }
              onRegisterMediaInBank={handleRegisterMediaInBank}
            />
          )}

          {/* ONGLET CALQUE 4 : ÉLÉMENT LIBRE 2 */}
          {activeLayerTab === 4 && (
            <OverlayLayerEditor
              layerNumber={4}
              layer={currentEffective.layer4}
              category={activeCategory}
              isSelected={selectedLayerNum === 4}
              onSelect={() => setSelectedLayerNum(4)}
              onChange={(updated) => updateCurrentCategoryTheme({ layer4: updated })}
              onOpenMediaBank={() =>
                setMediaBankModal({
                  isOpen: true,
                  target: 'layer4',
                  title: `Choisir le Calque 4 (${activeCategory})`,
                })
              }
              onRegisterMediaInBank={handleRegisterMediaInBank}
            />
          )}

          {/* Raccourci vers aperçu sur smartphone */}
          <div className="block xl:hidden pt-2">
            <button
              type="button"
              onClick={() => setMobileStudioTab('preview')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
            >
              <Eye className="w-4 h-4" />
              <span>Voir l'aperçu TV 16:9</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL APERÇU PLEIN ÉCRAN POUR SIMULATION RÉELLE TV */}
      {isFullscreen && (
        <div className={`fixed inset-0 z-50 bg-black flex flex-col justify-center items-center select-none animate-in fade-in duration-200 ${
          fullscreenFillMode === 'full' ? 'p-0' : 'p-2 sm:p-6'
        }`}>
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 left-2 sm:left-auto z-50 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-700 shadow-xl">
              <button
                onClick={() => setPreviewMode('matches')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  previewMode === 'matches' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏀 Matchs
              </button>
              <button
                onClick={() => setPreviewMode('results')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  previewMode === 'results' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏆 Résultats
              </button>
              <button
                onClick={() => setPreviewMode('birthdays')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  previewMode === 'birthdays' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎂 Anniv
              </button>
            </div>

            {(previewMode === 'matches' || previewMode === 'results') && (
              <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-700 shadow-xl">
                <button
                  type="button"
                  onClick={() => setStudioScope('home')}
                  className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                    studioScope === 'home' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Rencontres à Domicile"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Domicile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioScope('away')}
                  className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                    studioScope === 'away' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Rencontres à l'Extérieur"
                >
                  <Plane className="w-3.5 h-3.5 -rotate-45" />
                  <span className="hidden sm:inline">Extérieur</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioScope('all')}
                  className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                    studioScope === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tous les matchs"
                >
                  <span>Tous</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-700 shadow-xl">
              <button
                onClick={() => setFullscreenFillMode('full')}
                title="Occuper 100% de l'écran sans bandes noires"
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all ${
                  fullscreenFillMode === 'full'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Plein Écran</span>
              </button>
              <button
                onClick={() => setFullscreenFillMode('fitted')}
                title="Conserver les proportions 16:9 dans un cadre"
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all ${
                  fullscreenFillMode === 'fitted'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cadre 16:9</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen?.().catch(() => {});
                }
                setIsFullscreen(false);
              }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] sm:text-xs shadow-xl transition-all shrink-0"
            >
              <Minimize2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              <span>Quitter</span>
            </button>
          </div>

          <div
            className={
              fullscreenFillMode === 'full'
                ? 'w-screen h-screen max-w-none max-h-none overflow-hidden relative bg-black'
                : 'w-full h-full max-w-[96vw] max-h-[92vh] aspect-video rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl relative bg-black'
            }
          >
            <FixedCanvas169>
              {previewMode === 'matches' ? (
                <MatchesSlide
                  matches={displayedMatches}
                  clubSettings={clubSettings}
                  backgroundUrl={matchesEffective.backgroundUrl}
                  onDownloadVisual={() => {}}
                  hideShareButton={true}
                  theme={matchesEffective.theme}
                  mascot={matchesEffective.mascot}
                  layer3={matchesEffective.layer3}
                  layer4={matchesEffective.layer4}
                  customHeaderTitle={matchesEffective.categoryTheme?.customHeaderTitle}
                />
              ) : previewMode === 'results' ? (
                <ResultsSlide
                  results={displayedResults}
                  clubSettings={clubSettings}
                  backgroundUrl={resultsEffective.backgroundUrl}
                  onDownloadVisual={() => {}}
                  hideShareButton={true}
                  theme={resultsEffective.theme}
                  mascot={resultsEffective.mascot}
                  layer3={resultsEffective.layer3}
                  layer4={resultsEffective.layer4}
                  customHeaderTitle={resultsEffective.categoryTheme?.customHeaderTitle}
                />
              ) : (
                <BirthdaysSlide
                  birthdays={birthdays}
                  clubSettings={clubSettings}
                  backgroundUrl={birthdaysEffective.backgroundUrl}
                  theme={birthdaysEffective.theme}
                  mascot={birthdaysEffective.mascot}
                  layer3={birthdaysEffective.layer3}
                  layer4={birthdaysEffective.layer4}
                />
              )}
            </FixedCanvas169>
          </div>
        </div>
      )}

      {/* Modale de sélection dans la Banque Médias Commune */}
      <MediaBankSelectorModal
        isOpen={mediaBankModal.isOpen}
        title={mediaBankModal.title}
        onClose={() => setMediaBankModal({ ...mediaBankModal, isOpen: false })}
        visualTemplates={visualTemplates}
        onSelect={(url, mediaType) => {
          if (mediaBankModal.target === 'bg') {
            updateCurrentCategoryTheme({
              backgroundUrl: url,
              backgroundMediaType: mediaType,
            });
          } else if (mediaBankModal.target === 'layer3') {
            updateCurrentCategoryTheme({
              layer3: {
                ...currentEffective.layer3,
                mediaUrl: url,
                mediaType,
                enabled: true,
              },
            });
          } else if (mediaBankModal.target === 'layer4') {
            updateCurrentCategoryTheme({
              layer4: {
                ...currentEffective.layer4,
                mediaUrl: url,
                mediaType,
                enabled: true,
              },
            });
          }
        }}
      />
    </div>
  );
};
