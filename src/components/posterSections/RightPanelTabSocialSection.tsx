// RightPanelTabSocialSection — bloc « rightPanelTab === 'social' » de VisualExporterModal.
// Extrait automatiquement lors du découpage : aucune logique modifiée.

import { Download, Share2, Sparkles, Check, Instagram, Facebook, ExternalLink, Copy, Send, Zap, Radio, Flame, CheckCircle2, Layers, Edit3, Sliders, RotateCcw, AlertCircle, Wand2, Loader2 } from 'lucide-react';
import { getPosterItemKey } from '../../utils/posterCaptionSelectionHelpers';

export interface RightPanelTabSocialSectionProps {
  [key: string]: any;
}

export function RightPanelTabSocialSection(props: RightPanelTabSocialSectionProps) {
  const {
    p,
    text,
    setSelectedSocialTab,
    selectedSocialTab,
    setAspectRatio,
    allCurrentCaptionItems,
    contentType,
    matches,
    totalPages,
    setCaptionStyleProposal,
    setIsCustomCaptionEdited,
    captionStyleProposal,
    isCustomCaptionEdited,
    captionMatches,
    captionResults,
    selectAllCaptionItems,
    deselectAllCaptionItems,
    selectedItemKeysForCaption,
    toggleCaptionItemKey,
    allCurrentCaptionItemKeys,
    customCaptions,
    generatedCaptions,
    setCustomCaptions,
    showAiRewriteBox,
    setShowAiRewriteBox,
    customRewriteInstructions,
    setCustomRewriteInstructions,
    handleApplyAiRewrite,
    isRewriting,
    handleRegenerateWithAI,
    aiGenerating,
    title,
    previousAiCaption,
    handleUndoAiCaption,
    handleCopyText,
    copiedKey,
    badgeTitle,
    clubSettings,
    webhookStatus,
    handleSendToWebhook,
    handleNativeShare,
    isSharing,
    isExporting,
    exportError,
    handleDownloadAllPages,
    isExportingAll,
    exportProgress,
    handleDownloadImage,
    downloadSuccess,
    currentPage,
    aspectRatio,
    setRightPanelTab,
  } = props;

  return (
              <>
                {/* Social Platform Tabs */}
                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-pink-500" />
                      <span>Passerelle de diffusion réseaux sociaux</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      1-Clic Copie & Partage
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() => setSelectedSocialTab('instagram')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedSocialTab === 'instagram'
                          ? 'bg-gradient-to-tr from-pink-600 to-rose-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Instagram</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSocialTab('tiktok');
                        setAspectRatio('9:16');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedSocialTab === 'tiktok'
                          ? 'bg-gradient-to-tr from-cyan-600 via-slate-900 to-pink-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Flame className="w-4 h-4 text-cyan-300" />
                      <span>TikTok</span>
                    </button>

                    <button
                      onClick={() => setSelectedSocialTab('facebook')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedSocialTab === 'facebook'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </button>

                    <button
                      onClick={() => setSelectedSocialTab('webhook')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedSocialTab === 'webhook'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Webhook</span>
                    </button>
                  </div>
                </div>

                {/* PLATFORM SPECIFIC PANEL */}
                <div className="flex-1 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                  
                  {/* PROPOSITIONS DE STYLE & SÉLECTION DES MATCHS À INCLURE DANS LE TEXTE */}
                  {selectedSocialTab !== 'webhook' && (
                    <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 space-y-2">
                      {/* Global Publication Header */}
                      <div className="flex items-center justify-between gap-2 px-1 pb-1.5 border-b border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-pink-950/80 text-pink-300 border border-pink-700/50 text-[10px] font-black uppercase tracking-wider">
                            PUBLICATION GLOBALE
                          </span>
                          <span className="text-[11px] text-slate-300 font-bold">
                            1 seul texte pour les {allCurrentCaptionItems.length} {contentType === 'matches' ? 'matchs' : 'résultats'}
                          </span>
                        </div>
                        {totalPages > 1 && (
                          <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/50 font-medium">
                            {totalPages} affiches générées
                          </span>
                        )}
                      </div>

                      {/* Style Proposals Bar & AI Generation */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-bold text-slate-300">Style du texte :</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCaptionStyleProposal('standard');
                              setIsCustomCaptionEdited((prev) => ({ ...prev, [selectedSocialTab]: false }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              captionStyleProposal === 'standard' && !isCustomCaptionEdited[selectedSocialTab]
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            📌 Standard
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCaptionStyleProposal('short');
                              setIsCustomCaptionEdited((prev) => ({ ...prev, [selectedSocialTab]: false }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              captionStyleProposal === 'short' && !isCustomCaptionEdited[selectedSocialTab]
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            ⚡ Court
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCaptionStyleProposal('hype');
                              setIsCustomCaptionEdited((prev) => ({ ...prev, [selectedSocialTab]: false }));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              captionStyleProposal === 'hype' && !isCustomCaptionEdited[selectedSocialTab]
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            🔥 Hype
                          </button>
                        </div>
                      </div>

                      {/* Match / Result Selection Checkboxes */}
                      {allCurrentCaptionItems.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                              <span>Rencontres incluses dans le texte global :</span>
                              <span className="text-[10px] text-amber-400 font-mono">
                                ({captionMatches.length || captionResults.length}/{allCurrentCaptionItems.length})
                              </span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={selectAllCaptionItems}
                                className="text-[10px] text-blue-400 hover:underline font-bold"
                              >
                                Tout inclure
                              </button>
                              <span className="text-slate-600">•</span>
                              <button
                                type="button"
                                onClick={deselectAllCaptionItems}
                                className="text-[10px] text-rose-400 hover:underline font-bold"
                              >
                                Tout décocher
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                            {allCurrentCaptionItems.map((item: any, idx: number) => {
                              const key = getPosterItemKey(item, idx);
                              const isSelected = selectedItemKeysForCaption === null || selectedItemKeysForCaption.includes(key);
                              const teamOpp = item.isHomeMatch ? item.teamAway : item.teamHome;
                              const label = `${item.category || 'Match'}${teamOpp ? ` vs ${teamOpp}` : ''}`;

                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => toggleCaptionItemKey(key, allCurrentCaptionItemKeys)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all border ${
                                    isSelected
                                      ? 'bg-orange-950/80 border-orange-600/80 text-orange-200'
                                      : 'bg-slate-900/60 border-slate-800 text-slate-500 line-through hover:text-slate-300'
                                  }`}
                                >
                                  <span>{isSelected ? '✓' : '✗'}</span>
                                  <span className="truncate max-w-[150px]">{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✨ TEXTE IA DE LA PUBLICATION (INSTAGRAM / TIKTOK / FACEBOOK) */}
                  {selectedSocialTab !== 'webhook' && (() => {
                    const targetPlatform = selectedSocialTab as 'instagram' | 'tiktok' | 'facebook';
                    const currentCaptionValue = customCaptions[targetPlatform] || generatedCaptions[targetPlatform] || '';
                    const platformTitle =
                      targetPlatform === 'instagram'
                        ? 'Instagram'
                        : targetPlatform === 'tiktok'
                        ? 'TikTok'
                        : 'Facebook';
                    const platformIcon =
                      targetPlatform === 'instagram' ? (
                        <Instagram className="w-4 h-4 text-pink-400" />
                      ) : targetPlatform === 'tiktok' ? (
                        <Flame className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Facebook className="w-4 h-4 text-blue-400" />
                      );
                    const openLink =
                      targetPlatform === 'instagram'
                        ? 'https://www.instagram.com/'
                        : targetPlatform === 'tiktok'
                        ? 'https://www.tiktok.com/upload'
                        : 'https://www.facebook.com/';
                    const copyKey = targetPlatform === 'instagram' ? 'insta' : targetPlatform === 'tiktok' ? 'tiktok' : 'fb';

                    return (
                      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3 flex-1 flex flex-col">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-purple-600/25 shrink-0">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-montserrat">
                                <span>✨ TEXTE IA DE LA PUBLICATION</span>
                                <span className="text-[10px] text-pink-400 font-bold">({platformTitle})</span>
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                1 seul texte global pour les {allCurrentCaptionItems.length} {contentType === 'matches' ? 'matchs' : 'résultats'} • Modifiable librement
                              </p>
                            </div>
                          </div>

                          <a
                            href={openLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-300 hover:text-white hover:underline flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors shrink-0"
                          >
                            {platformIcon}
                            <span>Ouvrir {platformTitle}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        </div>

                        {/* Textarea pour le texte de la publication */}
                        <div className="relative flex-1 min-h-[140px]">
                          <textarea
                            value={currentCaptionValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomCaptions((prev) => ({ ...prev, [targetPlatform]: val }));
                              setIsCustomCaptionEdited((prev) => ({ ...prev, [targetPlatform]: true }));
                            }}
                            rows={8}
                            className="w-full h-full bg-slate-900/90 border border-slate-700/80 focus:border-pink-500 rounded-xl p-3 text-xs text-slate-100 font-mono resize-none focus:outline-none transition-colors shadow-inner leading-relaxed"
                            placeholder="Le texte de la publication apparaîtra ici..."
                          />
                        </div>

                        {isCustomCaptionEdited[targetPlatform] && (
                          <div className="flex items-center justify-between text-[10px] text-amber-400 px-1">
                            <span>✏️ Texte personnalisé</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomCaptionEdited((prev) => ({ ...prev, [targetPlatform]: false }));
                                setCustomCaptions((prev) => {
                                  const next = { ...prev };
                                  delete next[targetPlatform];
                                  return next;
                                });
                              }}
                              className="hover:underline text-rose-400 font-bold"
                            >
                              🔄 Réinitialiser la proposition
                            </button>
                          </div>
                        )}

                        {/* ZONE DE MODIFICATION PAR L'IA (Bouton 2) */}
                        {showAiRewriteBox && (
                          <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>Demander une retouche à l'IA sur le texte actuel :</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAiRewriteBox(false)}
                                className="text-[10px] text-slate-400 hover:text-white"
                              >
                                ✕ Fermer
                              </button>
                            </div>
                            <textarea
                              value={customRewriteInstructions}
                              onChange={(e) => setCustomRewriteInstructions(e.target.value)}
                              placeholder="Ex : Fais plus court, plus dynamique et parle de la buvette."
                              rows={3}
                              className="w-full bg-slate-950 border border-purple-700/50 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 font-sans"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowAiRewriteBox(false)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApplyAiRewrite(targetPlatform)}
                                disabled={isRewriting || !customRewriteInstructions.trim()}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
                              >
                                {isRewriting ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                    <span>Modification en cours...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>✨ APPLIQUER AVEC L'IA</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ACTIONS BAR : BOUTONS 1, 2, 3 + COPIER */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* BOUTON 1 : RÉGÉNÉRER AVEC L'IA */}
                            <button
                              type="button"
                              onClick={() => handleRegenerateWithAI(targetPlatform)}
                              disabled={aiGenerating}
                              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 active:bg-purple-700/60 text-purple-200 border border-purple-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                              title="Générer une nouvelle proposition avec l'IA"
                            >
                              {aiGenerating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                                  <span>✨ Génération en cours...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>✨ Régénérer avec l'IA</span>
                                </>
                              )}
                            </button>

                            {/* BOUTON 2 : MODIFIER AVEC L'IA */}
                            <button
                              type="button"
                              onClick={() => setShowAiRewriteBox((prev) => !prev)}
                              className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                                showAiRewriteBox
                                  ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                                  : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-900/60'
                              }`}
                              title="Demander à l'IA d'ajuster le texte actuel"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                              <span>✏️ Modifier avec l'IA</span>
                            </button>

                            {/* BOUTON 3 : ANNULER LA DERNIÈRE MODIFICATION */}
                            {previousAiCaption && (
                              <button
                                type="button"
                                onClick={() => handleUndoAiCaption(targetPlatform)}
                                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                title="Revenir à la version précédente du texte"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                <span>↩ Annuler la modif</span>
                              </button>
                            )}
                          </div>

                          {/* Bouton Copier */}
                          <button
                            type="button"
                            onClick={() => handleCopyText(currentCaptionValue, copyKey)}
                            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 active:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                          >
                            {copiedKey === copyKey ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-300" />
                                <span>Légende copiée !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copier la Légende</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* WEBHOOK / AUTOMATION PANEL */}
                  {selectedSocialTab === 'webhook' && (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                          <Zap className="w-4 h-4" />
                          <span>Passerelle Webhook & Automatisation (Zapier / Make / Meta)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Diffusez automatiquement l'affiche {badgeTitle} vers vos réseaux ou Discord via Webhook.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <label className="text-[11px] text-slate-400 block font-medium">
                          URL du Webhook configuré :
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={clubSettings.socialWebhookUrl || 'Non configuré (optionnel dans Réglages)'}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
                        />
                      </div>

                      {webhookStatus.message && (
                        <div
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                            webhookStatus.success
                              ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{webhookStatus.message}</span>
                        </div>
                      )}

                      <button
                        onClick={handleSendToWebhook}
                        disabled={webhookStatus.loading}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>
                          {webhookStatus.loading ? 'Envoi en cours...' : 'Déclencher la Passerelle Webhook'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS: NATIVE SHARE & HIGH RES DOWNLOAD */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNativeShare}
                      disabled={isSharing || isExporting}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all hover:scale-105 disabled:opacity-50"
                      id="btn-native-social-share"
                      title="Partage direct dans Instagram, Facebook ou WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{isSharing ? 'Préparation...' : 'Partager Directement (App / Mobile)'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {exportError && (
                      <span className="text-amber-400 text-xs font-semibold flex items-center gap-1 bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-800/60">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{exportError}</span>
                      </span>
                    )}

                    {totalPages > 1 && (
                      <button
                        onClick={handleDownloadAllPages}
                        disabled={isExporting || isExportingAll}
                        className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-700/20 disabled:opacity-50"
                        title={`Télécharger les ${totalPages} affiches de cette publication`}
                      >
                        <Layers className="w-4 h-4 text-white" />
                        <span>{isExportingAll ? (exportProgress || 'Génération...') : `Télécharger les ${totalPages} affiches`}</span>
                      </button>
                    )}

                    <button
                      onClick={handleDownloadImage}
                      disabled={isExporting || isExportingAll}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 shadow-md shadow-red-600/20"
                      id="btn-download-social-image"
                    >
                      {downloadSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-300" />
                          <span>Téléchargé (Haute Définition) !</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-white" />
                          <span>{isExporting ? 'Génération...' : totalPages > 1 ? `Télécharger l'affiche ${currentPage}/${totalPages}` : `Télécharger l'Affiche (${aspectRatio})`}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Link to Layer Customization */}
                <button
                  type="button"
                  onClick={() => setRightPanelTab('layers')}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>🎨 Personnaliser le style de l'affiche (couleurs, polices, logo, fond...)</span>
                </button>
              </>
              );
}