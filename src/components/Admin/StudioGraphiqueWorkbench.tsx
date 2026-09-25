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
import { AVAILABLE_FONTS } from '../../utils/fontUtils';
import { isVideoMedia, registerVideoBlob } from '../../utils/mediaUtils';
import { saveMediaBlob, getMediaBlobUrl } from '../../utils/indexedDBStorage';
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

const BRIGHTNESS_PRESETS = [
  { label: '20% Sombre', val: 0.2 },
  { label: '40% Équilibré', val: 0.4 },
  { label: '70% Doux', val: 0.7 },
  { label: '100% Naturel', val: 1.0 },
  { label: '150% Brillant', val: 1.5 },
  { label: '200% Ultra Éclatant', val: 2.0 },
];

const MATCH_COLOR_PRESETS = [
  { name: 'Orange Basket', primary: '#ea580c', cardBg: '#020617', opacity: 0.85, blur: 8 },
  { name: 'Rouge Puissant', primary: '#dc2626', cardBg: '#0b0404', opacity: 0.88, blur: 8 },
  { name: 'Bleu Royal', primary: '#2563eb', cardBg: '#030712', opacity: 0.85, blur: 10 },
  { name: 'Vert Celtics', primary: '#16a34a', cardBg: '#021208', opacity: 0.85, blur: 8 },
  { name: 'Noir & Or', primary: '#eab308', cardBg: '#000000', opacity: 0.9, blur: 12 },
];

const RESULTS_COLOR_PRESETS = [
  { name: 'Orange & Victoire', primary: '#ea580c', cardBg: '#020617', opacity: 0.85, blur: 8 },
  { name: 'Score Or & Nuit', primary: '#eab308', cardBg: '#05070e', opacity: 0.88, blur: 10 },
  { name: 'Contraste Bleu', primary: '#3b82f6', cardBg: '#030712', opacity: 0.9, blur: 12 },
  { name: 'Intense Rouge', primary: '#ef4444', cardBg: '#0b0404', opacity: 0.88, blur: 8 },
];

const BIRTHDAY_COLOR_PRESETS = [
  { name: 'Rose & Festif', primary: '#ec4899', cardBg: '#180410', opacity: 0.85, blur: 8 },
  { name: 'Or Étincelant', primary: '#f59e0b', cardBg: '#150f04', opacity: 0.88, blur: 10 },
  { name: 'Violet Célébration', primary: '#a855f7', cardBg: '#120520', opacity: 0.85, blur: 8 },
  { name: 'Cyan Fiesta', primary: '#06b6d4', cardBg: '#031419', opacity: 0.85, blur: 8 },
];

// Composant réutilisable pour éditer Calque 3 et Calque 4
interface OverlayLayerEditorProps {
  layerNumber: 3 | 4;
  layer: OverlayLayerItem;
  category: 'matches' | 'results' | 'birthdays';
  onChange: (updated: OverlayLayerItem) => void;
  isSelected: boolean;
  onSelect: () => void;
}

