// ResultsTab — onglet « results » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { X, Trophy, Calendar, Tv, Trash2, Plus, RefreshCw, Sparkles, CheckCircle2, AlertCircle, Layers, Instagram, Facebook, Pencil, Home, Navigation, Type } from 'lucide-react';
import { isMatchWin, isClubHomeMatch } from '../../../utils/matchStatus';
import { MiniCalendarPicker, SingleDatePicker, formatDateToReadableFrench } from '.././MiniCalendarPicker';
import { StudioGraphiqueWorkbench } from '.././StudioGraphiqueWorkbench';
import { formatDateToEuropean } from '../adminPanelConstants';

export interface ResultsTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function ResultsTab(props: ResultsTabProps) {
  const {
    setResultsSubTab,
    resultsSubTab,
    w,
    results,
    visualTemplates,
    onUpdateVisualTemplates,
    matches,
    birthdays,
    clubSettings,
    setShowCalendarInResults,
    showCalendarInResults,
    setResultsFilterToCurrentWeekend,
    setResultsFilterToLastWeekend,
    title,
    resultsStartDate,
    resultsEndDate,
    setResultsStartDate,
    setResultsEndDate,
    setResultsFilterMode,
    base,
    handleSelectOnlyFilteredResultsForTV,
    d,
    handleSyncFFBB,
    isSyncingFFBB,
    label,
    autoFetchOpponentLogos,
    setAutoFetchOpponentLogos,
    logos,
    onUpdateResults,
    setShowAddManualResult,
    showAddManualResult,
    cat,
    selectedScheduledMatchId,
    handleSelectScheduledMatch,
    setNewResultIsHome,
    newResultIsHome,
    newResultErrorMsg,
    newResultSuccessMsg,
    club,
    newResultIsCustomCategory,
    newResultCategory,
    setNewResultIsCustomCategory,
    setNewResultCategory,
    availableFfbbTeams,
    name,
    newResultOpponent,
    setNewResultOpponent,
    setNewResultErrorMsg,
    newResultDate,
    setNewResultDate,
    setNewResultMode,
    score,
    newResultMode,
    newResultHomeScore,
    setNewResultHomeScore,
    newResultAwayScore,
    setNewResultAwayScore,
    setNewResultStatusOutcome,
    newResultStatusOutcome,
    handleAddResultManual,
    result,
    homeScore,
    awayScore,
    setEditingResult,
    editingResult,
    handleSaveEditedResult,
  } = props;

