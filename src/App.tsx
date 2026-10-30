import { AdminAccess } from './components/Admin/AdminAccess';
import { VideoPlaybackBoundary } from './components/common/VideoPlaybackBoundary';
import { clubCalendarDate } from './utils/clubTime';
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
  ActiveMatchAlert,
  TeamVisualItem,
  VisualTemplatesConfig,
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
import { registerVideoBlob } from './utils/mediaUtils';
import { saveAppDataRequest } from './utils/appDataSaveHelpers';
import { getPolledAppDataVersion, getPolledCollections, hasChangedJson } from './utils/appDataPollingHelpers';
import { getMediaBlobUrl } from './utils/indexedDBStorage';
import { applyAlertToCurrentWeekendMatches, applyAlertsToCurrentWeekendMatches } from './utils/weekendMatchResultHelpers';
import { applyMatchTimingStatuses } from './utils/matchLifecycleHelpers';
import {
  getBirthdayWeekState,
  getNextMondayDelayMs,
  hasBirthdayWeekChanged,
} from './utils/birthdayWeekHelpers';
import {
  addAlertRequest,
  filterActiveAlerts,
  hasSameActiveAlerts,
  mergeActiveAlert,
  removeActiveAlert,
  removeAlertRequest,
} from './utils/activeAlertHelpers';
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
  Trash2,
} from 'lucide-react';

// Identifiants du contenu de démonstration d'origine (plus aucun item fictif ne doit s'afficher au club)
const DEMO_DATA_ITEM_IDS = new Set([
  'sp-1', 'sp-2', 'sp-3', 'sp-4', 'sp-5', 'sp-6',
  'ph-1', 'ph-2', 'ph-3', 'ph-4',
  'ev-1', 'ev-2', 'ev-3',
  'logo-1', 'logo-2', 'logo-3',
  'bd-1', 'bd-2', 'bd-3', 'bd-4', 'bd-5', 'bd-6', 'bd-7', 'bd-8',
  'bd-b1', 'bd-b2', 'bd-b3', 'bd-b4', 'bd-b5', 'bd-b6', 'bd-b7',
  'demo-cw-1', 'demo-cw-2', 'demo-cw-3', 'demo-cw-4', 'demo-cw-5', 'demo-cw-6', 'demo-cw-7',
  'demo-nw-1', 'demo-nw-2', 'demo-nw-3', 'demo-nw-4', 'demo-nw-5', 'demo-nw-6', 'demo-nw-7',
]);

