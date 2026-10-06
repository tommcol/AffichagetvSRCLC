import {
  CarouselSlide,
  CategoryConfig,
  ClubSettings,
  MatchItem,
  SponsorItem,
  ClubLogoItem,
  ClubPhotoItem,
  ClubEventItem,
  BirthdayItem,
  ActiveMatchAlert,
  VisualTemplatesConfig,
} from '../types';
import { isClubHomeMatch } from './matchStatus';
import { isMatchInCurrentWeekend } from './matchDateHelper';

export interface BuildCarouselPlaylistParams {
  activeAlerts: ActiveMatchAlert[];
  categories: CategoryConfig[];
  sponsors: SponsorItem[];
  logos: ClubLogoItem[];
  photos: ClubPhotoItem[];
  events: ClubEventItem[];
  matches: MatchItem[];
  results: MatchItem[];
  birthdays: BirthdayItem[];
  clubSettings: ClubSettings;
  visualTemplates: VisualTemplatesConfig;
}

export function buildCarouselPlaylist({
  activeAlerts,
  categories,
  sponsors,
  logos,
  photos,
  events,
  matches,
  results,
  birthdays,
  clubSettings,
  visualTemplates,
}: BuildCarouselPlaylistParams): CarouselSlide[] {
  const isBalanced = clubSettings.balancedLoopMode !== false;
  const enabledCategories = categories.filter((c) => c.enabled);

  // Step A: Build pools of slides per category
  const pools: { [key: string]: CarouselSlide[] } = {};

  // 1. Alerts Pool (unexpired 1-hour alerts)
  const unexpiredAlerts = activeAlerts.filter((a) => a.expiresAt > Date.now());
  if (unexpiredAlerts.length > 0) {
    pools['alerts'] = unexpiredAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      type: 'alert' as const,
      alert,
      durationSeconds: clubSettings.victoryPhotoDurationSeconds ?? 10,
      label: `${alert.team} • ${alert.isWin ? 'VICTOIRE' : 'DÉFAITE'}`,
    }));
  }

  // 2. Standard Category Pools (only add categories that actually contain content/photos)
  enabledCategories.forEach((cat) => {
    if (cat.id === 'sponsors') {
      if (sponsors.length > 0) {
        const getPassCount = (tier?: string): number => {
          if (tier === 'gold') return 3;
          if (tier === 'silver') return 2;
          return 1; // bronze or partenaire = 1 passage
        };

        const sponsorPasses: CarouselSlide[] = [];
        const maxPasses = Math.max(1, ...sponsors.map((s) => getPassCount(s.tier)));

        for (let pass = 0; pass < maxPasses; pass++) {
          sponsors.forEach((sp, idx) => {
            if (getPassCount(sp.tier) > pass) {
              sponsorPasses.push({
                id: `cat-sponsors-${sp.id}-pass-${pass + 1}`,
                type: 'category' as const,
                categoryId: 'sponsors',
                sponsor: sp,
                itemIndex: idx,
                totalItems: sponsors.length,
                durationSeconds: cat.durationSeconds,
                label: `Sponsor: ${sp.name} (${(sp.tier || 'partenaire').toUpperCase()} - Passage ${pass + 1})`,
              });
            }
          });
        }

        if (sponsorPasses.length > 0) {
          pools['sponsors'] = sponsorPasses;
        }
      }
    } else if (cat.id === 'photos') {
      if (photos.length > 0) {
        pools['photos'] = photos.map((ph, idx) => ({
          id: `cat-photos-${ph.id}`,
          type: 'category' as const,
          categoryId: 'photos',
          photo: ph,
          itemIndex: idx,
          totalItems: photos.length,
          durationSeconds: cat.durationSeconds,
          label: `Photo: ${ph.title || `Photo ${idx + 1}`}`,
        }));
      }
    } else if (cat.id === 'logos') {
      if (logos.length > 0) {
        pools['logos'] = logos.map((lg, idx) => ({
          id: `cat-logos-${lg.id}`,
          type: 'category' as const,
          categoryId: 'logos',
          logo: lg,
          itemIndex: idx,
          totalItems: logos.length,
          durationSeconds: cat.durationSeconds,
          label: `Logo: ${lg.name}`,
        }));
      }
    } else if (cat.id === 'events') {
      if (events.length > 0) {
        pools['events'] = events.map((ev, idx) => ({
          id: `cat-events-${ev.id}`,
          type: 'category' as const,
          categoryId: 'events',
          event: ev,
          itemIndex: idx,
          totalItems: events.length,
          durationSeconds: cat.durationSeconds,
          label: `Événement: ${ev.title}`,
        }));
      }
    } else if (cat.id === 'matches') {
      const weekendMatches = matches.filter(
        (m) => m.selectedForWeekend !== false && isMatchInCurrentWeekend(m.date)
      );
      const sortMatches = (a: MatchItem, b: MatchItem) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.time || '').localeCompare(b.time || '');
      };

      if (weekendMatches.length > 0) {
        const homeList = weekendMatches.filter((m) => m.isHomeMatch).sort(sortMatches);
        const awayList = weekendMatches.filter((m) => !m.isHomeMatch).sort(sortMatches);

        const customTitle = visualTemplates.matchesSettings?.customHeaderTitle?.trim();
        const customTitleHome = visualTemplates.matchesSettings?.customHeaderTitleHome?.trim();
        const customTitleAway = visualTemplates.matchesSettings?.customHeaderTitleAway?.trim();
        const rawDisplayScope = visualTemplates.matchesSettings?.matchDisplayScope;
        // Seuls deux modes : "all" (Tout) ou "split" (Domicile & Extérieur séparés). Les anciennes valeurs "home"/"away" sont converties en "split".
        const displayScope: 'split' | 'all' = rawDisplayScope === 'all' ? 'all' : 'split';

        const matchSlides: CarouselSlide[] = [];

        if (displayScope === 'all') {
          // MODE 1 — TOUT : chaque match dispose de son propre passage dans la boucle.
          const effectiveTitle = customTitle || 'LES RENCONTRES DU WEEK-END';
          weekendMatches.forEach((match, index) => {
            matchSlides.push({
              id: `cat-matches-all-${match.id}`,
              type: 'category' as const,
              categoryId: 'matches' as const,
              filterScope: 'all' as const,
              matchesPage: {
                homeMatches: match.isHomeMatch ? [match] : [],
                awayMatches: match.isHomeMatch ? [] : [match],
                pageNumber: index + 1,
                totalPages: weekendMatches.length,
              },
              customTitle: weekendMatches.length > 1
                ? `${effectiveTitle} (${index + 1}/${weekendMatches.length})`
                : effectiveTitle,
              durationSeconds: cat.durationSeconds,
              label: `Match ${index + 1}/${weekendMatches.length}`,
            });
          });
        } else {
          // MODE 2 — DOMICILE & EXTÉRIEUR SÉPARÉS : Matchs Domicile puis Matchs Extérieur
          const effectiveTitleHome = customTitleHome || 'LES RENCONTRES À DOMICILE';
          const effectiveTitleAway = customTitleAway || "LES RENCONTRES À L'EXTÉRIEUR";
          if (homeList.length > 0) {
            homeList.forEach((match, index) => {
              matchSlides.push({
                id: `cat-matches-home-${match.id}`,
                type: 'category' as const,
                categoryId: 'matches' as const,
                filterScope: 'home' as const,
                matchesPage: {
                  homeMatches: [match],
                  awayMatches: [],
                  pageNumber: index + 1,
                  totalPages: homeList.length,
                },
                customTitle: homeList.length > 1
                  ? `${effectiveTitleHome} (${index + 1}/${homeList.length})`
                  : effectiveTitleHome,
                durationSeconds: cat.durationSeconds,
                label: `Match Domicile ${index + 1}/${homeList.length}`,
              });
            });
          }

          if (awayList.length > 0) {
            awayList.forEach((match, index) => {
              matchSlides.push({
                id: `cat-matches-away-${match.id}`,
                type: 'category' as const,
                categoryId: 'matches' as const,
                filterScope: 'away' as const,
                matchesPage: {
                  homeMatches: [],
                  awayMatches: [match],
                  pageNumber: index + 1,
                  totalPages: awayList.length,
                },
                customTitle: awayList.length > 1
                  ? `${effectiveTitleAway} (${index + 1}/${awayList.length})`
                  : effectiveTitleAway,
                durationSeconds: cat.durationSeconds,
                label: `Match Extérieur ${index + 1}/${awayList.length}`,
              });
            });
          }
        }

        if (matchSlides.length > 0) {
          pools['matches'] = matchSlides;
        }
      }
    } else if (cat.id === 'results') {
      const activeResults = results.filter(
        (r) => r.selectedForWeekend !== false && isMatchInCurrentWeekend(r.date)
      );
      const resultsToUse = activeResults;

      const sortMatches = (a: MatchItem, b: MatchItem) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.time || '').localeCompare(b.time || '');
      };

      const homeResults = resultsToUse.filter((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName)).sort(sortMatches);
      const awayResults = resultsToUse.filter((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName)).sort(sortMatches);

      const customTitle = visualTemplates.resultsSettings?.customHeaderTitle?.trim();
      const customTitleHome = visualTemplates.resultsSettings?.customHeaderTitleHome?.trim();
      const customTitleAway = visualTemplates.resultsSettings?.customHeaderTitleAway?.trim();
      const rawDisplayScope = visualTemplates.resultsSettings?.matchDisplayScope;
      const displayScope: 'split' | 'all' = rawDisplayScope === 'all' ? 'all' : 'split';

      const resultSlides: CarouselSlide[] = [];

      if (displayScope === 'all') {
        // MODE 1 — TOUT : Tous les résultats ensemble
        if (resultsToUse.length > 0) {
          resultSlides.push({
            id: 'cat-results-all',
            type: 'category' as const,
            categoryId: 'results' as const,
            filterScope: 'all' as const,
            customTitle: customTitle || 'RÉSULTATS DU WEEK-END',
            durationSeconds: cat.durationSeconds,
            label: 'Tous les Résultats',
          });
        }
      } else {
        // MODE 2 — DOMICILE & EXTÉRIEUR SÉPARÉS : Résultats Domicile puis Résultats Extérieur
        if (homeResults.length > 0) {
          resultSlides.push({
            id: 'cat-results-home',
            type: 'category' as const,
            categoryId: 'results' as const,
            filterScope: 'home' as const,
            customTitle: customTitleHome || 'LES RÉSULTATS À DOMICILE',
            durationSeconds: cat.durationSeconds,
            label: 'Résultats Domicile',
          });
        }

        if (awayResults.length > 0) {
          resultSlides.push({
            id: 'cat-results-away',
            type: 'category' as const,
            categoryId: 'results' as const,
            filterScope: 'away' as const,
            customTitle: customTitleAway || "LES RÉSULTATS À L'EXTÉRIEUR",
            durationSeconds: cat.durationSeconds,
            label: 'Résultats Extérieur',
          });
        }

        if (resultSlides.length === 0 && resultsToUse.length > 0) {
          resultSlides.push({
            id: 'cat-results',
            type: 'category' as const,
            categoryId: 'results' as const,
            filterScope: 'all' as const,
            customTitle: customTitle || 'RÉSULTATS DU WEEK-END',
            durationSeconds: cat.durationSeconds,
            label: cat.label,
          });
        }
      }

      if (resultSlides.length > 0) {
        pools['results'] = resultSlides;
      }
    } else if (cat.id === 'birthdays') {
      if (birthdays.length > 0) {
        pools['birthdays'] = [
          {
            id: `cat-${cat.id}`,
            type: 'category' as const,
            categoryId: cat.id,
            durationSeconds: cat.durationSeconds,
            label: cat.label,
          },
        ];
      }
    } else {
      pools[cat.id] = [
        {
          id: `cat-${cat.id}`,
          type: 'category' as const,
          categoryId: cat.id,
          durationSeconds: cat.durationSeconds,
          label: cat.label,
        },
      ];
    }
  });

  const fallbackSlide: CarouselSlide = {
    id: 'fallback-standby',
    type: 'category',
    categoryId: 'standby',
    durationSeconds: 15,
    label: clubSettings.name || 'Club',
  };

  if (!isBalanced) {
    // Sequential Mode
    const sequentialList: CarouselSlide[] = [];
    Object.keys(pools).forEach((k) => sequentialList.push(...pools[k]));
    return sequentialList.length > 0 ? sequentialList : [fallbackSlide];
  }

  // Balanced Mode (Mélange Équilibré Intercalé - Une seule fois chaque visuel)
  const balancedList: CarouselSlide[] = [];
  const poolKeys = Object.keys(pools);

  if (poolKeys.length === 0) {
    return [fallbackSlide];
  }

  interface SpacedItem {
    slide: CarouselSlide;
    targetPosition: number;
  }

  const spacedItems: SpacedItem[] = [];

  // Calculate total count of unique items across all active pools
  let totalItemsCount = 0;
  poolKeys.forEach((key) => {
    totalItemsCount += pools[key].length;
  });

  poolKeys.forEach((key, poolIdx) => {
    const originalPool = pools[key];
    const N = originalPool.length;
    if (N === 0) return;

    const stepSize = totalItemsCount / N;
    const offset = (poolIdx * (stepSize / poolKeys.length)) % stepSize;

    originalPool.forEach((slide, idx) => {
      const targetPosition = idx * stepSize + offset;
      spacedItems.push({
        slide,
        targetPosition,
      });
    });
  });

  // Sort all items by their calculated target position to interleave categories perfectly
  spacedItems.sort((a, b) => a.targetPosition - b.targetPosition);

  spacedItems.forEach((item) => {
    balancedList.push(item.slide);
  });

  return balancedList.length > 0 ? balancedList : [fallbackSlide];
}
