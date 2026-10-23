import { clubCalendarDate } from '../../../utils/clubTime';
// ExcelTab — onglet « excel » de l'AdminPanel.
// Extrait automatiquement lors du découpage de AdminPanel.tsx : aucune logique modifiée.
// Toutes les données et fonctions nécessaires sont reçues via des props explicites.

import { X, Upload, FileSpreadsheet, Trash2, Plus, Download, CheckCircle2, AlertCircle, Cake, Layers, Check, ChevronLeft, ChevronRight, Pencil, Loader2 } from 'lucide-react';
import { generateClubBirthdayTemplate, getWeekBounds, formatDisplayCategory } from '../../../utils/excelBirthdayParser';
import { StudioGraphiqueWorkbench } from '.././StudioGraphiqueWorkbench';

export interface ExcelTabProps {
  // Typage permissif lors de l'extraction : chaque identifiant utilisé est passé en prop depuis AdminPanel.
  [key: string]: any;
}

export function ExcelTab(props: ExcelTabProps) {
  const {
    allMembers,
    allMembersPool,
    birthdayWeekOffset,
    birthdays,
    birthdaysSubTab,
    clubSettings,
    editBdayCategory,
    editBdayDate,
    editBdayFirstName,
    editingBirthdayId,
    excelErrors,
    excelInputRef,
    excelSuccessMsg,
    handleAddManualBirthday,
    handleCancelEditBirthday,
    handleDeleteBirthday,
    handleExcelFileUpload,
    handleSaveEditBirthday,
    handleSelectWeekOffset,
    handleStartEditBirthday,
    isAddingManualBday,
    isParsingExcel,
    manualBdayCategory,
    manualBdayDate,
    manualBdayFirstName,
    matches,
    onUpdateBirthdays,
    onUpdateVisualTemplates,
    results,
    saveErrorMessage,
    saveStatus,
    setBirthdaysSubTab,
    setEditBdayCategory,
    setEditBdayDate,
    setEditBdayFirstName,
    setIsAddingManualBday,
    setManualBdayCategory,
    setManualBdayDate,
    setManualBdayFirstName,
    visualTemplates,
  } = props;

  return (
            <div className="space-y-6">
              {/* Barre de sous-onglets : Licenciés vs Studio Calques */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBirthdaysSubTab('list')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      birthdaysSubTab === 'list'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Cake className="w-4 h-4 text-pink-400" />
                    <span>Licenciés & Import Excel ({birthdays.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBirthdaysSubTab('calques')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      birthdaysSubTab === 'calques'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>🎨 Design & Studio Calques Anniversaires</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 hidden sm:inline-block pr-2 font-medium">
                  {birthdaysSubTab === 'list' ? 'Gestion des licenciés & extraction hebdomadaire' : 'Fond festif, stickers & visuels 16:9'}
                </span>
              </div>

              {birthdaysSubTab === 'calques' ? (
                <>
                <p className="text-sm text-sky-300">Aperçu de la diffusion TV : semaine courante. La consultation des autres semaines ne change pas cet aperçu.</p>
                <StudioGraphiqueWorkbench
                  visualTemplates={visualTemplates}
                  onUpdateVisualTemplates={onUpdateVisualTemplates}
                  matches={matches}
                  results={results}
                  birthdays={props.tvBirthdays || []}
                  clubSettings={clubSettings}
                  defaultCategory="birthdays"
                  hideCategorySelector={true}
                  onNavigateToCategoryTab={() => setBirthdaysSubTab('list')}
                />
                </>
              ) : (
                <>
              {/* Header & Description */}
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Cake className="w-5 h-5 text-pink-400" />
                    <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                      GESTION & EXTRACTION DES ANNIVERSAIRES PAR SEMAINE
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Importez votre fichier Excel (.xlsx, .csv) de licenciés ou ajoutez-les manuellement.
                    <span className="text-pink-400 font-semibold ml-1">
                      Sur l'écran TV, seuls le Prénom et la Catégorie sont diffusés
                    </span> pour un rendu grand format ultra-lisible.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsAddingManualBday(!isAddingManualBday)}
                    className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-pink-600/20 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingManualBday ? 'Fermer formulaire' : 'Ajouter un licencié'}</span>
                  </button>
                  <button
                    onClick={generateClubBirthdayTemplate}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors whitespace-nowrap"
                    title="Télécharger le modèle Excel prêt à l'emploi"
                  >
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>Modèle Excel</span>
                  </button>
                </div>
              </div>

              {/* Formulaire d'ajout manuel de licencié */}
              {isAddingManualBday && (
                <form
                  onSubmit={handleAddManualBirthday}
                  className="bg-slate-900 p-5 rounded-3xl border-2 border-pink-500/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <Plus className="w-4 h-4 text-pink-400" />
                      AJOUTER UN LICENCIÉ (PRÉNOM & CATÉGORIE)
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingManualBday(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Prénom du licencié *
                      </label>
                      <input
                        type="text"
                        value={manualBdayFirstName}
                        onChange={(e) => setManualBdayFirstName(e.target.value)}
                        placeholder="Ex: Lucas, Emma, Juliette..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Catégorie / Équipe (avec F ou M) *
                      </label>
                      <input
                        type="text"
                        value={manualBdayCategory}
                        onChange={(e) => setManualBdayCategory(e.target.value)}
                        placeholder="Ex: U15F, U15M, U13F, Seniors F..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                        required
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['U7', 'U9', 'U11F', 'U11M', 'U13F', 'U13M', 'U15F', 'U15M', 'U17F', 'U17M', 'U18M', 'Seniors F', 'Seniors M', 'Loisirs', 'Coach', 'Bureau'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setManualBdayCategory(cat)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              manualBdayCategory === cat
                                ? 'bg-pink-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Date de naissance (ou date fête)
                      </label>
                      <input
                        type="date"
                        value={manualBdayDate}
                        onChange={(e) => setManualBdayDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingManualBday(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/30 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Enregistrer le licencié
                    </button>
                  </div>
                </form>
              )}

              {/* Barre de tri et sélection par Semaine */}
              <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Filtrer par semaine :
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-950/80 text-pink-300 border border-pink-500/30">
                      {getWeekBounds(clubCalendarDate(), birthdayWeekOffset).label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleSelectWeekOffset(birthdayWeekOffset - 1)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                      title="Semaine précédente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Précédente</span>
                    </button>

                    <button
                      onClick={() => handleSelectWeekOffset(0)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        birthdayWeekOffset === 0
                          ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      Cette semaine
                    </button>

                    <button
                      onClick={() => handleSelectWeekOffset(birthdayWeekOffset + 1)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                      title="Semaine suivante"
                    >
                      <span className="hidden sm:inline">Suivante</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Boutons de raccourcis rapides de semaines */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">Raccourcis :</span>
                  {[
                    { offset: -1, label: 'Semaine -1' },
                    { offset: 0, label: 'Semaine actuelle' },
                    { offset: 1, label: 'Semaine +1' },
                    { offset: 2, label: 'Semaine +2' },
                    { offset: 3, label: 'Semaine +3' },
                  ].map((w) => (
                    <button
                      key={w.offset}
                      onClick={() => handleSelectWeekOffset(w.offset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        birthdayWeekOffset === w.offset
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                  {((allMembers && allMembers.length > 0) ? allMembers : allMembersPool).length > 0 && (
                    <button
                      onClick={props.onShowAllMembers}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 ml-auto"
                    >
                      Afficher tous ({((allMembers && allMembers.length > 0) ? allMembers : allMembersPool).length})
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                <Cake className="w-10 h-10 text-pink-400 mx-auto mb-2" />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  IMPORTER OU METTRE À JOUR LE FICHIER EXCEL (.XLSX, .CSV)
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                  Détection automatique : Prénom, Nom, Date de Naissance, Catégorie / Équipe.
                </p>

                <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs md:text-sm cursor-pointer shadow-lg shadow-pink-600/20 transition-all hover:scale-105">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isParsingExcel ? 'Extraction en cours...' : 'Sélectionner le fichier Excel'}</span>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleExcelFileUpload}
                    disabled={isParsingExcel}
                  />
                </label>
              </div>

              {excelSuccessMsg && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 text-sm space-y-2">
                  <div className="flex items-center gap-2.5 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{excelSuccessMsg}</span>
                  </div>
                  <div className="text-xs pl-7 flex items-center gap-2">
                    {saveStatus === 'saving' && (
                      <span className="text-amber-400 flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Synchronisation en cours avec le serveur Cloudflare...
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Données sauvegardées en ligne sur le serveur.
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-red-400 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Attention : Échec de la sauvegarde serveur ({saveErrorMessage || 'Erreur réseau'}). Cliquez sur « Enregistrer » en haut pour retenter.
                      </span>
                    )}
                    {saveStatus === 'idle' && (
                      <span className="text-slate-400">
                        Pensez à vérifier que le bouton en haut indique « Enregistré » pour confirmer la persistance sur le serveur.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {excelErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm space-y-1">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Avertissements lors de l'import :</span>
                  </div>
                  {excelErrors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-300/90 pl-6">• {err}</p>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-400">Consultation uniquement. La TV suit automatiquement la semaine courante, du lundi au dimanche, heure française.</p>
              {/* Liste des Anniversaires diffusés avec Modification & Suppression */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Anniversaires consultés ({birthdays.length})</span>
                    <span className="text-xs font-normal text-slate-400">
                      (Affichage : Prénom + Catégorie)
                    </span>
                  </h4>

                </div>

                {birthdays.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center text-slate-400 space-y-2">
                    <Cake className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">Aucun anniversaire pour cette sélection</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Changez de semaine avec les boutons ci-dessus, importez un fichier Excel ou cliquez sur "Ajouter un licencié".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {birthdays.map((b) => {
                      const isEditing = editingBirthdayId === b.id;
                      const displayName = b.firstName || (b.fullName ? b.fullName.trim().split(/\s+/)[0] : 'Licencié');

                      if (isEditing) {
                        return (
                          <div
                            key={b.id}
                            className="p-4 rounded-2xl bg-slate-900 border-2 border-pink-500 shadow-xl space-y-3 animate-in fade-in"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-pink-400 uppercase tracking-wider">
                                MODIFIER LE LICENCIÉ
                              </span>
                              <button
                                onClick={handleCancelEditBirthday}
                                className="text-slate-400 hover:text-white p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                                  Prénom (affiché sur la TV) :
                                </label>
                                <input
                                  type="text"
                                  value={editBdayFirstName}
                                  onChange={(e) => setEditBdayFirstName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-bold focus:border-pink-500 focus:outline-none"
                                  placeholder="Prénom"
                                  autoFocus
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                                  Catégorie / Équipe (avec F ou M) :
                                </label>
                                <input
                                  type="text"
                                  value={editBdayCategory}
                                  onChange={(e) => setEditBdayCategory(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-bold focus:border-pink-500 focus:outline-none"
                                  placeholder="Ex: U15F, U15M, U13F, Seniors F"
                                />
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {['U7', 'U9', 'U11F', 'U11M', 'U13F', 'U13M', 'U15F', 'U15M', 'U17F', 'U17M', 'U18M', 'Seniors F', 'Seniors M', 'Loisirs', 'Coach', 'Bureau'].map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => setEditBdayCategory(cat)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                                        editBdayCategory === cat
                                          ? 'bg-pink-600 text-white'
                                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                      }`}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                                  Date de naissance :
                                </label>
                                <input
                                  type="date"
                                  value={editBdayDate}
                                  onChange={(e) => setEditBdayDate(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:border-pink-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={handleCancelEditBirthday}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleSaveEditBirthday(b.id)}
                                className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-pink-600/30"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const displayCat = formatDisplayCategory(b.teamCategory, b.gender, displayName);

                      return (
                        <div
                          key={b.id}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-md"
                              style={{ backgroundColor: clubSettings.primaryColor || '#ea580c' }}
                            >
                              <Cake className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-base font-black text-white truncate font-bebas tracking-wide">
                                {displayName}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="px-2 py-0.5 rounded-lg text-[11px] font-black text-white shrink-0 shadow-sm uppercase tracking-wider font-mono"
                                  style={{ backgroundColor: `${clubSettings.primaryColor || '#ea580c'}cc` }}
                                >
                                  {displayCat}
                                </span>
                                {b.birthDayFormatted && (
                                  <span className="text-[11px] text-pink-400 font-medium">
                                    🎂 {b.birthDayFormatted}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartEditBirthday(b)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Modifier (Prénom, Catégorie, Date)"
                            >
                              <Pencil className="w-4 h-4 text-orange-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteBirthday(b.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </>
              )}
            </div>  );
}