const OverlayLayerEditor: React.FC<OverlayLayerEditorProps> = ({
  layerNumber,
  layer,
  category,
  onChange,
  isSelected,
  onSelect,
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

    // Fallback
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
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border ${badgeColorClass}`}>
            Calque {layerNumber}
          </span>
          <input
            type="text"
            value={layer.name || (layerNumber === 3 ? 'Élément 1' : 'Élément 2')}
            onChange={(e) => onChange({ ...layer, name: e.target.value })}
            className="bg-transparent border-0 text-sm font-bold text-white hover:bg-slate-900/60 px-2 py-1 rounded-lg focus:ring-1 focus:ring-slate-700"
            placeholder={layerNumber === 3 ? 'Ex: Mascotte' : 'Ex: Logo Sponsor'}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs font-bold text-slate-300">
            {layer.enabled ? 'Actif' : 'Désactivé'}
          </span>
          <input
            type="checkbox"
            checked={layer.enabled}
            onChange={(e) => onChange({ ...layer, enabled: e.target.checked })}
            className={`w-4 h-4 rounded ${layerNumber === 3 ? 'accent-emerald-500' : 'accent-purple-500'}`}
          />
        </label>
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
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Fichier</span>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Aide Média Vidéo */}
        {Boolean(layer.mediaType === 'video' || layer.mediaUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) || layer.mediaUrl.startsWith('data:video/')) && (
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-2.5 text-xs text-blue-200 flex items-start gap-2">
            <Play className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-300 block">Lecture Vidéo</span>
              <span className="text-[11px] text-blue-200/80 leading-relaxed">
                Les vidéos sont configurées pour tourner en boucle sans son. Si votre navigateur bloque la lecture automatique, un bouton Play/Pause interactif est disponible au survol de la vidéo sur l'aperçu.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3 MODES D'AFFICHAGE DU CALQUE */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers className={`w-3.5 h-3.5 ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`} />
            <span>Mode d'Affichage du Calque</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {layer.fullScreen
              ? 'Plein Écran 16:9'
              : layer.motionTrajectory && layer.motionTrajectory !== 'none'
              ? 'Traversée Animée'
              : 'Position Fixe'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Mode 1 : Pleine Page 16:9 */}
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
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
              layer.fullScreen
                ? layerNumber === 3
                  ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-purple-950/50 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>16:9 Pleine Page</span>
            </div>
            <span className="text-[10px] leading-tight opacity-75">
              Occupe 100% de la diapositive (pour vidéo ou montage 16:9).
            </span>
          </button>

          {/* Mode 2 : Traversée Animée (Mascotte marchant) */}
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
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
              !layer.fullScreen && layer.motionTrajectory && layer.motionTrajectory !== 'none'
                ? 'bg-sky-950/50 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className="text-sm">🏃</span>
              <span>Traversée Animée</span>
            </div>
            <span className="text-[10px] leading-tight opacity-75">
              Idéal mascotte marche sur place : traverse l'écran en boucle !
            </span>
          </button>

          {/* Mode 3 : Élément Libre (Position Fixe X / Y) */}
          <button
            type="button"
            onClick={() => {
              onChange({
                ...layer,
                fullScreen: false,
                motionTrajectory: 'none',
              });
            }}
            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
              !layer.fullScreen && (!layer.motionTrajectory || layer.motionTrajectory === 'none')
                ? layerNumber === 3
                  ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-purple-950/50 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Move className="w-3.5 h-3.5" />
              <span>Position Fixe</span>
            </div>
            <span className="text-[10px] leading-tight opacity-75">
              Placez l'élément où vous voulez à la souris ou avec X/Y.
            </span>
          </button>
        </div>

        {/* Détails du mode 1 : Pleine Page 16:9 */}
        {layer.fullScreen && (
          <div className="pt-2.5 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-bold">Cadrage Plein Écran 16:9 :</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...layer, objectFit: 'cover' })}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                    (layer.objectFit || 'cover') === 'cover'
                      ? 'bg-slate-800 border-white/30 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Couvrir Tout (Cover - 0 bordure)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...layer, objectFit: 'contain' })}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                    layer.objectFit === 'contain'
                      ? 'bg-slate-800 border-white/30 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Proportionnel (Contain)
                </button>
              </div>
            </div>
            <p className="text-[10px] text-emerald-400 leading-relaxed">
              ✓ Ce mode permet à votre vidéo ou montage 16:9 de couvrir l'intégralité de la diapositive TV.
            </p>
          </div>
        )}

        {/* Détails du mode 2 : Traversée Animée (Marche) */}
        {!layer.fullScreen && layer.motionTrajectory && layer.motionTrajectory !== 'none' && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300">Sens de la traversée :</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...layer, motionTrajectory: 'right-to-left' })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                    layer.motionTrajectory === 'right-to-left'
                      ? 'bg-sky-600 text-white border-sky-400 shadow'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  ◀ Droite vers Gauche
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...layer, motionTrajectory: 'left-to-right' })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                    layer.motionTrajectory === 'left-to-right'
                      ? 'bg-sky-600 text-white border-sky-400 shadow'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  Gauche vers Droite ▶
                </button>
              </div>
            </div>

            {/* Vitesse de traversée */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Vitesse de marche (Durée de traversée)</span>
                <span className="font-mono text-sky-400 font-bold">
                  {layer.motionDuration ?? 12}s
                </span>
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
              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                <span>Rapide (6s)</span>
                <span>Moyenne (12s)</span>
                <span>Lente (24s)</span>
              </div>
            </div>

            {/* Hauteur du sol (Axe Y) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Hauteur de marche (Axe Y vertical)</span>
                <span className="font-mono text-sky-400 font-bold">
                  {layer.y ?? 78}% (sol)
                </span>
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

            {/* Option Miroir Horizontal */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-xs font-bold text-slate-300">
                🔄 Effet Miroir (Retourner horizontalement)
              </span>
              <input
                type="checkbox"
                checked={layer.flipHorizontal ?? false}
                onChange={(e) => onChange({ ...layer, flipHorizontal: e.target.checked })}
                className="w-4 h-4 rounded accent-sky-500"
              />
            </label>
          </div>
        )}

        {/* Détails du mode 3 : Position Fixe (X / Y) */}
        {!layer.fullScreen && (!layer.motionTrajectory || layer.motionTrajectory === 'none') && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Coordonnées sur l'Écran</span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                X: {layer.x}% | Y: {layer.y}%
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              🖱️ Glissez cet élément directement à la souris sur l'aperçu à droite, ou ajustez ci-dessous :
            </p>

            {/* Axe X (Horizontal) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Axe X (Horizontal : 0% Gauche ➔ 100% Droite)</span>
                <span className={`font-mono ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`}>
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

            {/* Axe Y (Vertical) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Axe Y (Vertical : 0% Haut ➔ 100% Bas)</span>
                <span className={`font-mono ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`}>
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

            {/* Boutons de positionnement rapide */}
            <div className="pt-1 flex flex-wrap gap-1.5">
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

            {/* Option Miroir Horizontal */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <span className="text-xs font-bold text-slate-300">
                🔄 Effet Miroir (Retourner horizontalement)
              </span>
              <input
                type="checkbox"
                checked={layer.flipHorizontal ?? false}
                onChange={(e) => onChange({ ...layer, flipHorizontal: e.target.checked })}
                className={`w-4 h-4 rounded ${layerNumber === 3 ? 'accent-emerald-500' : 'accent-purple-500'}`}
              />
            </label>
          </div>
        )}
      </div>

      {/* Taille, Opacité & Animation */}
      <div className="space-y-3">
        {/* Taille / Échelle jusqu'à 400% */}
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

            {/* Presets rapides de taille */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                { label: '50%', val: 0.5 },
                { label: '100% (Normal)', val: 1.0 },
                { label: '150%', val: 1.5 },
                { label: '200% (Grand)', val: 2.0 },
                { label: '300% (Très Grand)', val: 3.0 },
                { label: '400% (Max)', val: 4.0 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChange({ ...layer, scale: preset.val })}
                  className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                    Math.abs((layer.scale ?? 1.0) - preset.val) < 0.05
                      ? layerNumber === 3
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Opacité */}
        <div className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
            <span>Opacité</span>
            <span className={`font-mono ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`}>
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
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
            <Zap className={`w-3.5 h-3.5 ${layerNumber === 3 ? 'text-emerald-400' : 'text-purple-400'}`} />
            <span>Suppression Fond Vert (Chroma Key)</span>
          </span>
          <input
            type="checkbox"
            checked={layer.useChromaKey}
            onChange={(e) => onChange({ ...layer, useChromaKey: e.target.checked })}
            className={`w-4 h-4 rounded ${layerNumber === 3 ? 'accent-emerald-500' : 'accent-purple-500'}`}
          />
        </label>

        {/* Conseil explicite pour éviter l'effacement involontaire */}
        <p className="text-[10px] text-slate-400 leading-normal">
          💡 <strong>Attention :</strong> Cochez cette option <em>uniquement</em> si votre média possède un fond vert ou monochrome à rendre transparent. Si votre image a déjà son propre décor (photo naturelle, mur, parquet...), <strong>laissez décoché</strong> pour afficher tout le visuel.
        </p>

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
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 cursor-pointer">
          <div className="pr-2">
            <span className="text-xs font-bold text-amber-400 block">
              Afficher UNIQUEMENT en cas de Victoire
            </span>
            <span className="text-[10px] text-slate-400">
              Reste masqué si le club perd la rencontre.
            </span>
          </div>
          <input
            type="checkbox"
            checked={layer.onlyOnVictory ?? false}
            onChange={(e) => onChange({ ...layer, onlyOnVictory: e.target.checked })}
            className="w-4 h-4 rounded accent-amber-500"
          />
        </label>
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
  // Navigation par catégorie
  const [activeCategory, setActiveCategory] = useState<'matches' | 'results' | 'birthdays'>(
    defaultCategory || 'matches'
  );

  useEffect(() => {
    if (defaultCategory) {
      setActiveCategory(defaultCategory);
      setPreviewMode(defaultCategory);
    }
  }, [defaultCategory]);

  // Calque actif en cours d'édition dans l'accordéon (1, 2, 3 ou 4)
  const [activeLayerTab, setActiveLayerTab] = useState<1 | 2 | 3 | 4>(1);
  // Mode d'aperçu 16:9
  const [previewMode, setPreviewMode] = useState<'matches' | 'results' | 'birthdays'>(
    defaultCategory || 'matches'
  );
  // Mode Plein Écran
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Mode de cadrage plein écran : 'fitted' (cadre 16:9) ou 'full' (occupe 100% de la fenêtre sans bordure)
  const [fullscreenFillMode, setFullscreenFillMode] = useState<'fitted' | 'full'>('full');
  // Calque sélectionné interactivement à la souris (3 ou 4)
  const [selectedLayerNum, setSelectedLayerNum] = useState<3 | 4 | null>(null);

  // Mode d'affichage mobile : 'preview' (Aperçu TV 16:9) ou 'controls' (Réglages des Calques)
  const [mobileStudioTab, setMobileStudioTab] = useState<'preview' | 'controls'>('preview');

  // Filtre de scope pour les matchs et résultats : 'home' (Domicile), 'away' (Extérieur), ou 'all' (Tous)
  const [studioScope, setStudioScope] = useState<'home' | 'away' | 'all'>('home');

  const displayedMatches = useMemo(() => {
    if (studioScope === 'home') return matches.filter((m) => m.isHomeMatch);
    if (studioScope === 'away') return matches.filter((m) => !m.isHomeMatch);
    return matches;
  }, [matches, studioScope]);

  const displayedResults = useMemo(() => {
    if (studioScope === 'home') return results.filter((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName));
    if (studioScope === 'away') return results.filter((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName));
    return results;
  }, [results, studioScope, clubSettings]);

  const previewCanvasRef = useRef<HTMLDivElement | null>(null);

  // Configuration effective pour chaque catégorie
  const matchesEffective = getEffectiveCategoryConfig('matches', visualTemplates, clubSettings);
  const resultsEffective = getEffectiveCategoryConfig('results', visualTemplates, clubSettings);
  const birthdaysEffective = getEffectiveCategoryConfig('birthdays', visualTemplates, clubSettings);

  const currentEffective =
    activeCategory === 'matches'
      ? matchesEffective
      : activeCategory === 'results'
      ? resultsEffective
      : birthdaysEffective;

  // Mise à jour de la catégorie active
  const updateCurrentCategoryTheme = (partial: Partial<CategorySlideTheme>) => {
    if (activeCategory === 'matches') {
      const current = visualTemplates.matchesSettings || matchesEffective.categoryTheme;
      const updated = { ...current, ...partial };
      onUpdateVisualTemplates({
        ...visualTemplates,
        matchesSettings: updated,
        matchesBackgroundUrl: updated.backgroundUrl || visualTemplates.matchesBackgroundUrl,
      });
    } else if (activeCategory === 'results') {
      const current = visualTemplates.resultsSettings || resultsEffective.categoryTheme;
      const updated = { ...current, ...partial };
      onUpdateVisualTemplates({
        ...visualTemplates,
        resultsSettings: updated,
        resultsBackgroundUrl: updated.backgroundUrl || visualTemplates.resultsBackgroundUrl,
      });
    } else if (activeCategory === 'birthdays') {
      const current = visualTemplates.birthdaysSettings || birthdaysEffective.categoryTheme;
      const updated = { ...current, ...partial };
      onUpdateVisualTemplates({
        ...visualTemplates,
        birthdaysSettings: updated,
        birthdaysBackgroundUrl: updated.backgroundUrl || visualTemplates.birthdaysBackgroundUrl,
      });
    }
  };

  // Mise à jour de la position X / Y déclenchée par glisser-déposer sur le canvas
  const handleLayerPositionChange = (layerNum: 3 | 4, x: number, y: number) => {
    if (layerNum === 3) {
      const currentLayer3 = currentEffective.layer3 || DEFAULT_OVERLAY_LAYER_3;
      updateCurrentCategoryTheme({
        layer3: { ...currentLayer3, x, y },
      });
    } else {
      const currentLayer4 = currentEffective.layer4 || DEFAULT_OVERLAY_LAYER_4;
      updateCurrentCategoryTheme({
        layer4: { ...currentLayer4, x, y },
      });
    }
  };

  // Gestion du plein écran avec touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Restauration automatique des vidéos locales stockées dans IndexedDB
  useEffect(() => {
    const restoreVideos = async () => {
      try {
        const storedUrl = await getMediaBlobUrl(`category_bg_${activeCategory}`);
        if (storedUrl) {
          registerVideoBlob(storedUrl);
          const currentUrl = currentEffective.categoryTheme.backgroundUrl;
          if (!currentUrl || currentUrl.startsWith('blob:')) {
            updateCurrentCategoryTheme({
              backgroundUrl: storedUrl,
              backgroundMediaType: 'video',
            });
          }
        }
      } catch (e) {
        console.warn('Erreur restauration vidéo IndexedDB:', e);
      }
    };
    restoreVideos();
  }, [activeCategory]);

  const handleSelectCategory = (cat: 'matches' | 'results' | 'birthdays') => {
    setActiveCategory(cat);
    setPreviewMode(cat);
  };

  const getCategoryThemeColor = () => {
    if (activeCategory === 'matches') return 'from-orange-950/40 border-orange-500/30 text-orange-400 bg-orange-600';
    if (activeCategory === 'results') return 'from-emerald-950/40 border-emerald-500/30 text-emerald-400 bg-emerald-600';
    return 'from-pink-950/40 border-pink-500/30 text-pink-400 bg-pink-600';
  };

  return (
    <div className="space-y-6" id="studio-graphique-workbench">
      {/* En-tête Studio Graphique */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r ${getCategoryThemeColor().split(' ')[0]} via-slate-900 to-slate-950 p-5 sm:p-6 rounded-3xl border ${getCategoryThemeColor().split(' ')[1]}`}>
        <div>
          <div className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1 ${getCategoryThemeColor().split(' ')[2]}`}>
            <Layers className="w-4 h-4" />
            <span>
              {hideCategorySelector
                ? activeCategory === 'matches'
                  ? 'Diapositive 16:9 • Matchs à Venir'
                  : activeCategory === 'results'
                  ? 'Diapositive 16:9 • Résultats & Scores'
                  : 'Diapositive 16:9 • Anniversaires'
                : 'Architecture Universelle 4 Calques par Catégorie'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
            <span>
              {hideCategorySelector
                ? activeCategory === 'matches'
                  ? '🎨 STUDIO CALQUES : DIAPOSITIVE MATCHS'
                  : activeCategory === 'results'
                  ? '🎨 STUDIO CALQUES : DIAPOSITIVE RÉSULTATS'
                  : '🎨 STUDIO CALQUES : DIAPOSITIVE ANNIVERSAIRES'
                : 'STUDIO CALQUES : MATCHS, RÉSULTATS & ANNIVERSAIRES'}
            </span>
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-3xl mt-1">
            {hideCategorySelector
              ? `Réglez les 4 calques de cette diapositive : Fond (Calque 1), Cartes & Données (Calque 2), et 2 mascottes/overlays libres avec suppression de fond vert (Calques 3 & 4).`
              : `Réglez chaque catégorie indépendamment sur 4 calques superposés : Fond d'ambiance (Calque 1), Cartes et typographies (Calque 2), et deux éléments libres déplaçables à la souris (Calques 3 et 4).`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onNavigateToCategoryTab && (
            <button
              type="button"
              onClick={() => {
                if (activeCategory === 'matches') onNavigateToCategoryTab('matches');
                else if (activeCategory === 'results') onNavigateToCategoryTab('results');
                else onNavigateToCategoryTab('excel');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
            >
              <span>➜ Revenir aux données</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-lg shadow-orange-600/30 transition-all"
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
            <span>🏀 Matchs à venir</span>
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

      {/* ========================================================================= */}
      {/* BOUTONS NAVIGATION MOBILE : VISIBLE UNIQUEMENT SUR TÉLÉPHONE (< xl)      */}
      {/* ========================================================================= */}
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

      {/* GRILLE PRINCIPALE : CONTRÔLES À GAUCHE, CANEVAS 16:9 INTERACTIF À DROITE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* COLONNE GAUCHE (5 colonnes) : LES 4 CALQUES DE LA CATÉGORIE */}
        <div className={`xl:col-span-5 space-y-4 ${mobileStudioTab === 'controls' ? 'block' : 'hidden'} xl:block`}>
          {/* BARRE DES 4 CALQUES */}
          <div className="grid grid-cols-4 gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveLayerTab(1)}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeLayerTab === 1
                  ? 'bg-slate-800 text-white shadow ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calque 1
              <span className="block text-[10px] opacity-70">Fond</span>
            </button>
            <button
              onClick={() => setActiveLayerTab(2)}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeLayerTab === 2
                  ? 'bg-slate-800 text-white shadow ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calque 2
              <span className="block text-[10px] opacity-70">Cartes</span>
            </button>
            <button
              onClick={() => {
                setActiveLayerTab(3);
                setSelectedLayerNum(3);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeLayerTab === 3
                  ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calque 3
              <span className="block text-[10px] opacity-70">Élément 1</span>
            </button>
            <button
              onClick={() => {
                setActiveLayerTab(4);
                setSelectedLayerNum(4);
              }}
              className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                activeLayerTab === 4
                  ? 'bg-purple-600 text-white shadow ring-1 ring-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calque 4
              <span className="block text-[10px] opacity-70">Élément 2</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* ONGLET CALQUE 1 : FOND AVEC RÉGLAGES                                      */}
          {/* ========================================================================= */}
          {activeLayerTab === 1 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-orange-400" />
                    <span>Calque 1 : Fond & Ambiance ({activeCategory})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Image ou vidéo d'arrière-plan avec réglage de luminosité et de flou
                  </p>
                </div>
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
                    placeholder="URL image ou vidéo (ex: /video.mp4 ou https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 text-xs font-bold border border-orange-500/30 cursor-pointer transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Fichier</span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const isVideo = file.type.startsWith('video') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
                        
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
                          // Sauvegarde persistante dans IndexedDB pour ne jamais perdre la vidéo au rechargement
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
                </div>

                {/* Sélecteur de Type de média explicite (Image / Vidéo) */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Type détecté :</span>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
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
                          ? 'bg-orange-600 text-white shadow-sm shadow-orange-950'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Video className="w-3 h-3 text-white" />
                      <span>Vidéo (MP4/WebM)</span>
                    </button>
                  </div>
                </div>

                {/* Info stockage vidéo Cloudflare */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <HelpCircle className="w-3 h-3 shrink-0" />
                    <span>Diffusion de vidéo sur Cloudflare :</span>
                  </div>
                  <p className="leading-relaxed">
                    • <strong>Fichier local :</strong> Les vidéos sélectionnées depuis votre ordinateur sont enregistrées en cache persistant dans ce navigateur.<br />
                    • <strong>Pour diffuser sur TOUTES les TV :</strong> Placez simplement votre vidéo dans le dossier <code className="text-orange-300 bg-slate-900 px-1 py-0.5 rounded">public/</code> de votre projet (ex: <code className="text-orange-300 bg-slate-900 px-1 py-0.5 rounded">public/resultats.mp4</code>) et entrez <code className="text-orange-300 bg-slate-900 px-1 py-0.5 rounded">/resultats.mp4</code> comme URL. Cloudflare la distribuera gratuitement et à pleine vitesse partout !
                  </p>
                </div>
              </div>

              {/* Curseur Luminosité Fond (5% à 200%) */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
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
                <div className="flex flex-wrap gap-1 pt-1">
                  {BRIGHTNESS_PRESETS.map((bp) => (
                    <button
                      key={bp.label}
                      onClick={() => updateCurrentCategoryTheme({ backgroundBrightness: bp.val })}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${
                        Math.abs((currentEffective.categoryTheme.backgroundBrightness ?? 0.4) - bp.val) < 0.04
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {bp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Flou du fond */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
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
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                    <span>Filigrane Logo du Club au centre</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Affiche le logo du club en filigrane discret au milieu de l'écran derrière les cartes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateCurrentCategoryTheme({
                      showClubLogoWatermark: !currentEffective.categoryTheme.showClubLogoWatermark,
                    })
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    currentEffective.categoryTheme.showClubLogoWatermark
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {currentEffective.categoryTheme.showClubLogoWatermark ? '✓ Affiché' : 'Désactivé (Masqué)'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET CALQUE 2 : RÉGLAGE CARTE & DONNÉES                                  */}
          {/* ========================================================================= */}
          {activeLayerTab === 2 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-5">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4 text-orange-400" />
                  <span>Calque 2 : Cartes & Typographie ({activeCategory})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Personnalisez l'apparence des blocs de match, résultats ou anniversaires
                </p>
              </div>

              {/* Design Visuel de la diapositive */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-red-400 font-black">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Design Visuel pour la TV & le Carrousel</span>
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateCurrentCategoryTheme({ visualStyle: 'poster-red' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      (currentEffective.categoryTheme.visualStyle || 'poster-red') === 'poster-red'
                        ? 'bg-red-950/50 border-red-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs block text-red-300">🔴 Affiche Passerelle Réseaux</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Visuel 16:9 officiel avec pilules rouges et score blanc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentCategoryTheme({ visualStyle: 'cards' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      currentEffective.categoryTheme.visualStyle === 'cards'
                        ? 'bg-orange-950/50 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs block text-orange-300">🎴 Cartes Vitrées Glassmorphism</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Grille classique de cartes translucides avec scores</span>
                  </button>
                </div>
              </div>

              {/* Titre / Entête personnalisée */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-400 font-black">
                    <Type className="w-3.5 h-3.5" />
                    <span>Titre / Entête Personnalisée</span>
                  </span>
                  {currentEffective.categoryTheme.customHeaderTitle && (
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ customHeaderTitle: '' })}
                      className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Réinitialiser
                    </button>
                  )}
                </label>
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
                {/* Boutons d'accès rapide aux modèles de titres */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => updateCurrentCategoryTheme({ customHeaderTitle: 'LES MATCHS DU WEEK-END' })}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700"
                  >
                    🏀 Matchs Week-end
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentCategoryTheme({ customHeaderTitle: 'RÉSULTATS DU WEEK-END' })}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold border border-slate-700"
                  >
                    🏆 Résultats Week-end
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentCategoryTheme({ customHeaderTitle: 'RÉSULTATS DU WEEK-END (RÉSEAUX)' })}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-pink-300 font-bold border border-slate-700"
                  >
                    📱 Résultats Réseaux
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ customHeaderTitle: `RÉSULTATS J-${j}` })}
                      className="text-[10px] px-1.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-950 text-slate-300 hover:text-amber-300 font-mono font-bold border border-slate-800"
                    >
                      J-{j}
                    </button>
                  ))}
                </div>
              </div>

              {/* Palettes rapides */}
              <div className="grid grid-cols-2 gap-2">
                {(activeCategory === 'matches'
                  ? MATCH_COLOR_PRESETS
                  : activeCategory === 'results'
                  ? RESULTS_COLOR_PRESETS
                  : BIRTHDAY_COLOR_PRESETS
                ).map((p) => (
                  <button
                    key={p.name}
                    onClick={() =>
                      updateCurrentCategoryTheme({
                        primaryColor: p.primary,
                        cardBgColor: p.cardBg,
                        cardOpacity: p.opacity,
                        cardBlur: p.blur,
                      })
                    }
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 text-left transition-all"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.primary }} />
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.cardBg }} />
                    </div>
                    <span className="text-xs font-bold text-slate-300 block truncate">{p.name}</span>
                  </button>
                ))}
              </div>

              {/* Couleurs Personnalisées (Accentuation, Texte & Pastilles) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Couleur d'accentuation */}
                <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                  <input
                    type="color"
                    value={currentEffective.categoryTheme.primaryColor || '#ea580c'}
                    onChange={(e) => updateCurrentCategoryTheme({ primaryColor: e.target.value })}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                    title="Couleur d'accentuation générale"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">
                      Accentuation
                    </span>
                    <span className="text-[10px] font-mono text-orange-400 block truncate">
                      {currentEffective.categoryTheme.primaryColor || '#ea580c'}
                    </span>
                  </div>
                </div>

                {/* Couleur du texte / police */}
                <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                  <input
                    type="color"
                    value={currentEffective.categoryTheme.textColor || '#ffffff'}
                    onChange={(e) => updateCurrentCategoryTheme({ textColor: e.target.value })}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                    title="Couleur du texte principal"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">
                      Couleur Texte
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 block truncate">
                      {currentEffective.categoryTheme.textColor || '#ffffff'}
                    </span>
                  </div>
                </div>

                {/* Couleur des pastilles / badges */}
                <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                  <input
                    type="color"
                    value={currentEffective.categoryTheme.badgeBgColor || currentEffective.categoryTheme.primaryColor || '#dc2626'}
                    onChange={(e) => updateCurrentCategoryTheme({ badgeBgColor: e.target.value })}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
                    title="Couleur de fond des pastilles (ex: U13M, Domicile)"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-slate-200 block truncate">
                      Pastilles / Badges
                    </span>
                    <span className="text-[10px] font-mono text-sky-400 block truncate">
                      {currentEffective.categoryTheme.badgeBgColor || 'Auto'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Couleur du texte dans les pastilles */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentEffective.categoryTheme.badgeTextColor || '#ffffff'}
                    onChange={(e) => updateCurrentCategoryTheme({ badgeTextColor: e.target.value })}
                    className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Couleur Texte des Pastilles
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Texte à l'intérieur des badges de catégorie et statut
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => updateCurrentCategoryTheme({ badgeTextColor: '#ffffff' })}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold border border-slate-700"
                  >
                    Blanc
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentCategoryTheme({ badgeTextColor: '#000000' })}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-white text-black text-[10px] font-bold"
                  >
                    Noir
                  </button>
                </div>
              </div>

              {/* Mode d'affichage des résultats (Score / Mention / Les 2) */}
              {activeCategory === 'results' && (
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-200 block">
                    Mode d'Affichage des Résultats sur la Diapo :
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ resultDisplayMode: 'both' })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                        (currentEffective.categoryTheme.resultDisplayMode || 'both') === 'both'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Score + Mention
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ resultDisplayMode: 'score' })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                        currentEffective.categoryTheme.resultDisplayMode === 'score'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Score Seul
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCurrentCategoryTheme({ resultDisplayMode: 'status' })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
                        currentEffective.categoryTheme.resultDisplayMode === 'status'
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Victoire / Défaite
                    </button>
                  </div>
                </div>
              )}

              {/* Opacité & Flou des cartes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Opacité Cartes</span>
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

              {/* Typographie Titres & Équipes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-orange-400" />
                    <span>Police Titres & Équipes</span>
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

              {/* Pour Résultats : Police dédiée aux Scores ! */}
              {activeCategory === 'results' && (
                <div className="bg-blue-950/30 p-3.5 rounded-2xl border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      <span>Police Dédiée aux SCORES (Chiffres)</span>
                    </span>
                    <span className="text-xs font-mono text-blue-400 font-bold">
                      {currentEffective.categoryTheme.fontFamilyScore || 'Teko'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {AVAILABLE_FONTS.filter((f) => ['Teko', 'Bebas Neue', 'Kanit', 'Anton', 'Russo One', 'Montserrat'].includes(f.id)).map((font) => (
                      <button
                        key={font.id}
                        onClick={() => updateCurrentCategoryTheme({ fontFamilyScore: font.id })}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          (currentEffective.categoryTheme.fontFamilyScore || 'Teko') === font.id
                            ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-[11px] font-bold text-white block">{font.name}</span>
                        <div className={`text-xl font-black ${font.className} text-amber-400 tracking-wider`}>
                          84 : 76
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ONGLET CALQUE 3 : ÉLÉMENT LIBRE 1 (MASCOTTE, LOGO, BADGE, ETC.)          */}
          {/* ========================================================================= */}
          {activeLayerTab === 3 && (
            <OverlayLayerEditor
              layerNumber={3}
              layer={currentEffective.layer3}
              category={activeCategory}
              isSelected={selectedLayerNum === 3}
              onSelect={() => setSelectedLayerNum(3)}
              onChange={(updated) => updateCurrentCategoryTheme({ layer3: updated })}
            />
          )}

          {/* ========================================================================= */}
          {/* ONGLET CALQUE 4 : ÉLÉMENT LIBRE 2 (IDENTIQUE CALQUE 3)                    */}
          {/* ========================================================================= */}
          {activeLayerTab === 4 && (
            <OverlayLayerEditor
              layerNumber={4}
              layer={currentEffective.layer4}
              category={activeCategory}
              isSelected={selectedLayerNum === 4}
              onSelect={() => setSelectedLayerNum(4)}
              onChange={(updated) => updateCurrentCategoryTheme({ layer4: updated })}
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
              <span>Voir l'aperçu TV 16:9 en direct</span>
            </button>
          </div>
        </div>

        {/* COLONNE DROITE (7 colonnes) : APERÇU 16:9 INTERACTIF DIRECT */}
        <div className={`xl:col-span-7 space-y-3 sticky top-4 ${mobileStudioTab === 'preview' ? 'block' : 'hidden'} xl:block`}>
          <div className="flex items-center justify-between bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Aperçu 16:9 TV
              </span>
            </div>

            {/* Sélecteur Domicile / Extérieur pour prévisualiser chaque slide de catégorie */}
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
                title="Aperçu Plein Écran"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Plein Écran</span>
              </button>
            </div>
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
              <span>Chaque calque est repositionnable au millimètre près en temps réel.</span>
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
              <span>Modifier les calques (Fond, Textes, Éléments)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL APERÇU PLEIN ÉCRAN POUR SIMULATION RÉELLE TV                       */}
      {/* ========================================================================= */}
      {isFullscreen && (
        <div className={`fixed inset-0 z-50 bg-black flex flex-col justify-center items-center select-none animate-in fade-in duration-200 ${
          fullscreenFillMode === 'full' ? 'p-0' : 'p-2 sm:p-6'
        }`}>
          {/* Barre d'outils plein écran */}
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

            {/* Sélecteur Domicile / Extérieur Plein Écran */}
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

            {/* Mode Agrandir sur toute la page / Cadre 16:9 */}
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

          {/* Conteneur Plein Écran (100% Toute la page ou Cadre 16:9) */}
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
    </div>
  );
};
