// CategoriesTab — onglet « categories » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { CheckCircle2, Camera, Shuffle } from 'lucide-react';

export interface CategoriesTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function CategoriesTab(props: CategoriesTabProps) {
  const {
    categories,
    clubSettings,
    handleDurationChange,
    handleToggleCategory,
    onUpdateClubSettings,
  } = props;

  return (
            <div className="space-y-6">
              {/* Option 1: Mélange Équilibré de la Boucle TV */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <Shuffle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>MÉLANGE ÉQUILIBRÉ DES CATÉGORIES (DIFFUSION ALTERNÉE)</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        Optimisé pour la TV
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Intercale intelligemment 1 match, 1 sponsor, 1 photo, 1 résultat, 1 événement... ainsi la boucle est dynamiquement variée et s'adapte automatiquement d'une semaine à l'autre selon le nombre d'éléments.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateClubSettings({
                      ...clubSettings,
                      balancedLoopMode: clubSettings.balancedLoopMode === false ? true : false,
                    })
                  }
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
                    clubSettings.balancedLoopMode !== false
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {clubSettings.balancedLoopMode !== false
                      ? 'Actif : Mélange Équilibré Alterné'
                      : 'Séquentiel (Catégorie par catégorie)'}
                  </span>
                </button>
              </div>

              {/* Option 2: Mode 100% Photos / Visuels Purs Option */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>MODE 100% PHOTOS & VISUELS PURS (SANS TEXTE SUPERPOSÉ)</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                        Image Plein Écran
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Masque tous les textes, titres et calques d'écriture sur les diaporamas photos pour n'afficher que les visuels bruts plein écran.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateClubSettings({
                      ...clubSettings,
                      hideTextOverlays: !clubSettings.hideTextOverlays,
                      purePhotoSlidesOnly: !clubSettings.hideTextOverlays,
                    })
                  }
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
                    clubSettings.hideTextOverlays
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {clubSettings.hideTextOverlays
                      ? 'Actif : 100% Photos Sans Texte'
                      : 'Afficher le texte sur les photos'}
                  </span>
                </button>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                    DURÉE D'AFFICHAGE DE CHAQUE CATÉGORIE DU CARROUSEL (3 À 10 SECONDES)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ajustez le temps de passage (de 3s à 10s) de chaque slide sur la télévision.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      cat.enabled
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-base font-black text-white font-bebas">{cat.label}</h4>
                        <p className="text-xs text-slate-400">{cat.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            cat.enabled ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cat.enabled ? 'Actif' : 'Désactivé'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        value={Math.min(10, Math.max(3, cat.durationSeconds))}
                        onChange={(e) => handleDurationChange(cat.id, parseInt(e.target.value, 10))}
                        className="flex-1 accent-orange-500 cursor-pointer"
                        disabled={!cat.enabled}
                      />
                      <span className="w-16 text-right font-mono font-bold text-sm text-orange-400">
                        {Math.min(10, Math.max(3, cat.durationSeconds))} sec
                      </span>
                    </div>
                  </div>
                ))}

                {/* Réglage spécifique : Durée photo Victoire / Défaite */}
                <div className="rounded-2xl p-4 border transition-all bg-slate-950 border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-base font-black text-white font-bebas">Durée photo Victoire / Défaite</h4>
                      <p className="text-xs text-slate-400">Temps d'affichage des photos de victoire ou défaite dans la boucle (les vidéos jouent jusqu'à la fin)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                        Photos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="3"
                      max="15"
                      step="1"
                      value={Math.min(15, Math.max(3, clubSettings.victoryPhotoDurationSeconds ?? 10))}
                      onChange={(e) =>
                        onUpdateClubSettings({
                          ...clubSettings,
                          victoryPhotoDurationSeconds: parseInt(e.target.value, 10),
                        })
                      }
                      className="flex-1 accent-orange-500 cursor-pointer"
                    />
                    <span className="w-16 text-right font-mono font-bold text-sm text-orange-400">
                      {Math.min(15, Math.max(3, clubSettings.victoryPhotoDurationSeconds ?? 10))} sec
                    </span>
                  </div>
                </div>
              </div>
            </div>  );
}