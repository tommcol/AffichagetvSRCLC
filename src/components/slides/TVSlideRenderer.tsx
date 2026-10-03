import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { FFBBService, normalizeCategoryKey } from '../../services/ffbbService';

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

const getCurrentWeekendBounds = (referenceDate = new Date()): { start: Date; end: Date } => {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const fridayOffset = day === 0 ? -2 : 5 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + fridayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const isCurrentWeekendResult = (match: MatchItem, referenceDate = new Date()): boolean => {
  const { start, end } = getCurrentWeekendBounds(referenceDate);
  const matchDate = new Date(`${match.date}T12:00:00`);
  return !Number.isNaN(matchDate.getTime()) && matchDate >= start && matchDate <= end;
};

const getMatchOpponent = (match: MatchItem): string =>
  match.isHomeMatch ? match.teamAway : match.teamHome;

const normalizeMatchText = (value?: string): string =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const findFfbbResultForMatch = (match: MatchItem, results: MatchItem[]): MatchItem | undefined => {
  const directKey = match.ffbbMatchNumber || match.id;
  const direct = results.find((result) => {
    const resultKey = result.ffbbMatchNumber || result.id;
    return Boolean(directKey && resultKey && directKey.toLowerCase() === resultKey.toLowerCase());
  });
  if (direct) return direct;

  const categoryKey = normalizeCategoryKey(match.rawFfbbCategory || match.category);
  const opponentKey = normalizeMatchText(getMatchOpponent(match));

  return results.find((result) => {
    if (result.date !== match.date) return false;
    const resultCategoryKey = normalizeCategoryKey(result.rawFfbbCategory || result.category);
    if (categoryKey && resultCategoryKey && categoryKey !== resultCategoryKey) return false;
    const resultOpponentKey = normalizeMatchText(getMatchOpponent(result));
    return !opponentKey || !resultOpponentKey || opponentKey === resultOpponentKey || opponentKey.includes(resultOpponentKey) || resultOpponentKey.includes(opponentKey);
  });
};

const applyFfbbResultsToMatches = (matches: MatchItem[], ffbbResults: MatchItem[]): MatchItem[] =>
  matches.map((match) => {
    const result = findFfbbResultForMatch(match, ffbbResults);
    if (!result || result.result === null || result.result === undefined) return match;

    return {
      ...match,
      status: 'finished',
      result: result.result,
      ...(result.homeScore !== undefined ? { homeScore: result.homeScore } : {}),
      ...(result.awayScore !== undefined ? { awayScore: result.awayScore } : {}),
      finishedAt: result.finishedAt || Date.now(),
    };
  });

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
  const [ffbbResults, setFfbbResults] = useState<MatchItem[]>([]);
  const ffbbAlertSignaturesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const syncFfbbResults = async () => {
      try {
        const data = await FFBBService.fetchClubData(clubSettings.codeFFBB);
        if (cancelled) return;

        const weekendResults = data.results.filter(
          (result) =>
            isCurrentWeekendResult(result) &&
            result.result !== null &&
            result.result !== undefined &&
            result.homeScore !== undefined &&
            result.awayScore !== undefined
        );

        setFfbbResults(weekendResults);

        let activeAlerts: Array<{ matchId?: string; triggeredBy?: string; ourScore?: number; opponentScore?: number }> = [];
        try {
          const alertResponse = await fetch('/api/get-alerts');
          if (alertResponse.ok) {
            const alertData = await alertResponse.json();
            activeAlerts = Array.isArray(alertData?.alerts) ? alertData.alerts : [];
          }
        } catch {
          // Le résultat FFBB reste affichable même si la lecture des alertes échoue.
        }

        for (const ffbbResult of weekendResults) {
          const signature = `${ffbbResult.ffbbMatchNumber || ffbbResult.id}:${ffbbResult.homeScore}-${ffbbResult.awayScore}`;
          if (ffbbAlertSignaturesRef.current.has(signature)) continue;

          const alreadyActive = activeAlerts.some(
            (alert) =>
              alert.triggeredBy === 'ffbb' &&
              alert.matchId &&
              alert.matchId === ffbbResult.id &&
              alert.ourScore !== undefined &&
              alert.opponentScore !== undefined &&
              ((ffbbResult.isHomeMatch && alert.ourScore === ffbbResult.homeScore && alert.opponentScore === ffbbResult.awayScore) ||
                (!ffbbResult.isHomeMatch && alert.ourScore === ffbbResult.awayScore && alert.opponentScore === ffbbResult.homeScore))
          );

          if (alreadyActive) {
            ffbbAlertSignaturesRef.current.add(signature);
            continue;
          }

          const ourScore = ffbbResult.isHomeMatch ? ffbbResult.homeScore! : ffbbResult.awayScore!;
          const opponentScore = ffbbResult.isHomeMatch ? ffbbResult.awayScore! : ffbbResult.homeScore!;
          const alert = FFBBService.createFinishedNotification(
            ffbbResult,
            ourScore,
            opponentScore,
            60
          );

          try {
            const response = await fetch('/api/add-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(alert),
            });
            if (response.ok) {
              ffbbAlertSignaturesRef.current.add(signature);
            }
          } catch {
            // Le prochain cycle retentera l'injection de l'alerte FFBB.
          }
        }
      } catch (error) {
        console.warn('Synchronisation automatique FFBB TV impossible:', error);
      }
    };

    void syncFfbbResults();
    const interval = window.setInterval(() => {
      void syncFfbbResults();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [clubSettings.codeFFBB]);

  const matchesWithFfbbResults = useMemo(
    () => applyFfbbResultsToMatches(matches, ffbbResults),
    [matches, ffbbResults]
  );

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

  if (slide.type === 'alert' && slide.alert) {
    return (
      <MatchAlertSlide
        alert={slide.alert}
        teamVisual={matchingTeamVisual}
        visualTemplates={visualTemplates}
        clubSettings={clubSettings}
        onVideoEnded={onVideoEnded}
        onVideoTimeUpdate={onVideoTimeUpdate}
      />
    );
  }

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
        ? matchesWithFfbbResults.filter((m) => m.isHomeMatch)
        : slide.filterScope === 'away'
        ? matchesWithFfbbResults.filter((m) => !m.isHomeMatch)
        : matchesWithFfbbResults;

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
          customHeaderTitle={
            slide.customTitle ||
            (slide.filterScope === 'home'
              ? matchesEffective.categoryTheme?.customHeaderTitleHome
              : slide.filterScope === 'away'
              ? matchesEffective.categoryTheme?.customHeaderTitleAway
              : matchesEffective.categoryTheme?.customHeaderTitle)
          }
          onVideoEnded={onVideoEnded}
          onVideoTimeUpdate={onVideoTimeUpdate}
        />
      );
    }

    if (slide.categoryId === 'results') {
      const activeResults = results.filter((r) => r.selectedForWeekend !== false);
      const resultsToUse = activeResults;
      const filteredResults = slide.filterScope === 'home'
        ? resultsToUse.filter((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
        : slide.filterScope === 'away'
        ? resultsToUse.filter((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
        : resultsToUse;

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
          customHeaderTitle={
            slide.customTitle ||
            (slide.filterScope === 'home'
              ? resultsEffective.categoryTheme?.customHeaderTitleHome
              : slide.filterScope === 'away'
              ? resultsEffective.categoryTheme?.customHeaderTitleAway
              : resultsEffective.categoryTheme?.customHeaderTitle)
          }
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