import React, { useState } from 'react';
import { Film, Upload, Trash2, CheckCircle2, AlertCircle, Video, Image as ImageIcon, Sparkles, ExternalLink, X } from 'lucide-react';
import { VisualTemplatesConfig, MediaBankItem } from '../../types';
import {
  getConsolidatedMediaBank,
  getMediaUsages,
  addMediaToBank,
  removeMediaFromBank,
  applyMediaToTarget,
} from '../../utils/mediaBankUtils';

interface MediaBankManagerProps {
  visualTemplates: VisualTemplatesConfig;
  onUpdateVisualTemplates: (nextTemplates: VisualTemplatesConfig) => void;
  onOpenStudio?: (category: 'matches' | 'results' | 'birthdays') => void;
}

export const MediaBankManager: React.FC<MediaBankManagerProps> = ({
  visualTemplates,
  onUpdateVisualTemplates,
  onOpenStudio,
}) => {
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [usageBlockedModal, setUsageBlockedModal] = useState<{ media: MediaBankItem; usages: string[] } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<MediaBankItem | null>(null);
  const [targetModalMedia, setTargetModalMedia] = useState<MediaBankItem | null>(null);

  const consolidatedList = getConsolidatedMediaBank(visualTemplates);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Téléversement d'un nouveau média
  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    let nextTemplates = { ...visualTemplates };
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);

      try {
        let uploadedUrl = '';

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
              if (data.url) uploadedUrl = data.url;
            }
          } catch (e) {
            console.warn('PUT upload failed, fallback to POST:', e);
          }
        }

        if (!uploadedUrl) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) uploadedUrl = data.url;
          }
        }

        if (uploadedUrl) {
          nextTemplates = addMediaToBank(nextTemplates, {
            name: file.name,
            url: uploadedUrl,
            mediaType: isVideo ? 'video' : 'image',
            size: file.size,
          });
          successCount++;
        }
      } catch (err) {
        console.error('Erreur téléversement média:', err);
      }
    }

    setUploading(false);

    if (successCount > 0) {
      onUpdateVisualTemplates(nextTemplates);
      showFeedback(`${successCount} média(s) ajouté(s) avec succès à la Banque Médias !`, 'success');
    } else {
      showFeedback('Erreur lors du téléversement du média.', 'error');
    }
  };

  // Demande de suppression d'un média
  const handleDeleteMedia = (media: MediaBankItem) => {
    const usages = getMediaUsages(media.url, visualTemplates);

    if (usages.length > 0) {
      // Blocage strict de la suppression si encore utilisé
      setUsageBlockedModal({ media, usages });
      return;
    }

    // Média libre de toute utilisation : confirmation de suppression définitive
    setDeleteConfirmModal(media);
  };

  const handleConfirmPermanentDelete = () => {
    if (!deleteConfirmModal) return;
    const media = deleteConfirmModal;
    const res = removeMediaFromBank(visualTemplates, media.id || media.url);
    if (res.success) {
      onUpdateVisualTemplates(res.visualTemplates);
      showFeedback(`"${media.name}" a été définitivement supprimé de la Banque Médias.`, 'success');
    } else {
      showFeedback(res.error || 'Erreur lors de la suppression.', 'error');
    }
    setDeleteConfirmModal(null);
  };

  // Application du média à une cible
  const handleApplyToTarget = (target: any, label: string) => {
    if (!targetModalMedia) return;
    const updated = applyMediaToTarget(visualTemplates, targetModalMedia, target);
    onUpdateVisualTemplates(updated);
    const mediaName = targetModalMedia.name;
    setTargetModalMedia(null);
    showFeedback(`"${mediaName}" appliqué avec succès à : ${label}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-bebas tracking-wide">
              BANQUE MÉDIAS COMMUNE
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Centralisez et réutilisez l'ensemble des images et vidéos des Studios (Fond / Calque 1, Calque 3, Calque 4).
            Les fichiers sont dédupliqués et partagés entre Matchs, Résultats et Anniversaires sans copie physique.
          </p>
        </div>

        {/* Bouton Téléverser */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Importation...' : 'Importer un média'}</span>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm,video/*"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Message de notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold shadow-lg animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grille des Médias */}
      {consolidatedList.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl">
          <Film className="w-14 h-14 text-slate-600 mx-auto mb-3" />
          <h4 className="text-white font-black text-lg font-bebas tracking-wide">
            AUCUN MÉDIA DANS LA BANQUE
          </h4>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
            Importez des images ou vidéos ici, ou configurez vos calques dans le Studio Graphique pour qu'ils soient centralisés automatiquement.
          </p>
          <div className="mt-4">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Choisir un premier fichier</span>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm,video/*"
                className="hidden"
                onChange={(e) => handleUploadFiles(e.target.files)}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {consolidatedList.map((m) => {
            const usages = getMediaUsages(m.url, visualTemplates);
            const isVid = m.mediaType === 'video';
            const isUsed = usages.length > 0;

            return (
              <div
                key={m.id || m.url}
                className="bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-slate-700 shadow-xl overflow-hidden flex flex-col justify-between transition-all"
              >
                {/* Vignette */}
                <div className="aspect-video w-full bg-black/80 relative overflow-hidden flex items-center justify-center">
                  {isVid ? (
                    <video
                      src={m.url}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={m.url}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Badge Type (IMAGE ou VIDÉO) */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {isVid ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-600/95 text-white shadow-md flex items-center gap-1.5 border border-purple-400/30">
                        <Video className="w-3 h-3" />
                        <span>VIDÉO</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-sky-600/95 text-white shadow-md flex items-center gap-1.5 border border-sky-400/30">
                        <ImageIcon className="w-3 h-3" />
                        <span>IMAGE</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Corps / Nom & Utilisations */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    {/* Nom du média */}
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="text-sm font-bold text-white leading-snug break-all"
                        title={m.name}
                      >
                        {m.name}
                      </h4>
                    </div>

                    {/* Information d'utilisation */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      {isUsed ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Utilisé dans :</span>
                          </span>
                          <ul className="text-[11px] text-slate-300 font-medium space-y-0.5 pl-1">
                            {usages.map((u, idx) => (
                              <li key={idx} className="flex items-center gap-1 text-slate-200">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{u}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic block">
                          Non utilisé actuellement
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions : Utiliser / Supprimer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTargetModalMedia(m)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      title="Utiliser ce média dans un calque"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Utiliser</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(m)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isUsed
                          ? 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-rose-400 hover:border-rose-500/30'
                          : 'bg-rose-950/20 text-rose-400 border-rose-500/30 hover:bg-rose-900/40 hover:text-white'
                      }`}
                      title={
                        isUsed
                          ? "Ce média est encore utilisé. Cliquez pour voir où le retirer."
                          : 'Supprimer définitivement ce média'
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1 : BLOCAGE SUPPRESSION SI MÉDIA UTILISÉ */}
      {usageBlockedModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-black font-bebas tracking-wide text-amber-400">
                  CE MÉDIA EST ENCORE UTILISÉ
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  {usageBlockedModal.media.name}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-xs font-bold text-slate-300">
                Impossible de supprimer ce média car il est encore actif :
              </p>
              <div className="text-xs text-amber-300 font-bold">
                <span>Utilisé dans :</span>
                <ul className="mt-1.5 space-y-1 pl-1">
                  {usageBlockedModal.usages.map((u, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-white font-medium">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                Pour supprimer définitivement ce fichier, allez d'abord dans les calques concernés et cliquez sur <strong>[ Retirer du calque ]</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUsageBlockedModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setUsageBlockedModal(null)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : CONFIRMATION SUPPRESSION DÉFINITIVE SI MÉDIA INUTILISÉ */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-lg font-black font-bebas tracking-wide text-rose-400">
                  SUPPRIMER DÉFINITIVEMENT CE MÉDIA
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  {deleteConfirmModal.name}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300">
                Êtes-vous sûr de vouloir supprimer définitivement ce fichier de la Banque Médias ?
              </p>
              <p className="text-[11px] text-rose-400 font-semibold">
                ⚠️ Cette action est irréversible et supprimera le média de la bibliothèque.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 : APPLIQUER LE MÉDIA À UN CALQUE (BOUTON UTILISER) */}
      {targetModalMedia && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-black font-bebas tracking-wide text-white">
                    UTILISER CE MÉDIA DANS UN STUDIO
                  </h4>
                  <p className="text-xs text-slate-400 truncate max-w-xs font-mono">
                    {targetModalMedia.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTargetModalMedia(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Choisissez l'emplacement où appliquer directement ce média :
            </p>

            {/* Destinations possibles */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* MATCHS */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  Studio Matchs
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('matches-bg', 'Matchs — Fond')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-amber-600/30 hover:border-amber-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Fond (Calque 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('matches-layer3', 'Matchs — Calque 3')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600/30 hover:border-emerald-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Calque 3 (Élém. 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('matches-layer4', 'Matchs — Calque 4')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:border-purple-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Calque 4 (Élém. 2)
                  </button>
                </div>
              </div>

              {/* RÉSULTATS */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-black text-red-400 uppercase tracking-wider block">
                  Studio Résultats
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('results-bg', 'Résultats — Fond')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-red-600/30 hover:border-red-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Fond (Calque 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('results-layer3', 'Résultats — Calque 3')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600/30 hover:border-emerald-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Calque 3 (Élém. 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('results-layer4', 'Résultats — Calque 4')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:border-purple-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Calque 4 (Élém. 2)
                  </button>
                </div>
              </div>

              {/* ANNIVERSAIRES */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-black text-pink-400 uppercase tracking-wider block">
                  Studio Anniversaires
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('birthdays-bg', 'Anniversaires — Fond')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-pink-600/30 hover:border-pink-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Fond (Calque 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('birthdays-layer3', 'Anniversaires — Calque 3')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600/30 hover:border-emerald-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Calque 3 (Élém. 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyToTarget('birthdays-layer4', 'Anniversaires — Calque 4')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:border-purple-500/50 border border-slate-800 text-[11px] font-bold text-left transition-colors"
                  >
                    Calque 4 (Élém. 2)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setTargetModalMedia(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
