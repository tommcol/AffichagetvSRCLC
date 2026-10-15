// VisualThemeBrickSection — bloc « visualTheme === 'brick' » de VisualExporterModal.
// Extrait automatiquement lors du découpage : aucune logique modifiée.

import { AutoFitTeamName } from '../AutoFitTeamName';

export interface VisualThemeBrickSectionProps {
  [key: string]: any;
}

export function VisualThemeBrickSection(props: VisualThemeBrickSectionProps) {
  const {
    text,
    clubSettings,
    name,
    badgeTitle,
    displayedMatches,
    key,
  } = props;

  return (
                    <>
                      <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="brick-pat-modal" width="100" height="50" patternUnits="userSpaceOnUse">
                            <rect width="100" height="50" fill="#4a1610" />
                            <path d="M 0 0 L 100 0 M 0 25 L 100 25 M 0 50 L 100 50 M 50 0 L 50 25 M 0 25 L 0 50 M 100 25 L 100 50" stroke="#1f0704" strokeWidth="4" fill="none" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#brick-pat-modal)" />
                      </svg>
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />

                      <div className="relative z-10 w-full h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b-2 border-white/20 pb-4">
                          <div className="font-bebas text-4xl font-black text-white">{clubSettings.name}</div>
                          <span className="px-6 py-1.5 rounded-full bg-red-600 text-white text-2xl font-black uppercase font-bebas">
                            {badgeTitle}
                          </span>
                        </div>

                        <div className="my-auto space-y-4">
                          {displayedMatches.map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-4 py-1">
                              <div className="bg-white text-black font-black px-6 py-3 rounded-xl text-2xl uppercase truncate w-[42%] text-center shadow-md">
                                <AutoFitTeamName name={m.category} />
                              </div>
                              <span className="bg-red-600 text-white font-black italic px-4 py-1.5 rounded text-xl transform -skew-x-12">
                                VS
                              </span>
                              <div className="bg-white text-black font-black px-6 py-3 rounded-xl text-2xl uppercase truncate w-[42%] text-center shadow-md">
                                <AutoFitTeamName name={m.isHomeMatch ? m.teamAway : m.teamHome} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                    );
}