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
  DEFAULT_CLUB_MEMBERS,
  getAnchorDemoMembers,
  DEFAULT_EVENTS,
  DEFAULT_TEAM_VISUALS,
  DEFAULT_VISUAL_TEMPLATES,
  DEFAULT_REAL_FFBB_TEAMS,
} from './data/defaultData';
import { filterAndSortBirthdaysForWeek, getWeekBounds, getWeekKey } from './utils/excelBirthdayParser';
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
  FFBBTeamItem,
  AppDataPayload,
} from './types';
import { TVSlideRenderer } from './components/slides/TVSlideRenderer';
import { VisualExporterModal } from './components/VisualExporterModal';
import { AdminPanel } from './components/Admin/AdminPanel';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { getEffectiveCategoryConfig } from './utils/themeUtils';
import {
  getOfflineAppData,
  setOfflineAppData,
  getMemberPoolCache,
  setMemberPoolCache,
  getFfbbTeamsCache,
  setFfbbTeamsCache,
  getActiveAlertsCache,
  setActiveAlertsCache,
} from './utils/appStorageHelpers';
import { buildCarouselPlaylist } from './utils/carouselPlaylistBuilder';
import { getServerDataVersion, normalizeLoadedVisualTemplates } from './utils/appDataHelpers';
import { isCarouselSlideVideo } from './utils/carouselVideoHelpers';
import { isVideoMedia, registerVideoBlob } from './utils/mediaUtils';
import { saveAppDataRequest } from './utils/appDataSaveHelpers';
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
  Eye,
  EyeOff,
  Lock,
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
  // Pool permanent des adhérents du club (conservé et persistant en base)
  const [allMembers, setAllMembers] = useState<BirthdayItem[]>(() => {
    const localPool = getMemberPoolCache();
    if (localPool) return localPool;

    const cachedData = getOfflineAppData();
    if (cachedData?.allMembers && cachedData.allMembers.length > 0) {
      return cachedData.allMembers;
    }

    return getAnchorDemoMembers(new Date());
  });

  // Date simulée optionnelle (pour le banc d'essai et la vérification dimanche 23:59 -> lundi 00:00)
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);

  // Clé de semaine de référence (bascule au lundi 00:00:00)
  const [currentWeekKey, setCurrentWeekKey] = useState<string>(() => getWeekKey(new Date()));

  // Anniversaires actifs de la semaine courante (calcul dynamique immédiat au démarrage)
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>(() => {
    const initialPool =
      getMemberPoolCache() ||
      getOfflineAppData()?.allMembers ||
      getAnchorDemoMembers(new Date());

    const calculated = filterAndSortBirthdaysForWeek(initialPool, new Date(), 0);
    return calculated.length > 0 ? calculated : DEFAULT_BIRTHDAYS;
  });

  const [events, setEvents] = useState<ClubEventItem[]>(DEFAULT_EVENTS);
  const [teamVisuals, setTeamVisuals] = useState<TeamVisualItem[]>(DEFAULT_TEAM_VISUALS);
  const [visualTemplates, setVisualTemplates] = useState<VisualTemplatesConfig>(DEFAULT_VISUAL_TEMPLATES);
  const [ffbbTeams, setFfbbTeams] = useState<FFBBTeamItem[]>(() =>
    getFfbbTeamsCache() || DEFAULT_REAL_FFBB_TEAMS
  );
  const [activeAlerts, setActiveAlerts] = useState<ActiveMatchAlert[]>(getActiveAlertsCache);
  const [dataChargee, setDataChargee] = useState(false);
  const [dataVersion, setDataVersion] = useState<number>(0);
  const dataVersionRef = useRef<number>(0);

  const updateDataVersion = useCallback((v: number) => {
    setDataVersion(v);
    dataVersionRef.current = v;
  }, []);

  const [adminAuthentifie, setAdminAuthentifie] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

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

  // Application en mémoire des données chargées
  const applyLoadedData = useCallback((d: AppDataPayload) => {
    if (!d) return;
    if (d.clubSettings) {
      setClubSettings({
        ...d.clubSettings,
        victoryPhotoDurationSeconds: typeof d.clubSettings.victoryPhotoDurationSeconds === 'number'
          ? d.clubSettings.victoryPhotoDurationSeconds
          : 10,
      });
    }
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
    if (d.allMembers && Array.isArray(d.allMembers) && d.allMembers.length > 0) {
      setAllMembers(d.allMembers);
      setMemberPoolCache(d.allMembers);
      const ref = simulatedDate || new Date();
      const calculatedWeekBirthdays = filterAndSortBirthdaysForWeek(d.allMembers, ref, 0);
      setBirthdays(calculatedWeekBirthdays.length > 0 ? calculatedWeekBirthdays : (d.birthdays || []));
    } else if (d.birthdays) {
      setBirthdays(d.birthdays);
    }
    if (d.events) setEvents(d.events);
    if (d.teamVisuals) setTeamVisuals(d.teamVisuals);
    if (d.visualTemplates) {
      let vt = { ...d.visualTemplates };
      setVisualTemplates(normalizeLoadedVisualTemplates(vt));
    }
    if (d.ffbbTeams && Array.isArray(d.ffbbTeams) && d.ffbbTeams.length > 0) {
      setFfbbTeams(d.ffbbTeams);
      setFfbbTeamsCache(d.ffbbTeams);
    }
  }, [simulatedDate]);

  // Chargement des données avec support complet Hors-Ligne (PWA / Cache local)
  useEffect(() => {
    const loadFromOfflineCache = () => {
      const parsed = getOfflineAppData();
      if (parsed) {
        if (typeof parsed.version === 'number') {
          updateDataVersion(parsed.version);
        }
        applyLoadedData(parsed);
        lastSavedDataRef.current = JSON.stringify({ ...parsed, version: undefined });
        return true;
      }
      return false;
    };

    // 1. Tenter la récupération réseau avec fallback automatique sur cache hors-ligne
    fetch('/api/get-app-data')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then((res: { data?: AppDataPayload; version?: number }) => {
        if (res.data) {
          const v = getServerDataVersion(res.data, res.version);
          updateDataVersion(v);
          applyLoadedData(res.data);
          lastSavedDataRef.current = JSON.stringify({ ...res.data, version: undefined });
          try {
            setOfflineAppData({ ...res.data, version: v });
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

  // Construction centralisée de app-data
  const buildAppData = useCallback(
    (version: number): AppDataPayload => ({
      clubSettings,
      categories,
      matches,
      results,
      sponsors,
      logos,
      photos,
      birthdays,
      allMembers,
      events,
      teamVisuals,
      visualTemplates,
      ffbbTeams,
      version,
    }),
    [
      clubSettings,
      categories,
      matches,
      results,
      sponsors,
      logos,
      photos,
      birthdays,
      allMembers,
      events,
      teamVisuals,
      visualTemplates,
      ffbbTeams,
    ]
  );

  // Référence pour mémoriser le dernier contenu réellement sauvegardé (évite les sauvegardes identiques)
  const lastSavedDataRef = useRef<string | null>(null);

  // Enregistrement automatique (avec anti-rebond de 800ms) dès qu'une donnée change
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSeqRef = useRef<number>(0);

  const persistAppData = useCallback(
    async (payload: { version: number; data: AppDataPayload }, currentSeq: number, retryOnFailure: boolean) => {
      if (currentSeq !== saveSeqRef.current) return;

      const result = await saveAppDataRequest(payload);
      if (currentSeq !== saveSeqRef.current) return;

      if (result.ok) {
        if (typeof result.version === 'number') {
          updateDataVersion(result.version);
          payload.data.version = result.version;
          lastSavedDataRef.current = JSON.stringify({ ...payload.data, version: undefined });
          setOfflineAppData(payload.data);
        } else {
          lastSavedDataRef.current = JSON.stringify({ ...payload.data, version: undefined });
        }
        setSaveStatus('saved');
        setSaveErrorMessage('');
        window.setTimeout(() => {
          if (currentSeq === saveSeqRef.current) setSaveStatus('idle');
        }, 2000);
        return;
      }

      if (retryOnFailure) {
        window.setTimeout(() => {
          if (currentSeq === saveSeqRef.current) {
            void persistAppData(payload, currentSeq, false);
          }
        }, 3000);
        return;
      }

      setSaveStatus('error');
      setSaveErrorMessage(result.errorMessage || 'Erreur serveur');
      console.error("Échec de l'enregistrement des données :", result.errorMessage);
    },
    [updateDataVersion]
  );

  useEffect(() => {
    if (!dataChargee) return;

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      const currentSeq = ++saveSeqRef.current;
      const currentVer = dataVersionRef.current;
      const dataToSave = buildAppData(currentVer);
      const contentToCompare = JSON.stringify({ ...dataToSave, version: undefined });

      if (lastSavedDataRef.current === contentToCompare && currentVer === dataVersionRef.current) {
        setSaveStatus('idle');
        return;
      }

      setSaveStatus('saving');
      const payload = { version: currentVer, data: dataToSave };

      setOfflineAppData(payload.data);
      if (allMembers && allMembers.length > 0) setMemberPoolCache(allMembers);
      void persistAppData(payload, currentSeq, true);
    }, 800);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [dataChargee, buildAppData, allMembers, persistAppData]);

  const handleManualSave = useCallback(() => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    setSaveStatus('saving');
    const currentSeq = ++saveSeqRef.current;
    const currentVer = dataVersionRef.current;
    const payload = { version: currentVer, data: buildAppData(currentVer) };

    setOfflineAppData(payload.data);
    if (allMembers && allMembers.length > 0) setMemberPoolCache(allMembers);
    void persistAppData(payload, currentSeq, false);
  }, [buildAppData, allMembers, persistAppData]);


  // Rechargement manuel depuis le serveur en cas de conflit de concurrence
  const handleReloadFromServer = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/get-app-data');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (json.data) {
        const v = getServerDataVersion(json.data, json.version);
        updateDataVersion(v);
        applyLoadedData(json.data);
        try {
          setOfflineAppData({ ...json.data, version: v });
        } catch (e) {}
        setSaveStatus('idle');
        setSaveErrorMessage('');
      }
    } catch (err) {
      setSaveStatus('error');
      setSaveErrorMessage("Impossible de recharger les données : " + (err instanceof Error ? err.message : 'Erreur réseau'));
    }
  }, [applyLoadedData, updateDataVersion]);

  // Mise à jour du pool permanent d'adhérents (Excel ou ajouts manuels)
  const handleUpdateAllMembers = useCallback(
    (newMembers: BirthdayItem[], weekBirthdays?: BirthdayItem[]) => {
      setAllMembers(newMembers);
      try {
        setMemberPoolCache(newMembers);
      } catch (e) {}
      if (weekBirthdays !== undefined) {
        setBirthdays(weekBirthdays);
      }
    },
    []
  );

  // Modification de la date simulée (banc de test dimanche 23:59 -> lundi 00:00)
  const handleSetSimulatedDate = useCallback(
    (date: Date | null) => {
      setSimulatedDate(date);
      const ref = date || new Date();
      const newKey = getWeekKey(ref);
      setCurrentWeekKey(newKey);
      if (allMembers && allMembers.length > 0) {
        const updated = filterAndSortBirthdaysForWeek(allMembers, ref, 0);
        setBirthdays(updated);
      }
    },
    [allMembers]
  );

  // =========================================================================
  // SURVEILLANCE AUTOMATIQUE PERMANENTE DU CHANGEMENT DE SEMAINE DES ANNIVERSAIRES
  // La semaine commence Lundi 00:00:00 et finit Dimanche 23:59:59.
  // Au passage à Lundi 00:00, recalcul dynamique immédiat sans recharger la page.
  // =========================================================================
  useEffect(() => {
    const checkWeekTransition = () => {
      const now = simulatedDate || new Date();
      const newKey = getWeekKey(now);
      if (newKey !== currentWeekKey) {
        console.log(`[Anniversaires] Bascule de semaine automatique détectée : ${currentWeekKey} ➔ ${newKey}`);
        setCurrentWeekKey(newKey);
        if (allMembers && allMembers.length > 0) {
          const newBirthdays = filterAndSortBirthdaysForWeek(allMembers, now, 0);
          console.log(`[Anniversaires] Nouveau calcul hebdomadaire (${newBirthdays.length} retenu(s))`);
          setBirthdays(newBirthdays);
        }
      }
    };

    // 1. Ticker périodique de contrôle léger (toutes les 2 secondes pour être réactif aux secondes simulées et au temps réel)
    const interval = setInterval(checkWeekTransition, 2000);

    // 2. Minuteur ultra-précis ciblant exactement la milliseconde de Lundi 00:00:00 local
    const now = simulatedDate || new Date();
    const { monday } = getWeekBounds(now, 1);
    const msUntilNextMonday = monday.getTime() - now.getTime();
    let exactTimer: ReturnType<typeof setTimeout> | null = null;
    if (msUntilNextMonday > 0 && msUntilNextMonday < 2147483647) {
      exactTimer = setTimeout(() => {
        checkWeekTransition();
      }, msUntilNextMonday + 50);
    }

    return () => {
      clearInterval(interval);
      if (exactTimer) clearTimeout(exactTimer);
    };
  }, [allMembers, currentWeekKey, simulatedDate]);

  // Vérification périodique des alertes victoire/défaite actives
  useEffect(() => {
    const fetchServerAlerts = async () => {
      try {
        const res = await fetch('/api/get-alerts');
        if (res.ok) {
          const data = await res.json();
          if (data.alerts && Array.isArray(data.alerts)) {
            const now = Date.now();
            const valid = data.alerts.filter((a: ActiveMatchAlert) => a && a.expiresAt > now);
            try {
              setActiveAlertsCache(valid);
            } catch (e) {}
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
    const interval = setInterval(fetchServerAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Actualisation automatique des résultats et matchs depuis le serveur (mise à jour continue en temps réel)
  const refreshInProgressRef = useRef(false);

  const pollUpdatedData = useCallback(async () => {
    // En mode TV (non administrateur actif), synchroniser automatiquement les nouveaux résultats et matchs
    if (adminAuthentifie && viewMode === 'admin') return;

    // Verrou anti-chevauchement de requêtes
    if (refreshInProgressRef.current) return;
    refreshInProgressRef.current = true;

    try {
      const res = await fetch('/api/get-app-data');
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          const d = json.data;
          const v = typeof d.version === 'number'
            ? d.version
            : (typeof json.version === 'number' ? json.version : 0);

          updateDataVersion(v);

          // Mise à jour du cache hors-ligne uniquement en cas de vraie réponse serveur valide
          try {
            setOfflineAppData({ ...d, version: v });
          } catch (e) {}

          // Éviter les mises à jour d'état inutile si les données n'ont pas changé
          if (Array.isArray(d.results)) {
            setResults((prev) => (JSON.stringify(prev) === JSON.stringify(d.results) ? prev : d.results));
          }
          if (Array.isArray(d.matches)) {
            setMatches((prev) => (JSON.stringify(prev) === JSON.stringify(d.matches) ? prev : d.matches));
          }
          if (Array.isArray(d.sponsors)) {
            setSponsors((prev) => (JSON.stringify(prev) === JSON.stringify(d.sponsors) ? prev : d.sponsors));
          }
          if (Array.isArray(d.photos)) {
            setPhotos((prev) => (JSON.stringify(prev) === JSON.stringify(d.photos) ? prev : d.photos));
          }
          if (Array.isArray(d.events)) {
            setEvents((prev) => (JSON.stringify(prev) === JSON.stringify(d.events) ? prev : d.events));
          }
          if (Array.isArray(d.categories)) {
            setCategories((prev) => (JSON.stringify(prev) === JSON.stringify(d.categories) ? prev : d.categories));
          }
        }
      }
    } catch (err) {
      console.warn('Erreur lors du rafraîchissement automatique TV (données actuelles conservées):', err);
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [adminAuthentifie, viewMode, updateDataVersion]);

  // Polling toutes les 30 secondes + Rafraîchissement intelligent au retour au premier plan
  useEffect(() => {
    if (adminAuthentifie && viewMode === 'admin') return;

    const dataPollInterval = window.setInterval(() => {
      pollUpdatedData();
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollUpdatedData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(dataPollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [adminAuthentifie, viewMode, pollUpdatedData]);

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
  const carouselPlaylist = useMemo(
    () =>
      buildCarouselPlaylist({
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
      }),
    [
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
    ]
  );

  // Keep index within playlist boundaries
  const activeSlideIndex = currentSlideIndex % carouselPlaylist.length;
  const currentSlide = carouselPlaylist[activeSlideIndex] || carouselPlaylist[0];

  // Dynamically resolve duration based on category settings
  const currentDuration = useMemo(() => {
    if (!currentSlide) return 6;
    if (currentSlide.type === 'alert') {
      return clubSettings.victoryPhotoDurationSeconds ?? 10;
    }
    if (currentSlide.categoryId) {
      const cat = categories.find((c) => c.id === currentSlide.categoryId);
      if (cat?.durationSeconds) {
        return Math.min(10, Math.max(3, cat.durationSeconds));
      }
    }
    return Math.min(10, Math.max(3, currentSlide.durationSeconds || 6));
  }, [currentSlide, categories, clubSettings.victoryPhotoDurationSeconds]);

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

  const isCurrentSlideVideo = useMemo(
    () =>
      isCarouselSlideVideo(
        currentSlide,
        {
          birthdays: birthdaysEffective,
          matches: matchesEffective,
          results: resultsEffective,
        },
        teamVisuals,
        visualTemplates
      ),
    [currentSlide, birthdaysEffective, matchesEffective, resultsEffective, teamVisuals, visualTemplates]
  );

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
    setActiveAlerts((prev) => {
      const updated = [alert, ...prev.filter((a) => a.id !== alert.id)];
      try {
        setActiveAlertsCache(updated);
      } catch (e) {}
      return updated;
    });
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
    setActiveAlerts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        setActiveAlertsCache(updated);
      } catch (e) {}
      return updated;
    });
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

  if (viewMode === 'admin') {
    return (
      <div className="w-screen min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
          allMembers={allMembers}
          onUpdateAllMembers={handleUpdateAllMembers}
          simulatedDate={simulatedDate}
          onSetSimulatedDate={handleSetSimulatedDate}
          teamVisuals={teamVisuals}
          onUpdateTeamVisuals={setTeamVisuals}
          ffbbTeams={ffbbTeams}
          onUpdateFfbbTeams={setFfbbTeams}
          visualTemplates={visualTemplates}
          onUpdateVisualTemplates={setVisualTemplates}
          activeAlerts={activeAlerts}
          onAddAlert={handleAddAlert}
          onRemoveAlert={handleRemoveAlert}
          saveStatus={saveStatus}
          saveErrorMessage={saveErrorMessage}
          onManualSave={handleManualSave}
          onReloadFromServer={handleReloadFromServer}
          onSwitchToTvMode={() => {
            setViewMode('tv');
            handleToggleFullscreen();
          }}
          onOpenVisualExporter={(type) => setVisualModalState({ isOpen: true, type })}
          carouselPlaylist={carouselPlaylist}
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
          onUpdateVisualTemplates={setVisualTemplates}
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
