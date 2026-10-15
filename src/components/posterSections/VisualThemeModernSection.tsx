// VisualThemeModernSection — bloc « visualTheme === 'modern' » de VisualExporterModal.
// Extrait automatiquement lors du découpage : aucune logique modifiée.


export interface VisualThemeModernSectionProps {
  [key: string]: any;
}

export function VisualThemeModernSection(props: VisualThemeModernSectionProps) {
  const {
    text,
    clubSettings,
    name,
    badgeTitle,
    displayedMatches,
    key,
    p,
  } = props;

  return (
                    <>
                      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative z-10 w-full h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b-2 border-white/10 pb-4">
                          <div className="font-bebas text-4xl font-black text-amber-400">{clubSettings.name}</div>
                          <span className="px-6 py-1.5 rounded-full bg-slate-800 text-white text-2xl font-bold border border-slate-700">
                            {badgeTitle}
                          </span>
                        </div>

                        <div className="my-auto space-y-4">
                          {displayedMatches.map((m) => (
                            <div key={m.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 shadow-sm">
                              <div className="min-w-0 flex-1">
                                <div className="text-xl text-orange-400 font-bold uppercase">{m.category}</div>
                                <div className="font-bebas text-3xl font-black text-white truncate">
                                  {m.teamHome} <span className="text-slate-500 font-normal">vs</span> {m.teamAway}
                                </div>
                              </div>
                              <div className="text-2xl font-mono font-bold text-amber-300 bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800">
                                {m.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                    );
}