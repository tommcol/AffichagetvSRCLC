import { MatchItem, StudioElementRole, StudioTemplate } from '../../types';
import { getClubFirstMatchPresentation } from '../../utils/clubFirstMatchPresentation';
import { formatPosterMatchDate } from '../../utils/posterFormattingHelpers';
import { isExemptItem } from '../../utils/socialCaptionGenerator';
import { computeStudioRowBoxes } from '../../utils/studioTemplateHelpers';
import { StudioElementView } from '../Admin/studio/StudioElementView';
import { PosterMedia } from './PosterMedia';

interface StudioTemplatePosterProps {
  template: StudioTemplate;
  matches: MatchItem[];
  title: string;
  clubName: string;
  clubLogoUrl?: string;
  clubShortName: string;
}

export function StudioTemplatePoster({ template, matches, title, clubName, clubShortName, clubLogoUrl }: StudioTemplatePosterProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: template.previewBgColor ?? '#374151' }}>
      {template.previewBgUrl && (
        <PosterMedia src={template.previewBgUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {computeStudioRowBoxes(template, matches.length).map((box) => {
        const match = matches[box.index];
        const { teamLeft, teamRight, scoreText } = getClubFirstMatchPresentation(match, clubName, clubShortName, isExemptItem(match));
        const values: Partial<Record<StudioElementRole, string>> = {
          title,
          team: teamLeft,
          opponent: teamRight,
          score: match.homeScore != null && match.awayScore != null ? scoreText : '',
          date: formatPosterMatchDate(match.date, match.time),
          status: match.result === 'win' ? 'VICTOIRE' : match.result === 'loss' ? 'DÉFAITE' : '',
        };

        return (
          <div key={match.id} className="absolute" style={{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.w}%`,
            height: `${box.h}%`,
            containerType: 'size',
          }}>
            {template.rowElements.map((element) => (
              <StudioElementView key={element.id} element={element}
                imageUrl={element.role === 'clubLogo' ? clubLogoUrl : undefined}
                textOverride={values[element.role]} />
            ))}
          </div>
        );
      })}
      {template.decor.map((element) => (
        <StudioElementView key={element.id} element={element}
          imageUrl={element.role === 'clubLogo' ? clubLogoUrl : undefined}
          textOverride={element.role === 'title' ? (element.text || title) : undefined} />
      ))}
    </div>
  );
}
