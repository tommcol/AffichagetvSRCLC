import { isInDisplayPeriod } from '../../../utils/displayPeriod';
// MatchesTab — onglet « matches » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { Trophy, Calendar, Tv, Trash2, Plus, RefreshCw, CheckCircle2, XCircle, AlertCircle, Layers, Check, Instagram, Facebook, Pencil, Search } from 'lucide-react';
import { MatchItem, MatchStatus } from '../../../types';
import { isMatchLive } from '../../../utils/matchStatus';
import { MiniCalendarPicker, SingleDatePicker, formatDateToReadableFrench } from '.././MiniCalendarPicker';
import { StudioGraphiqueWorkbench } from '.././StudioGraphiqueWorkbench';
import { formatDateToEuropean } from '../adminPanelConstants';

export interface MatchesTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function MatchesTab(props: MatchesTabProps) {
    const {
    birthdays,
    clubSettings,
    editingMatch,
    handleAddMatchManual,
    handleQuickMatchOutcome,
    handleSelectOnlyFilteredMatchesForTV,
    handleSyncFFBB,
    isSyncingFFBB,
    logos,
    matches,
    matchesFilterMode,
    matchesSubTab,
    newMatchCategory,
    newMatchDate,
    newMatchOpponent,
    newMatchTime,
    onUpdateMatches,
    onUpdateVisualTemplates,
    quickAwayScore,
    quickHomeScore,
    quickScoreMatchId,
    results,
    setEditingMatch,
    setFilterToCurrentWeekend,
    setMatchesFilterMode,
    setMatchesSubTab,
    setNewMatchCategory,
    setNewMatchDate,
    setNewMatchIsHome,
    setNewMatchOpponent,
    setNewMatchTime,
    setQuickAwayScore,
    setQuickHomeScore,
    setQuickScoreMatchId,
    setShowAddManualMatch,
    setShowCalendarInMatches,
    setSyncEndDate,
    setSyncStartDate,
    showAddManualMatch,
    showCalendarInMatches,
    syncEndDate,
    syncIsError,
    syncMessage,
    syncStartDate,
    visualTemplates,
    newMatchIsHome,
  } = props;

