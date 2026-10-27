// FullykioskTab — onglet « fullykiosk » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { Tv, CheckCircle2 } from 'lucide-react';

export interface FullykioskTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function FullykioskTab(props: FullykioskTabProps) {
  return (
            <div className="space-y-6">
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                      DIFFUSION TV AVEC FULLY KIOSK BROWSER
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comment faire tourner le diaporama en boucle autonome sur votre écran de télévision
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold text-xs uppercase flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 1. URL de diffusion TV directe
                    </span>
                    <p className="text-xs text-slate-300">
                      Renseignez cette URL dans le champ <strong>Start URL</strong> de Fully Kiosk Browser :
                    </p>
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-700">
                      <code className="text-xs text-orange-400 font-mono flex-1 break-all select-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}?mode=tv&kiosk=1` : '?mode=tv&kiosk=1'}
                      </code>
                      <button
                        onClick={() => {
                          if (typeof navigator !== 'undefined') {
                            navigator.clipboard.writeText(`${window.location.origin}?mode=tv&kiosk=1`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold shrink-0"
                      >
                        Copier
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Avec les paramètres <code>?mode=tv&kiosk=1</code>, la TV démarre directement sur le diaporama et masque les commandes d'accès à la configuration. Le bouton « Lancer la diffusion » dans l'application reste inchangé.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold text-xs uppercase flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 2. Raccourcis et télécommande
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      <li><strong>Touche C ou A</strong> : bascule entre le Diaporama TV et la Console de Configuration.</li>
                      <li><strong>Touche F</strong> : Activer / Désactiver le plein écran.</li>
                      <li><strong>Flèche Droite / Gauche</strong> : Passer à la slide suivante ou précédente.</li>
                      <li><strong>Barre Espace</strong> : Mettre en pause ou reprendre le diaporama.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
                  <strong>💡 Conseil Fully Kiosk :</strong> Activez les options <em>Fullscreen Mode</em>, <em>Keep Screen On</em> (écran toujours allumé) et <em>Autostart on Boot</em> (démarrage automatique à l'allumage de la TV).
                </div>
              </div>
            </div>  );
}