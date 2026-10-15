// ContentTypeResultsSection2 — bloc « contentType === 'results' » de VisualExporterModal.
// Extrait automatiquement lors du découpage : aucune logique modifiée.


export interface ContentTypeResultsSection2Props {
  [key: string]: any;
}

export function ContentTypeResultsSection2(props: ContentTypeResultsSection2Props) {
  const {
    p,
    text,
    updateTemplateSetting,
    resultDisplayMode,
    title,
  } = props;

  return (
                      <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-300 uppercase flex items-center justify-between">
                          <span>Affichage du Résultat :</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => updateTemplateSetting({ resultDisplayMode: 'both' })}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center ${
                              resultDisplayMode === 'both'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Afficher le score au centre ET la mention Victoire / Défaite"
                          >
                            Score + Mention
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTemplateSetting({ resultDisplayMode: 'score' })}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center ${
                              resultDisplayMode === 'score'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Afficher uniquement le score (ex: 68 - 59)"
                          >
                            Score Seul
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTemplateSetting({ resultDisplayMode: 'status' })}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center ${
                              resultDisplayMode === 'status'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Afficher uniquement la mention (Victoire / Défaite)"
                          >
                            Victoire / Défaite
                          </button>
                        </div>
                      </div>
                      );
}