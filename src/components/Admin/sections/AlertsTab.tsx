// AlertsTab — onglet « alerts » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { Trophy, Trash2, Clock, Frown } from 'lucide-react';

export interface AlertsTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function AlertsTab(props: AlertsTabProps) {
  const {
    activeAlerts,
    w,
    d,
    now,
    isWin,
    team,
    ourScore,
    onRemoveAlert,
    title,
  } = props;

  return (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                    VISUELS VICTOIRE / DÉFAITE EN COURS DANS LA BOUCLE TV
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ces affiches tournent actuellement dans le carrousel plein écran. Chaque alerte reste exactement 1 heure à partir de sa réception.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold">
                  {activeAlerts.length} alerte(s) active(s)
                </span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="text-center py-12 px-6 bg-slate-950 rounded-3xl border border-slate-800 max-w-md mx-auto">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <h4 className="text-xl font-black text-white font-bebas">Aucune alerte active dans la boucle</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Envoyez un message sur Telegram ou déclenchez une simulation depuis l'onglet "Visuels Équipes" pour en ajouter une.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAlerts.map((alert) => {
                    const diffMs = alert.expiresAt - Date.now();
                    const minutesLeft = Math.max(0, Math.ceil(diffMs / 60000));

                    return (
                      <div
                        key={alert.id}
                        className={`rounded-3xl p-5 border flex items-center gap-5 justify-between ${
                          alert.isWin
                            ? 'bg-emerald-950/30 border-emerald-500/40'
                            : 'bg-rose-950/30 border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                              alert.isWin ? 'bg-emerald-600 shadow-lg shadow-emerald-600/30' : 'bg-rose-600'
                            }`}
                          >
                            {alert.isWin ? <Trophy className="w-7 h-7" /> : <Frown className="w-7 h-7" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-black uppercase tracking-wider ${
                                  alert.isWin ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {alert.isWin ? 'VICTOIRE' : 'DÉFAITE'}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-xs text-slate-400">
                                {alert.triggeredBy === 'telegram' ? 'Via Telegram' : 'Via FFBB / Manuel'}
                              </span>
                            </div>
                            <h4 className="text-xl font-black text-white font-bebas">{alert.team}</h4>
                            {alert.ourScore !== undefined && alert.opponentScore !== undefined && (
                              <p className="text-sm font-bold text-white font-mono">
                                Score : {alert.ourScore} - {alert.opponentScore}
                              </p>
                            )}
                            <p className="text-xs text-orange-400 mt-1 flex items-center gap-1 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              Dans la boucle encore {minutesLeft} min
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveAlert(alert.id)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
                          title="Retirer de la boucle TV"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>  );
}