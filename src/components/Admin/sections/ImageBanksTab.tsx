// ImageBanksTab — onglet « image_banks » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { X, Sliders, FolderPlus, Upload, Trophy, Trash2, RefreshCw, RotateCcw, Sparkles, Building2, Camera, Eye, Check, Shield, ShieldCheck, Frown, Video, Film, Type, AlignLeft, AlignCenter, AlignRight, Move } from 'lucide-react';
import { MatchAlertSlide } from '../../slides/MatchAlertSlide';
import { formatAlertTitle } from '../../../utils/alertUtils';
import { isVideoMedia } from '../../../utils/mediaUtils';
import { MediaBankManager } from '.././MediaBankManager';
import { AVAILABLE_FONTS, getFontFamilyClass } from '../../../utils/fontUtils';

export interface ImageBanksTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function ImageBanksTab(props: ImageBanksTabProps) {
  const {
    d,
    w,
    photos,
    logos,
    setImageBankSubTab,
    imageBankSubTab,
    consolidatedMediaBank,
    sponsors,
    events,
    visualTemplates,
    onUpdateVisualTemplates,
    club,
    setIsDraggingPhotos,
    handleBatchPhotosUpload,
    isDraggingPhotos,
    label,
    newPhotoTitle,
    setNewPhotoTitle,
    newPhotoFolder,
    setNewPhotoFolder,
    file,
    isVideo,
    data,
    title,
    onUpdatePhotos,
    setIsDraggingSponsors,
    handleBatchSponsorsUpload,
    isDraggingSponsors,
    newSponsorName,
    setNewSponsorName,
    newSponsorTier,
    setNewSponsorTier,
    logoUrl,
    name,
    onUpdateSponsors,
    setIsDraggingLogos,
    handleBatchLogosUpload,
    isDraggingLogos,
    newLogoName,
    setNewLogoName,
    newLogoCategory,
    setNewLogoCategory,
    onUpdateLogos,
    logo,
    setIsDraggingEvents,
    handleBatchEventsUpload,
    isDraggingEvents,
    newEventTitle,
    setNewEventTitle,
    newEventDate,
    setNewEventDate,
    onUpdateEvents,
    score,
    teamVisuals,
    uploadMultipleFiles,
    x,
    setSelectedAlertVisualUrl,
    setSelectedAlertVisualType,
    setAlertPreviewType,
    selectedAlertVisualUrl,
    selectedAlertVisualType,
    updateActiveConfig,
    activeEditingConfig,
    base,
    alertPreviewType,
    setAlertPreviewTeam,
    alertPreviewTeam,
    widestTeamInfo,
    team,
    allCandidateTeams,
    teamsMeasureRef,
    currentPreviewFont,
    currentPreviewScale,
    currentPreviewTitleTemplate,
    currentPreviewIsWin,
    effectivePreviewTeam,
    now,
    clubSettings,
  } = props;

