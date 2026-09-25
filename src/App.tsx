import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  DEFAULT_CLUB_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_MATCHES,
  DEFAULT_RESULTS,
  DEFAULT_SPONSORS,
  DEFAULT_CLUB_LOGOS,
  DEFAULT_PHOTOS,
  DEFAULT_BIRTHDAYS,
  DEFAULT_EVENTS,
  DEFAULT_TEAM_VISUALS,
  DEFAULT_VISUAL_TEMPLATES,
} from './data/defaultData';
import {
  CategoryConfig,
  ClubSettings,
  MatchItem,
  SponsorItem,
  ClubLogoItem,
  ClubPhotoItem,
  ClubEventItem,
  BirthdayItem,
  SlideCategory,
  ActiveMatchAlert,
  TeamVisualItem,
  VisualTemplatesConfig,
  CarouselSlide,
} from './types';
import { TVSlideRenderer } from './components/slides/TVSlideRenderer';
import { VisualExporterModal } from './components/VisualExporterModal';
import { AdminPanel } from './components/Admin/AdminPanel';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { getEffectiveCategoryConfig } from './utils/themeUtils';
import { isClubHomeMatch } from './utils/matchStatus';
import { isVideoMedia, registerVideoBlob } from './utils/mediaUtils';
import { getMediaBlobUrl } from './utils/indexedDBStorage';
import { AnimatePresence, motion } from 'motion/react';
import { FixedCanvas169 } from './components/common/FixedCanvas169';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Settings,
  Maximize2,
  Trophy,
  Flame,
  Radio,
  Sliders,
} from 'lucide-react';

function loadStorage<T>(_key: string, fallback: T): T {
  return fallback;
}

