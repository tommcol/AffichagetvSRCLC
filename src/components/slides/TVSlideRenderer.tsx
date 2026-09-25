import React, { useMemo } from 'react';
import {
  CarouselSlide,
  ClubSettings,
  MatchItem,
  SponsorItem,
  ClubLogoItem,
  ClubPhotoItem,
  BirthdayItem,
  ClubEventItem,
  TeamVisualItem,
  VisualTemplatesConfig,
} from '../../types';
import { MatchesSlide } from './MatchesSlide';
import { ResultsSlide } from './ResultsSlide';
import { SponsorsSlide } from './SponsorsSlide';
import { LogosSlide } from './LogosSlide';
import { PhotosSlide } from './PhotosSlide';
import { BirthdaysSlide } from './BirthdaysSlide';
import { EventsSlide } from './EventsSlide';
import { MatchAlertSlide } from './MatchAlertSlide';
import { getEffectiveCategoryConfig } from '../../utils/themeUtils';
import { isClubHomeMatch } from '../../utils/matchStatus';

export interface TVSlideRendererProps {
  slide: CarouselSlide;
  clubSettings: ClubSettings;
  matches: MatchItem[];
  results: MatchItem[];
  sponsors: SponsorItem[];
  logos: ClubLogoItem[];
  photos: ClubPhotoItem[];
  birthdays: BirthdayItem[];
  events: ClubEventItem[];
  teamVisuals?: TeamVisualItem[];
  visualTemplates?: VisualTemplatesConfig;
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (percent: number) => void;
  onDownloadVisual?: (type: 'matches' | 'results') => void;
  hideShareButton?: boolean;
}