  return (
            <div className="space-y-6">
              {/* Entête & Sous-onglets des Banques d'images */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-400" />
                    <span>BANQUES D'IMAGES & VISUELS DU CLUB</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Déposez et gérez l'ensemble des photos, logos, partenaires, affiches et visuels d'équipes.
                  </p>
                </div>

                {/* Sous-onglets de navigation */}
                <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-1.5 rounded-2xl border border-slate-800/90 shrink-0">
                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('media_bank')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'media_bank'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Médias ({consolidatedMediaBank.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('photos')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'photos'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Photos ({photos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('sponsors')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'sponsors'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Sponsors ({sponsors.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('logos')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'logos'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Banque Logos ({logos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('events')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'events'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Événements ({events.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('team_visuals')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'team_visuals'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Visuels Victoire/Défaite</span>
                  </button>
                </div>
              </div>

              {/* Banque Médias Commune */}
              {imageBankSubTab === 'media_bank' && (
                <MediaBankManager
                  visualTemplates={visualTemplates}
                  onUpdateVisualTemplates={onUpdateVisualTemplates}
                />
              )}

              {/* Photos */}
              {imageBankSubTab === 'photos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                    GALERIE & PHOTOS DE LA VIE DU CLUB ({photos.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Déposez les photos des matchs, entraînements et événements du club.
                  </p>
                </div>


              </div>

              {/* Upload Box for Photos (Drag & Drop + Multi-Files) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchPhotosUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDraggingPhotos
                    ? 'border-orange-400 bg-orange-950/40 scale-[1.01] shadow-xl shadow-orange-500/20'
                    : 'border-slate-700 hover:border-orange-500/80 bg-slate-950/60'
                }`}
              >
                <Camera className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDraggingPhotos ? 'text-orange-400 scale-125 animate-bounce' : 'text-orange-400'}`} />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES PHOTOS OU VIDÉOS AU CARROUSEL TV
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Glissez un ou <strong className="text-orange-300">plusieurs fichiers en même temps</strong> ou cliquez pour importer par lot (JPG, PNG, WebP, MP4, WebM).
                </p>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Titre (optionnel si lot) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Victoire Seniors"
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Équipe / Dossier :</label>
                    <input
                      type="text"
                      placeholder="Ex: Seniors 1"
                      value={newPhotoFolder}
                      onChange={(e) => setNewPhotoFolder(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                  <Upload className="w-4 h-4" />
                  <span>Choisir un ou plusieurs fichiers (Photos / Vidéos)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchPhotosUpload(e.target.files);
                      }
                    }}
                  />
                </label>
                <div className="mt-2 text-[11px] text-slate-400">
                  📁 Astuce : Vous pouvez sélectionner des dizaines de photos d'un coup avec Ctrl+A ou Shift !
                </div>
              </div>

              {/* Photo & Video Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {photos.map((p) => {
                  const isVid = p.isVideo || p.mediaType === 'video' || p.imageUrl?.includes('.mp4') || p.imageUrl?.startsWith('data:video/');
                  return (
                    <div
                      key={p.id}
                      className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group"
                    >
                      {isVid ? (
                        <div className="relative h-32 bg-black">
                          <video
                            src={p.imageUrl}
                            preload="metadata"
                            muted
                            playsInline
                            loop
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                            className="w-full h-32 object-cover"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] font-black bg-orange-500 text-slate-950 px-1 py-0.5 rounded uppercase pointer-events-none">
                            VIDÉO
                          </span>
                        </div>
                      ) : (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="p-2">
                        <p className="text-xs font-bold text-white truncate">{p.title}</p>
                        <span className="text-[10px] text-orange-400 block">{p.categoryFolder || 'Général'}</span>
                      </div>
                      <button
                        onClick={() => onUpdatePhotos(photos.filter((item) => item.id !== p.id))}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer la photo / vidéo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SPONSORS & PARTENAIRES */}
          {/* ========================================================================= */}
          {imageBankSubTab === 'sponsors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                    SPONSORS & PARTENAIRES DU CLUB ({sponsors.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ajoutez les logos ou clips vidéos de vos partenaires pour les mettre à l'honneur dans la boucle TV.
                  </p>
                </div>


              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingSponsors(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingSponsors(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingSponsors(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSponsors(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchSponsorsUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDraggingSponsors
                    ? 'border-orange-400 bg-orange-950/40 scale-[1.01] shadow-xl shadow-orange-500/20'
                    : 'border-slate-700 hover:border-orange-500/80 bg-slate-950/60'
                }`}
              >
                <Building2 className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDraggingSponsors ? 'text-orange-400 scale-125 animate-bounce' : 'text-orange-400'}`} />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES PARTENAIRES & SPONSORS
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Glissez un ou <strong className="text-orange-300">plusieurs logos en même temps</strong>. Les noms des partenaires seront automatiquement extraits du nom de vos fichiers !
                </p>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-left">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Nom (optionnel si import groupé) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Boulangerie Ducoin"
                      value={newSponsorName}
                      onChange={(e) => setNewSponsorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Rang :</label>
                    <select
                      value={newSponsorTier}
                      onChange={(e) => setNewSponsorTier(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="gold">Gold (Majeur)</option>
                      <option value="silver">Silver</option>
                      <option value="bronze">Bronze</option>
                      <option value="partenaire">Partenaire</option>
                    </select>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                  <Upload className="w-4 h-4" />
                  <span>Déposer un ou plusieurs logos / clips partenaires</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchSponsorsUpload(e.target.files);
                      }
                    }}
                  />
                </label>
                <div className="mt-2 text-[11px] text-slate-400">
                  📁 Astuce : Vous pouvez sélectionner plusieurs logos d'un coup (PNG, SVG, JPG, MP4).
                </div>
              </div>

              {/* Sponsors Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sponsors.map((sp) => {
                  const isVid = sp.isVideo || sp.mediaType === 'video' || sp.logoUrl?.includes('.mp4') || sp.logoUrl?.startsWith('data:video/');
                  return (
                    <div
                      key={sp.id}
                      className="relative rounded-2xl p-3 border border-slate-800 bg-slate-950 flex flex-col items-center text-center group overflow-hidden"
                    >
                      <div className="w-24 h-16 bg-white rounded-xl p-1 flex items-center justify-center mb-2 relative overflow-hidden">
                        {isVid ? (
                          <video
                            src={sp.logoUrl}
                            preload="metadata"
                            muted
                            playsInline
                            loop
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        ) : (
                          <img
                            src={sp.logoUrl}
                            alt={sp.name}
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {isVid && (
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black bg-orange-500 text-slate-950 px-1 py-0.5 rounded uppercase pointer-events-none">
                            VIDÉO
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate w-full">{sp.name}</h4>
                      <div className="mt-1.5 w-full flex items-center justify-center">
                        <select
                          value={sp.tier || 'partenaire'}
                          onChange={(e) => {
                            const newTier = e.target.value as 'gold' | 'silver' | 'bronze' | 'partenaire';
                            onUpdateSponsors(sponsors.map((item) => item.id === sp.id ? { ...item, tier: newTier } : item));
                          }}
                          className="bg-slate-900 border border-slate-700 text-amber-400 text-[10px] font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="gold">GOLD (3 passages)</option>
                          <option value="silver">SILVER (2 passages)</option>
                          <option value="bronze">BRONZE (1 passage)</option>
                          <option value="partenaire">PARTENAIRE (1 passage)</option>
                        </select>
                      </div>
                      <button
                        onClick={() => onUpdateSponsors(sponsors.filter((item) => item.id !== sp.id))}
                        className="absolute top-1.5 right-1.5 p-1 rounded bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BANQUE DÉDIÉE LOGOS (Club, Partenaires, Ligue, Comité) */}
          {/* ========================================================================= */}
          {imageBankSubTab === 'logos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-cyan-400" />
                    BANQUE DÉDIÉE LOGOS CLUB & PARTENAIRES ({logos.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Stockage centralisé de vos visuels et logos (PNG / SVG transparents) du club, des partenaires, de la Ligue et du Comité.
                  </p>
                </div>


              </div>

              {/* Upload Box for Logos (Drag & Drop + Multi-Files) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLogos(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingLogos(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingLogos(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLogos(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchLogosUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDraggingLogos
                    ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01] shadow-xl shadow-cyan-500/20'
                    : 'border-slate-700 hover:border-cyan-500/80 bg-slate-950/60'
                }`}
              >
                <Upload className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDraggingLogos ? 'text-cyan-400 scale-125 animate-bounce' : 'text-cyan-400'}`} />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES LOGOS OU CLIPS VIDÉOS
                </h4>
                <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
                  Glissez un ou <strong className="text-cyan-300">plusieurs fichiers de logos en même temps</strong> (PNG / SVG transparents, JPG, ou MP4/WebM).
                </p>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nom (optionnel si import groupé) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Logo Officiel HD"
                      value={newLogoName}
                      onChange={(e) => setNewLogoName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Type de Logo :</label>
                    <select
                      value={newLogoCategory}
                      onChange={(e) => setNewLogoCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="club">Logo du Club</option>
                      <option value="sponsor">Logo Partenaire</option>
                      <option value="comite">Comité Départemental</option>
                      <option value="ligue">Ligue Régionale</option>
                      <option value="autre">Autre Organisme</option>
                    </select>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                  <Upload className="w-4 h-4" />
                  <span>Importer un ou plusieurs fichiers (PNG/SVG/MP4)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchLogosUpload(e.target.files);
                      }
                    }}
                  />
                </label>
                <div className="mt-2 text-[11px] text-slate-400">
                  📁 Astuce : Vous pouvez sélectionner plusieurs logos pour les intégrer en un seul clic !
                </div>
              </div>

              {/* Logos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {logos.map((lg) => {
                  const isVid = lg.isVideo || lg.mediaType === 'video' || lg.logoUrl?.includes('.mp4') || lg.logoUrl?.startsWith('data:video/');
                  return (
                    <div
                      key={lg.id}
                      className="relative rounded-2xl p-4 border border-slate-800 bg-slate-950/80 flex flex-col items-center text-center group hover:border-cyan-500/50 transition-all overflow-hidden"
                    >
                      <div className="w-28 h-20 bg-slate-900/90 border border-slate-800 rounded-xl p-1 flex items-center justify-center mb-3 relative overflow-hidden">
                        {isVid ? (
                          <video
                            src={lg.logoUrl}
                            preload="metadata"
                            muted
                            playsInline
                            loop
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        ) : (
                          <img
                            src={lg.logoUrl}
                            alt={lg.name}
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {isVid && (
                          <span className="absolute bottom-1 right-1 text-[9px] font-black bg-cyan-500 text-slate-950 px-1 py-0.5 rounded uppercase pointer-events-none">
                            VIDÉO
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate w-full">{lg.name}</h4>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase mt-1 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/60">
                        {lg.category}
                      </span>
                      <button
                        onClick={() => onUpdateLogos && onUpdateLogos(logos.filter((item) => item.id !== lg.id))}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer ce logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ÉVÉNEMENTS */}
          {/* ========================================================================= */}
          {imageBankSubTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                    AFFICHE ÉVÉNEMENTS, TOURNOIS ET SOIRÉES DU CLUB ({events.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ces affiches sont diffusées en plein écran dans la boucle de la télévision.
                  </p>
                </div>


              </div>

              {/* Upload Box for Events (Drag & Drop + Multi-Files) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingEvents(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingEvents(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingEvents(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingEvents(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchEventsUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDraggingEvents
                    ? 'border-orange-400 bg-orange-950/40 scale-[1.01] shadow-xl shadow-orange-500/20'
                    : 'border-slate-700 hover:border-orange-500/80 bg-slate-950/60'
                }`}
              >
                <Sparkles className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDraggingEvents ? 'text-orange-400 scale-125 animate-bounce' : 'text-orange-400'}`} />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES AFFICHES D'ÉVÉNEMENTS
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Glissez une ou <strong className="text-orange-300">plusieurs affiches d'événements d'un coup</strong> (tournois, soirées, lotos, stages).
                </p>

                <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Titre (optionnel si import groupé) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Soirée Fondue du club"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Date :</label>
                    <input
                      type="text"
                      placeholder="Ex: Samedi 26 Septembre"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                    <Upload className="w-4 h-4" />
                    <span>Déposer une ou plusieurs affiches d'événements</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.mp4,.webm,.mov"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleBatchEventsUpload(e.target.files);
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400">
                    💡 Vos affiches d'événements s'afficheront en plein écran haute fidélité sur les TV sans aucun texte superposé par-dessus pour préserver vos visuels !
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col group relative"
                  >
                    {ev.imageUrl && (
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        className="w-full h-36 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="p-3">
                      <h4 className="text-sm font-black text-white font-bebas">{ev.title}</h4>
                      <p className="text-xs text-orange-400">{ev.date}</p>
                    </div>
                    <button
                      onClick={() => onUpdateEvents(events.filter((item) => item.id !== ev.id))}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ========================================================================= */}
          {/* TAB 3: VISUELS ÉQUIPES (VICTOIRE / DÉFAITE) */}
          {imageBankSubTab === 'team_visuals' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                    BIBLIOTHÈQUE DES VISUELS VICTOIRE & DÉFAITE PAR ÉQUIPE
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Lorsqu'un score est reçu depuis l'<strong>API FFBB</strong> ou depuis un <strong>message Telegram</strong>, 
                    l'application pioche automatiquement le visuel Victoire ou Défaite associé à l'équipe et l'insère dans la boucle TV pendant 1 heure !
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 whitespace-nowrap">
                  {teamVisuals.length} Équipes configurées
                </span>
              </div>

              {/* ========================================================================= */}
              {/* SECTION 1 : BANQUE COMMUNE DE VISUELS GÉNÉRAUX (VICTOIRE & DÉFAITE)     */}
              {/* ========================================================================= */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 rounded-3xl border-2 border-emerald-500/40 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs uppercase border border-emerald-500/30">
                        ⭐ NOUVELLE FONCTIONNALITÉ CLUB
                      </span>
                      <span className="text-xs text-amber-400 font-bold">Rotation 1h stable</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span>BANQUE COMMUNE DE VISUELS GÉNÉRAUX & MONTAGE DU TEXTE</span>
                    </h3>
                    <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                      Chargez ici vos visuels généraux de <strong>Victoire</strong> et de <strong>Défaite</strong> (photos ou vidéos). 
                      À la réception d'un match (FFBB, Telegram ou Manuel), l'application pioche automatiquement un visuel et 
                      <strong> conserve ce même visuel pendant 1 heure</strong> pour l'équipe concernée, avec votre texte personnalisé et positionné au millimètre !
                    </p>
                  </div>
                </div>

                {/* GRILLE 2 COLONNES : BANQUE VICTOIRES & BANQUE DÉFAITES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* COLONNE VICTOIRES COMMUNES */}
                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">
                            Visuels Communs Victoire
                          </h4>
                          <span className="text-[11px] text-emerald-400 font-bold">
                            {(visualTemplates.commonVictoryVisuals || []).length} visuel(s) disponible(s)
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Ajouter (Img / Vidéo)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*,.mp4,.webm,.mov"
                          className="hidden"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const results = await uploadMultipleFiles(e.target.files);
                              const newUrls = results.map((r) => r.url);
                              const existing = visualTemplates.commonVictoryVisuals || [];
                              const newConfigs = { ...(visualTemplates.visualTitleConfigs || {}) };
                              for (const u of newUrls) {
                                newConfigs[u] = {
                                  customTitle: visualTemplates.alertCustomWinTitle ?? 'VICTOIRE DES {CATEGORIE}',
                                  font: visualTemplates.alertTextFont ?? 'Bebas Neue',
                                  color: visualTemplates.alertWinColor || visualTemplates.alertTextColor || '#10b981',
                                  scale: visualTemplates.alertTextScale ?? 1.0,
                                  x: visualTemplates.alertTextX ?? 50,
                                  y: visualTemplates.alertTextY ?? 82,
                                  align: visualTemplates.alertTextAlign ?? 'center',
                                  bgOpacity: visualTemplates.alertTextBgOpacity ?? 0,
                                  glowEffect: visualTemplates.alertGlowEffect ?? true,
                                  isCustomized: true, // Devient immédiatement indépendant
                                };
                              }
                              onUpdateVisualTemplates({
                                ...visualTemplates,
                                commonVictoryVisuals: [...existing, ...newUrls],
                                visualTitleConfigs: newConfigs,
                              });
                              if (newUrls.length > 0) {
                                setSelectedAlertVisualUrl(newUrls[0]);
                                setSelectedAlertVisualType('win');
                                setAlertPreviewType('win');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Liste des visuels de victoire */}
                    {(visualTemplates.commonVictoryVisuals || []).length === 0 ? (
                      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-950/10 text-slate-400 text-xs">
                        <p className="font-semibold text-emerald-300 mb-1">Aucun visuel de victoire commun</p>
                        <p className="text-[11px]">Ajoutez 2 à 4 visuels/vidéos pour apporter de la variété automatique !</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                        {(visualTemplates.commonVictoryVisuals || []).map((url, idx) => {
                          const isSelected = selectedAlertVisualUrl === url;
                          const hasCustom = !!visualTemplates.visualTitleConfigs?.[url]?.isCustomized;
                          return (
                            <div
                              key={idx}
                              className={`group relative rounded-xl overflow-hidden border bg-black shadow-md flex flex-col transition-all ${
                                isSelected
                                  ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-amber-500/20'
                                  : 'border-emerald-500/40 hover:border-emerald-400'
                              }`}
                            >
                              <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                                {isVideoMedia(url) ? (
                                  <video
                                    src={url}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={url}
                                    alt={`Victoire ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                {isVideoMedia(url) && (
                                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-emerald-300 text-[9px] font-bold">
                                    Vidéo
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    const existing = visualTemplates.commonVictoryVisuals || [];
                                    const updated = existing.filter((_, i) => i !== idx);
                                    const nextConfigs = { ...(visualTemplates.visualTitleConfigs || {}) };
                                    delete nextConfigs[url];
                                    if (selectedAlertVisualUrl === url) setSelectedAlertVisualUrl(null);
                                    onUpdateVisualTemplates({
                                      ...visualTemplates,
                                      commonVictoryVisuals: updated,
                                      visualTitleConfigs: nextConfigs,
                                    });
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                                  title="Supprimer ce visuel"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="p-2 bg-slate-950/95 border-t border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-black text-white truncate">
                                    Visuel Victoire #{idx + 1}
                                  </span>
                                  {hasCustom ? (
                                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 shrink-0">
                                      <Check className="w-3 h-3" /> Titre personnalisé
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      Titre par défaut
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAlertVisualUrl(url);
                                    setSelectedAlertVisualType('win');
                                    setAlertPreviewType('win');
                                  }}
                                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                      : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                                  }`}
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>{isSelected ? 'Visuel en cours d\'édition' : 'Configurer le titre'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* COLONNE DÉFAITES COMMUNES */}
                  <div className="bg-rose-950/20 border border-rose-500/30 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <Frown className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">
                            Visuels Communs Défaite
                          </h4>
                          <span className="text-[11px] text-rose-400 font-bold">
                            {(visualTemplates.commonDefeatVisuals || []).length} visuel(s) disponible(s)
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Ajouter (Img / Vidéo)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*,.mp4,.webm,.mov"
                          className="hidden"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const results = await uploadMultipleFiles(e.target.files);
                              const newUrls = results.map((r) => r.url);
                              const existing = visualTemplates.commonDefeatVisuals || [];
                              const newConfigs = { ...(visualTemplates.visualTitleConfigs || {}) };
                              for (const u of newUrls) {
                                newConfigs[u] = {
                                  customTitle: visualTemplates.alertCustomLossTitle ?? 'DÉFAITE DES {CATEGORIE}',
                                  font: visualTemplates.alertTextFont ?? 'Bebas Neue',
                                  color: visualTemplates.alertLossColor || visualTemplates.alertTextColor || '#ef4444',
                                  scale: visualTemplates.alertTextScale ?? 1.0,
                                  x: visualTemplates.alertTextX ?? 50,
                                  y: visualTemplates.alertTextY ?? 82,
                                  align: visualTemplates.alertTextAlign ?? 'center',
                                  bgOpacity: visualTemplates.alertTextBgOpacity ?? 0,
                                  glowEffect: visualTemplates.alertGlowEffect ?? true,
                                  isCustomized: true, // Devient immédiatement indépendant
                                };
                              }
                              onUpdateVisualTemplates({
                                ...visualTemplates,
                                commonDefeatVisuals: [...existing, ...newUrls],
                                visualTitleConfigs: newConfigs,
                              });
                              if (newUrls.length > 0) {
                                setSelectedAlertVisualUrl(newUrls[0]);
                                setSelectedAlertVisualType('loss');
                                setAlertPreviewType('loss');
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Liste des visuels de défaite */}
                    {(visualTemplates.commonDefeatVisuals || []).length === 0 ? (
                      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-rose-500/30 bg-rose-950/10 text-slate-400 text-xs">
                        <p className="font-semibold text-rose-300 mb-1">Aucun visuel de défaite commun</p>
                        <p className="text-[11px]">Ajoutez 1 à 3 visuels/vidéos de soutien et combativité !</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                        {(visualTemplates.commonDefeatVisuals || []).map((url, idx) => {
                          const isSelected = selectedAlertVisualUrl === url;
                          const hasCustom = !!visualTemplates.visualTitleConfigs?.[url]?.isCustomized;
                          return (
                            <div
                              key={idx}
                              className={`group relative rounded-xl overflow-hidden border bg-black shadow-md flex flex-col transition-all ${
                                isSelected
                                  ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-amber-500/20'
                                  : 'border-rose-500/40 hover:border-rose-400'
                              }`}
                            >
                              <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
                                {isVideoMedia(url) ? (
                                  <video
                                    src={url}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={url}
                                    alt={`Défaite ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                {isVideoMedia(url) && (
                                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-rose-300 text-[9px] font-bold">
                                    Vidéo
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    const existing = visualTemplates.commonDefeatVisuals || [];
                                    const updated = existing.filter((_, i) => i !== idx);
                                    const nextConfigs = { ...(visualTemplates.visualTitleConfigs || {}) };
                                    delete nextConfigs[url];
                                    if (selectedAlertVisualUrl === url) setSelectedAlertVisualUrl(null);
                                    onUpdateVisualTemplates({
                                      ...visualTemplates,
                                      commonDefeatVisuals: updated,
                                      visualTitleConfigs: nextConfigs,
                                    });
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                                  title="Supprimer ce visuel"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="p-2 bg-slate-950/95 border-t border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-black text-white truncate">
                                    Visuel Défaite #{idx + 1}
                                  </span>
                                  {hasCustom ? (
                                    <span className="text-[10px] font-bold text-rose-400 flex items-center gap-0.5 shrink-0">
                                      <Check className="w-3 h-3" /> Titre personnalisé
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      Titre par défaut
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAlertVisualUrl(url);
                                    setSelectedAlertVisualType('loss');
                                    setAlertPreviewType('loss');
                                  }}
                                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                      : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30'
                                  }`}
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>{isSelected ? 'Visuel en cours d\'édition' : 'Configurer le titre'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ATELIER DE MONTAGE : TITRE DYNAMIQUE & POSITIONNEMENT */}
                <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        <span>
                          {selectedAlertVisualUrl
                            ? `Configuration du Titre : Visuel ${selectedAlertVisualType === 'win' ? 'Victoire' : 'Défaite'} Sélectionné`
                            : 'Composition Visuelle & Titre (Modèle Par Défaut)'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {selectedAlertVisualUrl
                          ? 'Ajustez le texte, la position X/Y et la taille spécifiquement pour ce média sans impacter les autres.'
                          : 'Modèle général utilisé pour les nouveaux visuels et en repli pour les médias non personnalisés.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAlertVisualUrl) {
                          const isWin = selectedAlertVisualType === 'win';
                          updateActiveConfig({
                            customTitle: isWin ? 'VICTOIRE DES {CATEGORIE}' : 'DÉFAITE DES {CATEGORIE}',
                            font: 'Bebas Neue',
                            color: isWin ? '#10b981' : '#ef4444',
                            scale: 1.0,
                            x: 50,
                            y: 82,
                            align: 'center',
                            bgOpacity: 0,
                            glowEffect: true,
                            isCustomized: true,
                          });
                        } else {
                          onUpdateVisualTemplates({
                            ...visualTemplates,
                            alertCustomWinTitle: 'VICTOIRE DES {CATEGORIE}',
                            alertCustomLossTitle: 'DÉFAITE DES {CATEGORIE}',
                            alertTextX: 50,
                            alertTextY: 82,
                            alertTextAlign: 'center',
                            alertTextScale: 1.0,
                            alertTextFont: 'Bebas Neue',
                            alertWinColor: '#10b981',
                            alertLossColor: '#ef4444',
                            alertTextColor: '#ffffff',
                            alertGlowEffect: true,
                            alertTextBgOpacity: 0,
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-orange-400" />
                      <span>Réinitialiser aux réglages optimaux</span>
                    </button>
                  </div>

                  {/* BANDEAU D'ÉTAT DU VISUEL EN COURS */}
                  {selectedAlertVisualUrl ? (
                    <div className="bg-amber-500/10 border border-amber-500/40 p-3.5 rounded-xl flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-9 rounded-lg overflow-hidden border border-amber-400/60 bg-black shrink-0 relative">
                          {isVideoMedia(selectedAlertVisualUrl) ? (
                            <video src={selectedAlertVisualUrl} muted className="w-full h-full object-cover" />
                          ) : (
                            <img src={selectedAlertVisualUrl} alt="Sélection" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-amber-300">
                              Visuel {selectedAlertVisualType === 'win' ? 'Victoire' : 'Défaite'} actif
                            </span>
                            {activeEditingConfig.isCustomized ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Titre personnalisé
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                                Titre par défaut (non encore modifié)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300">
                            Vos ajustements ci-dessous sont enregistrés <strong>exclusivement pour ce média</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const isWin = selectedAlertVisualType === 'win';
                            const nextConfigs = { ...(visualTemplates.visualTitleConfigs || {}) };
                            delete nextConfigs[selectedAlertVisualUrl];
                            onUpdateVisualTemplates({
                              ...visualTemplates,
                              visualTitleConfigs: nextConfigs,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Rétablir les réglages par défaut du club pour ce visuel"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-400" />
                          <span>Rétablir titre par défaut</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedAlertVisualUrl(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Fermer sélection</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs font-black uppercase text-slate-300 block">
                          Configuration globale par défaut (club)
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Cliquez sur <strong>« Configurer le titre »</strong> sur l'un des visuels ci-dessus pour adapter son titre à sa composition propre.
                        </p>
                      </div>
                      <span className="text-xs text-amber-400 font-bold">
                        💡 Chaque média peut avoir sa position et sa taille dédiées
                      </span>
                    </div>
                  )}

                  {/* 1. MODÈLES DE TITRES DYNAMIQUES */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {selectedAlertVisualUrl
                          ? `Modèle de Titre pour ce visuel (${selectedAlertVisualType === 'win' ? 'Victoire' : 'Défaite'})`
                          : 'Modèles de Titre Dynamique par Défaut'}
                      </span>
                    </label>

                    {selectedAlertVisualUrl ? (
                      /* Mode Visuel Sélectionné : un seul champ ciblé */
                      <div className={`p-4 rounded-xl border space-y-2 ${
                        selectedAlertVisualType === 'win'
                          ? 'bg-slate-900/60 border-emerald-500/40'
                          : 'bg-slate-900/60 border-rose-500/40'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black uppercase flex items-center gap-1.5 ${
                            selectedAlertVisualType === 'win' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {selectedAlertVisualType === 'win' ? <Trophy className="w-3.5 h-3.5" /> : <Frown className="w-3.5 h-3.5" />}
                            <span>Titre de ce visuel</span>
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">Configuration individuelle</span>
                        </div>
                        <textarea
                          rows={2}
                          value={activeEditingConfig.customTitle ?? (selectedAlertVisualType === 'win' ? 'VICTOIRE DES {CATEGORIE}' : 'DÉFAITE DES {CATEGORIE}')}
                          onChange={(e) => updateActiveConfig({ customTitle: e.target.value })}
                          placeholder={selectedAlertVisualType === 'win' ? "Ex: VICTOIRE DES\n{CATEGORIE}" : "Ex: DÉFAITE DES\n{CATEGORIE}"}
                          className={`w-full bg-slate-950 border border-slate-700 rounded-xl text-white px-3 py-2 text-xs font-bold focus:outline-none resize-none ${
                            selectedAlertVisualType === 'win' ? 'focus:border-emerald-500' : 'focus:border-rose-500'
                          }`}
                        />
                        <p className="text-[11px] text-slate-400">
                          La balise <span className="font-mono text-amber-300 font-bold">{'{CATEGORIE}'}</span> est remplacée automatiquement par l'équipe. <strong className="text-slate-300">Touche Entrée</strong> pour insérer un retour à la ligne volontaire.
                        </p>
                      </div>
                    ) : (
                      /* Mode Défaut Global : Titre Victoire & Titre Défaite */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Titre Victoire */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Titre Victoire (Défaut)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Modèle global</span>
                          </div>
                          <textarea
                            rows={2}
                            value={visualTemplates.alertCustomWinTitle ?? 'VICTOIRE DES {CATEGORIE}'}
                            onChange={(e) =>
                              onUpdateVisualTemplates({
                                ...visualTemplates,
                                alertCustomWinTitle: e.target.value,
                              })
                            }
                            placeholder="Ex: VICTOIRE DES&#10;{CATEGORIE}"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl text-white px-3 py-2 text-xs font-bold focus:border-emerald-500 focus:outline-none resize-none"
                          />
                          <p className="text-[11px] text-slate-400">
                            La balise <span className="font-mono text-emerald-300 font-bold">{'{CATEGORIE}'}</span> est remplacée automatiquement par l'équipe. <strong className="text-slate-300">Touche Entrée</strong> pour insérer un retour à la ligne.
                          </p>
                        </div>

                        {/* Titre Défaite */}
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-rose-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-rose-400 uppercase flex items-center gap-1.5">
                              <Frown className="w-3.5 h-3.5 text-rose-400" />
                              <span>Titre Défaite (Défaut)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Modèle global</span>
                          </div>
                          <textarea
                            rows={2}
                            value={visualTemplates.alertCustomLossTitle ?? 'DÉFAITE DES {CATEGORIE}'}
                            onChange={(e) =>
                              onUpdateVisualTemplates({
                                ...visualTemplates,
                                alertCustomLossTitle: e.target.value,
                              })
                            }
                            placeholder="Ex: DÉFAITE DES&#10;{CATEGORIE}"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl text-white px-3 py-2 text-xs font-bold focus:border-rose-500 focus:outline-none resize-none"
                          />
                          <p className="text-[11px] text-slate-400">
                            La balise <span className="font-mono text-rose-300 font-bold">{'{CATEGORIE}'}</span> est remplacée automatiquement par l'équipe. <strong className="text-slate-300">Touche Entrée</strong> pour insérer un retour à la ligne.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. TYPOGRAPHIE, ALIGNEMENT & COULEURS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                    {/* Police du Titre */}
                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <label className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-amber-400" />
                        <span>Police du Titre</span>
                      </label>
                      <select
                        value={activeEditingConfig.font || 'Bebas Neue'}
                        onChange={(e) => updateActiveConfig({ font: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl text-white px-3 py-2 text-xs font-bold"
                      >
                        {AVAILABLE_FONTS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.category})
                          </option>
                        ))}
                      </select>
                      <div className={`text-base font-black uppercase text-amber-300 tracking-wider text-center py-1 bg-black/40 rounded-lg truncate ${getFontFamilyClass(activeEditingConfig.font || 'Bebas Neue')}`}>
                        DÉFAITE DES U11 F
                      </div>
                    </div>

                    {/* Alignement du Titre */}
                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300 block">Alignement Horizontal</span>
                      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {[
                          { id: 'left', label: 'Gauche', icon: AlignLeft },
                          { id: 'center', label: 'Centré', icon: AlignCenter },
                          { id: 'right', label: 'Droite', icon: AlignRight },
                        ].map((align) => {
                          const Icon = align.icon;
                          const isSel = (activeEditingConfig.align || 'center') === align.id;
                          return (
                            <button
                              key={align.id}
                              type="button"
                              onClick={() => updateActiveConfig({ align: align.id as any })}
                              className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                                isSel
                                  ? 'bg-orange-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span className="text-[10px]">{align.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Couleur Titre */}
                    {selectedAlertVisualUrl ? (
                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 col-span-1 sm:col-span-2">
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">
                            Couleur du Titre ({selectedAlertVisualType === 'win' ? 'Victoire' : 'Défaite'})
                          </span>
                          <span className="text-[10px] text-amber-400">Couleur appliquée à ce visuel</span>
                        </div>
                        <input
                          type="color"
                          value={activeEditingConfig.color || (selectedAlertVisualType === 'win' ? '#10b981' : '#ef4444')}
                          onChange={(e) => updateActiveConfig({ color: e.target.value })}
                          className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                        />
                      </div>
                    ) : (
                      <>
                        {/* Couleur Titre Victoire Défaut */}
                        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">Couleur Victoire</span>
                            <span className="text-[10px] text-emerald-400">Défaut global victoire</span>
                          </div>
                          <input
                            type="color"
                            value={visualTemplates.alertWinColor || '#10b981'}
                            onChange={(e) =>
                              onUpdateVisualTemplates({
                                ...visualTemplates,
                                alertWinColor: e.target.value,
                              })
                            }
                            className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                          />
                        </div>

                        {/* Couleur Titre Défaite Défaut */}
                        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">Couleur Défaite</span>
                            <span className="text-[10px] text-rose-400">Défaut global défaite</span>
                          </div>
                          <input
                            type="color"
                            value={visualTemplates.alertLossColor || '#ef4444'}
                            onChange={(e) =>
                              onUpdateVisualTemplates({
                                ...visualTemplates,
                                alertLossColor: e.target.value,
                              })
                            }
                            className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* 3. CURSEURS DE POSITIONNEMENT & TAILLE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Position Horizontale X */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Position Horizontale (Axe X)</span>
                        <span className="font-mono text-orange-400">{activeEditingConfig.x ?? 50}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        step="1"
                        value={activeEditingConfig.x ?? 50}
                        onChange={(e) => updateActiveConfig({ x: parseInt(e.target.value, 10) })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Gauche (5%)</span>
                        <span>Centre (50%)</span>
                        <span>Droite (95%)</span>
                      </div>
                    </div>

                    {/* Position Verticale Y */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Position Verticale (Axe Y)</span>
                        <span className="font-mono text-orange-400">{activeEditingConfig.y ?? 82}%</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        step="1"
                        value={activeEditingConfig.y ?? 82}
                        onChange={(e) => updateActiveConfig({ y: parseInt(e.target.value, 10) })}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Haut (5%)</span>
                        <span>Milieu (50%)</span>
                        <span>Bas (85-90%)</span>
                      </div>
                    </div>

                    {/* Échelle / Taille du titre */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Taille du Titre</span>
                        <span className="font-mono text-amber-400">
                          {Math.round((activeEditingConfig.scale ?? 1.0) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="1.6"
                        step="0.05"
                        value={activeEditingConfig.scale ?? 1.0}
                        onChange={(e) => updateActiveConfig({ scale: parseFloat(e.target.value) })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Mini (20%)</span>
                        <span>Standard (100%)</span>
                        <span>Grand (160%)</span>
                      </div>
                    </div>

                    {/* Fond protecteur optionnel */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Fond Sous le Titre</span>
                        <span className="font-mono text-emerald-400">
                          {(activeEditingConfig.bgOpacity ?? 0) === 0 ? 'Aucun (Pur texte)' : `${Math.round((activeEditingConfig.bgOpacity ?? 0) * 100)}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.9"
                        step="0.05"
                        value={activeEditingConfig.bgOpacity ?? 0}
                        onChange={(e) => updateActiveConfig({ bgOpacity: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0% (Pur texte)</span>
                        <span>Léger (30%)</span>
                        <span>Foncé (90%)</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. APERÇU INTERACTIF EN DIRECT DU MONTAGE 16:9 */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                          {selectedAlertVisualUrl
                            ? `Aperçu en direct : ${selectedAlertVisualType === 'win' ? 'Visuel Victoire' : 'Visuel Défaite'} (Simulation TV 16:9)`
                            : 'Aperçu en direct (Simulation TV 16:9)'}
                        </span>
                      </div>

                      {/* Sélecteur de test Défaite / Victoire et Équipe */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {!selectedAlertVisualUrl && (
                          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setAlertPreviewType('loss')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                alertPreviewType === 'loss'
                                  ? 'bg-red-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Frown className="w-3.5 h-3.5" />
                              <span>Tester DÉFAITE</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAlertPreviewType('win')}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                alertPreviewType === 'win'
                                  ? 'bg-emerald-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Trophy className="w-3.5 h-3.5" />
                              <span>Tester VICTOIRE</span>
                            </button>
                          </div>
                        )}

                        {/* Choix et mode de l'équipe de test */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Bouton direct "La plus large" */}
                          <button
                            type="button"
                            onClick={() => setAlertPreviewTeam('__widest__')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              alertPreviewTeam === '__widest__'
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black ring-2 ring-amber-400/40'
                                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
                            }`}
                            title="Calibrer automatiquement le titre sur l'équipe produisant la plus grande largeur graphique"
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 ${alertPreviewTeam === '__widest__' ? 'text-slate-950' : 'text-amber-400'}`} />
                            <span>La plus large</span>
                            {alertPreviewTeam === '__widest__' && widestTeamInfo.team && (
                              <span className="ml-0.5 px-1.5 py-0.5 rounded bg-slate-950/20 text-slate-950 text-[10px] font-black uppercase">
                                {widestTeamInfo.team}
                              </span>
                            )}
                          </button>

                          {/* Sélecteur déroulant complet avec indication de l'équipe réellement testée */}
                          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                            <span className="text-slate-400 font-medium">Équipe test :</span>
                            <select
                              value={alertPreviewTeam}
                              onChange={(e) => setAlertPreviewTeam(e.target.value)}
                              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer max-w-[240px] truncate"
                            >
                              <option value="__widest__" className="bg-slate-900 text-amber-400 font-bold">
                                🛡️ La plus large — {widestTeamInfo.team}
                              </option>
                              <optgroup label="Tester une équipe spécifique" className="bg-slate-900 text-slate-400">
                                {allCandidateTeams.map((teamName) => (
                                  <option key={teamName} value={teamName} className="bg-slate-900 text-white font-normal">
                                    {teamName}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ÉLÉMENT INVISIBLE DE MESURE DE LARGEUR RÉELLE DE TOUTES LES ÉQUIPES DU CLUB */}
                    <div
                      ref={teamsMeasureRef}
                      aria-hidden="true"
                      className={`pointer-events-none select-none uppercase font-black tracking-wider leading-[1.08] ${getFontFamilyClass(
                        currentPreviewFont
                      )}`}
                      style={{
                        position: 'absolute',
                        visibility: 'hidden',
                        top: -99999,
                        left: -99999,
                        fontSize: `${Math.round(60 * currentPreviewScale)}px`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {allCandidateTeams.map((teamName) => {
                        const formatted = formatAlertTitle(currentPreviewTitleTemplate, currentPreviewIsWin, teamName);
                        const lines = formatted.split('\n');
                        return (
                          <div key={teamName} data-team={teamName} className="team-width-block">
                            {lines.map((line, lIdx) => (
                              <div key={lIdx} className="team-width-line">
                                {line}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bandeau d'information de l'équipe testée */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      {alertPreviewTeam === '__widest__' ? (
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            Équipe test : <strong>La plus large — {widestTeamInfo.team}</strong>. Si le titre tient avec cette équipe, il tiendra pour l'ensemble du club.
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full">
                          <span>
                            Équipe test : <strong>{alertPreviewTeam}</strong>.{' '}
                            <button
                              type="button"
                              onClick={() => setAlertPreviewTeam('__widest__')}
                              className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer ml-1"
                            >
                              Revenir à la plus large ({widestTeamInfo.team})
                            </button>
                          </span>
                        </div>
                      )}

                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                        {allCandidateTeams.length} équipes testées au pixel près
                      </span>
                    </div>

                    {/* Cadre de rendu 16:9 réel avec interaction directe */}
                    <div className="relative w-full aspect-video max-w-3xl mx-auto rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950 select-none">
                      <MatchAlertSlide
                        alert={{
                          id: 'preview-alert',
                          team: effectivePreviewTeam,
                          isWin: selectedAlertVisualUrl ? selectedAlertVisualType === 'win' : alertPreviewType === 'win',
                          triggeredBy: 'manual',
                          timestamp: Date.now(),
                          expiresAt: Date.now() + 3600000,
                        }}
                        overrideImageUrl={selectedAlertVisualUrl || undefined}
                        overrideTitleConfig={activeEditingConfig}
                        visualTemplates={visualTemplates}
                        clubSettings={clubSettings}
                        interactive={true}
                        onUpdatePosition={(x, y) => updateActiveConfig({ x, y })}
                        onUpdateTemplate={(newTemplate) => updateActiveConfig({ customTitle: newTemplate })}
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-orange-400" />
                        <span><strong>Glissez directement le titre</strong> dans l'image pour ajuster sa position X/Y.</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Double-cliquez sur le titre ou cliquez sur <em>Modifier texte</em> pour éditer la formulation et les retours à la ligne.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
            </div>  );
}