// ContentTypeResultsSection — bloc « contentType === 'results' » de VisualExporterModal.
// Extrait automatiquement lors du découpage : aucune logique modifiée.


export interface ContentTypeResultsSectionProps {
  [key: string]: any;
}

export function ContentTypeResultsSection(props: ContentTypeResultsSectionProps) {
  const {
    text,
    p,
    updateTemplateSetting,
    resultDisplayMode,
  } = props;

  return (
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Résultat :</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => updateTemplateSetting({ resultDisplayMode: 'both' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        resultDisplayMode === 'both' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Score + Mention
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTemplateSetting({ resultDisplayMode: 'score' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        resultDisplayMode === 'score' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Score seul
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTemplateSetting({ resultDisplayMode: 'status' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        resultDisplayMode === 'status' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Victoire / Défaite
                    </button>
                  </div>
                </div>
                );
}