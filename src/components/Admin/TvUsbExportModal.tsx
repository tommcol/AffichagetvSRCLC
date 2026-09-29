import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Tv,
  Download,
  Play,
  Film,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Info,
  Sparkles,
  Sliders,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  CarouselSlide,
  ClubSettings,
  MatchItem,
  SponsorItem,
  ClubLogoItem,
  ClubPhotoItem,
  BirthdayItem,
  ClubEventItem,
  TeamVisualItem,
  VisualTemplatesConfig,
} from '../../types';
import {
  calculateCarouselSchedule,
  exportCarouselToMp4,
  formatDurationToFrench,
  ExportProgress,
  ExportResult,
} from '../../utils/tvMp4Exporter';

interface TvUsbExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: CarouselSlide[];
  clubSettings: ClubSettings;
  matches: MatchItem[];
  results: MatchItem[];
  sponsors: SponsorItem[];
  logos: ClubLogoItem[];
  photos: ClubPhotoItem[];
  birthdays: BirthdayItem[];
  events: ClubEventItem[];
  teamVisuals: TeamVisualItem[];
  visualTemplates: VisualTemplatesConfig;
}

export const TvUsbExportModal: React.FC<TvUsbExportModalProps> = ({
  isOpen,
  onClose,
  playlist,
  clubSettings,
  matches,
  results,
  sponsors,
  logos,
  photos,
  birthdays,
  events,
  teamVisuals,
  visualTemplates,
}) => {
  const [fps, setFps] = useState<number>(30);
  const [bitrate, setBitrate] = useState<number>(6_000_000);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const schedule = useMemo(() => {
    return calculateCarouselSchedule(playlist, clubSettings, visualTemplates);
  }, [playlist, clubSettings, visualTemplates]);

  React.useEffect(() => {
    if (!isOpen) {
      setExportResult(null);
      setErrorMessage(null);
      setProgress(null);
      setIsExporting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await exportCarouselToMp4(
        playlist,
        clubSettings,
        matches,
        results,
        sponsors,
        logos,
        photos,
        birthdays,
        events,
        teamVisuals,
        visualTemplates,
        {
          fps,
          bitrate,
          signal: controller.signal,
          onProgress: (prog) => {
            setProgress(prog);
          },
        }
      );

      setExportResult(result);
      setIsExporting(false);

      // Déclenchement automatique du téléchargement
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      setIsExporting(false);
      if (err?.message !== 'Exportation annulée par l’utilisateur.' && err?.message !== 'Exportation annulée.') {
        setErrorMessage(err?.message || "Une erreur inattendue est survenue lors de l'exportation MP4.");
      }
    }
  };

  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsExporting(false);
    setProgress(null);
  };

  const handleCloseModal = () => {
    if (isExporting) {
      handleCancelExport();
    }
    setExportResult(null);
    setErrorMessage(null);
    setProgress(null);
    onClose();
  };

  const handleDownloadAgain = () => {
    if (!exportResult) return;
    const url = URL.createObjectURL(exportResult.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white font-bebas tracking-wide">
                  TÉLÉCHARGER LE CARROUSEL POUR CLÉ USB
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono border border-emerald-500/30">
                  MP4 1080p
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Générez une vidéo MP4 complète 1920 × 1080 prête à être copiée sur clé USB et lue en boucle sur votre téléviseur.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={isExporting ? handleCancelExport : handleCloseModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Durée totale</span>
              </div>
              <div className="text-xl font-black text-white font-mono">
                {formatDurationToFrench(schedule.totalDurationSeconds)}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {schedule.totalDurationSeconds} secondes
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Diapositives</span>
              </div>
              <div className="text-xl font-black text-white">
                {schedule.totalSlides}
              </div>
              <div className="text-[10px] text-slate-500">
                dans la boucle TV
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                <Tv className="w-4 h-4 text-sky-400" />
                <span>Résolution</span>
              </div>
              <div className="text-xl font-black text-white font-mono">
                1920 × 1080
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Format 16:9 Full HD
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span>Compatibilité</span>
              </div>
              <div className="text-xl font-black text-white">
                Smart TV
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                H.264 / USB universel
              </div>
            </div>
          </div>

          {/* Export in Progress State */}
          {isExporting && progress && (
            <div className="bg-slate-950/90 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {progress.status === 'validating'
                        ? 'Vérification des médias...'
                        : progress.status === 'preparing'
                        ? 'Préparation du flux MP4...'
                        : progress.status === 'finalizing'
                        ? 'Finalisation du fichier...'
                        : `Génération en cours : ${progress.currentSlideTitle}`}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {progress.statusMessage}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {progress.percent}%
                  </div>
                  {progress.estimatedRemainingSeconds !== undefined && progress.estimatedRemainingSeconds > 0 && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      ~{progress.estimatedRemainingSeconds}s restantes
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/60 p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-150 ease-out shadow-lg shadow-emerald-500/30"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>
                  Diapositive {progress.currentSlideIndex} sur {progress.totalSlides}
                </span>
                <span className="font-mono">
                  {progress.currentFrame} / {progress.totalFrames} images (frames)
                </span>
              </div>
            </div>
          )}

          {/* Success State */}
          {exportResult && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Vidéo carrousel TV générée avec succès !
                  </h3>
                  <p className="text-xs text-slate-300">
                    Le fichier a été téléchargé sur votre ordinateur. Vous pouvez le transférer sur une clé USB et le brancher sur votre TV.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-emerald-400" />
                    <span>{exportResult.filename}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Taille : <span className="text-white font-mono">{exportResult.fileSizeMb} Mo</span> • Durée : <span className="text-white font-mono">{formatDurationToFrench(exportResult.durationSeconds)}</span> ({exportResult.totalFrames} frames)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadAgain}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Télécharger à nouveau</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartExport}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Générer une nouvelle vidéo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-950/50 border border-red-500/50 rounded-2xl p-4 flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="font-bold text-white">Erreur lors de l'exportation</div>
                <p className="text-red-300 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Options de rendu */}
          {!isExporting && !exportResult && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                <span>Paramètres d'export vidéo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* FPS Selection */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    Fluidité (Images par seconde) :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFps(30)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        fps === 30
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>30 FPS</span>
                      <span className="text-[10px] opacity-80">(Standard TV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFps(25)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        fps === 25
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>25 FPS</span>
                      <span className="text-[10px] opacity-80">(PAL / Europe)</span>
                    </button>
                  </div>
                </div>

                {/* Bitrate Selection */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                    Qualité d'encodage :
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBitrate(6_000_000)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        bitrate === 6_000_000
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>Standard</span>
                      <span className="text-[10px] opacity-80">(6 Mbps)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBitrate(10_000_000)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        bitrate === 10_000_000
                          ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <span>Haute Qualité</span>
                      <span className="text-[10px] opacity-80">(10 Mbps)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Ordered Playlist Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-emerald-400" />
                <span>Ordre et durées des diapositives incluses ({schedule.totalSlides})</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Total : {formatDurationToFrench(schedule.totalDurationSeconds)}
              </span>
            </div>

            <div className="bg-slate-950/90 rounded-2xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden max-h-64 overflow-y-auto">
              {schedule.items.map((item) => (
                <div
                  key={`sched-slide-${item.index}-${item.slide.id}`}
                  className="px-4 py-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                      {item.index}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-normal border border-slate-700">
                          {item.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        {item.mediaTypes.background === 'video' && (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            🎥 Fond vidéo
                          </span>
                        )}
                        {item.mediaTypes.mainMedia === 'video' && (
                          <span className="text-sky-400 font-semibold flex items-center gap-1">
                            🎥 Vidéo média
                          </span>
                        )}
                        {item.mediaTypes.layer3 === 'video' && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            🎥 Calque 3 vidéo
                          </span>
                        )}
                        {item.mediaTypes.layer4 === 'video' && (
                          <span className="text-purple-400 font-semibold flex items-center gap-1">
                            🎥 Calque 4 vidéo
                          </span>
                        )}
                        {!item.hasVideo && (
                          <span className="text-slate-500">
                            🖼️ Visuel fixe
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-orange-400 font-mono font-bold text-xs border border-orange-500/20">
                      {item.durationSeconds}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guide Clé USB */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-200">Conseil d'utilisation sur Télévision :</span>
              <p className="leading-relaxed">
                Copiez le fichier MP4 sur une clé USB (formatée en FAT32 ou NTFS), branchez-la sur le port USB de votre TV, puis activez la fonction <strong>« Lecture en boucle » (Repeat All)</strong> dans le lecteur multimédia de la télévision pour une diffusion continue.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={isExporting ? handleCancelExport : handleCloseModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors border border-slate-800 cursor-pointer"
          >
            {isExporting ? 'Annuler l’export' : 'Fermer'}
          </button>

          {!exportResult ? (
            <button
              type="button"
              onClick={handleStartExport}
              disabled={isExporting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isExporting
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:scale-105'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Exportation en cours...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Générer et Télécharger le MP4 (1080p)</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadAgain}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Télécharger à nouveau</span>
              </button>
              <button
                type="button"
                onClick={handleStartExport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Générer une nouvelle vidéo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