export const TVSlideRenderer: React.FC<TVSlideRendererProps> = ({
  slide,
  clubSettings,
  matches,
  results,
  sponsors,
  logos,
  photos,
  birthdays,
  events,
  teamVisuals = [],
  visualTemplates,
  onVideoEnded,
  onVideoTimeUpdate,
  onDownloadVisual,
  hideShareButton = true,
}) => {
  const matchesEffective = useMemo(
    () => getEffectiveCategoryConfig('matches', visualTemplates, clubSettings),
    [visualTemplates, clubSettings]
  );
  const resultsEffective = useMemo(
    () => getEffectiveCategoryConfig('results', visualTemplates, clubSettings),
    [visualTemplates, clubSettings]
  );
  const birthdaysEffective = useMemo(
    () => getEffectiveCategoryConfig('birthdays', visualTemplates, clubSettings),
    [visualTemplates, clubSettings]
  );

  const matchingTeamVisual = useMemo(() => {
    if (slide.type === 'alert' && slide.alert) {
      return teamVisuals.find((t) => t.category === slide.alert?.team || t.teamName === slide.alert?.team);
    }
    return undefined;
  }, [slide, teamVisuals]);

  // Case A: Active Victory / Defeat Alert Slide
  if (slide.type === 'alert' && slide.alert) {
    return <MatchAlertSlide alert={slide.alert} teamVisual={matchingTeamVisual} />;
  }

  // Case B: Category Visuals
  if (slide.type === 'category') {
    if (slide.categoryId === 'photos') {
      return (
        <PhotosSlide
          photo={slide.photo}
          photos={photos}
          itemIndex={slide.itemIndex}
          totalItems={slide.totalItems}
          hideTextOverlay={clubSettings.hideTextOverlays ?? true}
          onVideoEnded={onVideoEnded}
          onVideoTimeUpdate={onVideoTimeUpdate}
        />
      );
    }

    if (slide.categoryId === 'sponsors') {
      return (
        <SponsorsSlide
          sponsor={slide.sponsor}
          sponsors={sponsors}
          itemIndex={slide.itemIndex}
          totalItems={slide.totalItems}
          clubSettings={clubSettings}
          onVideoEnded={onVideoEnded}
          onVideoTimeUpdate={onVideoTimeUpdate}
        />
      );
    }

    if (slide.categoryId === 'logos') {
      return (
        <LogosSlide
          logo={slide.logo}
          logos={logos}
          itemIndex={slide.itemIndex}
          totalItems={slide.totalItems}
          onVideoEnded={onVideoEnded}
          onVideoTimeUpdate={onVideoTimeUpdate}
        />
      );
    }

    if (slide.categoryId === 'matches') {
      const filteredMatches = slide.filterScope === 'home'
        ? matches.filter((m) => m.isHomeMatch)
        : slide.filterScope === 'away'
        ? matches.filter((m) => !m.isHomeMatch)
        : matches;

      return (
        <MatchesSlide
          matches={filteredMatches}
          customHomeMatches={slide.matchesPage?.homeMatches}
          customAwayMatches={slide.matchesPage?.awayMatches}
          pageNumber={slide.matchesPage?.pageNumber}
          totalPages={slide.matchesPage?.totalPages}
          clubSettings={clubSettings}
          backgroundUrl={matchesEffective.backgroundUrl}
          onDownloadVisual={onDownloadVisual ? () => onDownloadVisual('matches') : undefined}
          hideShareButton={hideShareButton}
          theme={matchesEffective.theme}
          mascot={matchesEffective.mascot}
          layer3={matchesEffective.layer3}
          layer4={matchesEffective.layer4}
          customHeaderTitle={slide.customTitle || matchesEffective.categoryTheme?.customHeaderTitle}
          onVideoEnded={onVideoEnded}
          onVideoTimeUpdate={onVideoTimeUpdate}
        />
      );
    }

    if (slide.categoryId === 'results') {
      const filteredResults = slide.filterScope === 'home'
        ? results.filter((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
        : slide.filterScope === 'away'
        ? results.filter((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
        : results;

      return (
        <ResultsSlide
          results={filteredResults}
          clubSettings={clubSettings}
          backgroundUrl={resultsEffective.backgroundUrl}
          onDownloadVisual={onDownloadVisual ? () => onDownloadVisual('results') : undefined}
          hideShareButton={hideShareButton}
          theme={resultsEffective.theme}
          mascot={resultsEffective.mascot}
          layer3={resultsEffective.layer3}
          layer4={resultsEffective.layer4}
          customHeaderTitle={slide.customTitle || resultsEffective.categoryTheme?.customHeaderTitle}
          onVideoEnded={onVideoEnded}
          onVideoTimeUpdate={onVideoTimeUpdate}
        />
      );
    }

    if (slide.categoryId === 'birthdays') {
      return (
        <BirthdaysSlide
          birthdays={birthdays}
          clubSettings={clubSettings}
          backgroundUrl={birthdaysEffective.backgroundUrl}
          theme={birthdaysEffective.theme}
          mascot={birthdaysEffective.mascot}
          layer3={birthdaysEffective.layer3}
          layer4={birthdaysEffective.layer4}
          onVideoEnded={onVideoEnded}
          onVideoTimeUpdate={onVideoTimeUpdate}
        />
      );
    }

    if (slide.categoryId === 'events') {
      return (
        <EventsSlide
          event={slide.event}
          events={events}
          itemIndex={slide.itemIndex}
          totalItems={slide.totalItems}
          clubSettings={clubSettings}
        />
      );
    }

    if (slide.categoryId === 'standby') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center select-none">
          {clubSettings.logoUrl && (
            <img
              src={clubSettings.logoUrl}
              alt={clubSettings.name}
              className="w-36 h-36 object-contain mb-6 drop-shadow-xl"
              referrerPolicy="no-referrer"
            />
          )}
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-wide font-bebas uppercase mb-2">
            {clubSettings.name || 'Club Omnisports'}
          </h2>
          {clubSettings.city && (
            <p className="text-slate-400 text-lg font-semibold max-w-md mb-6">
              {clubSettings.city}
            </p>
          )}
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-mono uppercase tracking-widest">
            Affichage dynamique • En attente de contenu
          </div>
        </div>
      );
    }
  }

  return null;
};