export default function App() {
  // Persistence state
  const [clubSettings, setClubSettings] = useState<ClubSettings>(DEFAULT_CLUB_SETTINGS);
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [matches, setMatches] = useState<MatchItem[]>(DEFAULT_MATCHES);
  const [results, setResults] = useState<MatchItem[]>(DEFAULT_RESULTS);
  const [sponsors, setSponsors] = useState<SponsorItem[]>(DEFAULT_SPONSORS);
  const [logos, setLogos] = useState<ClubLogoItem[]>(DEFAULT_CLUB_LOGOS);
  const [photos, setPhotos] = useState<ClubPhotoItem[]>(DEFAULT_PHOTOS);
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>(DEFAULT_BIRTHDAYS);
  const [events, setEvents] = useState<ClubEventItem[]>(DEFAULT_EVENTS);
  const [teamVisuals, setTeamVisuals] = useState<TeamVisualItem[]>(DEFAULT_TEAM_VISUALS);
  const [visualTemplates, setVisualTemplates] = useState<VisualTemplatesConfig>(DEFAULT_VISUAL_TEMPLATES);
  const [activeAlerts, setActiveAlerts] = useState<ActiveMatchAlert[]>([]);
  const [dataChargee, setDataChargee] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthentifie, setAdminAuthentifie] = useState(false);
  const [erreurAuthAdmin, setErreurAuthAdmin] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Controls & TV playback state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Admin and modal state: default to 'admin' mode for configuration, or 'tv' if ?mode=tv is passed (for Fully Kiosk Browser)
  const [viewMode, setViewMode] = useState<'admin' | 'tv'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'tv') return 'tv';
    }
    return 'admin';
  });
  const [visualModalState, setVisualModalState] = useState<{
    isOpen: boolean;
    type: 'matches' | 'results' | 'victory' | 'defeat';
  }>({
    isOpen: false,
    type: 'matches',
  });

  // Chargement des données avec support complet Hors-Ligne (PWA / Cache local)
  useEffect(() => {
    const applyLoadedData = (d: any) => {
      if (!d) return;
      if (d.clubSettings) setClubSettings(d.clubSettings);
      if (d.categories) {
        const clampedCats = d.categories.map((c: CategoryConfig) => ({
          ...c,
          durationSeconds: Math.min(10, Math.max(3, c.durationSeconds || 6)),
        }));
        setCategories(clampedCats);
      }
      if (d.matches) setMatches(d.matches);
      if (d.results) setResults(d.results);
      if (d.sponsors) setSponsors(d.sponsors);
      if (d.logos) setLogos(d.logos);
      if (d.photos) setPhotos(d.photos);
      if (d.birthdays) setBirthdays(d.birthdays);
      if (d.events) setEvents(d.events);
      if (d.teamVisuals) setTeamVisuals(d.teamVisuals);
      if (d.visualTemplates) setVisualTemplates(d.visualTemplates);
    };

    const loadFromOfflineCache = () => {
      try {
        const saved = localStorage.getItem('src_app_data_offline_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          applyLoadedData(parsed);
          return true;
        }
      } catch (e) {
        console.warn('Erreur lecture cache local hors-ligne:', e);
      }
      return false;
    };

    // 1. Tenter la récupération réseau avec fallback automatique sur cache hors-ligne
    fetch('/api/get-app-data')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((res: { data: any }) => {
        if (res.data) {
          applyLoadedData(res.data);
          try {
            localStorage.setItem('src_app_data_offline_cache', JSON.stringify(res.data));
          } catch (e) {}
        } else {
          loadFromOfflineCache();
        }
        setDataChargee(true);
      })
      .catch((err) => {
        console.warn('Réseau indisponible au démarrage - Bascule sur le cache local hors-ligne:', err);
        loadFromOfflineCache();
        setDataChargee(true);
      });

    // Restauration automatique des vidéos stockées dans IndexedDB
    const restoreVideos = async () => {
      try {
        const categoriesToCheck: ('matches' | 'results' | 'birthdays')[] = ['matches', 'results', 'birthdays'];
        for (const cat of categoriesToCheck) {
          const storedBlobUrl = await getMediaBlobUrl(`category_bg_${cat}`);
          if (storedBlobUrl) {
            registerVideoBlob(storedBlobUrl);
            setVisualTemplates((prev) => {
              if (cat === 'matches') {
                return {
                  ...prev,
                  matchesSettings: {
                    ...prev.matchesSettings,
                    backgroundUrl: storedBlobUrl,
                    backgroundMediaType: 'video',
                  },
                  matchesBackgroundUrl: storedBlobUrl,
                };
              } else if (cat === 'results') {
                return {
                  ...prev,
                  resultsSettings: {
                    ...prev.resultsSettings,
                    backgroundUrl: storedBlobUrl,
                    backgroundMediaType: 'video',
                  },
                  resultsBackgroundUrl: storedBlobUrl,
                };
              } else {
                return {
                  ...prev,
                  birthdaysSettings: {
                    ...prev.birthdaysSettings,
                    backgroundUrl: storedBlobUrl,
                    backgroundMediaType: 'video',
                  },
                  birthdaysBackgroundUrl: storedBlobUrl,
                };
              }
            });
          }
        }
      } catch (e) {
        console.warn('Erreur chargement vidéos IndexedDB:', e);
      }
    };
    restoreVideos();
  }, []);

  // Enregistrement automatique (avec anti-rebond de 800ms) dès qu'une donnée change
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!dataChargee || !adminAuthentifie) return;

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      setSaveStatus('saving');
      const payload = {
        password: adminPassword,
        data: {
          clubSettings,
          categories,
          matches,
          results,
          sponsors,
          logos,
          photos,
          birthdays,
          events,
          teamVisuals,
          visualTemplates,
        },
      };

      // Sauvegarde immédiate dans le cache hors-ligne local
      try {
        localStorage.setItem('src_app_data_offline_cache', JSON.stringify(payload.data));
      } catch (e) {}

      const tenter = (estNouvelleTentative: boolean) => {
        fetch('/api/save-app-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then((res) => {
            if (res.ok) {
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 2000);
            } else if (!estNouvelleTentative) {
              setTimeout(() => tenter(true), 3000);
            } else {
              setSaveStatus('error');
              console.error('Échec de l\'enregistrement des données (réponse serveur non OK)');
            }
          })
          .catch((err) => {
            if (!estNouvelleTentative) {
              setTimeout(() => tenter(true), 3000);
            } else {
              setSaveStatus('error');
              console.error('Échec de l\'enregistrement des données :', err);
            }
          });
      };

      tenter(false);
    }, 800);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [
    dataChargee,
    adminAuthentifie,
    adminPassword,
    clubSettings,
    categories,
    matches,
    results,
    sponsors,
    logos,
    photos,
    birthdays,
    events,
    teamVisuals,
    visualTemplates,
  ]);

  // Vérification périodique des alertes victoire/défaite actives
  useEffect(() => {
    const fetchServerAlerts = async () => {
      try {
        const res = await fetch('/api/get-alerts');
        if (res.ok) {
          const data = await res.json();
          if (data.alerts && Array.isArray(data.alerts)) {
            const now = Date.now();
            const valid = data.alerts.filter((a: ActiveMatchAlert) => a.expiresAt > now);
            setActiveAlerts((prev) => {
              if (prev.length === valid.length && prev.every((p, i) => p.id === valid[i]?.id)) {
                return prev;
              }
              return valid;
            });
          }
        }
      } catch (err) {
        // silencieux
      }
    };

    fetchServerAlerts();
    const interval = setInterval(fetchServerAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  // Actualisation automatique des résultats et matchs depuis le serveur (mise à jour continue en temps réel)
  useEffect(() => {
    const pollUpdatedData = async () => {
      // En mode TV (non administrateur actif), synchroniser automatiquement les nouveaux résultats et matchs
      if (adminAuthentifie && viewMode === 'admin') return;
      try {
        const res = await fetch('/api/get-app-data');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            const d = json.data;
            if (Array.isArray(d.results)) {
              setResults((prev) => {
                const prevJson = JSON.stringify(prev);
                const nextJson = JSON.stringify(d.results);
                return prevJson === nextJson ? prev : d.results;
              });
            }
            if (Array.isArray(d.matches)) {
              setMatches((prev) => {
                const prevJson = JSON.stringify(prev);
                const nextJson = JSON.stringify(d.matches);
                return prevJson === nextJson ? prev : d.matches;
              });
            }
          }
        }
      } catch (err) {
        // silencieux
      }
    };

    // Polling toutes les 30 secondes
    const dataPollInterval = setInterval(pollUpdatedData, 30000);
    return () => clearInterval(dataPollInterval);
  }, [adminAuthentifie, viewMode]);

  // Filter out any expired alerts every 30 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setActiveAlerts((prev) => {
        const filtered = prev.filter((a) => a.expiresAt > now);
        if (filtered.length === prev.length) return prev;
        return filtered;
      });
    }, 30000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Build the full carousel rotation playlist
  // Alternates dynamically between categories (Mélange Équilibré) so spectators never see 10 sponsors or 10 photos back-to-back!
  const carouselPlaylist: CarouselSlide[] = useMemo(() => {
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
        durationSeconds: 18,
        label: `${alert.team} • ${alert.isWin ? 'VICTOIRE' : 'DÉFAITE'}`,
      }));
    }

    // 2. Standard Category Pools (only add categories that actually contain content/photos)
    enabledCategories.forEach((cat) => {
      if (cat.id === 'sponsors') {
        if (sponsors.length > 0) {
          pools['sponsors'] = sponsors.map((sp, idx) => ({
            id: `cat-sponsors-${sp.id}`,
            type: 'category' as const,
            categoryId: 'sponsors',
            sponsor: sp,
            itemIndex: idx,
            totalItems: sponsors.length,
            durationSeconds: cat.durationSeconds,
            label: `Sponsor: ${sp.name}`,
          }));
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
        const weekendMatches = matches.filter((m) => m.selectedForWeekend !== false);
        const sortMatches = (a: MatchItem, b: MatchItem) => {
          const dateA = a.date || '';
          const dateB = b.date || '';
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return (a.time || '').localeCompare(b.time || '');
        };

        if (weekendMatches.length > 0) {
          const homeList = weekendMatches.filter((m) => m.isHomeMatch).sort(sortMatches);
          const awayList = weekendMatches.filter((m) => !m.isHomeMatch).sort(sortMatches);

          const matchSlides: CarouselSlide[] = [];

          // Slide(s) Domicile
          if (homeList.length > 0) {
            if (homeList.length <= 10) {
              matchSlides.push({
                id: 'cat-matches-home',
                type: 'category' as const,
                categoryId: 'matches' as const,
                filterScope: 'home' as const,
                customTitle: 'LES RENCONTRES À DOMICILE',
                durationSeconds: cat.durationSeconds,
                label: 'Matchs Domicile',
              });
            } else {
              const totalPages = Math.ceil(homeList.length / 10);
              for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
                const pageMatches = homeList.slice(pageIdx * 10, (pageIdx + 1) * 10);
                matchSlides.push({
                  id: `cat-matches-home-page-${pageIdx + 1}`,
                  type: 'category' as const,
                  categoryId: 'matches' as const,
                  filterScope: 'home' as const,
                  matchesPage: {
                    homeMatches: pageMatches,
                    awayMatches: [],
                    pageNumber: pageIdx + 1,
                    totalPages,
                  },
                  customTitle: totalPages > 1 ? `LES RENCONTRES À DOMICILE (${pageIdx + 1}/${totalPages})` : 'LES RENCONTRES À DOMICILE',
                  durationSeconds: cat.durationSeconds,
                  label: `Matchs Domicile (Page ${pageIdx + 1}/${totalPages})`,
                });
              }
            }
          }

          // Slide(s) Extérieur
          if (awayList.length > 0) {
            if (awayList.length <= 10) {
              matchSlides.push({
                id: 'cat-matches-away',
                type: 'category' as const,
                categoryId: 'matches' as const,
                filterScope: 'away' as const,
                customTitle: "LES RENCONTRES À L'EXTÉRIEUR",
                durationSeconds: cat.durationSeconds,
                label: 'Matchs Extérieur',
              });
            } else {
              const totalPages = Math.ceil(awayList.length / 10);
              for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
                const pageMatches = awayList.slice(pageIdx * 10, (pageIdx + 1) * 10);
                matchSlides.push({
                  id: `cat-matches-away-page-${pageIdx + 1}`,
                  type: 'category' as const,
                  categoryId: 'matches' as const,
                  filterScope: 'away' as const,
                  matchesPage: {
                    homeMatches: [],
                    awayMatches: pageMatches,
                    pageNumber: pageIdx + 1,
                    totalPages,
                  },
                  customTitle: totalPages > 1 ? `LES RENCONTRES À L'EXTÉRIEUR (${pageIdx + 1}/${totalPages})` : "LES RENCONTRES À L'EXTÉRIEUR",
                  durationSeconds: cat.durationSeconds,
                  label: `Matchs Extérieur (Page ${pageIdx + 1}/${totalPages})`,
                });
              }
            }
          }

          if (matchSlides.length > 0) {
            pools['matches'] = matchSlides;
          }
        }
      } else if (cat.id === 'results') {
        const activeResults = results.filter((r) => r.selectedForWeekend !== false);
        const resultsToUse = activeResults.length > 0 ? activeResults : results;

        const sortMatches = (a: MatchItem, b: MatchItem) => {
          const dateA = a.date || '';
          const dateB = b.date || '';
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return (a.time || '').localeCompare(b.time || '');
        };

        const homeResults = resultsToUse.filter((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName)).sort(sortMatches);
        const awayResults = resultsToUse.filter((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName)).sort(sortMatches);

        const resultSlides: CarouselSlide[] = [];

        // Slide(s) Résultats Domicile
        if (homeResults.length > 0) {
          resultSlides.push({
            id: 'cat-results-home',
            type: 'category' as const,
            categoryId: 'results' as const,
            filterScope: 'home' as const,
            customTitle: 'LES RÉSULTATS À DOMICILE',
            durationSeconds: cat.durationSeconds,
            label: 'Résultats Domicile',
          });
        }

        // Slide(s) Résultats Extérieur
        if (awayResults.length > 0) {
          resultSlides.push({
            id: 'cat-results-away',
            type: 'category' as const,
            categoryId: 'results' as const,
            filterScope: 'away' as const,
            customTitle: "LES RÉSULTATS À L'EXTÉRIEUR",
            durationSeconds: cat.durationSeconds,
            label: 'Résultats Extérieur',
          });
        }

        // Fallback si pas de distinction domicile/extérieur possible
        if (resultSlides.length === 0 && resultsToUse.length > 0) {
          resultSlides.push({
            id: 'cat-results',
            type: 'category' as const,
            categoryId: 'results' as const,
            filterScope: 'all' as const,
            durationSeconds: cat.durationSeconds,
            label: cat.label,
          });
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
  }, [activeAlerts, categories, sponsors, logos, photos, events, matches, results, birthdays, clubSettings.name, clubSettings.balancedLoopMode, visualTemplates]);

  // Keep index within playlist boundaries
  const activeSlideIndex = currentSlideIndex % carouselPlaylist.length;
  const currentSlide = carouselPlaylist[activeSlideIndex] || carouselPlaylist[0];

  // Dynamically resolve duration based on category settings (clamped 3 to 10 seconds)
  const currentDuration = useMemo(() => {
    if (!currentSlide) return 6;
    if (currentSlide.type === 'alert') return 18;
    if (currentSlide.categoryId) {
      const cat = categories.find((c) => c.id === currentSlide.categoryId);
      if (cat?.durationSeconds) {
        return Math.min(10, Math.max(3, cat.durationSeconds));
      }
    }
    return Math.min(10, Math.max(3, currentSlide.durationSeconds || 6));
  }, [currentSlide, categories]);

  // Effective slide themes per category
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

  const isCurrentSlideVideo = useMemo(() => {
    if (!currentSlide) return false;
    
    if (currentSlide.type === 'category') {
      if (currentSlide.categoryId === 'photos' && currentSlide.photo) {
        const ph = currentSlide.photo;
        return !!(ph.isVideo || ph.mediaType === 'video' || isVideoMedia(ph.imageUrl));
      }
      if (currentSlide.categoryId === 'sponsors' && currentSlide.sponsor) {
        const sp = currentSlide.sponsor;
        return !!(sp.isVideo || sp.mediaType === 'video' || isVideoMedia(sp.logoUrl));
      }
      if (currentSlide.categoryId === 'logos' && currentSlide.logo) {
        const lg = currentSlide.logo;
        return !!(lg.isVideo || lg.mediaType === 'video' || isVideoMedia(lg.logoUrl));
      }
      if (currentSlide.categoryId === 'birthdays') {
        const bgVid = birthdaysEffective.backgroundUrl && (birthdaysEffective.categoryTheme?.backgroundMediaType === 'video' || isVideoMedia(birthdaysEffective.backgroundUrl));
        const l3Vid = birthdaysEffective.layer3?.enabled && (birthdaysEffective.layer3.mediaType === 'video' || isVideoMedia(birthdaysEffective.layer3.mediaUrl));
        const l4Vid = birthdaysEffective.layer4?.enabled && (birthdaysEffective.layer4.mediaType === 'video' || isVideoMedia(birthdaysEffective.layer4.mediaUrl));
        const mascotVid = birthdaysEffective.mascot?.enabled && birthdaysEffective.mascot.mediaType === 'video' && birthdaysEffective.mascot.mediaUrl;
        return !!(bgVid || l3Vid || l4Vid || mascotVid);
      }
      if (currentSlide.categoryId === 'matches') {
        const bgVid = matchesEffective.backgroundUrl && (matchesEffective.categoryTheme?.backgroundMediaType === 'video' || isVideoMedia(matchesEffective.backgroundUrl));
        const l3Vid = matchesEffective.layer3?.enabled && (matchesEffective.layer3.mediaType === 'video' || isVideoMedia(matchesEffective.layer3.mediaUrl));
        const l4Vid = matchesEffective.layer4?.enabled && (matchesEffective.layer4.mediaType === 'video' || isVideoMedia(matchesEffective.layer4.mediaUrl));
        const mascotVid = matchesEffective.mascot?.enabled && matchesEffective.mascot.mediaType === 'video' && matchesEffective.mascot.mediaUrl;
        return !!(bgVid || l3Vid || l4Vid || mascotVid);
      }
      if (currentSlide.categoryId === 'results') {
        const bgVid = resultsEffective.backgroundUrl && (resultsEffective.categoryTheme?.backgroundMediaType === 'video' || isVideoMedia(resultsEffective.backgroundUrl));
        const l3Vid = resultsEffective.layer3?.enabled && (resultsEffective.layer3.mediaType === 'video' || isVideoMedia(resultsEffective.layer3.mediaUrl));
        const l4Vid = resultsEffective.layer4?.enabled && (resultsEffective.layer4.mediaType === 'video' || isVideoMedia(resultsEffective.layer4.mediaUrl));
        const mascotVid = resultsEffective.mascot?.enabled && resultsEffective.mascot.mediaType === 'video' && resultsEffective.mascot.mediaUrl;
        return !!(bgVid || l3Vid || l4Vid || mascotVid);
      }
    }
    return false;
  }, [currentSlide, birthdaysEffective, matchesEffective, resultsEffective]);

  // Slide navigation
  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % carouselPlaylist.length);
    setProgressPercent(0);
  }, [carouselPlaylist.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + carouselPlaylist.length) % carouselPlaylist.length);
    setProgressPercent(0);
  }, [carouselPlaylist.length]);

  // Carousel timer loop - Strictly respects elapsed time and resets on slide change
  useEffect(() => {
    if (!isPlaying || carouselPlaylist.length <= 1) {
      setProgressPercent(0);
      return;
    }

    // If current slide is a video, run a safety fallback timer (max 60s) in case video does not fire onEnded
    if (isCurrentSlideVideo) {
      const maxVideoSafetyTimer = setTimeout(() => {
        console.warn('Watchdog vidéo: passage automatique à la slide suivante');
        nextSlide();
      }, 60000);
      return () => clearTimeout(maxVideoSafetyTimer);
    }

    setProgressPercent(0);
    const startTime = Date.now();
    const durationMs = currentDuration * 1000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgressPercent(pct);

      if (elapsed >= durationMs) {
        clearInterval(timer);
        nextSlide();
      }
    }, 50);

    return () => clearInterval(timer);
  }, [isPlaying, activeSlideIndex, currentDuration, nextSlide, carouselPlaylist.length, isCurrentSlideVideo]);

  // Handle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Erreur plein écran:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Erreur sortie plein écran:', err);
      });
    }
  };

  // Auto-hiding floating controls on mouse movement or screen interaction
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Keyboard remote shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key.toLowerCase() === 'f') {
        handleToggleFullscreen();
      } else if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'a') {
        setViewMode((v) => (v === 'admin' ? 'tv' : 'admin'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Helper to add an alert to local and server state
  const handleAddAlert = async (alert: ActiveMatchAlert) => {
    setActiveAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
    try {
      await fetch('/api/add-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    } catch (e) {
      // Hors ligne
    }
  };

  const handleRemoveAlert = (id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/delete-alert?id=${encodeURIComponent(id)}`, { method: 'POST' }).catch((err) => {
      console.error('Échec de la suppression de l\'alerte côté serveur :', err);
    });
  };

  // Find matching team visual if current slide is an alert
  const matchingTeamVisual = currentSlide?.type === 'alert' && currentSlide.alert
    ? teamVisuals.find((tv) =>
        tv.teamName.toLowerCase().includes(currentSlide.alert!.team.toLowerCase()) ||
        tv.shortAliases.some((alias) => currentSlide.alert!.team.toLowerCase().includes(alias.toLowerCase()))
      )
    : undefined;

  // If in Admin Mode, render the full admin dashboard interface directly!
  if (viewMode === 'admin' && !adminAuthentifie) {
    const tenterConnexion = async (e: React.FormEvent) => {
      e.preventDefault();
      setErreurAuthAdmin('');
      try {
        const res = await fetch('/api/save-app-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: adminPassword,
            data: { clubSettings, categories, matches, results, sponsors, logos, photos, birthdays, events, teamVisuals, visualTemplates },
          }),
        });
        if (res.ok) {
          setAdminAuthentifie(true);
        } else {
          setErreurAuthAdmin('Mot de passe incorrect');
        }
      } catch {
        setErreurAuthAdmin('Erreur de connexion');
      }
    };

    return (
      <div className="w-screen min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <form onSubmit={tenterConnexion} className="bg-slate-900 p-8 rounded-2xl w-full max-w-sm border border-slate-700">
          <h1 className="text-xl font-bold mb-4">Admin — SRC Basket</h1>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full p-3 rounded-lg bg-slate-800 text-white mb-3"
          />
          {erreurAuthAdmin && <p className="text-red-400 text-sm mb-3">{erreurAuthAdmin}</p>}
          <button type="submit" className="w-full bg-orange-600 p-3 rounded-lg font-bold">
            Se connecter
          </button>
        </form>
      </div>
    );
  }

  if (viewMode === 'admin') {
    return (
      <div className="w-screen min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {saveStatus !== 'idle' && (
          <div
            className={`fixed top-4 right-4 z-[999] px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 ${
              saveStatus === 'saving'
                ? 'bg-slate-700 text-slate-200'
                : saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {saveStatus === 'saving' && 'Enregistrement...'}
            {saveStatus === 'saved' && '✓ Enregistré'}
            {saveStatus === 'error' && '⚠ Échec de l\'enregistrement — vérifie ta connexion'}
          </div>
        )}
        <AdminPanel
          isOpen={true}
          isFullPage={true}
          onClose={() => setViewMode('tv')}
          categories={categories}
          onUpdateCategories={setCategories}
          clubSettings={clubSettings}
          onUpdateClubSettings={setClubSettings}
          matches={matches}
          onUpdateMatches={setMatches}
          results={results}
          onUpdateResults={setResults}
          sponsors={sponsors}
          onUpdateSponsors={setSponsors}
          logos={logos}
          onUpdateLogos={setLogos}
          photos={photos}
          onUpdatePhotos={setPhotos}
          events={events}
          onUpdateEvents={setEvents}
          birthdays={birthdays}
          onUpdateBirthdays={setBirthdays}
          teamVisuals={teamVisuals}
          onUpdateTeamVisuals={setTeamVisuals}
          visualTemplates={visualTemplates}
          onUpdateVisualTemplates={setVisualTemplates}
          activeAlerts={activeAlerts}
          onAddAlert={handleAddAlert}
          onRemoveAlert={handleRemoveAlert}
          onSwitchToTvMode={() => {
            setViewMode('tv');
            handleToggleFullscreen();
          }}
          onOpenVisualExporter={(type) => setVisualModalState({ isOpen: true, type })}
        />

        {/* Social Media Visual Exporter Modal */}
        <VisualExporterModal
          isOpen={visualModalState.isOpen}
          onClose={() => setVisualModalState({ isOpen: false, type: 'matches' })}
          type={visualModalState.type}
          matches={matches}
          results={results}
          clubSettings={clubSettings}
          specificNotification={activeAlerts[0] || null}
          visualTemplates={visualTemplates}
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none cursor-default"
      onMouseMove={handleUserActivity}
    >
      {/* ========================================================================= */}
      {/* 1. 100% PURE FULL-SCREEN VISUAL CAROUSEL STAGE (FIXED 16:9 SCALED CANVAS) */}
      {/* ========================================================================= */}
      <main className="relative w-full h-full flex-1 overflow-hidden flex items-center justify-center bg-black">
        <FixedCanvas169>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="w-full h-full flex items-center justify-center"
            >
              <TVSlideRenderer
                slide={currentSlide}
                clubSettings={clubSettings}
                matches={matches}
                results={results}
                sponsors={sponsors}
                logos={logos}
                photos={photos}
                birthdays={birthdays}
                events={events}
                teamVisuals={teamVisuals}
                visualTemplates={visualTemplates}
                onVideoEnded={nextSlide}
                onVideoTimeUpdate={setProgressPercent}
                onDownloadVisual={(type) => setVisualModalState({ isOpen: true, type })}
                hideShareButton={true}
              />
            </motion.div>
          </AnimatePresence>
        </FixedCanvas169>

        {/* Discreet TV Remote Next/Prev Click Zones on sides */}
        <button
          onClick={prevSlide}
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white backdrop-blur-md transition-all z-20 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Slide précédente (Flèche gauche)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white backdrop-blur-md transition-all z-20 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Slide suivante (Flèche droite)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </main>

      {/* ========================================================================= */}
      {/* 2. DISCREET AUTO-HIDING FLOATING CONTROL BAR (Fades out when TV is playing) */}
      {/* ========================================================================= */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ease-out ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white border border-slate-700/80 shadow-2xl backdrop-blur-xl">
          {/* Open Configuration Panel */}
          <button
            onClick={() => setViewMode('admin')}
            className="px-3.5 py-1.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105"
            title="Ouvrir l'application de configuration (Touche C ou A)"
            id="btn-open-config"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configuration</span>
          </button>

          <div className="w-px h-5 bg-slate-700 mx-0.5" />

          {/* Prev / Next & Pause */}
          <button
            onClick={prevSlide}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isPlaying ? 'Mettre en pause' : 'Reprendre'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            onClick={nextSlide}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-0.5" />

          {/* Current Slide Indicator */}
          <div className="text-xs text-slate-300 font-medium px-2 flex items-center gap-2">
            <span className="font-mono text-orange-400 font-bold">
              {activeSlideIndex + 1}/{carouselPlaylist.length}
            </span>
            <span className="max-w-[140px] truncate">{currentSlide.label}</span>
          </div>

          {/* Active 1h Alert Indicator */}
          {activeAlerts.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <Trophy className="w-3 h-3 text-emerald-400" />
              <span>Alerte 1h active</span>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Plein écran (Touche F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS: SOCIAL MEDIA VISUAL EXPORTER */}
      {/* ========================================================================= */}
      <VisualExporterModal
        isOpen={visualModalState.isOpen}
        onClose={() => setVisualModalState({ isOpen: false, type: 'matches' })}
        type={visualModalState.type}
        matches={matches}
        results={results}
        clubSettings={clubSettings}
        specificNotification={activeAlerts[0] || null}
        visualTemplates={visualTemplates}
      />
    </div>
  );
}
