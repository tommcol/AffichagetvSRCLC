// LegacyLayersOptionsSection — ancien panneau manuel « Calques & Options » de VisualExporterModal.
// Code DÉSACTIVÉ (rendu derrière `&& false`) : conservé à titre de référence lors du découpage.
// Le panneau actif est <StudioGraphiqueWorkbench> (onglet Calques).

import React from 'react';
import { Radio, Palette, Trash2, Sun, Maximize2, clubSettings } from 'lucide-react';
import { ContentTypeResultsSection2 } from './ContentTypeResultsSection2';
import { AVAILABLE_FONTS } from '../../utils/fontUtils';

export interface LegacyLayersOptionsSectionProps {
  [key: string]: any;
}

export function LegacyLayersOptionsSection(props: LegacyLayersOptionsSectionProps) {
  const {
    p,
    text,
    setLayer1Brightness,
    setLayer1Blur,
    setLayer1Scale,
    setLayer1Grayscale,
    setLayer1Contrast,
    title,
    setBgSource,
    setCustomBgImage,
    bgSource,
    customBgImage,
    effectiveCategoryConfig,
    visualTemplates,
    onUpdateVisualTemplates,
    setMediaBankTarget,
    fileInputRef,
    current,
    layer1Brightness,
    layer1Blur,
    layer1Scale,
    layer1Grayscale,
    layer1Contrast,
    setLayer2PrimaryColor,
    setLayer2TextColor,
    setLayer2BadgeBgColor,
    setLayer2BadgeTextColor,
    setLayer2FontHeader,
    setLayer2FontBody,
    setCustomBadgeTitle,
    customBadgeTitle,
    posterFilter,
    layer2PrimaryColor,
    handleColorChange,
    layer2TextColor,
    layer2BadgeBgColor,
    layer2BadgeTextColor,
    contentType,
    results,
    updateTemplateSetting,
    resultDisplayMode,
    layer2FontHeader,
    name,
    layer2FontBody,
    file,
    layer3FileInputRef,
    handleLayer3Upload,
    showStudioLayer3,
    setShowStudioLayer3,
    effectiveLayer3Url,
    customLayer3Image,
    setCustomLayer3Image,
    clubSettings,
    studioLayer3Pos,
    setStudioLayer3Pos,
    studioLayer3Scale,
    setStudioLayer3Scale,
    layer4FileInputRef,
    handleLayer4Upload,
    showStudioLayer4,
    setShowStudioLayer4,
    effectiveLayer4Url,
    customLayer4Image,
    setCustomLayer4Image,
    studioLayer4Pos,
    setStudioLayer4Pos,
    studioLayer4Scale,
    setStudioLayer4Scale,
    setRightPanelTab,
  } = props;

  return (
              <div className="space-y-3.5">
                <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      <span>Calques & Options Studio Graphique</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Calques 1 à 4
                    </span>
                  </div>

                  {/* CALQUE 1 : FOND & RÉGLAGES VISUELS */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                        <span>Calque 1 (Arrière-plan / Fond)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLayer1Brightness(0.55);
                          setLayer1Blur(6);
                          setLayer1Scale(1.05);
                          setLayer1Grayscale(true);
                          setLayer1Contrast(1.25);
                        }}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                        title="Réinitialiser les réglages par défaut du fond"
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-slate-400" />
                        <span>Réinit.</span>
                      </button>
                    </div>

                    {/* Source buttons */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setBgSource('default');
                          setCustomBgImage(null);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                          bgSource === 'default' && !customBgImage
                            ? 'bg-red-950/80 border-red-600 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🔴 Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBgSource('studio');
                          setCustomBgImage(null);
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                          bgSource === 'studio' && !customBgImage
                            ? 'bg-amber-950/80 border-amber-600 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={effectiveCategoryConfig.backgroundUrl ? 'Utiliser le fond configuré dans Studio Graphique' : 'Fond studio'}
                      >
                        🎨 Fond Studio
                      </button>
                      {visualTemplates && onUpdateVisualTemplates && (
                        <button
                          type="button"
                          onClick={() => setMediaBankTarget('background')}
                          className="px-2 py-1 rounded-lg text-xs font-bold border border-emerald-700/70 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-all"
                          title="Choisir une photo ou un fond dans la Banque Médias commune"
                        >
                          🎞️ Banque Médias
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                          customBgImage
                            ? 'bg-blue-950/80 border-blue-500 text-white shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        📷 Photo Perso
                      </button>
                    </div>

                    {/* Sliders for Luminosité, Flou, Taille, Contraste */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      {/* Luminosité */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span>Luminosité :</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 max-w-[170px]">
                          <input
                            type="range"
                            min="0.1"
                            max="1.5"
                            step="0.05"
                            value={layer1Brightness}
                            onChange={(e) => setLayer1Brightness(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                            {Math.round(layer1Brightness * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Flou (Blur) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                          <Sliders className="w-3 h-3 text-cyan-400" />
                          <span>Flou :</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 max-w-[170px]">
                          <input
                            type="range"
                            min="0"
                            max="25"
                            step="1"
                            value={layer1Blur}
                            onChange={(e) => setLayer1Blur(parseInt(e.target.value, 10))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                            {layer1Blur}px
                          </span>
                        </div>
                      </div>

                      {/* Taille / Zoom (Scale) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                          <Maximize2 className="w-3 h-3 text-purple-400" />
                          <span>Taille (Zoom) :</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 max-w-[170px]">
                          <input
                            type="range"
                            min="1"
                            max="2.5"
                            step="0.05"
                            value={layer1Scale}
                            onChange={(e) => setLayer1Scale(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                            {Math.round(layer1Scale * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Style Noir & Blanc / Couleur & Contraste */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={layer1Grayscale}
                            onChange={(e) => setLayer1Grayscale(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                          />
                          <span>Noir & Blanc</span>
                        </label>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Contraste :</span>
                          <input
                            type="range"
                            min="0.8"
                            max="2.0"
                            step="0.05"
                            value={layer1Contrast}
                            onChange={(e) => setLayer1Contrast(parseFloat(e.target.value))}
                            className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                          />
                          <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
                            {Math.round(layer1Contrast * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CALQUE 2 : CARTES, POLICES & PASTILLES */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Palette className="w-3.5 h-3.5 text-orange-500" />
                        <span>Calque 2 (Cartes, Polices & Pastilles)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (effectiveCategoryConfig) {
                            const ct = effectiveCategoryConfig.categoryTheme;
                            setLayer2PrimaryColor(ct?.primaryColor || '#c80815');
                            setLayer2TextColor(ct?.textColor || '#ffffff');
                            setLayer2BadgeBgColor(ct?.badgeBgColor || ct?.primaryColor || '#c80815');
                            setLayer2BadgeTextColor(ct?.badgeTextColor || '#ffffff');
                            setLayer2FontHeader(ct?.fontFamilyHeader || 'Bebas Neue');
                            setLayer2FontBody(ct?.fontFamilyBody || 'Montserrat');
                            setCustomBadgeTitle('');
                          }
                        }}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                        title="Réinitialiser le style de la catégorie"
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-slate-400" />
                        <span>Réinit.</span>
                      </button>
                    </div>

                    {/* Surcharge Titre du Badge */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Titre du Badge (Surcharge) :
                      </label>
                      <input
                        type="text"
                        value={customBadgeTitle}
                        onChange={(e) => setCustomBadgeTitle(e.target.value)}
                        placeholder={`Ex: ${posterFilter === 'home' ? 'DOMICILE' : posterFilter === 'away' ? 'EXTÉRIEUR' : 'RÉSULTATS'}`}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                      />
                    </div>

                    {/* Palette de Couleurs : Accentuation, Texte, Pastilles */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80">
                      {/* Accentuation */}
                      <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-300 truncate">Accentuation</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="color"
                            value={layer2PrimaryColor}
                            onChange={(e) => handleColorChange(e.target.value, undefined, undefined, undefined)}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 shrink-0"
                          />
                          <span className="text-[9px] font-mono text-orange-400 truncate">
                            {layer2PrimaryColor}
                          </span>
                        </div>
                      </div>

                      {/* Texte Principal */}
                      <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-300 truncate">Couleur Texte</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="color"
                            value={layer2TextColor}
                            onChange={(e) => handleColorChange(undefined, e.target.value, undefined, undefined)}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 shrink-0"
                          />
                          <span className="text-[9px] font-mono text-amber-400 truncate">
                            {layer2TextColor}
                          </span>
                        </div>
                      </div>

                      {/* Pastilles / Badges */}
                      <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-300 truncate">Pastilles</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="color"
                            value={layer2BadgeBgColor}
                            onChange={(e) => handleColorChange(undefined, undefined, e.target.value, undefined)}
                            className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 shrink-0"
                          />
                          <span className="text-[9px] font-mono text-sky-400 truncate">
                            {layer2BadgeBgColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Texte des Pastilles */}
                    <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <input
                          type="color"
                          value={layer2BadgeTextColor}
                          onChange={(e) => handleColorChange(undefined, undefined, undefined, e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 shrink-0"
                        />
                        <span className="text-[10px] font-bold text-slate-300 truncate">
                          Texte des Pastilles
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleColorChange(undefined, undefined, undefined, '#ffffff')}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[9px] font-bold border border-slate-700"
                        >
                          Blanc
                        </button>
                        <button
                          type="button"
                          onClick={() => handleColorChange(undefined, undefined, undefined, '#000000')}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-white text-black text-[9px] font-bold"
                        >
                          Noir
                        </button>
                      </div>
                    </div>

                    {/* Option d'Affichage du Résultat (Score / Victoire-Défaite / Les 2) */}
                    {contentType === 'results' && (
            <ContentTypeResultsSection2
              p={p}
              text={text}
              updateTemplateSetting={updateTemplateSetting}
              resultDisplayMode={resultDisplayMode}
              title={title}
            />
          )}

                    {/* Polices Titres & Corps */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                          <Type className="w-3 h-3 text-orange-400" />
                          <span>Police Titres</span>
                        </label>
                        <select
                          value={layer2FontHeader}
                          onChange={(e) => updateTemplateSetting({ fontFamilyHeader: e.target.value as FontFamilyOption })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-white focus:outline-none focus:border-red-500"
                        >
                          {AVAILABLE_FONTS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                          <Type className="w-3 h-3 text-amber-400" />
                          <span>Police Corps</span>
                        </label>
                        <select
                          value={layer2FontBody}
                          onChange={(e) => updateTemplateSetting({ fontFamilyBody: e.target.value as FontFamilyOption })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-white focus:outline-none focus:border-red-500"
                        >
                          {AVAILABLE_FONTS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CALQUE 3 : ÉLÉMENT 1 */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                    <input
                      type="file"
                      ref={layer3FileInputRef}
                      onChange={handleLayer3Upload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Calque 3 (Élément 1)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showStudioLayer3}
                            onChange={(e) => setShowStudioLayer3(e.target.checked)}
                            className="rounded accent-red-600 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-slate-400 font-bold">Actif</span>
                        </label>
                      </div>
                    </div>

                    {/* Layer 3 Media Selection & Upload */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                      {visualTemplates && onUpdateVisualTemplates && (
                        <button type="button" onClick={() => setMediaBankTarget('layer3')} className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all" title="Choisir un élément de la Banque Médias commune">
                          <Film className="w-3.5 h-3.5" /> Choisir dans la Banque Médias
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        {effectiveLayer3Url ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0 bg-slate-900 border border-slate-700/80 rounded-lg p-1.5">
                            <div className="w-9 h-9 bg-black/60 rounded border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                              <img
                                src={effectiveLayer3Url}
                                alt="Aperçu Calque 3"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-bold text-white truncate block">
                                {customLayer3Image ? 'Élément personnalisé' : effectiveCategoryConfig.layer3?.name || 'Élément 1'}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono">
                                Prêt pour l'affiche
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => layer3FileInputRef.current?.click()}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] flex items-center gap-1"
                                title="Remplacer l'image"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Changer</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomLayer3Image(null);
                                  setShowStudioLayer3(false);
                                }}
                                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px]"
                                title="Supprimer cette image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => layer3FileInputRef.current?.click()}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>+ Importer une image (PNG/JPG)</span>
                            </button>
                            {clubSettings.logoUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomLayer3Image(clubSettings.logoUrl);
                                  setShowStudioLayer3(true);
                                }}
                                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold"
                                title="Utiliser le logo du club"
                              >
                                🛡️ Logo
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Manual URL input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={customLayer3Image || ''}
                          onChange={(e) => {
                            setCustomLayer3Image(e.target.value || null);
                            if (e.target.value) setShowStudioLayer3(true);
                          }}
                          placeholder="Ou coller une URL d'image PNG..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* Position & Scale */}
                    {showStudioLayer3 && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Position :</span>
                          <select
                            value={studioLayer3Pos}
                            onChange={(e) => setStudioLayer3Pos(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="bottom-right">Bas Droite</option>
                            <option value="bottom-left">Bas Gauche</option>
                            <option value="top-right">Haut Droite</option>
                            <option value="center">Centre Bas</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Taille ({Math.round(studioLayer3Scale * 100)}%) :</span>
                          <input
                            type="range"
                            min="0.3"
                            max="1.5"
                            step="0.05"
                            value={studioLayer3Scale}
                            onChange={(e) => setStudioLayer3Scale(parseFloat(e.target.value))}
                            className="w-full accent-red-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CALQUE 4 : ÉLÉMENT 2 */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                    <input
                      type="file"
                      ref={layer4FileInputRef}
                      onChange={handleLayer4Upload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>Calque 4 (Élément 2)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showStudioLayer4}
                            onChange={(e) => setShowStudioLayer4(e.target.checked)}
                            className="rounded accent-blue-600 w-3.5 h-3.5"
                          />
                          <span className="text-[11px] text-slate-400 font-bold">Actif</span>
                        </label>
                      </div>
                    </div>

                    {/* Layer 4 Media Selection & Upload */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                      {visualTemplates && onUpdateVisualTemplates && (
                        <button type="button" onClick={() => setMediaBankTarget('layer4')} className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all" title="Choisir un élément de la Banque Médias commune">
                          <Film className="w-3.5 h-3.5" /> Choisir dans la Banque Médias
                        </button>
                      )}
                      <div className="flex items-center gap-2">
                        {effectiveLayer4Url ? (
                          <div className="flex items-center gap-2 flex-1 min-w-0 bg-slate-900 border border-slate-700/80 rounded-lg p-1.5">
                            <div className="w-9 h-9 bg-black/60 rounded border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                              <img
                                src={effectiveLayer4Url}
                                alt="Aperçu Calque 4"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-bold text-white truncate block">
                                {customLayer4Image ? 'Élément personnalisé' : effectiveCategoryConfig.layer4?.name || 'Élément 2'}
                              </span>
                              <span className="text-[10px] text-blue-400 font-mono">
                                Prêt pour l'affiche
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => layer4FileInputRef.current?.click()}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] flex items-center gap-1"
                                title="Remplacer le logo/sponsor"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Changer</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomLayer4Image(null);
                                  setShowStudioLayer4(false);
                                }}
                                className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[10px]"
                                title="Supprimer ce logo/sponsor"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => layer4FileInputRef.current?.click()}
                              className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 hover:text-white border border-blue-800/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>+ Importer un logo / sponsor</span>
                            </button>
                            {clubSettings.logoUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomLayer4Image(clubSettings.logoUrl);
                                  setShowStudioLayer4(true);
                                }}
                                className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold"
                                title="Utiliser le logo du club"
                              >
                                🛡️ Logo
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Manual URL input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={customLayer4Image || ''}
                          onChange={(e) => {
                            setCustomLayer4Image(e.target.value || null);
                            if (e.target.value) setShowStudioLayer4(true);
                          }}
                          placeholder="Ou coller une URL d'image..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Position & Scale */}
                    {showStudioLayer4 && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Position :</span>
                          <select
                            value={studioLayer4Pos}
                            onChange={(e) => setStudioLayer4Pos(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="top-right">Haut Droite</option>
                            <option value="bottom-left">Bas Gauche</option>
                            <option value="bottom-right">Bas Droite</option>
                            <option value="center">Haut Gauche</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">Taille ({Math.round(studioLayer4Scale * 100)}%) :</span>
                          <input
                            type="range"
                            min="0.3"
                            max="1.5"
                            step="0.05"
                            value={studioLayer4Scale}
                            onChange={(e) => setStudioLayer4Scale(parseFloat(e.target.value))}
                            className="w-full accent-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Return to Social Captions Button */}
                <button
                  type="button"
                  onClick={() => setRightPanelTab('social')}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 transition-all"
                >
                  <Radio className="w-4 h-4 text-white" />
                  <span>💬 Revenir aux Textes & Propositions Réseaux</span>
                </button>
              </div>
              );
}