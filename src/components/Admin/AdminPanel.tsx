import { prepareClubSportsSync, clubCodeKey } from '../../utils/ffbbClubScope';
import { prepareExcelApiHandoff } from '../../utils/calendarImportIdentity';
import { groupFfbbTeams } from '../../utils/ffbbTeamGrouping';
import { useAdminViewState } from '../../utils/useAdminViewState';
import { useTelegramAdmin } from './hooks/useTelegramAdmin';
import { useMediaUploadsAdmin } from './hooks/useMediaUploadsAdmin';
import { useSocialAdmin } from './hooks/useSocialAdmin';
import { useBirthdaysAdmin } from './hooks/useBirthdaysAdmin';
import { clubCalendarDate } from '../../utils/clubTime';
import { MediaPlaybackWarning } from '../common/MediaPlaybackWarning';
import { BugConsole } from '../common/BugConsole';
import { isInDisplayPeriod } from '../../utils/displayPeriod';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Sliders,
  FolderPlus,
  Upload,
  Trophy,
  Calendar,
  FileSpreadsheet,
  Tv,
  Trash2,
  Plus,
  RefreshCw,
  RotateCcw,
  Clock,
  Sparkles,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Camera,
  Cake,
  Play,
  Eye,
  Bot,
  MessageSquare,
  Layers,
  Copy,
  Check,
  Send,
  ExternalLink,
  Shield,
  ShieldCheck,
  Frown,
  Share2,
  Instagram,
  Facebook,
  Smartphone,
  Flame,
  Shuffle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  Pencil,
  Video,
  Home,
  Navigation,
  Search,
  Film,
  Save,
  Loader2,
  Type,
  Zap,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Link,
  Unlink,
  Lock,
  Radio,
  LayoutTemplate,
} from 'lucide-react';
import {
  CategoryConfig,
  ClubSettings,
  MatchItem,
  MatchStatus,
  SponsorItem,
  ClubLogoItem,
  ClubPhotoItem,
  ClubEventItem,
  BirthdayItem,
  SlideCategory,
  ActiveMatchAlert,
  TeamVisualItem,
  VisualTemplatesConfig,
  VisualTitleConfig,
  FFBBTeamItem,
  CarouselSlide,
} from '../../types';
import { MatchAlertSlide, getEffectiveTitleConfig } from '../slides/MatchAlertSlide';
import { formatAlertTitle } from '../../utils/alertUtils';
import { isMatchLive, isMatchWin, isClubHomeMatch, getMatchOurAndOpponentScores } from '../../utils/matchStatus';
import { isVideoMedia } from '../../utils/mediaUtils';
import { compressImageFile } from '../../utils/imageCompressor';
import { FFBBService, isTeamCategoryIgnored, normalizeCategoryKey } from '../../services/ffbbService';
import { mergeMatchItems } from '../../utils/ffbbMergeUtils';
import {
  parseExcelBirthdays,
  generateClubBirthdayTemplate,
  getWeekBounds,
  filterAndSortBirthdaysForWeek,
  formatFrenchBirthday,
  extractFirstName,
  extractCleanCategory,
  sortBirthdaysByHierarchy,
  formatDisplayCategory,
} from '../../utils/excelBirthdayParser';
import { MiniCalendarPicker, SingleDatePicker, formatDateToReadableFrench } from './MiniCalendarPicker';
import { StudioGraphiqueWorkbench } from './StudioGraphiqueWorkbench';
import { MediaBankManager } from './MediaBankManager';
import { getConsolidatedMediaBank } from '../../utils/mediaBankUtils';
import { VisualExporterModal } from '../VisualExporterModal';
import { AVAILABLE_FONTS, getFontFamilyClass } from '../../utils/fontUtils';
import { DEFAULT_REAL_FFBB_TEAMS, formatDateToEuropean } from './adminPanelConstants';
import { MatchesTab } from './sections/MatchesTab';
import { ResultsTab } from './sections/ResultsTab';
import { ImageBanksTab } from './sections/ImageBanksTab';
import { SocialTab } from './sections/SocialTab';
import { TelegramTab } from './sections/TelegramTab';
import { AlertsTab } from './sections/AlertsTab';
import { CategoriesTab } from './sections/CategoriesTab';
import { ExcelTab } from './sections/ExcelTab';
import { ClubIdentityTab } from './sections/ClubIdentityTab';
import { FfbbTab } from './sections/FfbbTab';
import { FullykioskTab } from './sections/FullykioskTab';
import { StudioTemplatesTab } from './sections/StudioTemplatesTab';








interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isFullPage?: boolean;
  categories: CategoryConfig[];
  onUpdateCategories: (newCats: CategoryConfig[]) => void;
  clubSettings: ClubSettings;
  onUpdateClubSettings: (newSettings: ClubSettings) => void;
  matches: MatchItem[];
  onUpdateMatches: (newMatches: MatchItem[]) => void;
  results: MatchItem[];
  onUpdateResults: (newResults: MatchItem[]) => void;
  sponsors: SponsorItem[];
  onUpdateSponsors: (newSponsors: SponsorItem[]) => void;
  logos?: ClubLogoItem[];
  onUpdateLogos?: (newLogos: ClubLogoItem[]) => void;
  photos: ClubPhotoItem[];
  onUpdatePhotos: (newPhotos: ClubPhotoItem[]) => void;
  events: ClubEventItem[];
  onUpdateEvents: (newEvents: ClubEventItem[]) => void;
  birthdays: BirthdayItem[];
  onUpdateBirthdays: (newBirthdays: BirthdayItem[]) => void;
  allMembers?: BirthdayItem[];
  onUpdateAllMembers?: (newMembers: BirthdayItem[], weekBirthdays?: BirthdayItem[]) => void;
  simulatedDate?: Date | null;
  onSetSimulatedDate?: (date: Date | null) => void;
  teamVisuals: TeamVisualItem[];
  onUpdateTeamVisuals: (newVisuals: TeamVisualItem[]) => void;
  ffbbTeams?: FFBBTeamItem[];
  onUpdateFfbbTeams?: (teams: FFBBTeamItem[]) => void;
  visualTemplates: VisualTemplatesConfig;
  onUpdateVisualTemplates: (newTemplates: VisualTemplatesConfig) => void;
  activeAlerts: ActiveMatchAlert[];
  onAddAlert: (alert: ActiveMatchAlert) => void;
  onRemoveAlert: (alertId: string) => void;
  onSwitchToTvMode: () => void;
  onOpenVisualExporter?: (type: 'matches' | 'results' | 'victory' | 'defeat') => void;
  carouselPlaylist?: CarouselSlide[];
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveErrorMessage?: string;
  onManualSave?: () => void;
  onReloadFromServer?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  isFullPage = false,
  categories,
  onUpdateCategories,
  clubSettings,
  onUpdateClubSettings,
  matches,
  onUpdateMatches,
  results,
  onUpdateResults,
  sponsors,
  onUpdateSponsors,
  logos = [],
  onUpdateLogos,
  photos,
  onUpdatePhotos,
  events,
  onUpdateEvents,
  birthdays,
  onUpdateBirthdays,
  allMembers,
  onUpdateAllMembers,
  simulatedDate,
  onSetSimulatedDate,
  teamVisuals,
  onUpdateTeamVisuals,
  ffbbTeams: externalFfbbTeams,
  onUpdateFfbbTeams,
  visualTemplates,
  onUpdateVisualTemplates,
  activeAlerts,
  onAddAlert,
  onRemoveAlert,
  onSwitchToTvMode,
  onOpenVisualExporter,
  carouselPlaylist = [],
  saveStatus = 'idle',
  saveErrorMessage,
  onManualSave,
  onReloadFromServer,
}) => {
  const [activeTab, setActiveTab] = useAdminViewState<
    | 'club_identity'
    | 'matches'
    | 'results'
    | 'photos'
    | 'sponsors'
    | 'logos'
    | 'events'
    | 'categories'
    | 'team_visuals'
    | 'social'
    | 'telegram'
    | 'alerts'
    | 'excel'
    | 'ffbb'
    | 'fullykiosk'
    | 'settings'
    | 'image_banks'
    | 'studio_templates'
  >('club_admin_tab', 'matches');

  const [imageBankSubTab, setImageBankSubTab] = useAdminViewState<'media_bank' | 'photos' | 'sponsors' | 'logos' | 'events' | 'team_visuals'>('club_admin_bank_subtab', 'media_bank');
  const consolidatedMediaBank = useMemo(() => getConsolidatedMediaBank(visualTemplates), [visualTemplates]);

  const [selectedFolderCategory, setSelectedFolderCategory] = useState<'photos' | 'sponsors' | 'events' | 'opponent_logos'>('photos');
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  // Sous-onglets par catégorie pour intégrer directement le Studio Calques sur place
  const [matchesSubTab, setMatchesSubTab] = useAdminViewState<'list' | 'calques'>('club_admin_matches_subtab', 'list');
  const [resultsSubTab, setResultsSubTab] = useAdminViewState<'list' | 'calques'>('club_admin_results_subtab', 'list');
  const [birthdaysSubTab, setBirthdaysSubTab] = useAdminViewState<'list' | 'calques'>('club_admin_birthdays_subtab', 'list');

  // État de simulation et d'aperçu d'alerte Victoire / Défaite
  const [alertPreviewType, setAlertPreviewType] = useState<'win' | 'loss'>('loss');
  const [alertPreviewTeam, setAlertPreviewTeam] = useState<string>('__widest__');
  const [selectedAlertVisualUrl, setSelectedAlertVisualUrl] = useState<string | null>(null);
  const [selectedAlertVisualType, setSelectedAlertVisualType] = useState<'win' | 'loss'>('loss');

  // Configuration graphique actuellement en cours d'édition (spécifique au visuel sélectionné ou défaut global)
  const activeEditingConfig = useMemo(() => {
    if (selectedAlertVisualUrl) {
      return getEffectiveTitleConfig(
        selectedAlertVisualUrl,
        selectedAlertVisualType === 'win',
        visualTemplates
      );
    }
    return {
      customTitle: alertPreviewType === 'win'
        ? (visualTemplates.alertCustomWinTitle ?? 'VICTOIRE DES {CATEGORIE}')
        : (visualTemplates.alertCustomLossTitle ?? 'DÉFAITE DES {CATEGORIE}'),
      font: visualTemplates.alertTextFont ?? 'Bebas Neue',
      color: alertPreviewType === 'win'
        ? (visualTemplates.alertWinColor || visualTemplates.alertTextColor || '#10b981')
        : (visualTemplates.alertLossColor || visualTemplates.alertTextColor || '#ef4444'),
      scale: visualTemplates.alertTextScale ?? 1.0,
      x: visualTemplates.alertTextX ?? 50,
      y: visualTemplates.alertTextY ?? 82,
      align: visualTemplates.alertTextAlign ?? 'center',
      bgOpacity: visualTemplates.alertTextBgOpacity ?? 0,
      glowEffect: visualTemplates.alertGlowEffect ?? true,
      isCustomized: false,
    };
  }, [selectedAlertVisualUrl, selectedAlertVisualType, visualTemplates, alertPreviewType]);

  // Met à jour la configuration graphique du visuel sélectionné (ou les réglages par défaut généraux)
  const updateActiveConfig = (partial: Partial<VisualTitleConfig>) => {
    if (selectedAlertVisualUrl) {
      const existing = visualTemplates.visualTitleConfigs?.[selectedAlertVisualUrl] || {};
      const base = getEffectiveTitleConfig(
        selectedAlertVisualUrl,
        selectedAlertVisualType === 'win',
        visualTemplates
      );
      const updatedMediaConfig: VisualTitleConfig = {
        ...base,
        ...existing,
        ...partial,
        isCustomized: true, // Marque ce visuel comme personnalisé de façon indépendante
      };

      onUpdateVisualTemplates({
        ...visualTemplates,
        visualTitleConfigs: {
          ...(visualTemplates.visualTitleConfigs || {}),
          [selectedAlertVisualUrl]: updatedMediaConfig,
        },
      });
    } else {
      // Met à jour les valeurs par défaut globales
      const isWin = alertPreviewType === 'win';
      const nextVT = { ...visualTemplates };
      if (partial.customTitle !== undefined) {
        if (isWin) nextVT.alertCustomWinTitle = partial.customTitle;
        else nextVT.alertCustomLossTitle = partial.customTitle;
      }
      if (partial.font !== undefined) nextVT.alertTextFont = partial.font;
      if (partial.color !== undefined) {
        if (isWin) nextVT.alertWinColor = partial.color;
        else nextVT.alertLossColor = partial.color;
      }
      if (partial.scale !== undefined) nextVT.alertTextScale = partial.scale;
      if (partial.x !== undefined) nextVT.alertTextX = partial.x;
      if (partial.y !== undefined) nextVT.alertTextY = partial.y;
      if (partial.align !== undefined) nextVT.alertTextAlign = partial.align;
      if (partial.bgOpacity !== undefined) nextVT.alertTextBgOpacity = partial.bgOpacity;
      if (partial.glowEffect !== undefined) nextVT.alertGlowEffect = partial.glowEffect;

      onUpdateVisualTemplates(nextVT);
    }
  };



  // New Match Form State
  const [newMatchCategory, setNewMatchCategory] = useState('Seniors Garçons 1');
  const [newMatchOpponent, setNewMatchOpponent] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('Samedi 20 Septembre');
  const [newMatchTime, setNewMatchTime] = useState('20:30');
  const [newMatchGymnasium, setNewMatchGymnasium] = useState(clubSettings.gymnasiumDefault || 'Gymnase intercommunal');
  const [newMatchIsHome, setNewMatchIsHome] = useState(true);

  // New Result Form State (Synchronized with FFBB)
  const [newResultCategory, setNewResultCategory] = useState('Seniors Garçons 1');
  const [newResultIsCustomCategory, setNewResultIsCustomCategory] = useState(false);
  const [newResultOpponent, setNewResultOpponent] = useState('');
  const [newResultMode, setNewResultMode] = useState<'score' | 'status'>('score');
  const [newResultStatusOutcome, setNewResultStatusOutcome] = useState<'win' | 'loss'>('win');
  const [newResultHomeScore, setNewResultHomeScore] = useState<string>('');
  const [newResultAwayScore, setNewResultAwayScore] = useState<string>('');
  const [newResultIsHome, setNewResultIsHome] = useState<boolean>(true);
  const [selectedScheduledMatchId, setSelectedScheduledMatchId] = useState<string>('');
  const [newResultSuccessMsg, setNewResultSuccessMsg] = useState<string | null>(null);
  const [newResultErrorMsg, setNewResultErrorMsg] = useState<string | null>(null);
  const [editingResult, setEditingResult] = useState<MatchItem | null>(null);

  // FFBB Sync State & Real Teams State
  const [isSyncingFFBB, setIsSyncingFFBB] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncIsError, setSyncIsError] = useState<boolean>(false);

  // Proposition suggestive d'identité FFBB (propose sans imposer)
  const [identityProposal, setIdentityProposal] = useState<{
    ffbbName?: string;
    ffbbLogoUrl?: string;
    differences: {
      name?: { current: string; proposed: string };
      logo?: { current?: string; proposed: string };
    };
  } | null>(null);
  const [selectedProposalUpdates, setSelectedProposalUpdates] = useState<{
    updateName: boolean;
    updateLogo: boolean;
  }>({ updateName: true, updateLogo: true });
  const [proposalAppliedMsg, setProposalAppliedMsg] = useState<string | null>(null);

  const [editingMatch, setEditingMatch] = useState<MatchItem | null>(null);
  const [internalFfbbTeams, setInternalFfbbTeams] = useState<FFBBTeamItem[]>(() => {
    try {
      const saved = localStorage.getItem('ffbb_club_teams_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_REAL_FFBB_TEAMS;
  });

  const ffbbTeams = useMemo(() => groupFfbbTeams(
    externalFfbbTeams && externalFfbbTeams.length > 0 ? externalFfbbTeams : internalFfbbTeams,
    [], clubSettings.customTeamNames || {},
  ), [externalFfbbTeams, internalFfbbTeams, clubSettings.customTeamNames]);
  const setFfbbTeams = (teams: FFBBTeamItem[]) => {
    setInternalFfbbTeams(teams);
    if (onUpdateFfbbTeams) {
      onUpdateFfbbTeams(teams);
    }
  };

  const {
    telegramStatus,
    telegramStatusLoading,
    telegramConnecting,
    telegramDisconnecting,
    telegramActionMsg,
    setTelegramActionMsg,
    adminPasswordPrompt,
    setAdminPasswordPrompt,
    adminPasswordInput,
    setAdminPasswordInput,
    effectiveLastTelegramMessage,
    formatTelegramDate,
    telegramSimText,
    setTelegramSimText,
    telegramSimFeedback,
    telegramSimLoading,
    handleTestTelegramMessage,
    fetchTelegramStatus,
    handleConnectTelegram,
    handleDisconnectTelegram,
  } = useTelegramAdmin({ activeTab, teamVisuals, visualTemplates, onAddAlert });


  const {
    isParsingExcel,
    excelSuccessMsg,
    excelErrors,
    excelInputRef,
    showAllBirthdays,
    setShowAllBirthdays,
    birthdayWeekOffset,
    allMembersPool,
    editingBirthdayId,
    editBdayFirstName,
    setEditBdayFirstName,
    editBdayCategory,
    setEditBdayCategory,
    editBdayDate,
    setEditBdayDate,
    isAddingManualBday,
    setIsAddingManualBday,
    manualBdayFirstName,
    setManualBdayFirstName,
    manualBdayCategory,
    setManualBdayCategory,
    manualBdayDate,
    setManualBdayDate,
    handleExcelFileUpload,
    handleSelectWeekOffset,
    handleStartEditBirthday,
    handleSaveEditBirthday,
    handleCancelEditBirthday,
    handleAddManualBirthday,
    handleDeleteBirthday,
  } = useBirthdaysAdmin({ birthdays, onUpdateBirthdays, allMembers, onUpdateAllMembers, simulatedDate });

  const {
    socialWebhookStatus,
    setSocialSaveSuccess,
    socialForm,
    setSocialForm,
    handleTestSocialWebhook,
  } = useSocialAdmin({ clubSettings, onUpdateClubSettings, matches, results });

  // Periodes du calendrier persistees : restaurees a la reouverture de l'appli
  const [syncStartDate, setSyncStartDate] = useState<string>(() => {
    try { return clubSettings.matchesFilterStart || ''; } catch (e) { return ''; }
  });
  const [syncEndDate, setSyncEndDate] = useState<string>(() => {
    try { return clubSettings.matchesFilterEnd || ''; } catch (e) { return ''; }
  });
  const [resultsStartDate, setResultsStartDate] = useState<string>(() => {
    try { return clubSettings.resultsFilterStart || ''; } catch (e) { return ''; }
  });
  const [resultsEndDate, setResultsEndDate] = useState<string>(() => {
    try { return clubSettings.resultsFilterEnd || ''; } catch (e) { return ''; }
  });
  // Périodes des calendriers : partagées entre tous les appareils via clubSettings (sauvegarde en ligne)
  // + fallback localStorage hors-ligne.
  const periodSyncDoneRef = useRef<boolean>(true);

  // Restauration depuis le serveur : la période sélectionnée suit l'utilisateur sur n'importe quel appareil
  useEffect(() => {
    if (
      clubSettings.matchesFilterStart !== undefined ||
      clubSettings.matchesFilterEnd !== undefined ||
      clubSettings.resultsFilterStart !== undefined ||
      clubSettings.resultsFilterEnd !== undefined
    ) {
      periodSyncDoneRef.current = true;
      if (
        (clubSettings.matchesFilterStart || '') !== syncStartDate ||
        (clubSettings.matchesFilterEnd || '') !== syncEndDate ||
        (clubSettings.resultsFilterStart || '') !== resultsStartDate ||
        (clubSettings.resultsFilterEnd || '') !== resultsEndDate
      ) {
        setSyncStartDate(clubSettings.matchesFilterStart || '');
        setSyncEndDate(clubSettings.matchesFilterEnd || '');
        setResultsStartDate(clubSettings.resultsFilterStart || '');
        setResultsEndDate(clubSettings.resultsFilterEnd || '');
      }
    }
  }, [clubSettings]);

  // Sauvegarde : localStorage (hors-ligne) + clubSettings (partage tous appareils)
  useEffect(() => {
    try {
      if (syncStartDate) localStorage.setItem('club_matches_filter_start', syncStartDate);
      else localStorage.removeItem('club_matches_filter_start');
      if (syncEndDate) localStorage.setItem('club_matches_filter_end', syncEndDate);
      else localStorage.removeItem('club_matches_filter_end');
      if (resultsStartDate) localStorage.setItem('club_results_filter_start', resultsStartDate);
      else localStorage.removeItem('club_results_filter_start');
      if (resultsEndDate) localStorage.setItem('club_results_filter_end', resultsEndDate);
      else localStorage.removeItem('club_results_filter_end');
    } catch (e) {}

    if (!periodSyncDoneRef.current) return; // attendre la restauration serveur avant d'écraser
    const nextMStart = syncStartDate || undefined;
    const nextMEnd = syncEndDate || undefined;
    const nextRStart = resultsStartDate || undefined;
    const nextREnd = resultsEndDate || undefined;
    if (
      clubSettings.matchesFilterStart !== nextMStart ||
      clubSettings.matchesFilterEnd !== nextMEnd ||
      clubSettings.resultsFilterStart !== nextRStart ||
      clubSettings.resultsFilterEnd !== nextREnd
    ) {
      onUpdateClubSettings({
        ...clubSettings,
        matchesFilterStart: nextMStart,
        matchesFilterEnd: nextMEnd,
        resultsFilterStart: nextRStart,
        resultsFilterEnd: nextREnd,
      });
    }
  }, [syncStartDate, syncEndDate, resultsStartDate, resultsEndDate, clubSettings]);

  const [showCalendarInResults, setShowCalendarInResults] = useState<boolean>(true);
  const [resultsFilterMode, setResultsFilterMode] = useState<'all' | 'range'>('range');
  const [showAddManualResult, setShowAddManualResult] = useState<boolean>(false);
  const [quickScoreMatchId, setQuickScoreMatchId] = useState<string | null>(null);
  const [quickHomeScore, setQuickHomeScore] = useState<string>('');
  const [quickAwayScore, setQuickAwayScore] = useState<string>('');
  const [matchesFilterMode, setMatchesFilterMode] = useState<'all' | 'range'>('range');
  const previousPeriods = useRef(`${syncStartDate}|${syncEndDate}|${resultsStartDate}|${resultsEndDate}`);
  useEffect(() => {
    const key = `${syncStartDate}|${syncEndDate}|${resultsStartDate}|${resultsEndDate}`;
    const old = previousPeriods.current.split('|');
    previousPeriods.current = key;
    if (syncStartDate && syncEndDate && (old[0] !== syncStartDate || old[1] !== syncEndDate)) {
      setMatchesFilterMode('range');
      onUpdateMatches(matches.map(m => ({ ...m, selectedForWeekend: m.date >= syncStartDate && m.date <= syncEndDate })));
    }
    if (resultsStartDate && resultsEndDate && (old[2] !== resultsStartDate || old[3] !== resultsEndDate)) {
      setResultsFilterMode('range');
      onUpdateResults(results.map(m => ({ ...m, selectedForWeekend: m.date >= resultsStartDate && m.date <= resultsEndDate })));
    }
  }, [syncStartDate, syncEndDate, resultsStartDate, resultsEndDate]);
  const [showCalendarInMatches, setShowCalendarInMatches] = useState<boolean>(true);
  const [showAddManualMatch, setShowAddManualMatch] = useState<boolean>(false);
  const [showPerTeamVisuals, setShowPerTeamVisuals] = useState<boolean>(false);
  const [newResultDate, setNewResultDate] = useState<string>('Hier');

  const {
    isDraggingLogo,
    setIsDraggingLogo,
    isUploadingLogo,
    logoFileInputRef,
    newSponsorName,
    setNewSponsorName,
    newSponsorTier,
    setNewSponsorTier,
    newLogoName,
    setNewLogoName,
    newLogoCategory,
    setNewLogoCategory,
    isDraggingPhotos,
    setIsDraggingPhotos,
    isDraggingSponsors,
    setIsDraggingSponsors,
    isDraggingLogos,
    setIsDraggingLogos,
    isDraggingEvents,
    setIsDraggingEvents,
    uploadFeedback,
    setUploadFeedback,
    newPhotoTitle,
    setNewPhotoTitle,
    newPhotoFolder,
    setNewPhotoFolder,
    newEventTitle,
    setNewEventTitle,
    newEventDate,
    setNewEventDate,
    handleLogoFileUpload,
    uploadMultipleFiles,
    handleBatchPhotosUpload,
    handleBatchSponsorsUpload,
    handleBatchLogosUpload,
    handleBatchEventsUpload,
  } = useMediaUploadsAdmin({ clubSettings, onUpdateClubSettings, sponsors, logos, photos, events, onUpdateSponsors, onUpdateLogos, onUpdatePhotos, onUpdateEvents });

  // State for adding a custom team visual
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCategory, setNewTeamCategory] = useState('Seniors');
  const [newTeamAliases, setNewTeamAliases] = useState('');

  // Add Manual Match
  const handleAddMatchManual = () => {
    if (!newMatchOpponent.trim()) return;
    const club = clubSettings.shortName || clubSettings.name || 'Notre Club';
    const newMatch: MatchItem = {
      id: `match-m-${Date.now()}`,
      date: newMatchDate.trim() || 'Samedi',
      time: newMatchTime.trim() || '20:30',
      category: newMatchCategory.trim() || 'Seniors',
      competition: 'Régionale / Départementale',
      teamHome: newMatchIsHome ? club : newMatchOpponent.trim(),
      teamAway: newMatchIsHome ? newMatchOpponent.trim() : club,
      isHomeMatch: newMatchIsHome,
      ourClubName: club,
      gymnasium: newMatchGymnasium.trim() || clubSettings.gymnasiumDefault,
      city: clubSettings.city || '',
      status: 'upcoming',
      isManualMatch: true,
      isDateManual: true,
      isTimeManual: true,
      isGymnasiumManual: true,
    };
    onUpdateMatches([newMatch, ...matches]);
    setNewMatchOpponent('');
  };

  // Available synchronized FFBB teams from official club teams and matches
  const availableFfbbTeams = useMemo(() => {
    const list: { name: string; category?: string; gender?: string; competition?: string }[] = [];
    const seen = new Set<string>();

    // 1. From ffbbTeams
    if (Array.isArray(ffbbTeams) && ffbbTeams.length > 0) {
      ffbbTeams.forEach((t) => {
        if (t.name && !seen.has(t.name.trim().toLowerCase())) {
          seen.add(t.name.trim().toLowerCase());
          list.push({
            name: t.name,
            category: t.category,
            gender: t.gender,
            competition: t.competition,
          });
        }
      });
    }

    // 2. From matches
    matches.forEach((m) => {
      if (m.category && !seen.has(m.category.trim().toLowerCase())) {
        seen.add(m.category.trim().toLowerCase());
        list.push({
          name: m.category,
          category: m.category,
          competition: m.competition,
        });
      }
    });

    // 3. Fallback to DEFAULT_REAL_FFBB_TEAMS if still empty
    if (list.length === 0) {
      DEFAULT_REAL_FFBB_TEAMS.forEach((t) => {
        if (!seen.has(t.name.trim().toLowerCase())) {
          seen.add(t.name.trim().toLowerCase());
          list.push({
            name: t.name,
            category: t.category,
            gender: t.gender,
            competition: t.competition,
          });
        }
      });
    }

    return list;
  }, [ffbbTeams, matches]);

  // Liste unifiée de toutes les catégories / équipes du club pour le test de largeur
  const allCandidateTeams = useMemo(() => {
    const names = new Map<string, string>();
    for (const team of ffbbTeams) {
      const custom = clubSettings.customTeamNames?.[team.id] || clubSettings.customTeamNames?.[team.category];
      names.set(normalizeCategoryKey(team.category || team.name), custom || team.customName || team.category || team.name);
    }
    // With official teams available, visual aliases must not become extra teams.
    if (names.size > 0) return [...new Set(names.values())];
    for (const item of [...teamVisuals.map(t => ({ category: t.category, name: t.teamName })), ...matches.map(m => ({ category: m.rawFfbbCategory || m.category, name: m.category }))]) {
      const key = normalizeCategoryKey(item.category || item.name);
      if (!names.has(key)) names.set(key, item.name);
    }
    return [...new Set([...names.values()].filter(Boolean))];
  }, [teamVisuals, ffbbTeams, matches, clubSettings.customTeamNames]);

  const currentPreviewIsWin = selectedAlertVisualUrl ? selectedAlertVisualType === 'win' : alertPreviewType === 'win';
  const currentPreviewTitleTemplate = activeEditingConfig.customTitle || (currentPreviewIsWin ? (visualTemplates.alertCustomWinTitle ?? 'VICTOIRE DES {CATEGORIE}') : (visualTemplates.alertCustomLossTitle ?? 'DÉFAITE DES {CATEGORIE}'));
  const currentPreviewFont = activeEditingConfig.font || visualTemplates.alertTextFont || 'Bebas Neue';
  const currentPreviewScale = activeEditingConfig.scale ?? visualTemplates.alertTextScale ?? 1.0;

  // Référence DOM cachée pour mesurer la largeur réelle de chaque équipe avec la police et le modèle actuels
  const teamsMeasureRef = useRef<HTMLDivElement>(null);
  const [widestTeamInfo, setWidestTeamInfo] = useState<{
    team: string;
    widthPx: number;
    widestLine: string;
  }>(() => ({
    team: 'Seniors Garçons 1',
    widthPx: 0,
    widestLine: 'Seniors Garçons 1',
  }));

  // Mesure réelle au pixel de chaque équipe en tenant compte de la police, de la taille et des retours à la ligne
  useEffect(() => {
    const container = teamsMeasureRef.current;
    if (!container || allCandidateTeams.length === 0) return;

    const measureWidest = () => {
      const blocks = container.querySelectorAll<HTMLElement>('.team-width-block');
      let maxW = 0;
      let widestName = allCandidateTeams[0] || 'Seniors Garçons 1';
      let widestLineStr = '';

      blocks.forEach((block) => {
        const team = block.getAttribute('data-team') || '';
        const lineEls = block.querySelectorAll<HTMLElement>('.team-width-line');
        let teamMaxLine = 0;
        let localWidestLine = '';
        lineEls.forEach((el) => {
          const w = el.getBoundingClientRect().width;
          if (w > teamMaxLine) {
            teamMaxLine = w;
            localWidestLine = el.textContent || '';
          }
        });

        if (teamMaxLine > maxW) {
          maxW = teamMaxLine;
          widestName = team;
          widestLineStr = localWidestLine;
        }
      });

      if (widestName) {
        setWidestTeamInfo({
          team: widestName,
          widthPx: Math.round(maxW),
          widestLine: widestLineStr,
        });
      }
    };

    measureWidest();

    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureWidest);
    }
  }, [
    allCandidateTeams,
    currentPreviewTitleTemplate,
    currentPreviewIsWin,
    currentPreviewFont,
    currentPreviewScale,
  ]);

  const effectivePreviewTeam =
    alertPreviewTeam === '__widest__'
      ? (widestTeamInfo.team || allCandidateTeams[0] || 'Seniors Garçons 1')
      : alertPreviewTeam;

  // Handler for selecting an existing scheduled match from FFBB
  const handleSelectScheduledMatch = (matchId: string) => {
    setSelectedScheduledMatchId(matchId);
    if (!matchId) return;

    const selectedMatch = matches.find((m) => m.id === matchId);
    if (selectedMatch) {
      setNewResultCategory(selectedMatch.category);
      setNewResultIsCustomCategory(false);
      setNewResultOpponent(selectedMatch.isHomeMatch ? selectedMatch.teamAway : selectedMatch.teamHome);
      setNewResultDate(selectedMatch.date || 'Hier');
      setNewResultIsHome(selectedMatch.isHomeMatch ?? true);
      setNewResultErrorMsg(null);
      setNewResultSuccessMsg(
        `Match sélectionné : ${selectedMatch.category} vs ${
          selectedMatch.isHomeMatch ? selectedMatch.teamAway : selectedMatch.teamHome
        }. Entrez maintenant les scores ci-dessous !`
      );
      setTimeout(() => setNewResultSuccessMsg(null), 3500);
    }
  };

  // Add Manual Result
  const handleAddResultManual = () => {
    const cleanOpponent = newResultOpponent.trim();
    if (!cleanOpponent) {
      setNewResultErrorMsg("Veuillez indiquer le nom de l'équipe adverse.");
      return;
    }

    const club = clubSettings.shortName || clubSettings.name || 'Notre Club';
    const cat = newResultCategory.trim() || 'Seniors';

    let ourScore: number | undefined = undefined;
    let oppScore: number | undefined = undefined;
    let isWin = false;

    if (newResultMode === 'score') {
      if (newResultHomeScore.trim() === '' || newResultAwayScore.trim() === '') {
        setNewResultErrorMsg("Veuillez saisir les scores des deux équipes ou basculer en mode Victoire / Défaite.");
        return;
      }

      ourScore = parseInt(newResultHomeScore, 10);
      oppScore = parseInt(newResultAwayScore, 10);

      if (isNaN(ourScore) || isNaN(oppScore)) {
        setNewResultErrorMsg("Les scores doivent être des nombres entiers valides.");
        return;
      }
      isWin = ourScore > oppScore;
    } else {
      isWin = newResultStatusOutcome === 'win';
    }

    const newRes: MatchItem = {
      id: `res-m-${Date.now()}`,
      date: newResultDate.trim() || 'Week-end dernier',
      time: 'Terminé',
      category: cat,
      competition: 'Régionale / Départementale',
      teamHome: newResultIsHome ? cat : cleanOpponent,
      teamAway: newResultIsHome ? cleanOpponent : cat,
      isHomeMatch: newResultIsHome,
      ourClubName: club,
      gymnasium: newResultIsHome ? clubSettings.gymnasiumDefault : '',
      city: newResultIsHome ? clubSettings.city : '',
      homeScore: newResultMode === 'score' ? (newResultIsHome ? ourScore : oppScore) : undefined,
      awayScore: newResultMode === 'score' ? (newResultIsHome ? oppScore : ourScore) : undefined,
      status: 'finished',
      result: isWin ? 'win' : 'loss',
      isManualMatch: true,
      isScoreManual: true,
      isDateManual: true,
      isTimeManual: true,
    };

    onUpdateResults([newRes, ...results]);

    // If this was from a scheduled match, also mark the scheduled match as finished with scores
    if (selectedScheduledMatchId) {
      onUpdateMatches(
        matches.map((m) =>
          m.id === selectedScheduledMatchId
            ? {
                ...m,
                status: 'finished' as const,
                homeScore: newRes.homeScore,
                awayScore: newRes.awayScore,
                result: newRes.result,
                isScoreManual: true,
              }
            : m
        )
      );
    }

    setNewResultOpponent('');
    setNewResultHomeScore('');
    setNewResultAwayScore('');
    setSelectedScheduledMatchId('');
    setNewResultErrorMsg(null);
    setNewResultSuccessMsg(
      newResultMode === 'score'
        ? `Résultat enregistré avec succès : ${cat} ${ourScore} - ${oppScore} ${cleanOpponent} (${isWin ? 'Victoire 🏆' : 'Défaite'}) !`
        : `Résultat enregistré avec succès : ${cat} vs ${cleanOpponent} (${isWin ? 'Victoire 🏆' : 'Défaite'}) !`
    );
    setTimeout(() => setNewResultSuccessMsg(null), 4500);
  };

  // Edit an existing result
  const handleSaveEditedResult = (updated: MatchItem) => {
    const orig = results.find((r) => r.id === updated.id);
    const updatedRes: MatchItem = {
      ...updated,
      isScoreManual: true,
      isDateManual: orig ? (orig.isDateManual || updated.date !== orig.date) : true,
      isTimeManual: orig ? (orig.isTimeManual || updated.time !== orig.time) : true,
      isGymnasiumManual: orig ? (orig.isGymnasiumManual || updated.gymnasium !== orig.gymnasium) : true,
    };
    onUpdateResults(results.map((r) => (r.id === updated.id ? updatedRes : r)));
    setEditingResult(null);
  };

  if (!isOpen) return null;

  // Handle category duration change
  const handleDurationChange = (categoryId: SlideCategory, duration: number) => {
    const clampedDuration = Math.min(10, Math.max(3, duration));
    const updated = categories.map((c) =>
      c.id === categoryId ? { ...c, durationSeconds: clampedDuration } : c
    );
    onUpdateCategories(updated);
  };

  // Toggle category enabled
  const handleToggleCategory = (categoryId: SlideCategory) => {
    const updated = categories.map((c) =>
      c.id === categoryId ? { ...c, enabled: !c.enabled } : c
    );
    onUpdateCategories(updated);
  };

  // Helpers for multi-file batch upload & cleaning names

  // Trigger Victory or Defeat manually for 1 hour in loop
  const handleTriggerMatchOutcome = (team: TeamVisualItem, isWin: boolean, ourScore = 82, oppScore = 74) => {
    let customImg = isWin ? team.winVisualUrl : team.lossVisualUrl;
    const commonBank = isWin ? visualTemplates.commonVictoryVisuals : visualTemplates.commonDefeatVisuals;
    if (commonBank && commonBank.length > 0) {
      const randomIndex = Math.floor(Math.random() * commonBank.length);
      customImg = commonBank[randomIndex];
    }

    const resolvedTitleConfig = customImg
      ? getEffectiveTitleConfig(customImg, isWin, visualTemplates)
      : undefined;

    const alert: ActiveMatchAlert = {
      id: 'alert-' + Date.now(),
      team: team.teamName,
      isWin,
      ourScore: isWin ? Math.max(ourScore, oppScore) : Math.min(ourScore, oppScore),
      opponentScore: isWin ? Math.min(ourScore, oppScore) : Math.max(ourScore, oppScore),
      opponent: 'Adversaire',
      customImageUrl: customImg,
      titleConfig: resolvedTitleConfig,
      triggeredBy: 'manual',
      timestamp: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 heure
    };
    onAddAlert(alert);
    setActiveTab('alerts');
  };

  const setFilterToCurrentWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysToFriday = 5 - dayOfWeek;
    if (dayOfWeek === 0) daysToFriday = -2;
    else if (dayOfWeek === 6) daysToFriday = -1;

    const friday = new Date(today);
    friday.setDate(today.getDate() + daysToFriday);

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);

    setSyncStartDate(friday.toISOString().slice(0, 10));
    setSyncEndDate(sunday.toISOString().slice(0, 10));
    setMatchesFilterMode('range');
  };

  const setResultsFilterToLastWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysToFriday = 5 - dayOfWeek - 7;
    if (dayOfWeek === 0) daysToFriday = -2 - 7;
    else if (dayOfWeek === 6) daysToFriday = -1 - 7;

    const friday = new Date(today);
    friday.setDate(today.getDate() + daysToFriday);

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);

    setResultsStartDate(friday.toISOString().slice(0, 10));
    setResultsEndDate(sunday.toISOString().slice(0, 10));
    setResultsFilterMode('range');
  };

  const setResultsFilterToCurrentWeekend = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysToFriday = 5 - dayOfWeek;
    if (dayOfWeek === 0) daysToFriday = -2;
    else if (dayOfWeek === 6) daysToFriday = -1;

    const friday = new Date(today);
    friday.setDate(today.getDate() + daysToFriday);

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);

    setResultsStartDate(friday.toISOString().slice(0, 10));
    setResultsEndDate(sunday.toISOString().slice(0, 10));
    setResultsFilterMode('range');
  };

  const handleSelectOnlyFilteredMatchesForTV = (filteredList: MatchItem[]) => {
    const targetIds = new Set(filteredList.map((m) => m.id));
    const updated = matches.map((m) => ({
      ...m,
      selectedForWeekend: targetIds.has(m.id),
    }));
    onUpdateMatches(updated);
    setSyncMessage(`✓ ${filteredList.length} match(s) de la période cochés pour la TV.`);
    setTimeout(() => setSyncMessage(null), 3500);
  };

  const handleSelectOnlyFilteredResultsForTV = (filteredList: MatchItem[]) => {
    const targetIds = new Set(filteredList.map((r) => r.id));
    const updated = results.map((r) => ({
      ...r,
      selectedForWeekend: targetIds.has(r.id),
    }));
    onUpdateResults(updated);
    setSyncMessage(`✓ ${filteredList.length} résultat(s) de la période cochés pour la TV.`);
    setTimeout(() => setSyncMessage(null), 3500);
  };

  // Transformation rapide d'un match en Victoire / Défaite / Score et transfert direct dans Résultats
  const handleQuickMatchOutcome = (
    match: MatchItem,
    outcome: 'win' | 'loss' | 'score',
    customScores?: { homeScore: number; awayScore: number }
  ) => {
    const isHome = isClubHomeMatch(match, clubSettings.name, clubSettings.shortName);
    const cleanOpponent = isHome ? match.teamAway : match.teamHome;
    const club = clubSettings.shortName || clubSettings.name || 'Notre Club';
    const cat = match.category || 'Seniors';

    let homeScore = match.homeScore;
    let awayScore = match.awayScore;
    let isWin = false;

    if (outcome === 'win') {
      isWin = true;
    } else if (outcome === 'loss') {
      isWin = false;
    } else if (outcome === 'score' && customScores) {
      homeScore = customScores.homeScore;
      awayScore = customScores.awayScore;
      const ourScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;
      isWin = ourScore > oppScore;
    }

    const newRes: MatchItem = {
      id: `res-quick-${match.id}-${Date.now()}`,
      date: match.date || 'Hier',
      time: 'Terminé',
      category: cat,
      competition: match.competition || 'Régionale / Départementale',
      poule: match.poule,
      teamHome: match.teamHome,
      teamAway: match.teamAway,
      isHomeMatch: isHome,
      ourClubName: club,
      gymnasium: match.gymnasium || (isHome ? clubSettings.gymnasiumDefault : ''),
      city: match.city || (isHome ? clubSettings.city : ''),
      homeScore,
      awayScore,
      status: 'finished',
      result: isWin ? 'win' : 'loss',
      ffbbMatchNumber: match.ffbbMatchNumber,
      isManualMatch: match.isManualMatch,
      isScoreManual: true,
      isDateManual: match.isDateManual,
      isTimeManual: match.isTimeManual,
      isGymnasiumManual: match.isGymnasiumManual,
      isOpponentLogoManual: match.isOpponentLogoManual,
    };

    onUpdateResults([newRes, ...results.filter((r) => r.id !== newRes.id)]);
    onUpdateMatches(matches.filter((m) => m.id !== match.id));

    setSyncMessage(
      outcome === 'score' && homeScore !== undefined && awayScore !== undefined
        ? `Match ${cat} vs ${cleanOpponent} transféré dans Résultats (${homeScore} - ${awayScore}) !`
        : `Match ${cat} vs ${cleanOpponent} transféré dans Résultats (${isWin ? 'Victoire 🏆' : 'Défaite'}) !`
    );
    setTimeout(() => setSyncMessage(null), 4000);
  };

  // A code being typed is a draft, not a club switch. Commit it with successful sports data.
  const [ffbbClubDraft, setFfbbClubDraft] = useState(clubSettings.codeFFBB);
  const ffbbDraftRef = useRef(ffbbClubDraft);
  ffbbDraftRef.current = ffbbClubDraft;
  useEffect(() => { setFfbbClubDraft(clubSettings.codeFFBB); }, [clubSettings.codeFFBB]);
  const updateClubDraftSettings = (next: ClubSettings) => {
    ffbbDraftRef.current = next.codeFFBB;
    setFfbbClubDraft(next.codeFFBB);
    onUpdateClubSettings({ ...next, codeFFBB: clubSettings.codeFFBB });
  };
  const draftClubSettings = { ...clubSettings, codeFFBB: ffbbClubDraft };

  // Récupération automatique des logos des clubs adverses (FFBB API)
  const handleSyncFFBB = async () => {
    setIsSyncingFFBB(true);
    setSyncMessage(null);
    setSyncIsError(false);
    try {
      const requestedCode = ffbbClubDraft.trim();
      const res = await FFBBService.fetchClubData(requestedCode);
      if (clubCodeKey(ffbbDraftRef.current) !== clubCodeKey(requestedCode)) {
        setSyncMessage('Le code a changé pendant la récupération. Relancez la synchronisation ; aucune donnée remplacée.');
        return;
      }
      if (res.clubInfo?.organismeId) {
        const scope = prepareClubSportsSync(clubSettings, matches, results,
          { ...res.clubInfo, clubName: res.clubInfo.clubName }, requestedCode);
        let allSeasonMatches = res.matches || [];
        let allSeasonResults = res.results || [];

        const ignoredCategories = scope.settings.ignoredTeamCategories || [];
        const customNames = scope.settings.customTeamNames || {};
        const handoff = prepareExcelApiHandoff(scope.matches, scope.results, allSeasonMatches, allSeasonResults, groupFfbbTeams(res.clubInfo.teamsList || [], scope.changedClub ? [] : ffbbTeams));
        const finalMatches = mergeMatchItems(handoff.matches, allSeasonMatches, customNames);
        const finalResults = mergeMatchItems(handoff.results, allSeasonResults, customNames);

        onUpdateClubSettings(scope.settings);
        onUpdateMatches(finalMatches);
        onUpdateResults(finalResults);

        if (res.clubInfo?.teamsList) {
          const updatedTeams = groupFfbbTeams(res.clubInfo.teamsList, scope.changedClub ? [] : ffbbTeams, customNames);

          setFfbbTeams(updatedTeams);
          try {
            localStorage.setItem('ffbb_club_teams_cache', JSON.stringify(updatedTeams));
          } catch (e) {}
        }

        const sourceInfo = res.source === 'ffbb_mobile' ? 'API mobile FFBB' : 'API FFBB de secours';
        const allTeamsList = (res.clubInfo?.teamsList && res.clubInfo.teamsList.length > 0) ? groupFfbbTeams(res.clubInfo.teamsList, scope.changedClub ? [] : ffbbTeams, customNames) : scope.changedClub ? [] : ffbbTeams;
        const ignoredCount = allTeamsList.filter((t) => isTeamCategoryIgnored(t.category, ignoredCategories)).length;
        const trackedCount = allTeamsList.length - ignoredCount;
        const ignoredNote = ignoredCount > 0 ? ` (${ignoredCount} équipe${ignoredCount > 1 ? 's' : ''} ignorée${ignoredCount > 1 ? 's' : ''})` : '';

        setSyncMessage(`${res.clubInfo.membershipChecked === false ? 'Attention : vérification des anciens matchs indisponible ; leur historique est conservé. ' : ''}Synchronisation réussie (${sourceInfo})${ignoredNote}${scope.changedClub ? ' — nouveau club, anciennes données sportives remplacées' : ''} ! Le calendrier reçu (${allSeasonMatches.length} rencontres et ${allSeasonResults.length} résultats) a été synchronisé pour les ${trackedCount} équipes suivies.`);
      } else {
        setSyncIsError(true);
        setSyncMessage(res.message || 'Calendrier FFBB officiel interrogé : aucune rencontre programmée pour ce club.');
      }

      // Vérifier si la FFBB propose un nom officiel ou un logo différent de la configuration actuelle
      if (res.clubInfo) {
        const ffbbName = res.clubInfo.clubName?.trim();
        const ffbbLogo = res.clubInfo.logoUrl?.trim();
        const currentName = (clubSettings.name || '').trim();
        const currentLogo = (clubSettings.logoUrl || '').trim();

        const nameDiffers = Boolean(
          ffbbName &&
          currentName.toLowerCase() !== ffbbName.toLowerCase()
        );
        const logoDiffers = Boolean(
          ffbbLogo &&
          currentLogo !== ffbbLogo
        );

        if (nameDiffers || logoDiffers) {
          setIdentityProposal({
            ffbbName,
            ffbbLogoUrl: ffbbLogo,
            differences: {
              ...(nameDiffers ? { name: { current: currentName || 'Non configuré', proposed: ffbbName! } } : {}),
              ...(logoDiffers ? { logo: { current: currentLogo || undefined, proposed: ffbbLogo! } } : {}),
            },
          });
          setSelectedProposalUpdates({
            updateName: nameDiffers,
            updateLogo: logoDiffers,
          });
        } else {
          setIdentityProposal(null);
        }
      }
    } catch (err) {
      console.error(err);
      setSyncIsError(true);
      setSyncMessage('Erreur de connexion à l\'API FFBB officielle. Réessaie dans quelques minutes, ou vérifie le code club dans les paramètres FFBB.');
    } finally {
      setIsSyncingFFBB(false);
    }
  };

  // Appliquer la proposition d'identité officielle FFBB choisie par l'utilisateur
  const handleApplyIdentityProposal = () => {
    if (!identityProposal) return;
    const updated = { ...clubSettings };
    if (selectedProposalUpdates.updateName && identityProposal.differences.name) {
      updated.name = identityProposal.differences.name.proposed;
    }
    if (selectedProposalUpdates.updateLogo && identityProposal.differences.logo) {
      updated.logoUrl = identityProposal.differences.logo.proposed;
    }
    onUpdateClubSettings(updated);
    setIdentityProposal(null);
    setProposalAppliedMsg('✓ Identité du club mise à jour avec les informations officielles de la FFBB !');
    setTimeout(() => setProposalAppliedMsg(null), 6000);
  };

  // Refuser / fermer la proposition (l'utilisateur conserve ses paramètres actuels)
  const handleDismissIdentityProposal = () => {
    setIdentityProposal(null);
  };

  // Étape 3 : Basculer le suivi d'une équipe FFBB (Cocher / Décocher)
  const handleToggleTrackTeam = (teamCategory: string, teamName?: string) => {
    const currentIgnored = clubSettings.ignoredTeamCategories || [];
    const isCurrentlyIgnored = isTeamCategoryIgnored(teamCategory, currentIgnored);
    const targetKey = normalizeCategoryKey(teamCategory);

    let nextIgnored: string[];
    if (isCurrentlyIgnored) {
      // Réactiver l'équipe : la retirer de la liste des ignorés
      nextIgnored = currentIgnored.filter((item) => normalizeCategoryKey(item) !== targetKey);
      setProposalAppliedMsg(`✓ Équipe ${teamName || teamCategory} réactivée pour le diaporama TV.`);
    } else {
      // Décocher / ignorer l'équipe : l'ajouter aux ignorés
      nextIgnored = [...currentIgnored.filter((item) => normalizeCategoryKey(item) !== targetKey), teamCategory];

      setProposalAppliedMsg(`✕ Suivi de ${teamName || teamCategory} désactivé ; historique conservé.`);
    }

    setTimeout(() => setProposalAppliedMsg(null), 5000);

    onUpdateClubSettings({
      ...clubSettings,
      ignoredTeamCategories: nextIgnored,
    });
  };

  // Cocher toutes les équipes (toutes suivies)
  const handleTrackAllTeams = () => {
    onUpdateClubSettings({
      ...clubSettings,
      ignoredTeamCategories: [],
    });
    setProposalAppliedMsg('✓ Toutes les équipes sont désormais suivies et affichées sur la TV.');
    setTimeout(() => setProposalAppliedMsg(null), 5000);
  };

  // Décocher toutes les équipes
  const handleUntrackAllTeams = () => {
    const allKeys = ffbbTeams.map((t) => t.category);
    onUpdateClubSettings({
      ...clubSettings,
      ignoredTeamCategories: allKeys,
    });
    setProposalAppliedMsg('⚠ Toutes les équipes sont décochées. Historique conservé.');
    setTimeout(() => setProposalAppliedMsg(null), 5000);
  };

  // Personnalisation du nom d'affichage d'une équipe FFBB
  const handleUpdateTeamCustomName = (teamId: string, teamCategory: string, newCustomName: string) => {
    const trimmed = newCustomName.trim();
    const updatedCustomNames = { ...(clubSettings.customTeamNames || {}) };

    if (trimmed) {
      const aliases = ffbbTeams.find(t => t.id === teamId)?.engagementIds || [teamId];
      for (const id of aliases) updatedCustomNames[id] = trimmed;
      updatedCustomNames[teamId] = trimmed;
      updatedCustomNames[teamCategory] = trimmed;
      updatedCustomNames[normalizeCategoryKey(teamCategory)] = trimmed;
    } else {
      const aliases = ffbbTeams.find(t => t.id === teamId)?.engagementIds || [teamId];
      for (const id of aliases) delete updatedCustomNames[id];
      delete updatedCustomNames[teamId];
      delete updatedCustomNames[teamCategory];
      delete updatedCustomNames[normalizeCategoryKey(teamCategory)];
    }

    onUpdateClubSettings({
      ...clubSettings,
      customTeamNames: updatedCustomNames,
    });

    // 1. Mettre à jour ffbbTeams
    const nextFfbbTeams = ffbbTeams.map((t) => {
      if (t.id === teamId || normalizeCategoryKey(t.category) === normalizeCategoryKey(teamCategory)) {
        return {
          ...t,
          customName: trimmed || undefined,
        };
      }
      return t;
    });
    setFfbbTeams(nextFfbbTeams);
    try {
      localStorage.setItem('ffbb_club_teams_cache', JSON.stringify(nextFfbbTeams));
    } catch (e) {}

    // 2. Mettre à jour les matchs et résultats pour afficher ce nouveau nom sur le carrousel
    const targetCatKey = normalizeCategoryKey(teamCategory);
    const effectiveDisplayName = trimmed || nextFfbbTeams.find(t => t.id === teamId)?.name || teamCategory;

    const updatedMatches = matches.map((m) => {
      const matchCatKey = normalizeCategoryKey(m.rawFfbbCategory || m.category);
      if (m.ffbbTeamId === teamId || matchCatKey === targetCatKey) {
        return {
          ...m,
          category: effectiveDisplayName,
          rawFfbbCategory: m.rawFfbbCategory || teamCategory,
          ffbbTeamId: teamId,
        };
      }
      return m;
    });

    const updatedResults = results.map((r) => {
      const resultCatKey = normalizeCategoryKey(r.rawFfbbCategory || r.category);
      if (r.ffbbTeamId === teamId || resultCatKey === targetCatKey) {
        return {
          ...r,
          category: effectiveDisplayName,
          rawFfbbCategory: r.rawFfbbCategory || teamCategory,
          ffbbTeamId: teamId,
        };
      }
      return r;
    });

    onUpdateMatches(updatedMatches);
    onUpdateResults(updatedResults);

    setProposalAppliedMsg(`✓ Nom d'équipe mis à jour : « ${effectiveDisplayName} » sera affiché dans l'application, le carrousel et Telegram.`);
    setTimeout(() => setProposalAppliedMsg(null), 5000);
  };

  // Horizontal Slider / Navigation for Categories
  const tabsNavRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingTabsRef = useRef(false);
  const startXTabsRef = useRef(0);
  const scrollLeftTabsRef = useRef(0);

  const checkTabsScroll = () => {
    if (tabsNavRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsNavRef.current;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    }
  };

  useEffect(() => {
    checkTabsScroll();
    const handleResize = () => checkTabsScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsNavRef.current) {
      const distance = 350;
      tabsNavRef.current.scrollBy({
        left: direction === 'left' ? -distance : distance,
        behavior: 'smooth',
      });
      setTimeout(checkTabsScroll, 350);
    }
  };

  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabsNavRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        tabsNavRef.current.scrollLeft += e.deltaY;
        checkTabsScroll();
      }
    }
  };

  const handleTabsMouseDown = (e: React.MouseEvent) => {
    if (!tabsNavRef.current) return;
    isDraggingTabsRef.current = true;
    startXTabsRef.current = e.pageX - tabsNavRef.current.offsetLeft;
    scrollLeftTabsRef.current = tabsNavRef.current.scrollLeft;
  };

  const handleTabsMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingTabsRef.current || !tabsNavRef.current) return;
    const x = e.pageX - tabsNavRef.current.offsetLeft;
    const walk = (x - startXTabsRef.current) * 1.5;
    tabsNavRef.current.scrollLeft = scrollLeftTabsRef.current - walk;
    checkTabsScroll();
  };

  const handleTabsMouseUpOrLeave = () => {
    isDraggingTabsRef.current = false;
  };

  const handleSelectTab = (
    tabName: string,
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (['photos', 'sponsors', 'logos', 'events', 'team_visuals'].includes(tabName)) {
      setActiveTab('image_banks');
      setImageBankSubTab(tabName as any);
    } else {
      setActiveTab(tabName as any);
    }
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    setTimeout(checkTabsScroll, 300);
  };

  // Rendu de la carte de proposition FFBB non-imposée
  const renderIdentityProposal = () => {
    if (!identityProposal) return null;
    return (
      <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 space-y-4 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-white font-bebas tracking-wide flex items-center gap-2">
                <span>PROPOSITION DE MISE À JOUR — FICHE OFFICIELLE FFBB</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Suggestion non imposée
                </span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                La FFBB a retourné des informations officielles différentes de vos réglages actuels. Cochez les éléments à appliquer ou conservez vos paramètres personnalisés :
              </p>
            </div>
          </div>
        </div>

        {/* Comparatif Nom & Logo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Proposition Nom */}
          {identityProposal.differences.name && (
            <label
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedProposalUpdates.updateName
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedProposalUpdates.updateName}
                onChange={(e) =>
                  setSelectedProposalUpdates((prev) => ({ ...prev, updateName: e.target.checked }))
                }
                className="mt-1 accent-amber-500 rounded cursor-pointer w-4 h-4"
              />
              <div className="space-y-1.5 text-xs flex-1">
                <span className="font-bold text-amber-300 block text-xs">
                  Mettre à jour le Nom Officiel du club
                </span>
                <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[11px]">
                    Actuel : <span className="line-through text-slate-400 font-medium">{identityProposal.differences.name.current}</span>
                  </div>
                  <div className="text-white font-bold text-xs flex items-center gap-1.5">
                    <span className="text-emerald-400">FFBB :</span>
                    <span className="text-amber-300">{identityProposal.differences.name.proposed}</span>
                  </div>
                </div>
              </div>
            </label>
          )}

          {/* Proposition Logo */}
          {identityProposal.differences.logo && (
            <label
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                selectedProposalUpdates.updateLogo
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedProposalUpdates.updateLogo}
                onChange={(e) =>
                  setSelectedProposalUpdates((prev) => ({ ...prev, updateLogo: e.target.checked }))
                }
                className="mt-1 accent-amber-500 rounded cursor-pointer w-4 h-4"
              />
              <div className="space-y-2 text-xs flex-1">
                <span className="font-bold text-amber-300 block text-xs">
                  Mettre à jour le Logo Officiel du club
                </span>
                <div className="flex items-center justify-around bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block mb-1">Actuel</span>
                    {identityProposal.differences.logo.current ? (
                      <img
                        src={identityProposal.differences.logo.current}
                        alt="Logo actuel"
                        className="w-12 h-12 rounded-xl object-contain bg-slate-900 border border-slate-700 p-1 mx-auto"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                        Aucun
                      </div>
                    )}
                  </div>

                  <span className="text-slate-500 font-bold text-lg">➔</span>

                  <div className="text-center">
                    <span className="text-[10px] text-emerald-400 font-bold block mb-1">Fiche FFBB</span>
                    <img
                      src={identityProposal.differences.logo.proposed}
                      alt="Logo FFBB"
                      className="w-12 h-12 rounded-xl object-contain bg-white/10 border border-amber-500/60 p-1 mx-auto shadow-md"
                    />
                  </div>
                </div>
              </div>
            </label>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-400">
            Les matchs et scores sont déjà synchronisés. Vous gardez la main sur les visuels et coordonnées du club.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDismissIdentityProposal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Garder mes paramètres actuels
            </button>
            <button
              type="button"
              onClick={handleApplyIdentityProposal}
              disabled={!selectedProposalUpdates.updateName && !selectedProposalUpdates.updateLogo}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Mettre à jour la sélection</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={
        isFullPage
          ? 'w-full min-h-screen bg-slate-950 flex flex-col p-0'
          : 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto'
      }
    >
      <div
        className={
          isFullPage
            ? 'bg-slate-950 w-full min-h-screen flex flex-col flex-1 border-none rounded-none shadow-none overflow-hidden'
            : 'bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-[1550px] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden'
        }
      >
        {/* Top Header Bar for Desktop Management */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white font-bebas tracking-wide">
                  CONSOLE DE GESTION ORDINATEUR • DIAPORAMA TV
                </h2>
                <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                  <Tv className="w-3 h-3 text-orange-400" /> Ordinateur & Clavier
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gérez vos dossiers, durées, bot Telegram, visuels réseaux sociaux et lancez la diffusion TV.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MediaPlaybackWarning />
            <BugConsole />
          {/* Bouton dynamique Enregistrer en haut à droite */}
            <button
              onClick={onManualSave}
              disabled={saveStatus === 'saving'}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-105 cursor-pointer ${
                saveStatus === 'saving'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 cursor-wait'
                  : saveStatus === 'saved'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : saveStatus === 'error'
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
              }`}
              title={
                saveStatus === 'saving'
                  ? 'Enregistrement en cours...'
                  : saveStatus === 'saved'
                  ? 'Données enregistrées avec succès !'
                  : saveStatus === 'error'
                  ? saveErrorMessage || 'Erreur lors de la sauvegarde — Cliquez pour réessayer'
                  : 'Enregistrement automatique actif. Cliquer pour relancer une sauvegarde.'
              }
              id="btn-header-save"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Enregistrement...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Modifications enregistrées</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4 text-white" />
                  <span>Échec (Réessayer)</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrement automatique</span>
                </>
              )}
            </button>

            {/* Direct Switch to TV Broadcast Mode Button */}
            <button
              disabled={saveStatus === 'saving' || saveStatus === 'error'}
              onClick={() => { onSwitchToTvMode(); }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all hover:scale-105"
              title="Lancer le diaporama TV (ou appuyez sur C)"
              id="btn-launch-tv-mode"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Lancer la Diffusion TV</span>
            </button>

            {!isFullPage && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Bandeau de notification de conflit de concurrence (Optimistic Concurrency Control) */}
        {saveStatus === 'error' && (
          <div className="mx-4 sm:mx-6 my-2.5 p-3.5 sm:p-4 rounded-2xl bg-red-950/90 border border-red-500/50 text-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5 sm:mt-0">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">
                  {saveErrorMessage || "Les données ont été modifiées ailleurs. Rechargez les données avant de sauvegarder à nouveau."}
                </div>
                <p className="text-xs text-red-200/80 mt-0.5">
                  Vos modifications en cours sont conservées dans votre navigateur. Cliquez sur « Recharger les données » pour récupérer la version la plus récente du serveur.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onReloadFromServer && (
                <button
                  type="button"
                  onClick={onReloadFromServer}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-red-600/30"
                  title="Recharger la dernière version enregistrée sur le serveur"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recharger les données</span>
                </button>
              )}
              {onManualSave && (
                <button
                  type="button"
                  onClick={onManualSave}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Réessayer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation Menu with Horizontal Slider Controls */}
        <div className="relative bg-slate-950 border-b border-slate-800 flex items-center group">
          {/* Left Slide Button */}
          <div
            className={`absolute left-0 top-0 bottom-0 z-20 flex items-center pl-2 pr-6 bg-gradient-to-r from-slate-950 via-slate-950/95 to-transparent transition-opacity duration-200 ${
              canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className="p-2 rounded-xl bg-slate-800/95 hover:bg-orange-600 text-slate-200 hover:text-white shadow-xl border border-slate-700/80 transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
              title="Faire défiler les catégories vers la gauche"
              aria-label="Faire défiler les catégories vers la gauche"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Tabs Track */}
          <div
            ref={tabsNavRef}
            onScroll={checkTabsScroll}
            onWheel={handleTabsWheel}
            onMouseDown={handleTabsMouseDown}
            onMouseMove={handleTabsMouseMove}
            onMouseUp={handleTabsMouseUpOrLeave}
            onMouseLeave={handleTabsMouseUpOrLeave}
            className="flex items-center gap-1.5 px-6 py-2.5 overflow-x-auto scroll-smooth text-xs md:text-sm w-full select-none cursor-grab active:cursor-grabbing scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={(e) => handleSelectTab('matches', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'matches'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>Matchs du Week-end ({matches.length})</span>
            </button>

            <button
              onClick={(e) => handleSelectTab('results', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'results'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Résultats ({results.length})</span>
            </button>

            <button
              onClick={(e) => handleSelectTab('excel', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'excel'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cake className="w-4 h-4 text-pink-400" />
              <span>Anniversaires ({birthdays.length})</span>
            </button>

            <button
              onClick={(e) => handleSelectTab('social', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'social'
                  ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 text-white shadow-md shadow-pink-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Share2 className="w-4 h-4 text-pink-400" />
              <span>Passerelle Réseaux</span>
            </button>

            <button
              onClick={(e) => handleSelectTab('studio_templates', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'studio_templates'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutTemplate className="w-4 h-4 text-sky-400" />
              <span>Studio templates</span>
            </button>

            <div className="w-px h-6 bg-slate-700/70 mx-1.5 shrink-0" />

            <button
              onClick={(e) => handleSelectTab('image_banks', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'image_banks'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Banques d'images</span>
            </button>

            <div className="w-px h-6 bg-slate-700/70 mx-1.5 shrink-0" />

            <button
              onClick={(e) => handleSelectTab('ffbb', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'ffbb'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span>Sync FFBB</span>
              {identityProposal && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" title="Proposition FFBB disponible" />
              )}
            </button>

            <button
              onClick={(e) => handleSelectTab('telegram', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'telegram'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4 text-sky-400" />
              <span>Bot Telegram</span>
              {telegramStatus?.connected && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    effectiveLastTelegramMessage && effectiveLastTelegramMessage.success !== false
                      ? 'bg-emerald-400 shadow-emerald-400/50'
                      : 'bg-sky-400 shadow-sky-400/50'
                  } animate-pulse shadow-sm`}
                  title={
                    effectiveLastTelegramMessage && effectiveLastTelegramMessage.success !== false
                      ? 'Bot opérationnel'
                      : 'Configuration active — en attente du premier message'
                  }
                />
              )}
            </button>

            <button
              onClick={(e) => handleSelectTab('categories', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'categories'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Paramètres Carrousel & TV</span>
            </button>

            <button
              onClick={(e) => handleSelectTab('club_identity', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'club_identity'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-4 h-4 text-orange-400" />
              <span>Identité du Club</span>
              {identityProposal && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" title="Proposition FFBB disponible" />
              )}
            </button>

            <button
              onClick={(e) => handleSelectTab('fullykiosk', e)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'fullykiosk'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tv className="w-4 h-4 text-amber-300" />
              <span>Guide Fully Kiosk</span>
            </button>

          </div>

          {/* Right Slide Button */}
          <div
            className={`absolute right-0 top-0 bottom-0 z-20 flex items-center pr-2 pl-6 bg-gradient-to-l from-slate-950 via-slate-950/95 to-transparent transition-opacity duration-200 ${
              canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className="p-2 rounded-xl bg-slate-800/95 hover:bg-orange-600 text-slate-200 hover:text-white shadow-xl border border-slate-700/80 transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer shadow-orange-500/10"
              title="Faire défiler les catégories vers la droite"
              aria-label="Faire défiler les catégories vers la droite"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Notification de mise à jour d'identité FFBB confirmée */}
          {proposalAppliedMsg && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{proposalAppliedMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setProposalAppliedMsg(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-emerald-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Proposition FFBB suggestive (propose sans imposer) */}
          {renderIdentityProposal()}

          {/* Global Batch Upload Feedback Toast */}
          {uploadFeedback && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-3 ${
                uploadFeedback.type === 'success'
                  ? 'bg-emerald-950/90 border border-emerald-500/80 text-emerald-200'
                  : 'bg-rose-950/90 border border-rose-500/80 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {uploadFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-bold">{uploadFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadFeedback(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* ========================================================================= */}
          {/* TAB 1: MATCHS À VENIR */}
          {/* ========================================================================= */}
          {activeTab === 'matches' && (
            <MatchesTab
              ffbbTeams={ffbbTeams}
              onUpdateResults={onUpdateResults}

              birthdays={birthdays}
              clubSettings={clubSettings}
              editingMatch={editingMatch}
              handleAddMatchManual={handleAddMatchManual}
              handleQuickMatchOutcome={handleQuickMatchOutcome}
              handleSelectOnlyFilteredMatchesForTV={handleSelectOnlyFilteredMatchesForTV}
              handleSyncFFBB={handleSyncFFBB}

              isSyncingFFBB={isSyncingFFBB}
              logos={logos}
              matches={matches}
              matchesFilterMode={matchesFilterMode}
              matchesSubTab={matchesSubTab}
              newMatchCategory={newMatchCategory}
              newMatchDate={newMatchDate}
              newMatchOpponent={newMatchOpponent}
              newMatchTime={newMatchTime}
              onUpdateMatches={onUpdateMatches}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              quickAwayScore={quickAwayScore}
              quickHomeScore={quickHomeScore}
              quickScoreMatchId={quickScoreMatchId}
              results={results}

              setEditingMatch={setEditingMatch}
              setFilterToCurrentWeekend={setFilterToCurrentWeekend}
              setMatchesFilterMode={setMatchesFilterMode}
              setMatchesSubTab={setMatchesSubTab}
              setNewMatchCategory={setNewMatchCategory}
              setNewMatchDate={setNewMatchDate}
              setNewMatchIsHome={setNewMatchIsHome}
              setNewMatchOpponent={setNewMatchOpponent}
              setNewMatchTime={setNewMatchTime}
              setQuickAwayScore={setQuickAwayScore}
              setQuickHomeScore={setQuickHomeScore}
              setQuickScoreMatchId={setQuickScoreMatchId}
              setShowAddManualMatch={setShowAddManualMatch}
              setShowCalendarInMatches={setShowCalendarInMatches}
              setSyncEndDate={setSyncEndDate}
              setSyncStartDate={setSyncStartDate}
              showAddManualMatch={showAddManualMatch}
              showCalendarInMatches={showCalendarInMatches}
              syncEndDate={syncEndDate}
              syncIsError={syncIsError}
              syncMessage={syncMessage}
              syncStartDate={syncStartDate}
              visualTemplates={visualTemplates}
              newMatchIsHome={newMatchIsHome}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 2: RÉSULTATS DU WEEK-END */}
          {/* ========================================================================= */}
          {activeTab === 'results' && (
            <ResultsTab

              availableFfbbTeams={availableFfbbTeams}
              birthdays={birthdays}
              clubSettings={clubSettings}
              editingResult={editingResult}
              handleAddResultManual={handleAddResultManual}
              handleSaveEditedResult={handleSaveEditedResult}
              handleSelectOnlyFilteredResultsForTV={handleSelectOnlyFilteredResultsForTV}
              handleSelectScheduledMatch={handleSelectScheduledMatch}
              handleSyncFFBB={handleSyncFFBB}
              isSyncingFFBB={isSyncingFFBB}
              logos={logos}
              matches={matches}
              newResultAwayScore={newResultAwayScore}
              newResultCategory={newResultCategory}
              newResultDate={newResultDate}
              newResultErrorMsg={newResultErrorMsg}
              newResultHomeScore={newResultHomeScore}
              newResultIsCustomCategory={newResultIsCustomCategory}
              newResultIsHome={newResultIsHome}
              newResultMode={newResultMode}
              newResultOpponent={newResultOpponent}
              newResultStatusOutcome={newResultStatusOutcome}
              newResultSuccessMsg={newResultSuccessMsg}
              onUpdateResults={onUpdateResults}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              results={results}
              resultsEndDate={resultsEndDate}
              resultsStartDate={resultsStartDate}
              resultsSubTab={resultsSubTab}
              selectedScheduledMatchId={selectedScheduledMatchId}

              setEditingResult={setEditingResult}
              setNewResultAwayScore={setNewResultAwayScore}
              setNewResultCategory={setNewResultCategory}
              setNewResultDate={setNewResultDate}
              setNewResultErrorMsg={setNewResultErrorMsg}
              setNewResultHomeScore={setNewResultHomeScore}
              setNewResultIsCustomCategory={setNewResultIsCustomCategory}
              setNewResultIsHome={setNewResultIsHome}
              setNewResultMode={setNewResultMode}
              setNewResultOpponent={setNewResultOpponent}
              setNewResultStatusOutcome={setNewResultStatusOutcome}
              setResultsEndDate={setResultsEndDate}
              resultsFilterMode={resultsFilterMode}
              setResultsFilterMode={setResultsFilterMode}
              setResultsFilterToCurrentWeekend={setResultsFilterToCurrentWeekend}
              setResultsFilterToLastWeekend={setResultsFilterToLastWeekend}
              setResultsStartDate={setResultsStartDate}
              setResultsSubTab={setResultsSubTab}
              setShowAddManualResult={setShowAddManualResult}
              setShowCalendarInResults={setShowCalendarInResults}
              showAddManualResult={showAddManualResult}
              showCalendarInResults={showCalendarInResults}
              visualTemplates={visualTemplates}
            />
          )}

          {/* ========================================================================= */}
          {/* BANQUES D'IMAGES & VISUELS DU CLUB */}
          {/* ========================================================================= */}
          {activeTab === 'image_banks' && (
            <ImageBanksTab
              activeEditingConfig={activeEditingConfig}
              alertPreviewTeam={alertPreviewTeam}
              alertPreviewType={alertPreviewType}
              allCandidateTeams={allCandidateTeams}
              clubSettings={clubSettings}
              consolidatedMediaBank={consolidatedMediaBank}
              currentPreviewIsWin={currentPreviewIsWin}
              currentPreviewTitleTemplate={currentPreviewTitleTemplate}
              effectivePreviewTeam={effectivePreviewTeam}
              events={events}
              handleBatchEventsUpload={handleBatchEventsUpload}
              handleBatchLogosUpload={handleBatchLogosUpload}
              handleBatchPhotosUpload={handleBatchPhotosUpload}
              handleBatchSponsorsUpload={handleBatchSponsorsUpload}
              imageBankSubTab={imageBankSubTab}
              logos={logos}
              newEventDate={newEventDate}
              newEventTitle={newEventTitle}
              newLogoCategory={newLogoCategory}
              newLogoName={newLogoName}
              newPhotoFolder={newPhotoFolder}
              newPhotoTitle={newPhotoTitle}
              newSponsorName={newSponsorName}
              newSponsorTier={newSponsorTier}
              onUpdateEvents={onUpdateEvents}
              onUpdateLogos={onUpdateLogos}
              onUpdatePhotos={onUpdatePhotos}
              onUpdateSponsors={onUpdateSponsors}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              photos={photos}
              selectedAlertVisualType={selectedAlertVisualType}
              selectedAlertVisualUrl={selectedAlertVisualUrl}
              setAlertPreviewTeam={setAlertPreviewTeam}
              setAlertPreviewType={setAlertPreviewType}
              setImageBankSubTab={setImageBankSubTab}
              setIsDraggingEvents={setIsDraggingEvents}
              setIsDraggingLogos={setIsDraggingLogos}
              setIsDraggingPhotos={setIsDraggingPhotos}
              setIsDraggingSponsors={setIsDraggingSponsors}
              setNewEventDate={setNewEventDate}
              setNewEventTitle={setNewEventTitle}
              setNewLogoCategory={setNewLogoCategory}
              setNewLogoName={setNewLogoName}
              setNewPhotoFolder={setNewPhotoFolder}
              setNewPhotoTitle={setNewPhotoTitle}
              setNewSponsorName={setNewSponsorName}
              setNewSponsorTier={setNewSponsorTier}
              setSelectedAlertVisualType={setSelectedAlertVisualType}
              setSelectedAlertVisualUrl={setSelectedAlertVisualUrl}
              sponsors={sponsors}
              teamVisuals={teamVisuals}
              teamsMeasureRef={teamsMeasureRef}
              updateActiveConfig={updateActiveConfig}
              uploadMultipleFiles={uploadMultipleFiles}
              visualTemplates={visualTemplates}
              widestTeamInfo={widestTeamInfo}
              isDraggingPhotos={isDraggingPhotos}
              isDraggingSponsors={isDraggingSponsors}
              isDraggingLogos={isDraggingLogos}
              isDraggingEvents={isDraggingEvents}
              currentPreviewFont={currentPreviewFont}
              currentPreviewScale={currentPreviewScale}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB: PASSERELLE RÉSEAUX SOCIAUX (INSTAGRAM • TIKTOK • FACEBOOK) */}
          {/* ========================================================================= */}
          {activeTab === 'social' && (
            <SocialTab
              birthdays={birthdays}
              clubSettings={clubSettings}
              handleTestSocialWebhook={handleTestSocialWebhook}
              matches={matches}
              onUpdateClubSettings={onUpdateClubSettings}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              results={results}
              setActiveTab={setActiveTab}
              setSocialForm={setSocialForm}
              setSocialSaveSuccess={setSocialSaveSuccess}
              socialForm={socialForm}
              socialWebhookStatus={socialWebhookStatus}
              visualTemplates={visualTemplates}
              isOpen={isOpen}
              onClose={onClose}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 4: BOT TELEGRAM */}
          {/* ========================================================================= */}
          {activeTab === 'telegram' && (
            <TelegramTab
              activeAlerts={activeAlerts}
              adminPasswordInput={adminPasswordInput}
              adminPasswordPrompt={adminPasswordPrompt}
              effectiveLastTelegramMessage={effectiveLastTelegramMessage}
              fetchTelegramStatus={fetchTelegramStatus}
              formatTelegramDate={formatTelegramDate}
              handleConnectTelegram={handleConnectTelegram}
              handleDisconnectTelegram={handleDisconnectTelegram}
              handleTestTelegramMessage={handleTestTelegramMessage}
              onRemoveAlert={onRemoveAlert}
              setAdminPasswordInput={setAdminPasswordInput}
              setAdminPasswordPrompt={setAdminPasswordPrompt}
              setTelegramActionMsg={setTelegramActionMsg}
              setTelegramSimText={setTelegramSimText}
              telegramActionMsg={telegramActionMsg}
              telegramConnecting={telegramConnecting}
              telegramDisconnecting={telegramDisconnecting}
              telegramSimFeedback={telegramSimFeedback}
              telegramSimLoading={telegramSimLoading}
              telegramSimText={telegramSimText}
              telegramStatus={telegramStatus}
              telegramStatusLoading={telegramStatusLoading}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ALERTES 1H EN COURS */}
          {/* ========================================================================= */}
          {activeTab === 'alerts' && (
            <AlertsTab
              activeAlerts={activeAlerts}
              onRemoveAlert={onRemoveAlert}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CARROUSEL & TEMPS D'AFFICHAGE */}
          {/* ========================================================================= */}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              clubSettings={clubSettings}
              handleDurationChange={handleDurationChange}
              handleToggleCategory={handleToggleCategory}
              onUpdateClubSettings={onUpdateClubSettings}
              photos={photos}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 7: ANNIVERSAIRES (EXCEL & GESTION PAR SEMAINE) */}
          {/* ========================================================================= */}
          {activeTab === 'excel' && (
            <ExcelTab
              allMembers={allMembers}
              allMembersPool={allMembersPool}
              birthdayWeekOffset={birthdayWeekOffset}
              birthdays={showAllBirthdays ? allMembersPool : filterAndSortBirthdaysForWeek(allMembersPool, simulatedDate || clubCalendarDate(), birthdayWeekOffset)}
              tvBirthdays={birthdays}
              onShowAllMembers={() => setShowAllBirthdays(true)}
              birthdaysSubTab={birthdaysSubTab}
              clubSettings={clubSettings}
              editBdayCategory={editBdayCategory}
              editBdayDate={editBdayDate}
              editBdayFirstName={editBdayFirstName}
              editingBirthdayId={editingBirthdayId}
              excelErrors={excelErrors}
              excelInputRef={excelInputRef}
              excelSuccessMsg={excelSuccessMsg}
              handleAddManualBirthday={handleAddManualBirthday}
              handleCancelEditBirthday={handleCancelEditBirthday}
              handleDeleteBirthday={handleDeleteBirthday}
              handleExcelFileUpload={handleExcelFileUpload}
              handleSaveEditBirthday={handleSaveEditBirthday}
              handleSelectWeekOffset={handleSelectWeekOffset}
              handleStartEditBirthday={handleStartEditBirthday}
              isAddingManualBday={isAddingManualBday}
              isParsingExcel={isParsingExcel}
              manualBdayCategory={manualBdayCategory}
              manualBdayDate={manualBdayDate}
              manualBdayFirstName={manualBdayFirstName}
              matches={matches}
              onUpdateBirthdays={onUpdateBirthdays}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              results={results}
              saveErrorMessage={saveErrorMessage}
              saveStatus={saveStatus}
              setBirthdaysSubTab={setBirthdaysSubTab}
              setEditBdayCategory={setEditBdayCategory}
              setEditBdayDate={setEditBdayDate}
              setEditBdayFirstName={setEditBdayFirstName}
              setIsAddingManualBday={setIsAddingManualBday}
              setManualBdayCategory={setManualBdayCategory}
              setManualBdayDate={setManualBdayDate}
              setManualBdayFirstName={setManualBdayFirstName}
              visualTemplates={visualTemplates}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB: IDENTITÉ DU CLUB */}
          {/* ========================================================================= */}
          {activeTab === 'club_identity' && (
            <ClubIdentityTab
              clubSettings={draftClubSettings}
              activeClubCode={clubSettings.codeFFBB}
              ffbbTeams={ffbbTeams}
              handleLogoFileUpload={handleLogoFileUpload}
              isUploadingLogo={isUploadingLogo}
              logoFileInputRef={logoFileInputRef}
              onUpdateClubSettings={updateClubDraftSettings}
              setActiveTab={setActiveTab}
              setIsDraggingLogo={setIsDraggingLogo}
              setSocialForm={setSocialForm}
              isDraggingLogo={isDraggingLogo}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 8: FFBB */}
          {/* ========================================================================= */}
          {activeTab === 'ffbb' && (
            <FfbbTab
              clubSettings={draftClubSettings}
              activeClubCode={clubSettings.codeFFBB}
              ffbbTeams={ffbbTeams}
              handleSyncFFBB={handleSyncFFBB}
              handleToggleTrackTeam={handleToggleTrackTeam}
              handleTrackAllTeams={handleTrackAllTeams}
              handleUntrackAllTeams={handleUntrackAllTeams}
              handleUpdateTeamCustomName={handleUpdateTeamCustomName}
              isSyncingFFBB={isSyncingFFBB}
              onOpenVisualExporter={onOpenVisualExporter}
              onUpdateClubSettings={updateClubDraftSettings}
              setActiveTab={setActiveTab}
              setFilterToCurrentWeekend={setFilterToCurrentWeekend}
              setSyncEndDate={setSyncEndDate}
              setSyncStartDate={setSyncStartDate}
              syncEndDate={syncEndDate}
              syncIsError={syncIsError}
              syncMessage={syncMessage}
              syncStartDate={syncStartDate}
              matches={matches}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 9: GUIDE FULLY KIOSK BROWSER */}
          {/* ========================================================================= */}
          {activeTab === 'fullykiosk' && (
            <FullykioskTab />
          )}

          {activeTab === 'studio_templates' && (
            <StudioTemplatesTab
              visualTemplates={visualTemplates}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
            />
          )}
        </div>
      </div>

    </div>
  );
};