  const periodItems = matches.filter((item: any) => isInDisplayPeriod(item, clubSettings, 'matches'));
  const visibleMatches = matchesFilterMode === 'all' ? matches : periodItems;
  const periodSelected = periodItems.filter((item: any) => item.selectedForWeekend !== false).length;
  return (
            <div className="space-y-6">
              {/* Barre de sous-onglets : Matchs vs Studio Calques */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMatchesSubTab('list')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      matchesSubTab === 'list'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 ring-1 ring-orange-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span>Matchs & Calendrier ({periodItems.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchesSubTab('calques')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      matchesSubTab === 'calques'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>🎨 Design & Studio Calques Matchs</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 hidden sm:inline-block pr-2 font-medium">
                  {matchesSubTab === 'list' ? 'Saisie & Import FFBB des rencontres' : 'Fond, éléments libres & visuels 16:9 de cette diapositive'}
                </span>
              </div>

              {matchesSubTab === 'calques' ? (
                <StudioGraphiqueWorkbench
                  visualTemplates={visualTemplates}
                  onUpdateVisualTemplates={onUpdateVisualTemplates}
                  matches={matches}
                  results={results}
                  birthdays={birthdays}
                  clubSettings={clubSettings}
                  defaultCategory="matches"
                  hideCategorySelector={true}
                  onNavigateToCategoryTab={() => setMatchesSubTab('list')}
                />
              ) : (
                <>
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>PROGRAMME DES MATCHS DU WEEK-END ({periodItems.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ces rencontres sont affichées dans la boucle TV et exportables sur Instagram/TikTok/Facebook.
                    </p>
                  </div>
                </div>

                {/* Widget de Filtrage Instantané par Calendrier & Synchronisation FFBB */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mt-2 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                        Filtrage instantané par date (En mémoire • Sans recharger FFBB)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowCalendarInMatches(!showCalendarInMatches)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Calendar className="w-3 h-3 text-orange-400" />
                        <span>{showCalendarInMatches ? 'Masquer le calendrier' : 'Afficher le calendrier'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={setFilterToCurrentWeekend}
                        className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/35 text-orange-300 border border-orange-500/30 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        🔥 Ce week-end
                      </button>
                      {(syncStartDate || syncEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setMatchesFilterMode('all');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium transition-all cursor-pointer"
                        >
                          Voir toute la saison
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calendrier visuel interactif : filtrage 100% instantané en mémoire */}
                  {showCalendarInMatches ? (
                    <div className="flex flex-col md:flex-row items-stretch gap-4 pt-1">
                      <div className="shrink-0 flex justify-center">
                        <MiniCalendarPicker
                            emptyRangeLabel="Diffusion automatique : week-end courant ; historique conservé"
                          startDate={syncStartDate}
                          endDate={syncEndDate}
                          onChangeRange={(start, end) => {
                            setSyncStartDate(start);
                            setSyncEndDate(end);
                            if (start || end) {
                              setMatchesFilterMode('range');
                            }
                          }}
                          title="Sélectionner les dates à afficher"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                              {syncStartDate || syncEndDate ? 'Période consultée :' : 'Historique consultable :'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                              {
                                (syncStartDate || syncEndDate
                                  ? matches.filter((m) => (!syncStartDate || m.date >= syncStartDate) && (!syncEndDate || m.date <= syncEndDate))
                                  : matches
                                ).length
                              } match(s) trouvé(s)
                            </span>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            {syncStartDate && syncEndDate ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-orange-400 block">
                                  Du {formatDateToReadableFrench(syncStartDate)}
                                </span>
                                <span className="text-xs font-bold text-orange-400 block">
                                  Au {formatDateToReadableFrench(syncEndDate)}
                                </span>
                              </div>
                            ) : syncStartDate ? (
                              <span className="text-xs font-bold text-orange-400">
                                À partir du {formatDateToReadableFrench(syncStartDate)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Diffusion automatique : week-end courant. Les matchs des autres semaines restent dans l’historique.
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            💡 <strong>Cliquez simplement sur une date du calendrier</strong> : le filtre s'applique instantanément sur la base sans aucun chargement réseau.
                          </p>
                        </div>

                        {/* Actions directes sur la sélection filtrée */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/80">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">


                            <button
                              type="button"
                              onClick={handleSyncFFBB}
                              disabled={isSyncingFFBB}
                              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                              title="Utile si une nouvelle phase (Phase 2, Phase 3 jeunes) a débuté ou si des horaires ont été modifiés sur la FFBB"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                              <span>Actualiser depuis FFBB</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Vue compacte si le calendrier est replié */
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        <span>
                          {syncStartDate && syncEndDate ? (
                            <>Période filtrée : <strong>{formatDateToReadableFrench(syncStartDate)}</strong> au <strong>{formatDateToReadableFrench(syncEndDate)}</strong></>
                          ) : (
                            <span className="text-slate-400 italic">Diffusion : week-end courant · historique : {matches.length} matchs</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">


                        <button
                          type="button"
                          onClick={() => setShowCalendarInMatches(true)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                        >
                          Ouvrir le calendrier
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncFFBB}
                          disabled={isSyncingFFBB}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          title="Actualiser la base avec la FFBB (utile pour les nouvelles phases)"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                          <span>Actualiser FFBB</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">

                  </div>

                  {syncMessage && (
                    <p className={`text-[11px] font-medium p-2.5 rounded-xl border ${
                      syncIsError
                        ? 'text-red-400 bg-red-950/40 border-red-500/20'
                        : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20'
                    }`}>
                      {syncIsError ? '⚠ ' : '✓ '}{syncMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Barre d'action et sélection des matchs pour le week-end */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase font-bebas tracking-wide">
                        SÉLECTION DES MATCHS DU WEEK-END
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono">
                        {periodItems.length} sur la période · {periodSelected} pour la TV · {matches.length} enregistrés
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cochez ou décochez les matchs à diffuser sur l'écran TV et les réseaux sociaux ce week-end.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">


                  <button
                    type="button"
                    onClick={() => setShowAddManualMatch(!showAddManualMatch)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un match</span>
                  </button>
                </div>
              </div>

              {/* Formulaire manuel d'ajout de match avec Sélecteur de date Calendrier */}
              {showAddManualMatch && (
                <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-400" />
                      <span>AJOUTER UNE RENCONTRE MANUELLE</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddManualMatch(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Catégorie :</label>
                      <input
                        type="text"
                        placeholder="Ex: Seniors Garçons 1"
                        value={newMatchCategory}
                        onChange={(e) => setNewMatchCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Adversaire :</label>
                      <input
                        type="text"
                        placeholder="Ex: Basket Club Mâcon"
                        value={newMatchOpponent}
                        onChange={(e) => setNewMatchOpponent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Date du match :</label>
                      <SingleDatePicker
                        value={newMatchDate}
                        onChange={(french, iso) => setNewMatchDate(french || iso)}
                        placeholder="Choisir la date..."
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Heure :</label>
                      <input
                        type="time"
                        value={newMatchTime}
                        onChange={(e) => setNewMatchTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Lieu :</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewMatchIsHome(true)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            newMatchIsHome
                              ? 'bg-orange-600 text-white shadow-md'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          Domicile
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewMatchIsHome(false)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            !newMatchIsHome
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          Extérieur
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddMatchManual();
                        setShowAddManualMatch(false);
                      }}
                      disabled={!newMatchOpponent.trim()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer la rencontre</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Barre d'action & Filtre d'affichage des matchs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2 font-bold text-slate-300">
                  <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Afficher dans la liste :</span>
                  <button
                    type="button"
                    onClick={() => setMatchesFilterMode('all')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      matchesFilterMode === 'all'
                        ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Toute la saison ({matches.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchesFilterMode('range')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      matchesFilterMode === 'range'
                        ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Période du calendrier ({
                      periodItems.length
                    })
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">

                </div>
              </div>

              {/* Liste des matchs */}
              {visibleMatches.length === 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                  <Calendar className="w-7 h-7 text-slate-500 mx-auto opacity-60" />
                  <p className="text-xs font-bold text-slate-300">
                    {matches.length === 0
                      ? 'Aucune rencontre dans la base de données.'
                      : `Aucune rencontre trouvée pour la période sélectionnée (${formatDateToReadableFrench(syncStartDate)} au ${formatDateToReadableFrench(syncEndDate)}).`}
                  </p>
                  {matches.length > 0 && (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMatchesFilterMode('all');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        Afficher toute la saison ({matches.length} matchs)
                      </button>
                      <button
                        type="button"
                        onClick={setFilterToCurrentWeekend}
                        className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Voir ce week-end
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleMatches
                  .map((m) => {
                  const isEditing = editingMatch?.id === m.id;
                  const isSelected = m.selectedForWeekend !== false;
                  const isLive = isMatchLive(m);
                  const isPastOrFinished =
                    m.status === 'finished' || (m.date && m.date < new Date().toISOString().slice(0, 10));
                  const isNeedsResult =
                    isPastOrFinished && m.homeScore === undefined && m.awayScore === undefined && !m.result;

                  if (isEditing && editingMatch) {
                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-slate-900 border-2 border-orange-500/60 shadow-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-orange-400 font-mono">
                            MODIFIER LA RENCONTRE
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {m.teamHome} vs {m.teamAway}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Date :</label>
                            <SingleDatePicker
                              value={editingMatch.date}
                              onChange={(french, iso) => setEditingMatch({ ...editingMatch, date: french || iso })}
                              placeholder="Choisir la date..."
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Heure :</label>
                            <input
                              type="text"
                              value={editingMatch.time || ''}
                              onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })}
                              placeholder="ex: 14:30 ou Horaire à fixer"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Catégorie :</label>
                            <input
                              type="text"
                              value={editingMatch.category}
                              onChange={(e) => setEditingMatch({ ...editingMatch, category: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                              placeholder="ex: U18 F1, U18 M1"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Gymnase / Salle :</label>
                            <input
                              type="text"
                              value={editingMatch.gymnasium || ''}
                              onChange={(e) => setEditingMatch({ ...editingMatch, gymnasium: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                              placeholder="ex: Gymnase municipal"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Statut du match :</label>
                            <select
                              value={editingMatch.status || 'upcoming'}
                              onChange={(e) => setEditingMatch({ ...editingMatch, status: e.target.value as MatchStatus })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-bold"
                            >
                              <option value="upcoming">À venir (Passe en cours à l'heure du match)</option>
                              <option value="live">🔴 En cours (Direct)</option>
                              <option value="finished">✅ Terminé</option>
                            </select>
                          </div>
                          {(editingMatch.status === 'live' || editingMatch.status === 'finished') && (
                            <div className="col-span-2 grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                              <div>
                                <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Score Domicile :</label>
                                <input
                                  type="number"
                                  value={editingMatch.homeScore ?? ''}
                                  onChange={(e) => setEditingMatch({ ...editingMatch, homeScore: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                                  placeholder="Score Domicile"
                                />
                              </div>
                              <div>
                                <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Score Extérieur :</label>
                                <input
                                  type="number"
                                  value={editingMatch.awayScore ?? ''}
                                  onChange={(e) => setEditingMatch({ ...editingMatch, awayScore: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                                  placeholder="Score Extérieur"
                                />
                              </div>
                            </div>
                          )}
                          <div className="col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                              <input
                                type="checkbox"
                                checked={editingMatch.selectedForWeekend !== false}
                                onChange={(e) => setEditingMatch({ ...editingMatch, selectedForWeekend: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                              />
                              <span>Diffuser cette rencontre sur l'écran TV ce week-end</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                          <button
                            onClick={() => setEditingMatch(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => {
                              const orig = matches.find((item) => item.id === editingMatch.id);
                              const updatedMatchItem: MatchItem = {
                                ...editingMatch,
                                isDateManual: orig ? (orig.isDateManual || editingMatch.date !== orig.date) : true,
                                isTimeManual: orig ? (orig.isTimeManual || editingMatch.time !== orig.time) : true,
                                isGymnasiumManual: orig ? (orig.isGymnasiumManual || editingMatch.gymnasium !== orig.gymnasium) : true,
                                isScoreManual: orig ? (orig.isScoreManual || editingMatch.homeScore !== orig.homeScore || editingMatch.awayScore !== orig.awayScore || editingMatch.status !== orig.status || editingMatch.result !== orig.result) : true,
                              };
                              onUpdateMatches(matches.map((item) => (item.id === editingMatch.id ? updatedMatchItem : item)));
                              setEditingMatch(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Enregistrer</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border flex flex-col gap-3 transition-all ${
                        isLive
                          ? 'bg-red-950/20 border-red-500/50 shadow-md shadow-red-950/20'
                          : isNeedsResult
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                          : isSelected
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        {/* Checkbox pour choisir d'afficher ou non le match ce week-end */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = matches.map((item) =>
                              item.id === m.id ? { ...item, selectedForWeekend: !isSelected } : item
                            );
                            onUpdateMatches(updated);
                          }}
                          className={`shrink-0 p-2 sm:px-3 sm:py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10'
                              : 'bg-slate-900/90 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                          }`}
                          title={
                            isSelected
                              ? isInDisplayPeriod(m, clubSettings, 'matches') ? 'Sélectionné sur la période TV (cliquer pour masquer)' : 'Sélection conservée dans l’historique, hors de la période TV'
                              : 'Match masqué de la TV (cliquer pour cocher et afficher)'
                          }
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="hidden sm:inline font-mono text-[11px]">
                            {!isSelected ? 'Non sélectionné' : isInDisplayPeriod(m, clubSettings, 'matches') ? 'Sélection TV' : 'Hors période TV'}
                          </span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs font-bold mb-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-[11px] font-bold">
                              {m.category}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300 font-mono">{formatDateToEuropean(m.date)} - {m.time}</span>
                            {isLive && (
                              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                EN COURS
                              </span>
                            )}
                            {isNeedsResult && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold animate-pulse flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                                En attente du résultat
                              </span>
                            )}
                            {m.competition && (
                              <>
                                <span className="text-slate-600 hidden sm:inline">•</span>
                                <span className="text-[10px] text-slate-500 truncate max-w-[170px] hidden sm:inline" title={m.competition}>
                                  {m.competition}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-sm font-bold text-white truncate">
                            {m.teamHome} vs {m.teamAway}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            📍 {m.gymnasium || clubSettings.gymnasiumDefault}
                            {m.poule && <span className="text-orange-400/80 ml-2 font-medium">({m.poule})</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingMatch({ ...m })}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 transition-all"
                            title="Modifier la rencontre"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateMatches(matches.filter((item) => item.id !== m.id))}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 transition-all"
                            title="Supprimer la rencontre"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Actions Rapides en 1 Clic : Victoire / Défaite / Saisir le Score */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Résultat direct :
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleQuickMatchOutcome(m, 'win')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Enregistrer une Victoire en 1 clic et transférer dans Résultats"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Victoire</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickMatchOutcome(m, 'loss')}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Enregistrer une Défaite en 1 clic et transférer dans Résultats"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Défaite</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (quickScoreMatchId === m.id) {
                                setQuickScoreMatchId(null);
                              } else {
                                setQuickScoreMatchId(m.id);
                                setQuickHomeScore(m.homeScore?.toString() || '');
                                setQuickAwayScore(m.awayScore?.toString() || '');
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              quickScoreMatchId === m.id
                                ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                            title="Saisir un score numérique (ex: 78 - 65)"
                          >
                            <span className="font-mono font-black text-sky-400">#</span>
                            <span>Score</span>
                          </button>
                        </div>
                      </div>

                      {/* Popover / Formulaire Inline pour Saisie Rapide du Score */}
                      {quickScoreMatchId === m.id && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/50 space-y-2.5 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                            <span>🔢 Saisie du score final chiffré :</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Saisissez les points puis validez pour envoyer dans Résultats
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-slate-300 block mb-1 font-bold truncate">
                                {m.teamHome} (Dom.)
                              </label>
                              <input
                                type="number"
                                value={quickHomeScore}
                                onChange={(e) => setQuickHomeScore(e.target.value)}
                                placeholder="ex: 78"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:border-sky-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-300 block mb-1 font-bold truncate">
                                {m.teamAway} (Ext.)
                              </label>
                              <input
                                type="number"
                                value={quickAwayScore}
                                onChange={(e) => setQuickAwayScore(e.target.value)}
                                placeholder="ex: 65"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:border-sky-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setQuickScoreMatchId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              disabled={!quickHomeScore.trim() || !quickAwayScore.trim()}
                              onClick={() => {
                                const h = parseInt(quickHomeScore, 10);
                                const a = parseInt(quickAwayScore, 10);
                                if (!isNaN(h) && !isNaN(a)) {
                                  handleQuickMatchOutcome(m, 'score', { homeScore: h, awayScore: a });
                                  setQuickScoreMatchId(null);
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Valider & Transférer dans Résultats</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </>
              )}
            </div>  );
}
