import React, { useState } from 'react';
import { X, Film, Image as ImageIcon, Video, Check, Search } from 'lucide-react';
import { VisualTemplatesConfig, MediaBankItem } from '../../types';
import { getConsolidatedMediaBank, getMediaUsages } from '../../utils/mediaBankUtils';

interface MediaBankSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaUrl: string, mediaType: 'image' | 'video', mediaName: string) => void;
  visualTemplates: VisualTemplatesConfig;
  filterType?: 'all' | 'image' | 'video';
  title?: string;
}

export const MediaBankSelectorModal: React.FC<MediaBankSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  visualTemplates,
  filterType = 'all',
  title = 'Choisir dans la Banque Médias',
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'video'>(filterType);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const consolidatedList = getConsolidatedMediaBank(visualTemplates);

  const filteredMedia = consolidatedList.filter((m) => {
    if (activeFilter === 'image' && m.mediaType !== 'image') return false;
    if (activeFilter === 'video' && m.mediaType !== 'video') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-bebas tracking-wide text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-sans font-bold">
                  {consolidatedList.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sélectionnez un média déjà importé pour le réutiliser sans copie physique
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de filtre & recherche */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Tous ({consolidatedList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('image')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'image'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Images ({consolidatedList.filter((m) => m.mediaType === 'image').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'video'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>Vidéos ({consolidatedList.filter((m) => m.mediaType === 'video').length})</span>
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un média..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Grille des Médias */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredMedia.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-3xl">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold text-sm">Aucun média trouvé</p>
              <p className="text-slate-500 text-xs mt-1">
                {searchQuery
                  ? 'Aucun résultat ne correspond à votre recherche.'
                  : 'La banque ne contient pas encore de médias pour ce filtre.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredMedia.map((m) => {
                const usages = getMediaUsages(m.url, visualTemplates);
                const isVid = m.mediaType === 'video';

                return (
                  <div
                    key={m.id || m.url}
                    onClick={() => {
                      onSelect(m.url, m.mediaType, m.name);
                      onClose();
                    }}
                    className="group relative bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/80 hover:shadow-xl hover:shadow-emerald-500/10 transition-all overflow-hidden flex flex-col cursor-pointer"
                  >
                    {/* Vignette / Aperçu */}
                    <div className="aspect-video w-full bg-black/60 relative overflow-hidden flex items-center justify-center">
                      {isVid ? (
                        <video
                          src={m.url}
                          preload="metadata"
                          muted
                          playsInline
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <img
                          src={m.url}
                          alt={m.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      )}

                      {/* Badge Type */}
                      <div className="absolute top-2 left-2 z-10">
                        {isVid ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600/90 text-white shadow flex items-center gap-1">
                            <Video className="w-2.5 h-2.5" />
                            <span>VIDÉO</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-600/90 text-white shadow flex items-center gap-1">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>IMAGE</span>
                          </span>
                        )}
                      </div>

                      {/* Overlay au survol */}
                      <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Choisir</span>
                        </span>
                      </div>
                    </div>

                    {/* Infos du média */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
                      <div className="min-w-0">
                        <h4
                          className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors"
                          title={m.name}
                        >
                          {m.name}
                        </h4>

                        {/* Utilisations */}
                        <div className="mt-1">
                          {usages.length > 0 ? (
                            <div className="text-[10px] text-emerald-400 font-semibold leading-tight space-y-0.5">
                              <span className="text-slate-400 block font-normal">Utilisé dans :</span>
                              {usages.slice(0, 2).map((u, idx) => (
                                <span key={idx} className="block truncate">
                                  • {u}
                                </span>
                              ))}
                              {usages.length > 2 && (
                                <span className="text-[9px] text-slate-400 italic block">
                                  +{usages.length - 2} autre(s)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              Non utilisé actuellement
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full mt-1 py-1 rounded-lg bg-slate-900 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white font-bold text-[11px] transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Sélectionner</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredMedia.length} média(s) affiché(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