  return (
            <div className="space-y-6">
              {/* Barre de sous-onglets : Résultats vs Studio Calques */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResultsSubTab('list')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      resultsSubTab === 'list'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <span>Scores & Résultats ({results.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultsSubTab('calques')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      resultsSubTab === 'calques'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>🎨 Design & Studio Calques Résultats</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 hidden sm:inline-block pr-2 font-medium">
                  {resultsSubTab === 'list' ? 'Saisie des scores du week-end' : 'Fond, visuels Victoire / Défaite & visuels 16:9'}
                </span>
              </div>

              {resultsSubTab === 'calques' ? (
                <StudioGraphiqueWorkbench
                  visualTemplates={visualTemplates}
                  onUpdateVisualTemplates={onUpdateVisualTemplates}
                  matches={matches}
                  results={results}
                  birthdays={birthdays}
                  clubSettings={clubSettings}
                  defaultCategory="results"
                  hideCategorySelector={true}
                  onNavigateToCategoryTab={() => setResultsSubTab('list')}
                />
              ) : (
                <>
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>PROGRAMME DES RÉSULTATS DU WEEK-END ({results.length})</span>
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
                        onClick={() => setShowCalendarInResults(!showCalendarInResults)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Calendar className="w-3 h-3 text-orange-400" />
                        <span>{showCalendarInResults ? 'Masquer le calendrier' : 'Afficher le calendrier'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={setResultsFilterToCurrentWeekend}
                        className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/35 text-orange-300 border border-orange-500/30 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        🔥 Ce week-end
                      </button>
                      <button
                        type="button"
                        onClick={setResultsFilterToLastWeekend}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition-all cursor-pointer"
                        title="Afficher les résultats du week-end passé"
                      >
                        ⏮️ Week-end passé
                      </button>
                      {(resultsStartDate || resultsEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setResultsStartDate('');
                            setResultsEndDate('');
                            setResultsFilterMode('all');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium transition-all cursor-pointer"
                        >
                          Voir toute la saison
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calendrier visuel interactif : filtrage 100% instantané en mémoire */}
                  {showCalendarInResults ? (
                    <div className="flex flex-col md:flex-row items-stretch gap-4 pt-1">
                      <div className="shrink-0 flex justify-center">
                        <MiniCalendarPicker
                          startDate={resultsStartDate}
                          endDate={resultsEndDate}
                          onChangeRange={(start, end) => {
                            setResultsStartDate(start);
                            setResultsEndDate(end);
                            if (start || end) {
                              setResultsFilterMode('range');
                            }
                          }}
                          title="Sélectionner les dates à afficher"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                              Filtre actif :
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                              {
                                (resultsStartDate || resultsEndDate
                                  ? results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate)))
                                  : results
                                ).length
                              } match(s) trouvé(s)
                            </span>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            {resultsStartDate && resultsEndDate ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-orange-400 block">
                                  Du {formatDateToReadableFrench(resultsStartDate)}
                                </span>
                                <span className="text-xs font-bold text-orange-400 block">
                                  Au {formatDateToReadableFrench(resultsEndDate)}
                                </span>
                              </div>
                            ) : resultsStartDate ? (
                              <span className="text-xs font-bold text-orange-400">
                                À partir du {formatDateToReadableFrench(resultsStartDate)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Aucun filtre : toute la saison ({results.length} résultats) est affichée.
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
                              onClick={() => {
                                const list = (resultsStartDate || resultsEndDate)
                                  ? results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate)))
                                  : results;
                                handleSelectOnlyFilteredResultsForTV(list);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                              title="Coche uniquement les résultats de cette période pour la boucle TV et décoche les autres"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Cocher cette période pour la TV</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleSyncFFBB}
                              disabled={isSyncingFFBB}
                              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                              title="Utile si des scores ont été actualisés sur la FFBB"
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
                          {resultsStartDate && resultsEndDate ? (
                            <>Période filtrée : <strong>{formatDateToReadableFrench(resultsStartDate)}</strong> au <strong>{formatDateToReadableFrench(resultsEndDate)}</strong></>
                          ) : (
                            <span className="text-slate-400 italic">Aucune période filtrée (Toute la saison : {results.length} résultats)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const list = (resultsStartDate || resultsEndDate)
                              ? results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate)))
                              : results;
                            handleSelectOnlyFilteredResultsForTV(list);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                        >
                          Cocher pour la TV
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncFFBB}
                          disabled={isSyncingFFBB}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                          <span>Actualiser FFBB</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCalendarInResults(true)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          Ouvrir le calendrier
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={autoFetchOpponentLogos}
                        onChange={(e) => setAutoFetchOpponentLogos(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                      />
                      <span>Récupérer automatiquement les logos officiels FFBB des clubs adverses à chaque synchronisation</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Barre d'action et sélection des résultats pour le week-end */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase font-bebas tracking-wide">
                        SÉLECTION DES RÉSULTATS DU WEEK-END
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono">
                        {results.filter((r) => r.selectedForWeekend !== false).length} / {results.length} cochés pour la TV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cochez ou décochez les résultats à diffuser sur l'écran TV et les réseaux sociaux ce week-end.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => onUpdateResults(results.map((r) => ({ ...r, selectedForWeekend: true })))}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold transition-all cursor-pointer"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateResults(results.map((r) => ({ ...r, selectedForWeekend: false })))}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold transition-all cursor-pointer"
                  >
                    Tout décocher
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddManualResult(!showAddManualResult)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddManualResult ? 'Masquer la saisie' : 'Ajouter un résultat'}</span>
                  </button>
                </div>
              </div>

              {/* Formulaire et saisie rapide (repliable via showAddManualResult) */}
              {showAddManualResult && (
                <>
                  {/* Raccourci 1 : Pré-remplissage depuis un match programmé du week-end */}
                  {matches.length > 0 && (
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Saisie rapide 1-Clic depuis le calendrier du week-end :</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      Pré-remplit catégorie, adversaire & date
                    </span>
                  </div>

                  <select
                    value={selectedScheduledMatchId}
                    onChange={(e) => handleSelectScheduledMatch(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-amber-400"
                  >
                    <option value="">
                      -- Cliquez ici pour choisir un match programmé (remplissage automatique) --
                    </option>
                    {matches.map((m) => {
                      const opponentName = m.isHomeMatch ? m.teamAway : m.teamHome;
                      const locationLabel = m.isHomeMatch ? '🏠 Domicile' : '🚗 Extérieur';
                      return (
                        <option key={m.id} value={m.id}>
                          [{m.category}] {locationLabel} vs {opponentName} ({formatDateToEuropean(m.date)} - {m.time})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Formulaire de saisie de résultat */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-black text-white font-bebas tracking-wide flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>ENREGISTRER LE SCORE D'UN MATCH</span>
                  </h4>

                  {/* Toggle Domicile / Extérieur */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Lieu :</span>
                    <button
                      type="button"
                      onClick={() => setNewResultIsHome(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        newResultIsHome
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Home className="w-3 h-3" />
                      <span>À Domicile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewResultIsHome(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        !newResultIsHome
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>À l'Extérieur</span>
                    </button>
                  </div>
                </div>

                {/* Notifications & Alertes Feedback */}
                {newResultErrorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">{newResultErrorMsg}</span>
                  </div>
                )}

                {newResultSuccessMsg && (
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{newResultSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 text-xs">
                  
                  {/* 1. Équipe FFBB Synchronisée (MENU DÉROULANT DEMANDÉ) */}
                  <div className="lg:col-span-4 space-y-1.5">
                    <label className="text-slate-300 block font-bold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-orange-400" />
                      <span>Équipe du club (Synchronisée FFBB) :</span>
                    </label>

                    <select
                      value={newResultIsCustomCategory ? '__custom__' : newResultCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setNewResultIsCustomCategory(true);
                          setNewResultCategory('');
                        } else {
                          setNewResultIsCustomCategory(false);
                          setNewResultCategory(val);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-orange-500 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      {availableFfbbTeams.map((t, idx) => (
                        <option key={`${t.name}-${idx}`} value={t.name}>
                          🏀 {t.name} {t.category ? `(${t.category})` : ''}
                        </option>
                      ))}
                      <option value="__custom__">✏️ Autre équipe (Saisie manuelle personnalisée)</option>
                    </select>

                    {newResultIsCustomCategory && (
                      <input
                        type="text"
                        placeholder="Ex: Baby Basket, Anciens, Loisirs..."
                        value={newResultCategory}
                        onChange={(e) => setNewResultCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-orange-500/70 rounded-xl px-3 py-2 text-white mt-1 animate-in fade-in"
                        autoFocus
                      />
                    )}
                  </div>

                  {/* 2. Adversaire */}
                  <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-slate-300 block font-bold">
                      Équipe adverse : <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Basket Club Mâcon"
                      value={newResultOpponent}
                      onChange={(e) => {
                        setNewResultOpponent(e.target.value);
                        if (newResultErrorMsg) setNewResultErrorMsg(null);
                      }}
                      className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none transition-colors ${
                        newResultErrorMsg && !newResultOpponent.trim()
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-slate-700 hover:border-slate-600 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* 3. Date du match */}
                  <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-slate-300 block font-bold">Date du match :</label>
                    <SingleDatePicker
                      value={newResultDate}
                      onChange={(french, iso) => setNewResultDate(french || iso)}
                      placeholder="Choisir date..."
                    />
                  </div>

                  {/* Choix du Mode de Saisie du Résultat */}
                  <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-slate-300 block font-bold">Saisie du résultat :</label>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setNewResultMode('score')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                          newResultMode === 'score'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Saisir les scores numériques exacts (ex: 82-74)"
                      >
                        🔢 Score
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewResultMode('status')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                          newResultMode === 'status'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Sélectionner directement Victoire ou Défaite (Sans score)"
                      >
                        🏆 Victoire/Défaite
                      </button>
                    </div>
                  </div>

                  {/* 4. Champs de score OU Boutons Victoire/Défaite */}
                  {newResultMode === 'score' ? (
                    <>
                      {/* Score Notre Club */}
                      <div className="lg:col-span-1.5 space-y-1.5">
                        <label className="text-emerald-400 block font-bold truncate" title="Notre Club">
                          Notre score : <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="82"
                          value={newResultHomeScore}
                          onChange={(e) => {
                            setNewResultHomeScore(e.target.value);
                            if (newResultErrorMsg) setNewResultErrorMsg(null);
                          }}
                          className="w-full bg-slate-950 border border-emerald-500/50 hover:border-emerald-400 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-white font-mono font-black text-base text-center text-emerald-400 focus:outline-none"
                        />
                      </div>

                      {/* Score Adversaire */}
                      <div className="lg:col-span-1.5 space-y-1.5">
                        <label className="text-rose-400 block font-bold truncate" title="Adversaire">
                          Score adv. : <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="74"
                          value={newResultAwayScore}
                          onChange={(e) => {
                            setNewResultAwayScore(e.target.value);
                            if (newResultErrorMsg) setNewResultErrorMsg(null);
                          }}
                          className="w-full bg-slate-950 border border-rose-500/50 hover:border-rose-400 focus:border-rose-400 rounded-xl px-3 py-2.5 text-white font-mono font-black text-base text-center text-rose-400 focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="lg:col-span-3 space-y-1.5">
                      <label className="text-slate-300 block font-bold">Résultat direct :</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewResultStatusOutcome('win')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 ${
                            newResultStatusOutcome === 'win'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                              : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <span>🏆 VICTOIRE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewResultStatusOutcome('loss')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 ${
                            newResultStatusOutcome === 'loss'
                              ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50'
                              : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <span>❌ DÉFAITE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Score Live Preview Indicator */}
                {newResultMode === 'score' && newResultHomeScore.trim() !== '' && newResultAwayScore.trim() !== '' && (
                  <div className="pt-2 flex items-center justify-between text-xs font-bold px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Aperçu :</span>
                      <span className="font-mono text-white text-sm">
                        {newResultIsHome
                          ? `${newResultCategory || 'Notre Club'} ${newResultHomeScore} - ${newResultAwayScore} ${newResultOpponent || 'Adversaire'}`
                          : `${newResultOpponent || 'Adversaire'} ${newResultAwayScore} - ${newResultHomeScore} ${newResultCategory || 'Notre Club'}`}
                      </span>
                    </div>

                    <div>
                      {parseInt(newResultHomeScore, 10) > parseInt(newResultAwayScore, 10) ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span>🏆 Victoire (+{parseInt(newResultHomeScore, 10) - parseInt(newResultAwayScore, 10)} pts)</span>
                        </span>
                      ) : parseInt(newResultHomeScore, 10) < parseInt(newResultAwayScore, 10) ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <span>Défaite (-{parseInt(newResultAwayScore, 10) - parseInt(newResultHomeScore, 10)} pts)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Égalité
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {newResultMode === 'status' && (
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold px-1">
                    <span className="text-slate-400">Aperçu :</span>
                    <span className="text-white">
                      {newResultCategory || 'Notre Club'} vs {newResultOpponent || 'Adversaire'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      newResultStatusOutcome === 'win' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {newResultStatusOutcome === 'win' ? '🏆 VICTOIRE' : '❌ DÉFAITE'}
                    </span>
                  </div>
                )}

                {/* Bouton d'enregistrement */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    💡 <em>Astuce : Vous pouvez aussi cliquer sur le bouton <strong>"Score"</strong> directement depuis la liste des matchs.</em>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddResultManual}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black font-bebas text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                    id="btn-save-manual-result"
                  >
                    <Trophy className="w-4 h-4 text-emerald-200" />
                    <span>ENREGISTRER CE RÉSULTAT</span>
                  </button>
                </div>
              </div>
              </>
              )}

              {/* Liste des résultats enregistrés */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>
                      {resultsStartDate || resultsEndDate ? (
                        <>Résultats filtrés ({
                          results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate))).length
                        } / {results.length}) :</>
                      ) : (
                        <>Tous les résultats enregistrés ({results.length}) :</>
                      )}
                    </span>
                  </h4>
                  {results.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onUpdateResults([])}
                      className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Effacer tous les résultats
                    </button>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                    <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Aucun résultat enregistré pour le moment.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Sélectionnez une équipe FFBB ci-dessus pour ajouter le score du week-end.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const filteredList = (resultsStartDate || resultsEndDate)
                      ? results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate)))
                      : results;

                    if (filteredList.length === 0) {
                      return (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                          <Calendar className="w-7 h-7 text-slate-500 mx-auto opacity-60" />
                          <p className="text-xs font-bold text-slate-300">
                            Aucun résultat trouvé pour la période sélectionnée ({formatDateToReadableFrench(resultsStartDate)} au {formatDateToReadableFrench(resultsEndDate)}).
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setResultsStartDate('');
                              setResultsEndDate('');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            Afficher tous les {results.length} résultats de la saison
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredList.map((r) => {
                          const isWin = isMatchWin(r, clubSettings.name, clubSettings.shortName);
                          const isHome = isClubHomeMatch(r, clubSettings.name, clubSettings.shortName);
                          return (
                            <div
                              key={r.id}
                              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:border-slate-600 ${
                                isWin
                                  ? 'bg-emerald-950/20 border-emerald-500/30'
                                  : 'bg-rose-950/20 border-rose-500/30'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs font-bold mb-1 flex-wrap">
                                  <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                                    {r.category}
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-bold">
                                    {isHome ? '🏠 Domicile' : '🚗 Extérieur'}
                                  </span>
                                  {r.date && r.date !== 'Week-end dernier' && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-slate-400 font-mono text-[11px] font-bold">
                                        {formatDateToEuropean(r.date)}
                                      </span>
                                    </>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      isWin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                    }`}
                                  >
                                    {isWin ? 'VICTOIRE 🏆' : 'DÉFAITE'}
                                  </span>
                                </div>
                                <div className="text-base font-black text-white font-mono tracking-wider">
                                  {r.teamHome} {r.homeScore !== undefined && r.awayScore !== undefined ? `${r.homeScore} - ${r.awayScore}` : ''} {r.teamAway}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isSelected = r.selectedForWeekend !== false;
                                    const updated = results.map((item) =>
                                      item.id === r.id ? { ...item, selectedForWeekend: !isSelected } : item
                                    );
                                    onUpdateResults(updated);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                                    r.selectedForWeekend !== false
                                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                                  }`}
                                  title={r.selectedForWeekend !== false ? 'Diffusé sur la TV (cliquez pour masquer)' : 'Masqué de la TV (cliquez pour diffuser)'}
                                >
                                  <CheckCircle2 className={`w-3.5 h-3.5 ${r.selectedForWeekend !== false ? 'text-emerald-400' : 'text-slate-600'}`} />
                                  <span className="text-[11px]">{r.selectedForWeekend !== false ? 'Coché TV' : 'Non diffusé'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingResult({ ...r })}
                                  className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                                  title="Modifier ce score ou la rencontre"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onUpdateResults(results.filter((item) => item.id !== r.id))}
                                  className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all cursor-pointer"
                                  title="Supprimer ce résultat"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Modal d'édition d'un résultat existant */}
              {editingResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-lg font-black text-white font-bebas flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-blue-400" />
                        <span>MODIFIER LE RÉSULTAT</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingResult(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Catégorie :</label>
                        <input
                          type="text"
                          value={editingResult.category}
                          onChange={(e) => setEditingResult({ ...editingResult, category: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Équipe 1 :</label>
                          <input
                            type="text"
                            value={editingResult.teamHome}
                            onChange={(e) => setEditingResult({ ...editingResult, teamHome: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Équipe 2 :</label>
                          <input
                            type="text"
                            value={editingResult.teamAway}
                            onChange={(e) => setEditingResult({ ...editingResult, teamAway: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-emerald-400 block mb-1 font-bold truncate">
                            Score {editingResult.teamHome || 'Équipe 1'} :
                          </label>
                          <input
                            type="number"
                            placeholder="Optionnel"
                            value={editingResult.homeScore !== undefined ? editingResult.homeScore : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setEditingResult({ ...editingResult, homeScore: undefined });
                              } else {
                                const newHome = parseInt(val, 10);
                                const updated = { ...editingResult, homeScore: isNaN(newHome) ? undefined : newHome };
                                if (updated.homeScore !== undefined && updated.awayScore !== undefined) {
                                  const win = isMatchWin(updated, clubSettings.name, clubSettings.shortName);
                                  setEditingResult({ ...updated, result: win ? 'win' : 'loss' });
                                } else {
                                  setEditingResult(updated);
                                }
                              }
                            }}
                            className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-center text-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="text-rose-400 block mb-1 font-bold truncate">
                            Score {editingResult.teamAway || 'Équipe 2'} :
                          </label>
                          <input
                            type="number"
                            placeholder="Optionnel"
                            value={editingResult.awayScore !== undefined ? editingResult.awayScore : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setEditingResult({ ...editingResult, awayScore: undefined });
                              } else {
                                const newAway = parseInt(val, 10);
                                const updated = { ...editingResult, awayScore: isNaN(newAway) ? undefined : newAway };
                                if (updated.homeScore !== undefined && updated.awayScore !== undefined) {
                                  const win = isMatchWin(updated, clubSettings.name, clubSettings.shortName);
                                  setEditingResult({ ...updated, result: win ? 'win' : 'loss' });
                                } else {
                                  setEditingResult(updated);
                                }
                              }
                            }}
                            className="w-full bg-slate-950 border border-rose-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-center text-rose-400"
                          />
                        </div>
                      </div>

                      {(editingResult.homeScore !== undefined || editingResult.awayScore !== undefined) && (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => setEditingResult({ ...editingResult, homeScore: undefined, awayScore: undefined })}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline"
                          >
                            🗑️ Effacer les scores numériques (garder uniquement Victoire/Défaite)
                          </button>
                        </div>
                      )}

                      {/* Sélecteur forcé Résultat / Type de match */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Lieu du match :</label>
                          <select
                            value={editingResult.isHomeMatch ? 'home' : 'away'}
                            onChange={(e) => {
                              const isHome = e.target.value === 'home';
                              const updated = { ...editingResult, isHomeMatch: isHome };
                              const win = isMatchWin(updated, clubSettings.name, clubSettings.shortName);
                              setEditingResult({
                                ...updated,
                                result: win ? 'win' : 'loss',
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          >
                            <option value="home">🏠 Domicile</option>
                            <option value="away">🚗 Extérieur</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Résultat :</label>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingResult({ ...editingResult, result: 'win' })}
                              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                                editingResult.result === 'win'
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                  : 'bg-slate-950 text-slate-400 border border-slate-700'
                              }`}
                            >
                              🏆 Victoire
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingResult({ ...editingResult, result: 'loss' })}
                              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                                editingResult.result === 'loss'
                                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                                  : 'bg-slate-950 text-slate-400 border border-slate-700'
                              }`}
                            >
                              ❌ Défaite
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Date :</label>
                        <input
                          type="text"
                          value={editingResult.date}
                          onChange={(e) => setEditingResult({ ...editingResult, date: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingResult(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditedResult(editingResult)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>
              )}
            </div>  );
}