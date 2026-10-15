// FfbbTab — onglet « ffbb » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { Trophy, Calendar, RefreshCw, RotateCcw, Check, Share2, Smartphone } from 'lucide-react';
import { isTeamCategoryIgnored } from '../../../services/ffbbService';
import { MiniCalendarPicker, formatDateToReadableFrench } from '.././MiniCalendarPicker';

export interface FfbbTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function FfbbTab(props: FfbbTabProps) {
  const {
    label,
    clubSettings,
    onUpdateClubSettings,
    w,
    handleSyncFFBB,
    isSyncingFFBB,
    d,
    setFilterToCurrentWeekend,
    syncStartDate,
    syncEndDate,
    setSyncStartDate,
    setSyncEndDate,
    title,
    syncMessage,
    syncIsError,
    setActiveTab,
    onOpenVisualExporter,
    matches,
    ffbbTeams,
    handleTrackAllTeams,
    handleUntrackAllTeams,
    base,
    team,
    customName,
    handleToggleTrackTeam,
    name,
    handleUpdateTeamCustomName,
  } = props;

  return (
            <div className="space-y-6">
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
                <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                  SYNCHRONISATION OFFICIELLE FFBB
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Code Club Officiel FFBB :</label>
                    <input
                      type="text"
                      value={clubSettings.codeFFBB}
                      onChange={(e) => onUpdateClubSettings({ ...clubSettings, codeFFBB: e.target.value })}
                      placeholder="Ex: BFC0071042"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                    />
                  </div>
                  <button
                    onClick={handleSyncFFBB}
                    disabled={isSyncingFFBB}
                    className="self-end px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-lg"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                    <span>{isSyncingFFBB ? 'Synchronisation...' : 'Synchroniser les matchs'}</span>
                  </button>
                </div>

                {/* Petit Calendrier de Filtrage des Dates */}
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        <span>Filtre calendrier (Évite d'importer toute la saison) :</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Sélectionnez directement vos dates sur le petit calendrier ci-dessous sans rien taper.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={setFilterToCurrentWeekend}
                        className="px-2.5 py-1 rounded bg-orange-600/20 hover:bg-orange-600/35 text-orange-300 border border-orange-500/30 text-[10px] font-bold transition-all"
                      >
                        📅 Ce week-end
                      </button>
                      {(syncStartDate || syncEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSyncStartDate('');
                            setSyncEndDate('');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-all"
                        >
                          Effacer le filtre
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start pt-1">
                    <div className="shrink-0 flex justify-center w-full sm:w-auto">
                      <MiniCalendarPicker
                        startDate={syncStartDate}
                        endDate={syncEndDate}
                        onChangeRange={(start, end) => {
                          setSyncStartDate(start);
                          setSyncEndDate(end);
                        }}
                        title="Calendrier FFBB"
                      />
                    </div>
                    <div className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 w-full">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Dates sélectionnées :
                      </span>
                      <div className="text-sm font-bold text-orange-400">
                        {syncStartDate && syncEndDate ? (
                          <>Du {formatDateToReadableFrench(syncStartDate)} au {formatDateToReadableFrench(syncEndDate)}</>
                        ) : syncStartDate ? (
                          <>À partir du {formatDateToReadableFrench(syncStartDate)}</>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Tous les matchs de la saison FFBB</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Cliquez sur les cases du calendrier pour définir la période souhaitée, ou utilisez les raccourcis <strong>Ce week-end</strong> ou <strong>Week-end +1</strong> pour une sélection immédiate en 1 clic.
                      </p>
                    </div>
                  </div>
                </div>

                {syncMessage && (
                  <p className={`text-xs font-medium p-3 rounded-xl border ${
                    syncIsError
                      ? 'text-red-400 bg-red-950/40 border-red-500/30'
                      : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                  }`}>
                    {syncIsError ? '⚠ ' : '✓ '}{syncMessage}
                  </p>
                )}

                {/* Passerelle Réseaux Sociaux Direct Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Passerelle Réseaux Sociaux</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
                          Insta • TikTok • FB
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300">
                        Diffusez les matchs FFBB synchronisés sur vos réseaux sociaux au format story 9:16 ou post 1:1.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTab('social')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
                    >
                      Voir les légendes
                    </button>
                    {onOpenVisualExporter && (
                      <button
                        onClick={() => onOpenVisualExporter('matches')}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Créer le visuel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Étape 3 : Sélection des Équipes Suivies FFBB */}
              {(() => {
                const ignoredList = clubSettings.ignoredTeamCategories || [];
                const ignoredCount = ffbbTeams.filter((t) => isTeamCategoryIgnored(t.category, ignoredList)).length;
                const trackedCount = ffbbTeams.length - ignoredCount;

                return (
                  <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-5">
                    {/* En-tête et compteurs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                              SÉLECTION DES ÉQUIPES SUIVIES SUR LA TV
                            </h3>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                              {trackedCount} / {ffbbTeams.length} actives
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Cochez les équipes à diffuser sur votre écran TV. Décochez celles qui ne jouent pas ou ne doivent pas apparaître (ex: U18F).
                          </p>
                        </div>
                      </div>

                      {/* Boutons d'action globale */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleTrackAllTeams}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                        >
                          Tout cocher
                        </button>
                        <button
                          type="button"
                          onClick={handleUntrackAllTeams}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                        >
                          Tout décocher
                        </button>
                      </div>
                    </div>

                    {/* Explication du comportement */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
                      <span className="text-base leading-none">💡</span>
                      <div>
                        <strong className="text-slate-200">Filtrage persistant :</strong> Chaque synchronisation future ignore automatiquement les équipes décochées. Leurs matchs et résultats ne seront ni enregistrés, ni affichés sur le diaporama.
                      </div>
                    </div>

                    {/* Grille des équipes interactives avec personnalisation des noms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {ffbbTeams.map((team, idx) => {
                        const isIgnored = isTeamCategoryIgnored(team.category, ignoredList);
                        const isTracked = !isIgnored;
                        const currentCustomName = clubSettings.customTeamNames?.[team.id] ||
                          clubSettings.customTeamNames?.[team.category] ||
                          team.customName || '';

                        return (
                          <div
                            key={team.id || idx}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group ${
                              isTracked
                                ? 'bg-slate-950 border-slate-700/80 hover:border-orange-500/60 shadow-md'
                                : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-90'
                            }`}
                          >
                            <div>
                              {/* Ligne 1 : Case à cocher + Nom et badges */}
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTrackTeam(team.category, currentCustomName || team.name)}
                                  className="pt-0.5 shrink-0 cursor-pointer"
                                  title={isTracked ? "Cliquer pour ignorer l'équipe" : "Cliquer pour diffuser l'équipe"}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                                      isTracked
                                        ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/40'
                                        : 'border border-slate-600 bg-slate-900 hover:border-slate-500'
                                    }`}
                                  >
                                    {isTracked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                </button>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-xs font-bold ${isTracked ? 'text-white' : 'text-slate-400 line-through'}`}>
                                      {currentCustomName ? (
                                        <span className="flex items-center gap-1">
                                          <span className="text-orange-400 font-extrabold">{currentCustomName}</span>
                                          <span className="text-[10px] text-slate-400 font-normal">({team.name})</span>
                                        </span>
                                      ) : (
                                        team.name
                                      )}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                        team.gender === 'M'
                                          ? 'bg-sky-500/20 text-sky-300'
                                          : team.gender === 'F'
                                          ? 'bg-pink-500/20 text-pink-300'
                                          : 'bg-amber-500/20 text-amber-300'
                                      }`}
                                    >
                                      {team.gender === 'F' ? 'Féminine' : team.gender === 'M' ? 'Masculine' : 'Mixte'}
                                    </span>
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                      {team.category}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                    {team.competition}
                                    {team.poule && (
                                      <span className="text-orange-400/90 font-medium"> • {team.poule}</span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Champ de personnalisation du nom pour l'application, carrousel et Telegram */}
                              <div className="mt-3 pt-3 border-t border-slate-800/80">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <span>Nom affiché dans l'application :</span>
                                  </label>
                                  {currentCustomName && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      Personnalisé
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={currentCustomName}
                                    placeholder={team.name}
                                    onChange={(e) => handleUpdateTeamCustomName(team.id, team.category, e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 font-semibold transition-all focus:outline-none"
                                  />
                                  {currentCustomName && (
                                    <button
                                      type="button"
                                      title="Rétablir le nom officiel FFBB"
                                      onClick={() => handleUpdateTeamCustomName(team.id, team.category, '')}
                                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors shrink-0 text-xs"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                                  <span className="truncate">
                                    ID FFBB : <code className="text-slate-400 font-mono">{team.id}</code>
                                  </span>
                                  {currentCustomName ? (
                                    <span className="text-emerald-400 font-medium shrink-0">✓ TV & Telegram</span>
                                  ) : (
                                    <span className="text-slate-500 shrink-0">Nom FFBB actif</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Statut de diffusion et compteur de matchs */}
                            <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between">
                              <span
                                className={`text-[10px] font-bold ${
                                  isTracked ? 'text-emerald-400' : 'text-slate-500'
                                }`}
                              >
                                {isTracked ? '✓ Diffusée sur TV' : '✕ Ignorée (exclue)'}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {team.matchesCount} matchs
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>  );
}