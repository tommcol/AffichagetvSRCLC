import React from 'react';
import type { FontFamilyOption, MatchItem } from '../../types';
import type { PosterAspectRatio } from '../../utils/posterExporter';
import type { TeamCalendarRow } from '../../utils/teamCalendarHelpers';
import { formatTeamCalendarDate } from '../../utils/teamCalendarHelpers';
import { getClubFirstMatchPresentation } from '../../utils/clubFirstMatchPresentation';
import { getAdaptivePosterCardSizing } from '../../utils/posterAdaptiveSizing';
import { getFontFamilyClass } from '../../utils/fontUtils';
import { isExemptItem } from '../../utils/socialCaptionGenerator';
import { AutoFitTeamName } from '../AutoFitTeamName';

export function TeamCalendarRows({ rows, aspectRatio, fontHeader, fontBody, dateColor, dateTextColor,
  clubName, shortName }: {
  rows: TeamCalendarRow[]; aspectRatio: PosterAspectRatio;
  fontHeader: FontFamilyOption; fontBody: FontFamilyOption;
  dateColor: string; dateTextColor: string; clubName?: string; shortName?: string;
}) {
  const sizing = getAdaptivePosterCardSizing(rows.length, aspectRatio);
  const h = sizing.pillHeight;
  const dateCell = (match: MatchItem | undefined, label: string) => {
    if (!match) return <div className="min-w-0" aria-label={`${label} non renseigné dans la période`} />;
    const home = getClubFirstMatchPresentation(match, clubName, shortName).isHome;
    return <div className="min-w-0 flex flex-col items-center gap-2" data-calendar-side={label}>
      <span className={`font-bold uppercase tracking-wider text-slate-200 ${getFontFamilyClass(fontBody)}`}
        style={{ fontSize: Math.max(18, Math.min(28, h * .25)) }}>
        {isExemptItem(match) ? 'Exempt' : home ? 'Domicile' : 'Extérieur'}
      </span>
      <div className={`w-full min-w-0 rounded-full shadow-lg border border-white/20 flex items-center justify-center ${getFontFamilyClass(fontHeader)}`}
        style={{ height: h, background: `linear-gradient(180deg, ${dateColor} 0%, ${dateColor}dd 100%)` }}>
        <AutoFitTeamName name={formatTeamCalendarDate(match.date)} pillHeight={h} count={rows.length}
          aspectRatio={aspectRatio} fontHeader={fontHeader} textColor={dateTextColor} />
      </div>
    </div>;
  };
  return <div className="w-full flex-1 min-h-0 flex flex-col justify-center my-auto"
    style={{ gap: sizing.gapY }} data-team-calendar="true">
    {rows.map(row => <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)] items-end gap-3 w-full min-w-0"
      data-calendar-row={row.id}>
      {dateCell(row.first, 'Aller')}
      <div className="min-w-0 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-lg flex items-center justify-center"
        style={{ height: h }}>
        <AutoFitTeamName name={row.opponent} pillHeight={h} count={rows.length} aspectRatio={aspectRatio}
          fontHeader={fontHeader} textColor="#e2e8f0" />
      </div>
      {dateCell(row.second, 'Retour')}
    </div>)}
  </div>;
}
