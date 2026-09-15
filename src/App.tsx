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
} from './types';
import { MatchesSlide } from './components/slides/MatchesSlide';
import { ResultsSlide } from './components/slides/ResultsSlide';
import { SponsorsSlide } from './components/slides/SponsorsSlide';
import { LogosSlide } from './components/slides/LogosSlide';
import { PhotosSlide } from './components/slides/PhotosSlide';
import { BirthdaysSlide } from './components/slides/BirthdaysSlide';
import { EventsSlide } from './components/slides/EventsSlide';
import { MatchAlertSlide } from './components/slides/MatchAlertSlide';
import { VisualExporterModal } from './components/VisualExporterModal';
import { AdminPanel } from './components/Admin/AdminPanel';
import { AnimatePresence, motion } from 'motion/react';
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

// Represents one item in the carousel rotation
interface CarouselSlide {
  id: string;
  type: 'category' | 'alert';
  categoryId?: SlideCategory;
  alert?: ActiveMatchAlert;
  sponsor?: SponsorItem;
  photo?: ClubPhotoItem;
  event?: ClubEventItem;
  logo?: ClubLogoItem;
  itemIndex?: number;
  totalItems?: number;
  durationSeconds: number;
  label: string;
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
  const [adminAuthentifie, setAdminAuthentifie] = useState(true);
  const [erreurAuthAdmin, setErreurAuthAdmin] = useState('');

  // Controls & TV playback state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Chargement des données depuis le serveur au démarrage
  useEffect(() => {
    fetch('/.netlify/functions/get-app-data')
      .then((res) => res.json())
      .then((res: { data: any }) => {
        if (res.data) {
          const d = res.data;
          if (d.clubSettings) setClubSettings(d.clubSettings);
          if (d.categories) setCategories(d.categories);
          if (d.matches) setMatches(d.matches);
          if (d.results) setResults(d.results);
          if (d.sponsors) setSponsors(d.sponsors);
          if (d.logos) setLogos(d.logos);
          if (d.photos) setPhotos(d.photos);
          if (d.birthdays) setBirthdays(d.birthdays);
          if (d.events) setEvents(d.events);
          if (d.teamVisuals) setTeamVisuals(d.teamVisuals);
          if (d.visualTemplates) setVisualTemplates(d.visualTemplates);
        }
        setDataChargee(true);
      })
      .catch(() => setDataChargee(true));
  }, []);