export default function App() {
  // Le mode kiosk est réservé à l'URL dédiée pour Fully Kiosk. Le mode TV lancé depuis l'application conserve les commandes normales.
  const isKioskMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('kiosk') === '1';

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

  const [adminAuthentifie, setAdminAuthentifie] = useState(false);
  const authorizeAdmin = useCallback(() => setAdminAuthentifie(true), []);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Controls & TV playback state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [slideCycle, setSlideCycle] = useState(0);
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

    // Migration : retire le contenu de démonstration d'origine éventuellement resté enregistré côté serveur
    const isDemoItemId = (id?: string) => !!id && DEMO_DATA_ITEM_IDS.has(id);
    const cleaned: AppDataPayload = { ...d };
    if (cleaned.sponsors) cleaned.sponsors = cleaned.sponsors.filter((s) => !isDemoItemId(s.id));
    if (cleaned.logos) cleaned.logos = cleaned.logos.filter((l) => !isDemoItemId(l.id));
    if (cleaned.photos) cleaned.photos = cleaned.photos.filter((p) => !isDemoItemId(p.id));
    if (cleaned.events) cleaned.events = cleaned.events.filter((e) => !isDemoItemId(e.id));
    if (cleaned.allMembers) cleaned.allMembers = cleaned.allMembers.filter((m) => !isDemoItemId(m.id));
    if (cleaned.birthdays) cleaned.birthdays = cleaned.birthdays.filter((m) => !isDemoItemId(m.id));
    d = cleaned;
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
    if (Array.isArray(d.allMembers)) {
      setAllMembers(d.allMembers);
      setMemberPoolCache(d.allMembers);
      const ref = simulatedDate || clubCalendarDate();
      const calculatedWeekBirthdays = filterAndSortBirthdaysForWeek(d.allMembers, ref, 0);
      setBirthdays(calculatedWeekBirthdays);
    } else if (d.birthdays) {
      setBirthdays(filterAndSortBirthdaysForWeek(d.birthdays, simulatedDate || clubCalendarDate(), 0));
    }
    if (d.events) setEvents(d.events);
    if (d.teamVisuals) setTeamVisuals(d.teamVisuals);
    if (d.visualTemplates) {
      let vt = { ...d.visualTemplates };
      setVisualTemplates(normalizeLoadedVisualTemplates(vt));
    }
    if (Array.isArray(d.ffbbTeams)) {
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
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const persistAppData = useCallback(
    async (payload: { version: number; data: AppDataPayload }, currentSeq: number, retryOnFailure: boolean) => {
      if (currentSeq !== saveSeqRef.current) return;

      const request = saveQueueRef.current.catch(() => {}).then(async () => {
        if (currentSeq !== saveSeqRef.current) return { ok: false };
        payload.version = dataVersionRef.current;
        payload.data.version = payload.version;
        const response = await saveAppDataRequest(payload);
        if (response.ok && typeof response.version === 'number') updateDataVersion(response.version);
        return response;
      });
      saveQueueRef.current = request;
      const result = await request;
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
          if (currentSeq === saveSeqRef.current) setSaveStatus('saved');
        }, 2000);
        return;
      }

      if (retryOnFailure && !result.isConflict && !result.isUnauthorized) {
        window.setTimeout(() => {
          if (currentSeq === saveSeqRef.current) {
            void persistAppData(payload, currentSeq, false);
          }
        }, 3000);
        return;
      }

      if (result.isUnauthorized) setAdminAuthentifie(false);
      setSaveStatus('error');
      setSaveErrorMessage(result.errorMessage || 'Erreur serveur');
      console.error("Échec de l'enregistrement des données :", result.errorMessage);
    },
    [updateDataVersion]
  );

  useEffect(() => {
    if (!dataChargee || viewMode !== 'admin' || !adminAuthentifie) return;

    setSaveStatus('saving');
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      const currentSeq = ++saveSeqRef.current;
      const currentVer = dataVersionRef.current;
      const dataToSave = buildAppData(currentVer);
      const contentToCompare = JSON.stringify({ ...dataToSave, version: undefined });

      if (lastSavedDataRef.current === contentToCompare && currentVer === dataVersionRef.current) {
        setSaveStatus('saved');
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
  }, [dataChargee, viewMode, adminAuthentifie, buildAppData, allMembers, persistAppData]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (saveStatus === 'saving' || saveStatus === 'error') { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [saveStatus]);

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

  // Surveillance automatique du changement de semaine des anniversaires.
  useEffect(() => {
    const checkWeekTransition = () => {
      const now = simulatedDate || clubCalendarDate();
      if (!hasBirthdayWeekChanged(currentWeekKey, now)) return;

      const { weekKey, birthdays: newBirthdays } = getBirthdayWeekState(allMembers, now);
      setCurrentWeekKey(weekKey);
      setBirthdays(newBirthdays);
    };

    const interval = window.setInterval(checkWeekTransition, 2000);
    const now = simulatedDate || clubCalendarDate();
    const delay = getNextMondayDelayMs(now);
    const exactTimer =
      delay > 0 && delay < 2147483647
        ? window.setTimeout(checkWeekTransition, delay + 50)
        : null;

    return () => {
      window.clearInterval(interval);
      if (exactTimer !== null) window.clearTimeout(exactTimer);
    };
  }, [allMembers, currentWeekKey, simulatedDate]);

  // Mise à jour persistante du cycle temporel des matchs :
  // à l'heure annoncée -> en cours, après 2h sans résultat -> terminé.
  useEffect(() => {
    const refreshMatchStatuses = () => {
      const referenceDate = simulatedDate || clubCalendarDate();
      setMatches((prev) => {
        const next = applyMatchTimingStatuses(prev, referenceDate);
        return hasChangedJson(prev, next) ? next : prev;
      });
    };

    refreshMatchStatuses();
    const interval = window.setInterval(refreshMatchStatuses, 30000);
    return () => window.clearInterval(interval);
  }, [simulatedDate]);

  // Synchronisation périodique des alertes victoire/défaite actives.
  useEffect(() => {
    const fetchServerAlerts = async () => {
      try {
        const res = await fetch('/api/get-alerts');
        if (!res.ok) return;

        const data = await res.json();
        const valid = filterActiveAlerts(data?.alerts);
        setActiveAlertsCache(valid);
        setActiveAlerts((prev) => (hasSameActiveAlerts(prev, valid) ? prev : valid));
        setMatches((prev) => {
          const updated = applyAlertsToCurrentWeekendMatches(prev, valid);
          return hasChangedJson(prev, updated) ? updated : prev;
        });
      } catch {
        // Hors ligne : conserver les alertes locales.
      }
    };

    void fetchServerAlerts();
    const interval = window.setInterval(fetchServerAlerts, 3000);
    return () => window.clearInterval(interval);
  }, []);

  // Actualisation automatique des résultats et matchs depuis le serveur (mise à jour continue en temps réel)
  const refreshInProgressRef = useRef(false);
  const pendingTvDataRef = useRef<AppDataPayload | null>(null);
  const currentViewRef = useRef(viewMode);
  currentViewRef.current = viewMode;
  useEffect(() => { if (viewMode === 'admin') pendingTvDataRef.current = null; }, [viewMode]);

  const pollUpdatedData = useCallback(async () => {
    // En mode TV (non administrateur actif), synchroniser automatiquement les nouveaux résultats et matchs
    if (viewMode !== 'tv') return;

    // Verrou anti-chevauchement de requêtes
    if (refreshInProgressRef.current) return;
    refreshInProgressRef.current = true;

    try {
      const res = await fetch('/api/get-app-data');
      if (res.ok) {
        const json = await res.json();
        if (json?.data && currentViewRef.current === 'tv') {
          const version = getPolledAppDataVersion(json.data, json.version);
          if (version !== dataVersionRef.current) pendingTvDataRef.current = { ...json.data, version };
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
    if (viewMode !== 'tv') return;

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

  // Nettoyage local des alertes expirées, utile même hors ligne.
  useEffect(() => {
    const cleanupExpiredAlerts = () => {
      setActiveAlerts((prev) => {
        const valid = filterActiveAlerts(prev);
        if (hasSameActiveAlerts(prev, valid)) return prev;
        setActiveAlertsCache(valid);
        return valid;
      });
    };

    const interval = window.setInterval(cleanupExpiredAlerts, 30000);
    return () => window.clearInterval(interval);
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
  const [isCurrentSlideVideo, setIsCurrentSlideVideo] = useState(false);
  useEffect(() => {
    const data = pendingTvDataRef.current;
    if (!data || viewMode !== 'tv') return;
    pendingTvDataRef.current = null;
    lastSavedDataRef.current = JSON.stringify({ ...data, version: undefined });
    updateDataVersion(data.version || 0);
    applyLoadedData(data);
  }, [currentSlide?.id, viewMode, applyLoadedData, updateDataVersion]);

  // Slide navigation
  const nextSlide = useCallback(() => {
    const pending = pendingTvDataRef.current;
    if (pending) {
      pendingTvDataRef.current = null;
      lastSavedDataRef.current = JSON.stringify({ ...pending, version: undefined });
      updateDataVersion(pending.version || 0); applyLoadedData(pending);
    }

    fixedSlideClock.current = { id: '', elapsed: 0 };
    setSlideCycle(cycle => cycle + 1);
    setCurrentSlideIndex((prev) => (prev + 1) % carouselPlaylist.length);
    setProgressPercent(0);
  }, [carouselPlaylist.length, applyLoadedData, updateDataVersion]);

  const prevSlide = useCallback(() => {
    fixedSlideClock.current = { id: '', elapsed: 0 };
    setSlideCycle(cycle => cycle + 1);
    setCurrentSlideIndex((prev) => (prev - 1 + carouselPlaylist.length) % carouselPlaylist.length);
    setProgressPercent(0);
  }, [carouselPlaylist.length]);

  const fixedSlideClock = useRef({ id: '', elapsed: 0 });
  // Les visuels fixes suivent la durée configurée. Une slide contenant une vidéo
  // est pilotée exclusivement par l'événement de fin de lecture de sa vidéo.
  useEffect(() => {
    if (!isPlaying || carouselPlaylist.length === 0 || isCurrentSlideVideo) {

      return;
    }

    const key = currentSlide?.id || String(activeSlideIndex);
    if (fixedSlideClock.current.id !== key) fixedSlideClock.current = { id: key, elapsed: 0 };
    let lastTick = Date.now();
    const durationMs = currentDuration * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      fixedSlideClock.current.elapsed += now - lastTick;
      lastTick = now;
      const elapsed = fixedSlideClock.current.elapsed;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgressPercent(pct);

      if (elapsed >= durationMs) {
        clearInterval(timer);
        nextSlide();
      }
    }, 50);

    return () => clearInterval(timer);
  }, [isPlaying, activeSlideIndex, slideCycle, currentDuration, nextSlide, carouselPlaylist.length, isCurrentSlideVideo]);

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
      } else if (!isKioskMode && (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'a')) {
        if (viewMode !== 'admin' || (saveStatus !== 'saving' && saveStatus !== 'error')) setViewMode((v) => (v === 'admin' ? 'tv' : 'admin'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, isKioskMode]);

  // Synchronisation locale immédiate + persistance serveur des alertes.
  const handleAddAlert = useCallback(async (alert: ActiveMatchAlert) => {
    setActiveAlerts((prev) => {
      const updated = mergeActiveAlert(prev, alert);
      setActiveAlertsCache(updated);
      return updated;
    });
    setMatches((prev) => applyAlertToCurrentWeekendMatches(prev, alert));
    await addAlertRequest(alert);
  }, []);

  const handleRemoveAlert = useCallback(async (id: string) => {
    setActiveAlerts((prev) => {
      const updated = removeActiveAlert(prev, id);
      setActiveAlertsCache(updated);
      return updated;
    });
    await removeAlertRequest(id);
  }, []);

  // Find matching team visual if current slide is an alert
  const matchingTeamVisual = currentSlide?.type === 'alert' && currentSlide.alert
    ? teamVisuals.find((tv) =>
        tv.teamName.toLowerCase().includes(currentSlide.alert!.team.toLowerCase()) ||
        tv.shortAliases.some((alias) => currentSlide.alert!.team.toLowerCase().includes(alias.toLowerCase()))
      )
    : undefined;

  if (viewMode === 'admin' && !adminAuthentifie) return <AdminAccess onAuthorized={authorizeAdmin} />;

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
              transition={{ duration: 0 }}
              className="w-full h-full flex items-center justify-center"
            >
              <VideoPlaybackBoundary key={`${currentSlide.id}:${slideCycle}`} playing={isPlaying} slideId={`${currentSlide.id}:${slideCycle}`} onComplete={nextSlide} onVideoMode={setIsCurrentSlideVideo} onProgress={setProgressPercent}>
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
                onVideoEnded={undefined}
                onVideoTimeUpdate={undefined}
                onDownloadVisual={(type) => setVisualModalState({ isOpen: true, type })}
                hideShareButton={true}
              />
              </VideoPlaybackBoundary>
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
          {/* En mode kiosque, aucune commande d'accès à la configuration n'est affichée */}
          {!isKioskMode && (
            <>
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
            </>
          )}

          {currentSlide?.type === 'alert' && currentSlide.alert && (
            <>
              <button
                onClick={() => handleRemoveAlert(currentSlide.alert!.id)}
                className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105"
                title="Supprimer cette alerte de la boucle TV"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer l'alerte</span>
              </button>
              <div className="w-px h-5 bg-slate-700 mx-0.5" />
            </>
          )}

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