  // Enregistrement automatique (avec anti-rebond de 800ms) dès qu'une donnée change
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!dataChargee || !adminAuthentifie) return;

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      fetch('/.netlify/functions/save-app-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      }).catch(() => {});
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

  // Vérification périodique des alertes victoire/défaite actives (partagées via Netlify)
  useEffect(() => {
    const fetchServerAlerts = async () => {
      try {
        const res = await fetch('/.netlify/functions/get-alerts');
        if (res.ok) {
          const data = await res.json();
          if (data.alerts && Array.isArray(data.alerts)) {
            const now = Date.now();
            const valid = data.alerts.filter((a: ActiveMatchAlert) => a.expiresAt > now);
            setActiveAlerts(valid);
          }
        }
      } catch (err) {
        // silencieux
      }
    };

    fetchServerAlerts();
    const interval = setInterval(fetchServerAlerts, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter out any expired alerts every 30 seconds
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setActiveAlerts((prev) => prev.filter((a) => a.expiresAt > now));
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

    // 2. Standard Category Pools
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
        } else {
          pools['sponsors'] = [
            {
              id: `cat-${cat.id}`,
              type: 'category' as const,
              categoryId: cat.id,
              durationSeconds: cat.durationSeconds,
              label: cat.label,
            },
          ];
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
        } else {
          pools['photos'] = [
            {
              id: `cat-${cat.id}`,
              type: 'category' as const,
              categoryId: cat.id,
              durationSeconds: cat.durationSeconds,
              label: cat.label,
            },
          ];
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
        } else {
          pools['logos'] = [
            {
              id: `cat-${cat.id}`,
              type: 'category' as const,
              categoryId: cat.id,
              durationSeconds: cat.durationSeconds,
              label: cat.label,
            },
          ];
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
        } else {
          pools['events'] = [
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

    if (!isBalanced) {
      // Sequential Mode
      const sequentialList: CarouselSlide[] = [];
      Object.keys(pools).forEach((k) => sequentialList.push(...pools[k]));
      return sequentialList.length > 0
        ? sequentialList
        : [{ id: 'fallback', type: 'category', categoryId: 'photos', durationSeconds: 15, label: 'Photos' }];
    }

    // Balanced Mode (Mélange Équilibré Intercalé - Une seule fois chaque visuel)
    const balancedList: CarouselSlide[] = [];
    const poolKeys = Object.keys(pools);

    if (poolKeys.length === 0) {
      return [{ id: 'fallback', type: 'category', categoryId: 'photos', durationSeconds: 15, label: 'Photos' }];
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

    poolKeys.forEach((key) => {
      const originalPool = pools[key];
      // Shuffle the items within this pool to have a nice randomization (mélange)
      const shuffledPool = [...originalPool];
      for (let i = shuffledPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffledPool[i];
        shuffledPool[i] = shuffledPool[j];
        shuffledPool[j] = temp;
      }

      const N = shuffledPool.length;
      if (N === 0) return;

      shuffledPool.forEach((slide, idx) => {
        // Proportional spreading formula:
        // Spacing factor = totalItemsCount / N
        // Base target position = (idx + 0.1 + Math.random() * 0.8) * Spacing factor
        const stepSize = totalItemsCount / N;
        const targetPosition = (idx + 0.1 + Math.random() * 0.8) * stepSize;

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

    return balancedList.length > 0
      ? balancedList
      : [{ id: 'fallback', type: 'category', categoryId: 'photos', durationSeconds: 15, label: 'Photos' }];
  }, [activeAlerts, categories, sponsors, logos, photos, events, clubSettings.balancedLoopMode]);

  // Keep index within playlist boundaries
  const activeSlideIndex = currentSlideIndex % carouselPlaylist.length;
  const currentSlide = carouselPlaylist[activeSlideIndex] || carouselPlaylist[0];
  const currentDuration = currentSlide?.durationSeconds || 15;

  const isCurrentSlideVideo = useMemo(() => {
    if (!currentSlide) return false;
    
    if (currentSlide.type === 'category') {
      if (currentSlide.categoryId === 'photos' && currentSlide.photo) {
        const ph = currentSlide.photo;
        return !!(ph.isVideo || ph.mediaType === 'video' || ph.imageUrl?.includes('.mp4') || ph.imageUrl?.startsWith('data:video/'));
      }
      if (currentSlide.categoryId === 'sponsors' && currentSlide.sponsor) {
        const sp = currentSlide.sponsor;
        return !!(sp.isVideo || sp.mediaType === 'video' || sp.logoUrl?.includes('.mp4') || sp.logoUrl?.startsWith('data:video/'));
      }
      if (currentSlide.categoryId === 'logos' && currentSlide.logo) {
        const lg = currentSlide.logo;
        return !!(lg.isVideo || lg.mediaType === 'video' || lg.logoUrl?.includes('.mp4') || lg.logoUrl?.startsWith('data:video/'));
      }
    }
    return false;
  }, [currentSlide]);

  // Slide navigation
  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % carouselPlaylist.length);
    setProgressPercent(0);
  }, [carouselPlaylist.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + carouselPlaylist.length) % carouselPlaylist.length);
    setProgressPercent(0);
  }, [carouselPlaylist.length]);

  // Carousel timer loop
  useEffect(() => {
    if (!isPlaying || carouselPlaylist.length <= 1) return;
    if (isCurrentSlideVideo) return; // Video controls its own duration and next-slide trigger

    const stepIntervalMs = 100;
    const totalSteps = (currentDuration * 1000) / stepIntervalMs;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const pct = Math.min(100, (currentStep / totalSteps) * 100);
      setProgressPercent(pct);

      if (currentStep >= totalSteps) {
        nextSlide();
      }
    }, stepIntervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentDuration, nextSlide, carouselPlaylist.length, isCurrentSlideVideo]);

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
      await fetch('/.netlify/functions/add-alert', {
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
    fetch(`/.netlify/functions/delete-alert?id=${encodeURIComponent(id)}`, { method: 'POST' }).catch(() => {});
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
        const res = await fetch('/.netlify/functions/save-app-data', {
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
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none cursor-default"
      onMouseMove={handleUserActivity}
    >
      {/* ========================================================================= */}
      {/* 1. 100% PURE FULL-SCREEN VISUAL CAROUSEL STAGE (NO CLOCK, NO PERMANENT HEADER) */}
      {/* ========================================================================= */}
      <main className="relative w-full h-full flex-1 overflow-hidden flex items-center justify-center bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="w-full h-full flex items-center justify-center"
          >
            {/* Case A: Active 1-Hour Victory / Defeat Alert Slide */}
            {currentSlide.type === 'alert' && currentSlide.alert && (
              <MatchAlertSlide alert={currentSlide.alert} teamVisual={matchingTeamVisual} />
            )}

            {/* Case B: Standard Category Visuals */}
            {currentSlide.type === 'category' && (
              <>
                {currentSlide.categoryId === 'photos' && (
                  <PhotosSlide
                    photo={currentSlide.photo}
                    photos={photos}
                    itemIndex={currentSlide.itemIndex}
                    totalItems={currentSlide.totalItems}
                    hideTextOverlay={clubSettings.hideTextOverlays ?? true}
                    onVideoEnded={nextSlide}
                    onVideoTimeUpdate={setProgressPercent}
                  />
                )}

                {currentSlide.categoryId === 'sponsors' && (
                  <SponsorsSlide
                    sponsor={currentSlide.sponsor}
                    sponsors={sponsors}
                    itemIndex={currentSlide.itemIndex}
                    totalItems={currentSlide.totalItems}
                    clubSettings={clubSettings}
                    onVideoEnded={nextSlide}
                    onVideoTimeUpdate={setProgressPercent}
                  />
                )}

                {currentSlide.categoryId === 'logos' && (
                  <LogosSlide
                    logo={currentSlide.logo}
                    logos={logos}
                    itemIndex={currentSlide.itemIndex}
                    totalItems={currentSlide.totalItems}
                    onVideoEnded={nextSlide}
                    onVideoTimeUpdate={setProgressPercent}
                  />
                )}

                {currentSlide.categoryId === 'matches' && (
                  <MatchesSlide
                    matches={matches}
                    clubSettings={clubSettings}
                    backgroundUrl={visualTemplates.matchesBackgroundUrl}
                    onDownloadVisual={() => setVisualModalState({ isOpen: true, type: 'matches' })}
                    hideShareButton={true}
                  />
                )}

                {currentSlide.categoryId === 'results' && (
                  <ResultsSlide
                    results={results}
                    clubSettings={clubSettings}
                    backgroundUrl={visualTemplates.resultsBackgroundUrl}
                    onDownloadVisual={() => setVisualModalState({ isOpen: true, type: 'results' })}
                    hideShareButton={true}
                  />
                )}

                {currentSlide.categoryId === 'birthdays' && (
                  <BirthdaysSlide
                    birthdays={birthdays}
                    clubSettings={clubSettings}
                    backgroundUrl={visualTemplates.birthdaysBackgroundUrl}
                  />
                )}

                {currentSlide.categoryId === 'events' && (
                  <EventsSlide
                    event={currentSlide.event}
                    events={events}
                    itemIndex={currentSlide.itemIndex}
                    totalItems={currentSlide.totalItems}
                    clubSettings={clubSettings}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

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

          <div className="w-px h-5 bg-slate-700 mx-0.5" />

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
      />
    </div>
  );
}
