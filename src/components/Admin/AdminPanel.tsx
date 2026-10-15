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
  const [activeTab, setActiveTab] = useState<
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
  >('matches');

  const [imageBankSubTab, setImageBankSubTab] = useState<'media_bank' | 'photos' | 'sponsors' | 'logos' | 'events' | 'team_visuals'>('media_bank');
  const consolidatedMediaBank = useMemo(() => getConsolidatedMediaBank(visualTemplates), [visualTemplates]);

  const [selectedFolderCategory, setSelectedFolderCategory] = useState<'photos' | 'sponsors' | 'events' | 'opponent_logos'>('photos');
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  // Sous-onglets par catégorie pour intégrer directement le Studio Calques sur place
  const [matchesSubTab, setMatchesSubTab] = useState<'list' | 'calques'>('list');
  const [resultsSubTab, setResultsSubTab] = useState<'list' | 'calques'>('list');
  const [birthdaysSubTab, setBirthdaysSubTab] = useState<'list' | 'calques'>('list');

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

  const ffbbTeams = externalFfbbTeams && externalFfbbTeams.length > 0 ? externalFfbbTeams : internalFfbbTeams;
  const setFfbbTeams = (teams: FFBBTeamItem[]) => {
    setInternalFfbbTeams(teams);
    if (onUpdateFfbbTeams) {
      onUpdateFfbbTeams(teams);
    }
  };

  // Telegram Bot State
  const [telegramStatus, setTelegramStatus] = useState<{
    hasSecretToken: boolean;
    connected: boolean;
    webhookUrl?: string | null;
    botUsername?: string | null;
    botName?: string | null;
    lastError?: string | null;
    pendingUpdateCount?: number;
    message?: string;
    lastMessage?: {
      receivedAt: number;
      text: string | null;
      team?: string;
      isWin?: boolean;
      score?: string;
      success: boolean;
      error?: string;
    } | null;
  } | null>(null);
  const [telegramStatusLoading, setTelegramStatusLoading] = useState<boolean>(false);
  const [telegramConnecting, setTelegramConnecting] = useState<boolean>(false);
  const [telegramDisconnecting, setTelegramDisconnecting] = useState<boolean>(false);
  const [telegramActionMsg, setTelegramActionMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [adminPasswordPrompt, setAdminPasswordPrompt] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [savedAdminPassword, setSavedAdminPassword] = useState<string>(() => {
    try {
      return sessionStorage.getItem('src_admin_password') || '';
    } catch (e) {
      return '';
    }
  });

  // Dernier message réel reçu depuis le webhook Telegram
  const effectiveLastTelegramMessage = useMemo(() => {
    return telegramStatus?.lastMessage || null;
  }, [telegramStatus?.lastMessage]);

  const formatTelegramDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  // Telegram Simulator State
  const [telegramSimText, setTelegramSimText] = useState<string>('Victoire Seniors 1 82-74');
  const [telegramSimResponse, setTelegramSimResponse] = useState<string | null>(null);
  const [telegramSimFeedback, setTelegramSimFeedback] = useState<{
    success: boolean;
    message: string;
    suggestions?: string[];
    isAmbiguous?: boolean;
  } | null>(null);
  const [telegramSimLoading, setTelegramSimLoading] = useState<boolean>(false);

  // Excel & Birthday parsing/editing state
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState<string | null>(null);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [birthdayWeekOffset, setBirthdayWeekOffset] = useState<number>(0);
  const [allMembersPool, setAllMembersPool] = useState<BirthdayItem[]>(() => {
    if (allMembers && allMembers.length > 0) return allMembers;
    try {
      const saved = localStorage.getItem('club_all_members_pool');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (allMembers && allMembers.length > 0) {
      setAllMembersPool(allMembers);
    }
  }, [allMembers]);

  // Synchronisation unifiée de la liste complète des adhérents (source de vérité unique)
  const updateAllMembersEverywhere = (newPool: BirthdayItem[], newWeekBirthdays?: BirthdayItem[]) => {
    setAllMembersPool(newPool);
    onUpdateAllMembers?.(newPool, newWeekBirthdays);
    if (newWeekBirthdays !== undefined) {
      onUpdateBirthdays(newWeekBirthdays);
    }
    try {
      localStorage.setItem('club_all_members_pool', JSON.stringify(newPool));
    } catch (e) {}
  };
  const [editingBirthdayId, setEditingBirthdayId] = useState<string | null>(null);
  const [editBdayFirstName, setEditBdayFirstName] = useState<string>('');
  const [editBdayCategory, setEditBdayCategory] = useState<string>('');
  const [editBdayDate, setEditBdayDate] = useState<string>('');

  // Adding manual birthday
  const [isAddingManualBday, setIsAddingManualBday] = useState<boolean>(false);
  const [manualBdayFirstName, setManualBdayFirstName] = useState<string>('');
  const [manualBdayCategory, setManualBdayCategory] = useState<string>('U15');
  const [manualBdayDate, setManualBdayDate] = useState<string>('');

  // Social Media Bridge State & Anti-Doublon Tracking
  const [socialContentType, setSocialContentType] = useState<'matches' | 'results'>('matches');
  const [preparedItemIds, setPreparedItemIds] = useState<string[]>([]);
  const [socialCopiedPlatform, setSocialCopiedPlatform] = useState<string | null>(null);
  const [socialWebhookStatus, setSocialWebhookStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({ loading: false });
  const [socialSaveSuccess, setSocialSaveSuccess] = useState<boolean>(false);
  const [socialOnlySelectedMatches, setSocialOnlySelectedMatches] = useState<boolean>(true);
  const [aiTone, setAiTone] = useState<'supporter' | 'officiel' | 'fun' | 'buvette'>('supporter');
  const [aiExtraContext, setAiExtraContext] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiCustomCaptions, setAiCustomCaptions] = useState<{ instagram?: string; tiktok?: string; facebook?: string }>({});
  const [previousAiCaption, setPreviousAiCaption] = useState<string | null>(null);
  const [customRewriteInput, setCustomRewriteInput] = useState<string>('');
  const [customRewriteInstructions, setCustomRewriteInstructions] = useState<string>('');
  const [customRewriteOutput, setCustomRewriteOutput] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [syncStartDate, setSyncStartDate] = useState<string>('');
  const [syncEndDate, setSyncEndDate] = useState<string>('');
  const [resultsStartDate, setResultsStartDate] = useState<string>('');
  const [resultsEndDate, setResultsEndDate] = useState<string>('');
  const [showCalendarInResults, setShowCalendarInResults] = useState<boolean>(true);
  const [resultsFilterMode, setResultsFilterMode] = useState<'all' | 'range'>('all');
  const [showAddManualResult, setShowAddManualResult] = useState<boolean>(false);
  const [quickScoreMatchId, setQuickScoreMatchId] = useState<string | null>(null);
  const [quickHomeScore, setQuickHomeScore] = useState<string>('');
  const [quickAwayScore, setQuickAwayScore] = useState<string>('');
  const [matchesFilterMode, setMatchesFilterMode] = useState<'all' | 'range'>('all');
  const [showCalendarInMatches, setShowCalendarInMatches] = useState<boolean>(true);
  const [showAddManualMatch, setShowAddManualMatch] = useState<boolean>(false);
  const [showPerTeamVisuals, setShowPerTeamVisuals] = useState<boolean>(false);
  const [newResultDate, setNewResultDate] = useState<string>('Hier');

  // Opponent Club Logos state & cache
  const [autoFetchOpponentLogos, setAutoFetchOpponentLogos] = useState<boolean>(true);
  const [isFetchingOpponentLogos, setIsFetchingOpponentLogos] = useState<boolean>(false);
  const [opponentLogosCache, setOpponentLogosCache] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('club_opponent_logos_cache');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [newOpponentClubName, setNewOpponentClubName] = useState<string>('');
  const [newOpponentLogoUrl, setNewOpponentLogoUrl] = useState<string>('');
  const [socialForm, setSocialForm] = useState({
    instagramHandle: clubSettings.instagramHandle || '',
    facebookPage: clubSettings.facebookPage || '',
    tiktokHandle: clubSettings.tiktokHandle || '',
    socialWebhookUrl: clubSettings.socialWebhookUrl || '',
  });

  // Maintien de socialForm synchronisé avec clubSettings
  useEffect(() => {
    setSocialForm((prev) => ({
      ...prev,
      instagramHandle: clubSettings.instagramHandle || '',
      facebookPage: clubSettings.facebookPage || '',
      tiktokHandle: clubSettings.tiktokHandle || '',
      socialWebhookUrl: clubSettings.socialWebhookUrl || '',
    }));
  }, [clubSettings.instagramHandle, clubSettings.facebookPage, clubSettings.tiktokHandle, clubSettings.socialWebhookUrl]);

  // État glisser-déposer pour le Logo du Club
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateAICaption = async (targetPlatform: 'all' | 'instagram' | 'tiktok' | 'facebook' = 'all') => {
    setAiLoading(true);
    try {
      const publicationMatches =
        socialContentType === 'matches'
          ? (socialOnlySelectedMatches
              ? matches.filter((m) => m.selectedForWeekend !== false)
              : matches)
          : [];

      const publicationResults =
        socialContentType === 'results'
          ? (socialOnlySelectedMatches
              ? results.filter((r) => r.selectedForWeekend !== false)
              : results)
          : [];

      const safeClubName = clubSettings.name || clubSettings.shortName || 'Notre Club';
      const safeShortClub = clubSettings.shortName || clubSettings.name || 'Notre Club';
      const safeGymnasium = clubSettings.gymnasiumDefault || 'Gymnase du Club';

      if (targetPlatform === 'all') {
        const [resInsta, resTikTok, resFB] = await Promise.all([
          fetch('/api/generate-caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'instagram',
              type: socialContentType,
              matches: publicationMatches,
              results: publicationResults,
              clubName: safeClubName,
              shortClub: safeShortClub,
              gymnasium: safeGymnasium,
              tone: aiTone,
              extraContext: aiExtraContext.trim(),

              provider: clubSettings.aiProvider || 'gemini',
            }),
          }).then((r) => r.json()).catch(() => null),

          fetch('/api/generate-caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'tiktok',
              type: socialContentType,
              matches: publicationMatches,
              results: publicationResults,
              clubName: safeClubName,
              shortClub: safeShortClub,
              gymnasium: safeGymnasium,
              tone: aiTone,
              extraContext: aiExtraContext.trim(),

              provider: clubSettings.aiProvider || 'gemini',
            }),
          }).then((r) => r.json()).catch(() => null),

          fetch('/api/generate-caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'facebook',
              type: socialContentType,
              matches: publicationMatches,
              results: publicationResults,
              clubName: safeClubName,
              shortClub: safeShortClub,
              gymnasium: safeGymnasium,
              tone: aiTone,
              extraContext: aiExtraContext.trim(),

              provider: clubSettings.aiProvider || 'gemini',
            }),
          }).then((r) => r.json()).catch(() => null),
        ]);

        const failedResponse = [resInsta, resTikTok, resFB].find((item) => !item?.success || !item?.caption);
        if (failedResponse) {
          window.alert(failedResponse.message || "La génération IA a échoué. Vérifiez la configuration de l'IA côté serveur.");
          return;
        }
        setAiCustomCaptions({
          instagram: resInsta.caption,
          tiktok: resTikTok.caption,
          facebook: resFB.caption,
        });
      } else {
        const res = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: targetPlatform,
            type: socialContentType,
            matches: publicationMatches,
            results: publicationResults,
            clubName: safeClubName,
            shortClub: safeShortClub,
            gymnasium: safeGymnasium,
            tone: aiTone,
            extraContext: aiExtraContext.trim(),

            provider: clubSettings.aiProvider || 'gemini',
          }),
        });
        const data = await res.json();
        if (data.success && data.caption) {
          setAiCustomCaptions((prev) => ({ ...prev, [targetPlatform]: data.caption }));
        } else {
          window.alert(data.message || "La génération IA a échoué. Vérifiez la configuration de l'IA côté serveur.");
        }
      }
    } catch (err) {
      console.error('Erreur génération IA:', err);
      window.alert("Impossible de contacter le service IA. Vérifiez votre connexion et réessayez.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCustomRewrite = async () => {
    if (!customRewriteInput.trim()) return;
    setIsRewriting(true);
    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          type: 'matches',
          matches: [],
          results: [],
          clubName: clubSettings.name || clubSettings.shortName || 'Notre Club',
          shortClub: clubSettings.shortName || clubSettings.name || 'Notre Club',
          gymnasium: clubSettings.gymnasiumDefault || 'Gymnase du Club',
          tone: aiTone,
          provider: clubSettings.aiProvider || 'gemini',

          extraContext: `RÉÉCRITURE DE TEXTE - IGNORE LES AUTRES INSTRUCTIONS ET LES MATCHS : Corrige les fautes, optimise la tournure, et applique ces consignes d'amélioration : "${customRewriteInstructions || 'Améliorer le style et corriger l\'orthographe'}".
Voici le texte brut que tu dois améliorer et réécrire :
"${customRewriteInput}"
Ne renvoie QUE le texte réécrit, nettoyé et amélioré, sans guillemets ni phrases d'introduction.`,
        }),
      });
      const data = await response.json();
      if (data.success && data.caption) {
        setCustomRewriteOutput(data.caption);
      } else {
        setCustomRewriteOutput(customRewriteInput);
      }
    } catch (err) {
      console.error(err);
      setCustomRewriteOutput(customRewriteInput);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleApplyRewriteToPlatform = (platform: 'instagram' | 'tiktok' | 'facebook' | 'all') => {
    if (!customRewriteOutput) return;
    const targetPlatform = platform === 'all' ? 'instagram' : platform;
    const current = aiCustomCaptions[targetPlatform];
    if (current) {
      setPreviousAiCaption(current);
    }
    setAiCustomCaptions((prev) => {
      const next = { ...prev };
      if (platform === 'all' || platform === 'instagram') next.instagram = customRewriteOutput;
      if (platform === 'all' || platform === 'tiktok') next.tiktok = customRewriteOutput;
      if (platform === 'all' || platform === 'facebook') next.facebook = customRewriteOutput;
      return next;
    });
  };

  const handleUndoAiCaption = (platform: 'instagram' | 'tiktok' | 'facebook') => {
    if (!previousAiCaption) return;
    const current = aiCustomCaptions[platform] || '';
    setAiCustomCaptions((prev) => ({
      ...prev,
      [platform]: previousAiCaption,
    }));
    setPreviousAiCaption(current);
  };

  const togglePreparedItem = (id: string) => {
    setPreparedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // New item states
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorTagline, setNewSponsorTagline] = useState('');
  const [newSponsorTier, setNewSponsorTier] = useState<'gold' | 'silver' | 'bronze' | 'partenaire'>('silver');
  const [newSponsorFolder, setNewSponsorFolder] = useState('Partenaires Locaux');

  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoCategory, setNewLogoCategory] = useState<'club' | 'sponsor' | 'comite' | 'ligue' | 'autre'>('club');

  const handleAddLogo = (logoUrl: string, isVideo = false) => {
    const newLogo: ClubLogoItem = {
      id: 'logo-' + Date.now(),
      name: newLogoName.trim() || (isVideo ? 'Vidéo Logo ' + (logos.length + 1) : 'Logo ' + (logos.length + 1)),
      logoUrl,
      category: newLogoCategory,
      isTransparent: !isVideo,
      isVideo,
      mediaType: isVideo ? 'video' : 'image',
    };
    if (onUpdateLogos) {
      onUpdateLogos([...logos, newLogo]);
    }
    setNewLogoName('');
  };

  // Drag & drop and batch upload states
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [isDraggingSponsors, setIsDraggingSponsors] = useState(false);
  const [isDraggingLogos, setIsDraggingLogos] = useState(false);
  const [isDraggingEvents, setIsDraggingEvents] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoFolder, setNewPhotoFolder] = useState('Équipe Fanion');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState(clubSettings.gymnasiumDefault);
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventBadge, setNewEventBadge] = useState('Soirée Club');

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
    const list: string[] = [];
    const seen = new Set<string>();

    const add = (name?: string) => {
      if (!name) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push(trimmed);
      }
    };

    // 1. Équipes des visuels configurés
    if (Array.isArray(teamVisuals) && teamVisuals.length > 0) {
      teamVisuals.forEach((tv) => {
        add(tv.teamName);
      });
    }

    // 2. Équipes synchronisées FFBB et catégories des matchs
    if (Array.isArray(availableFfbbTeams) && availableFfbbTeams.length > 0) {
      availableFfbbTeams.forEach((t) => {
        add(t.name);
      });
    }

    // 3. Catégories des matchs existants
    if (Array.isArray(matches) && matches.length > 0) {
      matches.forEach((m) => {
        add(m.category);
      });
    }

    // 4. Équipes réelles du SRC Basket par défaut
    DEFAULT_REAL_FFBB_TEAMS.forEach((t) => {
      add(t.name);
    });

    return list;
  }, [teamVisuals, availableFfbbTeams, matches]);

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
  const cleanNameFromFileName = (fileName: string): string => {
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    const cleaned = withoutExt
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) return 'Élément';
    return cleaned
      .split(' ')
      .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');
  };

  // Upload file asynchronously via server streaming endpoint (prevents browser RAM exhaustion / crash)
  const uploadSingleFile = async (file: File): Promise<{ url: string; isVideo: boolean; fileName: string }> => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(file.name);

    // 1. Pour les vidéos et gros fichiers : Flux binaire direct (PUT) vers R2 (contourne l'erreur 413)
    if (isVideo || file.size > 2 * 1024 * 1024) {
      try {
        const uploadUrl = `/api/upload?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type || 'video/mp4')}`;
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'X-Filename': encodeURIComponent(file.name),
          },
          body: file,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            return {
              url: data.url,
              isVideo: data.mediaType === 'video' || isVideo,
              fileName: data.fileName || file.name,
            };
          }
        }
      } catch (err) {
        console.warn('Upload flux binaire (PUT) échoué, essai POST standard:', err);
      }
    }

    // 2. Upload standard POST FormData (images légères, logos classiques)
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          return {
            url: data.url,
            isVideo: data.mediaType === 'video' || isVideo,
            fileName: data.fileName || file.name,
          };
        }
      }
    } catch (err) {
      console.warn('Upload serveur direct indisponible, bascule sur ObjectURL/FileReader local:', err);
    }

    // 3. Safe local fallback with automatic image compression
    if (isVideo) {
      try {
        const blobUrl = URL.createObjectURL(file);
        return { url: blobUrl, isVideo: true, fileName: file.name };
      } catch {
        return { url: '', isVideo: true, fileName: file.name };
      }
    }

    try {
      const compressedUrl = await compressImageFile(file);
      return {
        url: compressedUrl,
        isVideo: false,
        fileName: file.name,
      };
    } catch {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            url: (e.target?.result as string) || '',
            isVideo: false,
            fileName: file.name,
          });
        };
        reader.onerror = () => {
          resolve({
            url: URL.createObjectURL(file),
            isVideo: false,
            fileName: file.name,
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Upload du logo officiel du club
  const handleLogoFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const res = await uploadSingleFile(file);
      if (res.url) {
        onUpdateClubSettings({
          ...clubSettings,
          logoUrl: res.url,
        });
      }
    } catch (err) {
      console.error('Erreur lors du téléversement du logo:', err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Upload multiple files in batch via server
  const uploadMultipleFiles = async (
    files: FileList | File[]
  ): Promise<Array<{ url: string; isVideo: boolean; fileName: string }>> => {
    const fileArray = Array.from(files).filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.type.startsWith('video/') ||
        /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return [];

    // Téléversement individuel fichier par fichier (idéal pour le streaming R2 sans saturation de payload)
    const results: Array<{ url: string; isVideo: boolean; fileName: string }> = [];
    for (const f of fileArray) {
      try {
        const single = await uploadSingleFile(f);
        results.push(single);
      } catch (err) {
        console.warn('Erreur téléversement fichier:', f.name, err);
      }
    }
    return results;
  };

  // Batch upload Photos & Videos (Multiple files & Drag-and-Drop)
  const handleBatchPhotosUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return;

    setUploadFeedback({
      message: `⏳ Téléversement de ${fileArray.length} fichier(s) en cours...`,
      type: 'success',
    });

    try {
      const results = await uploadMultipleFiles(fileArray);
      const now = Date.now();
      const newPhotos: ClubPhotoItem[] = results.map((res, idx) => {
        const title = fileArray.length === 1 && newPhotoTitle.trim()
          ? newPhotoTitle.trim()
          : cleanNameFromFileName(res.fileName);
        return {
          id: `photo-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          title,
          categoryFolder: newPhotoFolder || 'Général',
          imageUrl: res.url,
          date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          caption: fileArray.length === 1 && newPhotoCaption.trim() ? newPhotoCaption.trim() : undefined,
          isVideo: res.isVideo,
          mediaType: res.isVideo ? 'video' : 'image',
        };
      });

      onUpdatePhotos([...newPhotos, ...photos]);
      setNewPhotoTitle('');
      setNewPhotoCaption('');
      setUploadFeedback({
        message: `✅ ${newPhotos.length} photo(s) / vidéo(s) ajoutée(s) avec succès !`,
        type: 'success',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err) {
      setUploadFeedback({
        message: '❌ Erreur lors du chargement des fichiers',
        type: 'error',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  // Batch upload Sponsors & Partners
  const handleBatchSponsorsUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return;

    setUploadFeedback({
      message: `⏳ Téléversement de ${fileArray.length} partenaire(s) en cours...`,
      type: 'success',
    });

    try {
      const results = await uploadMultipleFiles(fileArray);
      const now = Date.now();
      const newSponsors: SponsorItem[] = results.map((res, idx) => {
        const name = fileArray.length === 1 && newSponsorName.trim()
          ? newSponsorName.trim()
          : cleanNameFromFileName(res.fileName);
        return {
          id: `sponsor-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          tier: newSponsorTier,
          logoUrl: res.url,
          tagline: fileArray.length === 1 && newSponsorTagline.trim() ? newSponsorTagline.trim() : undefined,
          categoryFolder: newSponsorFolder,
          isVideo: res.isVideo,
          mediaType: res.isVideo ? 'video' : 'image',
        };
      });

      onUpdateSponsors([...sponsors, ...newSponsors]);
      setNewSponsorName('');
      setNewSponsorTagline('');
      setUploadFeedback({
        message: `✅ ${newSponsors.length} partenaire(s) ajouté(s) avec succès !`,
        type: 'success',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err) {
      setUploadFeedback({
        message: '❌ Erreur lors du chargement des partenaires',
        type: 'error',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  // Batch upload Logos
  const handleBatchLogosUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return;

    setUploadFeedback({
      message: `⏳ Téléversement de ${fileArray.length} logo(s) en cours...`,
      type: 'success',
    });

    try {
      const results = await uploadMultipleFiles(fileArray);
      const now = Date.now();
      const newLogos: ClubLogoItem[] = results.map((res, idx) => {
        const name = fileArray.length === 1 && newLogoName.trim()
          ? newLogoName.trim()
          : cleanNameFromFileName(res.fileName);
        return {
          id: `logo-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          logoUrl: res.url,
          category: newLogoCategory,
          isTransparent: !res.isVideo,
          isVideo: res.isVideo,
          mediaType: res.isVideo ? 'video' : 'image',
        };
      });

      if (onUpdateLogos) {
        onUpdateLogos([...logos, ...newLogos]);
      }
      setNewLogoName('');
      setUploadFeedback({
        message: `✅ ${newLogos.length} logo(s) ajouté(s) avec succès !`,
        type: 'success',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err) {
      setUploadFeedback({
        message: '❌ Erreur lors du chargement des logos',
        type: 'error',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  // Batch upload Event Posters
  const handleBatchEventsUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|webp|svg|gif|mp4|webm|mov|m4v)$/i.test(f.name)
    );
    if (fileArray.length === 0) return;

    setUploadFeedback({
      message: `⏳ Téléversement de ${fileArray.length} affiche(s) en cours...`,
      type: 'success',
    });

    try {
      const results = await uploadMultipleFiles(fileArray);
      const now = Date.now();
      const newEvents: ClubEventItem[] = results.map((res, idx) => {
        const title = fileArray.length === 1 && newEventTitle.trim()
          ? newEventTitle.trim()
          : cleanNameFromFileName(res.fileName);
        return {
          id: `event-${now}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          title,
          date: newEventDate.trim() || 'Prochainement',
          time: newEventTime.trim() || undefined,
          location: newEventLocation.trim() || clubSettings.gymnasiumDefault,
          description: newEventDesc.trim() || 'Tous les licenciés et supporters sont les bienvenus !',
          badge: newEventBadge,
          categoryFolder: 'Événements',
          imageUrl: res.url,
          isVideo: res.isVideo,
          mediaType: res.isVideo ? 'video' : 'image',
        };
      });

      onUpdateEvents([...events, ...newEvents]);
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventTime('');
      setNewEventDesc('');
      setUploadFeedback({
        message: `✅ ${newEvents.length} affiche(s) d'événement(s) ajoutée(s) !`,
        type: 'success',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    } catch (err) {
      setUploadFeedback({
        message: '❌ Erreur lors du chargement des affiches',
        type: 'error',
      });
      setTimeout(() => setUploadFeedback(null), 4000);
    }
  };

  // Generic image & video upload helper via server upload
  const handleMediaFileChange = (file: File, callback: (url: string, isVideo: boolean) => void) => {
    uploadSingleFile(file).then((res) => {
      callback(res.url, res.isVideo);
    });
  };

  // Legacy helper for places that only expect an image URL but can also receive videos
  const handleImageFileChange = (file: File, callback: (dataUrl: string) => void) => {
    uploadSingleFile(file).then((res) => {
      callback(res.url);
    });
  };

  // Add a new photo/video to photos folder
  const handleAddPhoto = (imageUrl: string, isVideo = false) => {
    const newPhoto: ClubPhotoItem = {
      id: 'photo-' + Date.now(),
      title: newPhotoTitle.trim() || (isVideo ? 'Vidéo Clip Club ' : 'Photo Club ') + (photos.length + 1),
      categoryFolder: newPhotoFolder,
      imageUrl,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      caption: newPhotoCaption.trim() || undefined,
      isVideo,
      mediaType: isVideo ? 'video' : 'image',
    };
    onUpdatePhotos([newPhoto, ...photos]);
    setNewPhotoTitle('');
    setNewPhotoCaption('');
  };

  // Add a new sponsor
  const handleAddSponsor = (logoUrl: string, isVideo = false) => {
    const newSponsor: SponsorItem = {
      id: 'sponsor-' + Date.now(),
      name: newSponsorName.trim() || 'Nouveau Partenaire',
      tier: newSponsorTier,
      logoUrl,
      tagline: newSponsorTagline.trim() || undefined,
      categoryFolder: newSponsorFolder,
      isVideo,
      mediaType: isVideo ? 'video' : 'image',
    };
    onUpdateSponsors([...sponsors, newSponsor]);
    setNewSponsorName('');
    setNewSponsorTagline('');
  };

  // Add a new event
  const handleAddEvent = (imageUrl?: string, isVideo = false) => {
    if (!newEventTitle.trim()) return;
    const newEv: ClubEventItem = {
      id: 'event-' + Date.now(),
      title: newEventTitle.trim(),
      date: newEventDate.trim() || 'Prochainement',
      time: newEventTime.trim() || undefined,
      location: newEventLocation.trim() || clubSettings.gymnasiumDefault,
      description: newEventDesc.trim() || 'Tous les licenciés et supporters sont les bienvenus !',
      badge: newEventBadge,
      categoryFolder: 'Événements',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
      isVideo,
      mediaType: isVideo ? 'video' : 'image',
    };
    onUpdateEvents([...events, newEv]);
    setNewEventTitle('');
    setNewEventDate('');
    setNewEventTime('');
    setNewEventDesc('');
  };

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

  // Simulate Telegram Message
  const handleTestTelegramMessage = async () => {
    if (!telegramSimText.trim()) return;
    setTelegramSimLoading(true);
    setTelegramSimResponse(null);
    setTelegramSimFeedback(null);

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: telegramSimText }),
      });
      const data = await res.json();
      if (data.success && data.alert) {
        // Look up matching visual in team visuals
        const teamMatch = teamVisuals.find((tv) =>
          tv.teamName.toLowerCase().includes(data.alert.team.toLowerCase()) ||
          tv.shortAliases.some((alias) => data.alert.team.toLowerCase().includes(alias.toLowerCase()))
        );

        const commonBank = data.alert.isWin ? visualTemplates.commonVictoryVisuals : visualTemplates.commonDefeatVisuals;
        if (commonBank && commonBank.length > 0) {
          const randomIndex = Math.floor(Math.random() * commonBank.length);
          data.alert.customImageUrl = commonBank[randomIndex];
        } else if (teamMatch) {
          data.alert.customImageUrl = data.alert.isWin ? teamMatch.winVisualUrl : teamMatch.lossVisualUrl;
        }

        if (data.alert.customImageUrl) {
          data.alert.titleConfig = getEffectiveTitleConfig(
            data.alert.customImageUrl,
            data.alert.isWin,
            visualTemplates
          );
        }

        onAddAlert(data.alert);
        const confirmMsg = data.confirmationMessage || `Visuel ${data.alert.isWin ? 'VICTOIRE' : 'DÉFAITE'} pour ${data.alert.team} injecté dans la boucle TV pendant 1 heure !`;
        setTelegramSimResponse(confirmMsg);
        setTelegramSimFeedback({
          success: true,
          message: confirmMsg,
        });
      } else {
        const errorMsg = data.error || 'Équipe non reconnue : aucune alerte créée.';
        setTelegramSimResponse(errorMsg);
        setTelegramSimFeedback({
          success: false,
          message: errorMsg,
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
          isAmbiguous: Boolean(data.isAmbiguous),
        });
      }
    } catch (e) {
      console.error(e);
      const connErrMsg = 'Erreur de connexion au serveur API';
      setTelegramSimResponse(connErrMsg);
      setTelegramSimFeedback({
        success: false,
        message: connErrMsg,
      });
    } finally {
      setTelegramSimLoading(false);
    }
  };

  // Telegram Bot Operations
  const fetchTelegramStatus = async () => {
    setTelegramStatusLoading(true);
    try {
      const res = await fetch('/api/telegram/status');
      if (res.ok) {
        const data = await res.json();
        setTelegramStatus(data);
      }
    } catch (err) {
      console.error('Erreur chargement statut Telegram:', err);
    } finally {
      setTelegramStatusLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'telegram') {
      fetchTelegramStatus();
      const interval = setInterval(() => {
        fetchTelegramStatus();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleConnectTelegram = async (customPassword?: string) => {
    setTelegramConnecting(true);
    setTelegramActionMsg(null);
    const passwordToSend = customPassword !== undefined ? customPassword : savedAdminPassword;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (passwordToSend) {
        headers['x-admin-password'] = passwordToSend;
      }

      const res = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          adminPassword: passwordToSend,
          customDomain: typeof window !== 'undefined' ? window.location.host : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setAdminPasswordPrompt(true);
        setTelegramActionMsg({
          type: 'error',
          text: data.error || 'Action protégée : mot de passe administrateur requis pour connecter le bot.',
        });
        return;
      }

      if (data.success && data.connected) {
        if (passwordToSend) {
          setSavedAdminPassword(passwordToSend);
          try { sessionStorage.setItem('src_admin_password', passwordToSend); } catch (e) {}
        }
        setAdminPasswordPrompt(false);
        setAdminPasswordInput('');
        setTelegramActionMsg({
          type: 'success',
          text: `Bot connecté avec succès ! (@${data.botUsername || 'bot'}). Le webhook est configuré et sécurisé par signature secrète.`,
        });
        await fetchTelegramStatus();
      } else {
        setTelegramActionMsg({
          type: 'error',
          text: data.error || 'Échec de la connexion du bot Telegram.',
        });
      }
    } catch (err: any) {
      setTelegramActionMsg({
        type: 'error',
        text: `Erreur de connexion : ${err.message || 'serveur inaccessible'}`,
      });
    } finally {
      setTelegramConnecting(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm('Voulez-vous vraiment déconnecter le webhook Telegram ? Le bot ne recevra plus les alertes de victoires / défaites en direct.')) {
      return;
    }
    setTelegramDisconnecting(true);
    setTelegramActionMsg(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (savedAdminPassword) {
        headers['x-admin-password'] = savedAdminPassword;
      }

      const res = await fetch('/api/telegram/disconnect', {
        method: 'POST',
        headers,
        body: JSON.stringify({ adminPassword: savedAdminPassword }),
      });

      const data = await res.json();
      if (res.status === 401) {
        setAdminPasswordPrompt(true);
        setTelegramActionMsg({
          type: 'error',
          text: data.error || 'Action protégée : mot de passe administrateur requis.',
        });
        return;
      }

      if (data.success) {
        setTelegramActionMsg({
          type: 'info',
          text: 'Webhook Telegram déconnecté avec succès.',
        });
        await fetchTelegramStatus();
      } else {
        setTelegramActionMsg({
          type: 'error',
          text: data.error || 'Erreur lors de la déconnexion.',
        });
      }
    } catch (err: any) {
      setTelegramActionMsg({
        type: 'error',
        text: `Erreur : ${err.message || 'serveur inaccessible'}`,
      });
    } finally {
      setTelegramDisconnecting(false);
    }
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

  // Récupération automatique des logos des clubs adverses (FFBB API)
  const handleFetchOpponentLogos = async (overrideMatches?: MatchItem[], overrideResults?: MatchItem[]) => {
    setIsFetchingOpponentLogos(true);
    const targetMatches = overrideMatches || matches;
    const targetResults = overrideResults || results;
    const updatedCache = { ...opponentLogosCache };
    let newLogosCount = 0;

    const clubNameLower = (clubSettings.name || '').toLowerCase().trim();
    const clubShortLower = (clubSettings.shortName || '').toLowerCase().trim();
    const clubCityLower = (clubSettings.city || '').toLowerCase().trim();

    const allOpponents = Array.from(
      new Set(
        [...targetMatches, ...targetResults]
          .map((m) => (m.isHomeMatch ? m.teamAway : m.teamHome))
          .filter(
            (name) => {
              if (!name || name.trim().length <= 1) return false;
              const nLower = name.toLowerCase();
              if (clubNameLower && nLower.includes(clubNameLower)) return false;
              if (clubShortLower && nLower.includes(clubShortLower)) return false;
              if (clubCityLower && clubCityLower.length > 2 && nLower.includes(clubCityLower)) return false;
              return true;
            }
          )
      )
    );

    for (const opp of allOpponents) {
      if (!updatedCache[opp]) {
        const logoUrl = await FFBBService.fetchClubLogoByName(opp);
        if (logoUrl) {
          updatedCache[opp] = logoUrl;
          newLogosCount++;
        }
      }
    }

    setOpponentLogosCache(updatedCache);
    try {
      localStorage.setItem('club_opponent_logos_cache', JSON.stringify(updatedCache));
    } catch (e) {}

    // Attacher les logos aux matchs et résultats
    const applyLogos = (items: MatchItem[]) =>
      items.map((m) => {
        const oppName = m.isHomeMatch ? m.teamAway : m.teamHome;
        const logo = updatedCache[oppName];
        return logo ? { ...m, opponentLogo: logo } : m;
      });

    const updatedM = applyLogos(targetMatches);
    const updatedR = applyLogos(targetResults);
    onUpdateMatches(updatedM);
    onUpdateResults(updatedR);
    setIsFetchingOpponentLogos(false);

    if (!overrideMatches) {
      setSyncMessage(`🔍 Recherche de logos FFBB terminée : ${newLogosCount} nouveau(x) logo(s) de club(s) adverses trouvé(s) !`);
      setTimeout(() => setSyncMessage(null), 4000);
    }
    return { updatedMatches: updatedM, updatedResults: updatedR, newLogosCount };
  };

  // Sync with FFBB : Télécharge TOUTE la saison sans supprimer par date
  const handleSyncFFBB = async () => {
    setIsSyncingFFBB(true);
    setSyncMessage(null);
    setSyncIsError(false);
    try {
      const res = await FFBBService.fetchClubData(clubSettings.codeFFBB);
      if (res.matches && res.matches.length > 0) {
        let allSeasonMatches = res.matches || [];
        let allSeasonResults = res.results || [];

        // Étape : Filtrer uniquement en ignorant les équipes décochées par l'administrateur
        const ignoredCategories = clubSettings.ignoredTeamCategories || [];
        if (ignoredCategories.length > 0) {
          allSeasonMatches = allSeasonMatches.filter((m) => !isTeamCategoryIgnored(m.category, ignoredCategories));
          allSeasonResults = allSeasonResults.filter((r) => !isTeamCategoryIgnored(r.category, ignoredCategories));
        }

        // Attacher les logos adverses si disponibles en cache
        const applyLogos = (items: MatchItem[]) =>
          items.map((m) => {
            const oppName = m.isHomeMatch ? m.teamAway : m.teamHome;
            const logo = opponentLogosCache[oppName];
            return logo ? { ...m, opponentLogo: logo } : m;
          });

        allSeasonMatches = applyLogos(allSeasonMatches);
        allSeasonResults = applyLogos(allSeasonResults);

        const customNames = clubSettings.customTeamNames || {};
        const finalMatches = mergeMatchItems(matches, allSeasonMatches, customNames);
        const finalResults = mergeMatchItems(results, allSeasonResults, customNames);

        onUpdateMatches(finalMatches);
        onUpdateResults(finalResults);

        // Si l'option d'auto-récupération des logos adverses est cochée, lancer la recherche en arrière-plan
        if (autoFetchOpponentLogos) {
          handleFetchOpponentLogos(finalMatches, finalResults);
        }

        if (res.clubInfo?.teamsList && res.clubInfo.teamsList.length > 0) {
          // Préserver les noms personnalisés pour chaque équipe par son identifiant FFBB
          const existingMap = new Map(ffbbTeams.map((t) => [t.id, t]));
          const existingCatMap = new Map(ffbbTeams.map((t) => [normalizeCategoryKey(t.category), t]));

          const updatedTeams = res.clubInfo.teamsList.map((t) => {
            const existing = existingMap.get(t.id) || existingCatMap.get(normalizeCategoryKey(t.category));
            const customName = customNames[t.id] || customNames[t.category] || existing?.customName;
            return {
              ...t,
              customName: customName || undefined,
            };
          });

          setFfbbTeams(updatedTeams);
          try {
            localStorage.setItem('ffbb_club_teams_cache', JSON.stringify(updatedTeams));
          } catch (e) {}
        }
        
        const sourceInfo = "API FFBB Officielle (ffbb-api.desimone.fr)";
        const allTeamsList = (res.clubInfo?.teamsList && res.clubInfo.teamsList.length > 0) ? res.clubInfo.teamsList : ffbbTeams;
        const ignoredCount = allTeamsList.filter((t) => isTeamCategoryIgnored(t.category, ignoredCategories)).length;
        const trackedCount = allTeamsList.length - ignoredCount;
        const ignoredNote = ignoredCount > 0 ? ` (${ignoredCount} équipe${ignoredCount > 1 ? 's' : ''} ignorée${ignoredCount > 1 ? 's' : ''})` : '';

        setSyncMessage(`Synchronisation réussie (${sourceInfo})${ignoredNote} ! L'intégralité du calendrier de la saison (${allSeasonMatches.length} rencontres et ${allSeasonResults.length} résultats) a été synchronisée pour les ${trackedCount} équipes suivies.`);
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
      
      // Retirer immédiatement les matchs et résultats de cette équipe décochée pour ne pas polluer l'affichage
      const updatedMatches = matches.filter((m) => !isTeamCategoryIgnored(m.category, [teamCategory]));
      const updatedResults = results.filter((r) => !isTeamCategoryIgnored(r.category, [teamCategory]));
      onUpdateMatches(updatedMatches);
      onUpdateResults(updatedResults);
      setProposalAppliedMsg(`✕ Équipe ${teamName || teamCategory} ignorée : ses matchs et résultats ont été retirés.`);
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
    onUpdateMatches([]);
    onUpdateResults([]);
    setProposalAppliedMsg('⚠ Toutes les équipes sont décochées. Aucune rencontre ne sera affichée.');
    setTimeout(() => setProposalAppliedMsg(null), 5000);
  };

  // Personnalisation du nom d'affichage d'une équipe FFBB
  const handleUpdateTeamCustomName = (teamId: string, teamCategory: string, newCustomName: string) => {
    const trimmed = newCustomName.trim();
    const updatedCustomNames = { ...(clubSettings.customTeamNames || {}) };

    if (trimmed) {
      updatedCustomNames[teamId] = trimmed;
      updatedCustomNames[teamCategory] = trimmed;
      updatedCustomNames[normalizeCategoryKey(teamCategory)] = trimmed;
    } else {
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

  // Excel upload handler & Birthday week handlers
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setExcelSuccessMsg(null);
    setExcelErrors([]);

    try {
      const result = await parseExcelBirthdays(file, new Date(), birthdayWeekOffset);
      if (result.allMembers && result.allMembers.length > 0) {
        const sortedMembers = sortBirthdaysByHierarchy(result.allMembers);
        const refDate = simulatedDate || new Date();
        const filtered = filterAndSortBirthdaysForWeek(sortedMembers, refDate, birthdayWeekOffset);
        updateAllMembersEverywhere(sortedMembers, filtered);

        const bounds = getWeekBounds(refDate, birthdayWeekOffset);
        setExcelSuccessMsg(
          `Fichier ${file.name} importé avec succès (${sortedMembers.length} licenciés trouvés). ${filtered.length} anniversaire(s) sélectionné(s) pour la ${bounds.shortLabel} !`
        );
      } else if (result.errors && result.errors.length > 0) {
        setExcelErrors(result.errors);
      } else {
        setExcelErrors(['Aucun licencié trouvé dans ce fichier']);
      }
    } catch (err: any) {
      console.error(err);
      setExcelErrors([err.message || 'Erreur inattendue lors du traitement du fichier Excel']);
    } finally {
      setIsParsingExcel(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  const handleSelectWeekOffset = (offset: number) => {
    setBirthdayWeekOffset(offset);
    const pool = (allMembers && allMembers.length > 0) ? allMembers : allMembersPool;
    if (pool.length > 0) {
      const refDate = simulatedDate || new Date();
      const filtered = filterAndSortBirthdaysForWeek(pool, refDate, offset);
      onUpdateBirthdays(filtered);
    }
  };

  const handleStartEditBirthday = (item: BirthdayItem) => {
    setEditingBirthdayId(item.id);
    const firstName = item.firstName || (item.fullName ? item.fullName.trim().split(/\s+/)[0] : '');
    setEditBdayFirstName(firstName);
    setEditBdayCategory(item.teamCategory || '');
    setEditBdayDate(item.birthDate || '');
  };

  const handleSaveEditBirthday = (id: string) => {
    const cleanFirst = editBdayFirstName.trim();
    if (!cleanFirst) return;
    const cleanCat = formatDisplayCategory(editBdayCategory.trim() || 'Club', undefined, cleanFirst);

    const updateList = (list: BirthdayItem[]) =>
      list.map((b) => {
        if (b.id !== id) return b;
        let newFormatted = b.birthDayFormatted;
        if (editBdayDate) {
          const d = new Date(editBdayDate);
          if (!isNaN(d.getTime())) {
            newFormatted = formatFrenchBirthday(d);
          }
        }
        return {
          ...b,
          firstName: cleanFirst,
          fullName: cleanFirst,
          teamCategory: cleanCat,
          birthDate: editBdayDate || b.birthDate,
          birthDayFormatted: newFormatted,
        };
      });

    const updatedBirthdays = sortBirthdaysByHierarchy(updateList(birthdays));
    const pool = (allMembers && allMembers.length > 0) ? allMembers : allMembersPool;
    const updatedPool = pool.length > 0 ? sortBirthdaysByHierarchy(updateList(pool)) : updatedBirthdays;
    updateAllMembersEverywhere(updatedPool, updatedBirthdays);

    setEditingBirthdayId(null);
  };

  const handleCancelEditBirthday = () => {
    setEditingBirthdayId(null);
  };

  const handleAddManualBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBdayFirstName.trim()) return;

    const cleanFirst = manualBdayFirstName.trim();
    const cleanCat = formatDisplayCategory(manualBdayCategory.trim() || 'Club', undefined, cleanFirst);
    const dateObj = manualBdayDate ? new Date(manualBdayDate) : new Date();
    const formattedDate = formatFrenchBirthday(dateObj);

    const newItem: BirthdayItem = {
      id: `bday-manual-${Date.now()}`,
      firstName: cleanFirst,
      fullName: cleanFirst,
      teamCategory: cleanCat,
      birthDate: manualBdayDate || new Date().toISOString().split('T')[0],
      birthDayFormatted: formattedDate,
      isThisWeek: true,
    };

    const nextList = sortBirthdaysByHierarchy([newItem, ...birthdays]);
    const pool = (allMembers && allMembers.length > 0) ? allMembers : allMembersPool;
    const nextPool = sortBirthdaysByHierarchy([newItem, ...pool]);
    updateAllMembersEverywhere(nextPool, nextList);

    setManualBdayFirstName('');
    setManualBdayCategory('U15');
    setManualBdayDate('');
    setIsAddingManualBday(false);
  };

  const handleDeleteBirthday = (id: string) => {
    const nextList = birthdays.filter((b) => b.id !== id);
    const pool = (allMembers && allMembers.length > 0) ? allMembers : allMembersPool;
    const nextPool = pool.length > 0 ? pool.filter((b) => b.id !== id) : [];
    updateAllMembersEverywhere(nextPool, nextList);
  };

  // Social Caption Generator Helper
  const getSocialCaption = (platform: 'instagram' | 'tiktok' | 'facebook', type: 'matches' | 'results') => {
    if (aiCustomCaptions[platform]) {
      return aiCustomCaptions[platform]!;
    }

    const clubName = String(clubSettings?.name || clubSettings?.shortName || 'Notre Club').trim();
    const shortClub = String(clubSettings?.shortName || clubSettings?.name || 'Notre Club').trim();
    const gym = String(clubSettings?.gymnasiumDefault || 'Gymnase').trim();
    const insta = socialForm.instagramHandle || clubSettings?.instagramHandle || '@votre_club';
    const fb = socialForm.facebookPage || clubSettings?.facebookPage || 'Nom du club';
    const tiktok = socialForm.tiktokHandle || clubSettings?.tiktokHandle || '@votre_club';

    const targetMatches = socialOnlySelectedMatches
      ? matches.filter((m) => m.selectedForWeekend !== false)
      : matches;

    if (type === 'matches') {
      const homeMatches = targetMatches.filter((m) => m.isHomeMatch);
      const awayMatches = targetMatches.filter((m) => !m.isHomeMatch);

      const buildGroupedMatchesText = (list: MatchItem[], isHome: boolean) => {
        if (list.length === 0) {
          return isHome ? "Aucun match à domicile" : "Aucun déplacement";
        }
        
        // Group by date
        const grouped: Record<string, MatchItem[]> = {};
        list.forEach((m) => {
          const d = m.date || 'Date non spécisée';
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(m);
        });

        // Sort dates
        const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

        return sortedKeys.map((dateStr) => {
          const dateEur = formatDateToEuropean(dateStr);
          const matchLines = grouped[dateStr].map((m) => {
            const label = isHome ? `vs ${m.teamAway}` : `@ ${m.teamHome}`;
            return `  • ${m.category} ${label} à ${m.time}`;
          }).join('\n');
          return `📅 ${dateEur} :\n${matchLines}`;
        }).join('\n\n');
      };

      if (platform === 'instagram') {
        const homeList = buildGroupedMatchesText(homeMatches, true);
        const awayList = buildGroupedMatchesText(awayMatches, false);

        return `🔥 PROGRAMME DU WEEK-END • ${shortClub.toUpperCase()} 🔥\n\nVenez soutenir nos équipes en nombre ce week-end !\n\n📍 À DOMICILE (${gym}) :\n${homeList}\n\n📍 À L'EXTÉRIEUR :\n${awayList}\n\nBuvette & ambiance au rendez-vous ! 🔴⚪\n.\n.\n#Basket #MatchDay #${shortClub.replace(/[^a-zA-Z0-9]/g, '')} #TeamSpirit #FFBB #Basketball #GameDay\n📲 Suivez-nous : ${insta}`;
      } else if (platform === 'tiktok') {
        return `C'est le match day pour ${shortClub} ! 🏀🔥 Qui sera là pour faire du bruit ce week-end ? Rendez-vous sur le terrain ! ⚡💥\n\n#basketball #basket #matchday #pourtoi #fyp #${shortClub.replace(/[^a-zA-Z0-9]/g, '')} #foryou #viral #hoops #bball @${tiktok.replace(/^@/, '')}`;
      } else {
        const homeList = buildGroupedMatchesText(homeMatches, true);
        const awayList = buildGroupedMatchesText(awayMatches, false);

        return `🏀 PROGRAMME DU WEEK-END — ${clubName.toUpperCase()} 🏀\n\nCe week-end, nos équipes sont d'attaque pour défendre nos couleurs ! Retrouvez ci-dessous le calendrier complet des rencontres :\n\n📍 À DOMICILE (${gym}) :\n${homeList}\n\n📍 À L'EXTÉRIEUR :\n${awayList}\n\nBuvette et restauration sur place pour les matchs à domicile ! Venez encourager nos joueuses et joueurs ! 👏\n\nRetrouvez toute l'actualité du club sur notre page : fb.com/${fb}`;
      }
    } else {
      const wins = results.filter((r) => isMatchWin(r, clubSettings.name, clubSettings.shortName)).length;
      const losses = results.filter((r) => !isMatchWin(r, clubSettings.name, clubSettings.shortName)).length;

      if (platform === 'instagram') {
        const resultsList = results.map((r) => {
          const isHome = isClubHomeMatch(r, clubSettings.name, clubSettings.shortName);
          const opponent = isHome ? r.teamAway : r.teamHome;
          const isWin = isMatchWin(r, clubSettings.name, clubSettings.shortName);
          const score = `${r.homeScore ?? '-'} - ${r.awayScore ?? '-'}`;
          return `${isWin ? '✅' : '❌'} ${r.category} : ${score} (${isHome ? 'vs ' + opponent : '@ ' + opponent})`;
        }).join('\n');

        return `🏆 RÉSULTATS DU WEEK-END • ${shortClub.toUpperCase()} 🏆\n\nBilan de nos équipes : ${wins} Victoire(s) et ${losses} Défaite(s) ! 💥\n\n${resultsList}\n\nFélicitations à l'ensemble des joueuses, joueurs et entraîneurs pour leur engagement ! Merci également aux arbitres, OTM et supporters ! 👏❤️\n.\n.\n#BasketResultats #Victoire #${shortClub.replace(/[^a-zA-Z0-9]/g, '')} #Basket #FFBB #Team`;
      } else if (platform === 'tiktok') {
        return `Le bilan du week-end pour ${shortClub} : ${wins} Victoires et ${losses} Défaites ! 🏀🔥 Identifie ton coéquipier en commentaire 👇\n\n#basket #resultats #victoire #basketball #pourtoi #fyp #bball #hooper @${tiktok.replace(/^@/, '')}`;
      } else {
        const resultsList = results.map((r) => {
          const isHome = isClubHomeMatch(r, clubSettings.name, clubSettings.shortName);
          const opponent = isHome ? r.teamAway : r.teamHome;
          const isWin = isMatchWin(r, clubSettings.name, clubSettings.shortName);
          const score = `${r.homeScore ?? '-'} - ${r.awayScore ?? '-'}`;
          return `• ${r.category} : ${score} contre ${opponent} (${isWin ? 'VICTOIRE ✌️' : 'DÉFAITE'})`;
        }).join('\n');

        return `🏆 BILAN DU WEEK-END — TOUS LES RÉSULTATS 🏆\n\nUn beau week-end sportif pour ${clubName} avec un bilan global de ${wins} victoire(s) et ${losses} défaite(s) :\n\n${resultsList}\n\nBravo à toutes nos équipes pour l'état d'esprit irréprochable et la détermination sur chaque ballon ! Un immense merci à nos fidèles supporters et bénévoles présents dans les gradins !\n\nAllez ${shortClub} ! ❤️🤍`;
      }
    }
  };

  const handleCopySocialCaption = (platform: string, text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setSocialCopiedPlatform(platform);
      setTimeout(() => setSocialCopiedPlatform(null), 2500);
    }
  };

  const handleSaveSocialSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateClubSettings({
      ...clubSettings,
      instagramHandle: socialForm.instagramHandle,
      facebookPage: socialForm.facebookPage,
      tiktokHandle: socialForm.tiktokHandle,
      socialWebhookUrl: socialForm.socialWebhookUrl,
    });
    setSocialSaveSuccess(true);
    setTimeout(() => setSocialSaveSuccess(false), 3000);
  };

  const handleTestSocialWebhook = async () => {
    const webhookUrl = socialForm.socialWebhookUrl || clubSettings.socialWebhookUrl;
    if (!webhookUrl) {
      setSocialWebhookStatus({
        loading: false,
        message: 'Veuillez renseigner une URL de Webhook valide ci-dessous.',
        success: false,
      });
      return;
    }

    setSocialWebhookStatus({ loading: true, message: 'Envoi du test en cours...' });
    try {
      const caption = getSocialCaption('instagram', socialContentType);
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'webhook',
          aspectRatio: '1:1',
          caption,
          contentType: socialContentType,
          webhookUrl,
          itemsCount: socialContentType === 'matches' ? matches.length : results.length,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSocialWebhookStatus({
          loading: false,
          message: '✅ Webhook exécuté avec succès ! Payload envoyé.',
          success: true,
        });
      } else {
        setSocialWebhookStatus({
          loading: false,
          message: `⚠️ Erreur : ${data.error || 'Échec de transmission'}`,
          success: false,
        });
      }
    } catch (err: any) {
      setSocialWebhookStatus({
        loading: false,
        message: `❌ Erreur réseau : ${err.message || 'Impossible de joindre le serveur'}`,
        success: false,
      });
    }
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
                  ? saveErrorMessage || 'Erreur lors de la sauvegarde — Cliquez pour réorganiser'
                  : 'Enregistrer manuellement les modifications'
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
                  <span>Enregistré !</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4 text-white" />
                  <span>Échec (Réessayer)</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>

            {/* Direct Switch to TV Broadcast Mode Button */}
            <button
              onClick={() => {
                onSwitchToTvMode();
              }}
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
              setMatchesSubTab={setMatchesSubTab}
              matchesSubTab={matchesSubTab}
              matches={matches}
              visualTemplates={visualTemplates}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              results={results}
              birthdays={birthdays}
              clubSettings={clubSettings}
              setShowCalendarInMatches={setShowCalendarInMatches}
              showCalendarInMatches={showCalendarInMatches}
              setFilterToCurrentWeekend={setFilterToCurrentWeekend}
              syncStartDate={syncStartDate}
              syncEndDate={syncEndDate}
              setSyncStartDate={setSyncStartDate}
              setSyncEndDate={setSyncEndDate}
              setMatchesFilterMode={setMatchesFilterMode}
              handleSelectOnlyFilteredMatchesForTV={handleSelectOnlyFilteredMatchesForTV}
              handleSyncFFBB={handleSyncFFBB}
              isSyncingFFBB={isSyncingFFBB}
              handleFetchOpponentLogos={handleFetchOpponentLogos}
              isFetchingOpponentLogos={isFetchingOpponentLogos}
              logos={logos}
              autoFetchOpponentLogos={autoFetchOpponentLogos}
              setAutoFetchOpponentLogos={setAutoFetchOpponentLogos}
              syncMessage={syncMessage}
              syncIsError={syncIsError}
              onUpdateMatches={onUpdateMatches}
              setShowAddManualMatch={setShowAddManualMatch}
              showAddManualMatch={showAddManualMatch}
              newMatchCategory={newMatchCategory}
              setNewMatchCategory={setNewMatchCategory}
              newMatchOpponent={newMatchOpponent}
              setNewMatchOpponent={setNewMatchOpponent}
              newMatchDate={newMatchDate}
              setNewMatchDate={setNewMatchDate}
              newMatchTime={newMatchTime}
              setNewMatchTime={setNewMatchTime}
              setNewMatchIsHome={setNewMatchIsHome}
              newMatchIsHome={newMatchIsHome}
              handleAddMatchManual={handleAddMatchManual}
              matchesFilterMode={matchesFilterMode}
              editingMatch={editingMatch}
              setEditingMatch={setEditingMatch}
              handleQuickMatchOutcome={handleQuickMatchOutcome}
              quickScoreMatchId={quickScoreMatchId}
              setQuickScoreMatchId={setQuickScoreMatchId}
              setQuickHomeScore={setQuickHomeScore}
              setQuickAwayScore={setQuickAwayScore}
              quickHomeScore={quickHomeScore}
              quickAwayScore={quickAwayScore}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 2: RÉSULTATS DU WEEK-END */}
          {/* ========================================================================= */}
          {activeTab === 'results' && (
            <ResultsTab
              setResultsSubTab={setResultsSubTab}
              resultsSubTab={resultsSubTab}
              results={results}
              visualTemplates={visualTemplates}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              matches={matches}
              birthdays={birthdays}
              clubSettings={clubSettings}
              setShowCalendarInResults={setShowCalendarInResults}
              showCalendarInResults={showCalendarInResults}
              setResultsFilterToCurrentWeekend={setResultsFilterToCurrentWeekend}
              setResultsFilterToLastWeekend={setResultsFilterToLastWeekend}
              resultsStartDate={resultsStartDate}
              resultsEndDate={resultsEndDate}
              setResultsStartDate={setResultsStartDate}
              setResultsEndDate={setResultsEndDate}
              setResultsFilterMode={setResultsFilterMode}
              handleSelectOnlyFilteredResultsForTV={handleSelectOnlyFilteredResultsForTV}
              handleSyncFFBB={handleSyncFFBB}
              isSyncingFFBB={isSyncingFFBB}
              autoFetchOpponentLogos={autoFetchOpponentLogos}
              setAutoFetchOpponentLogos={setAutoFetchOpponentLogos}
              logos={logos}
              onUpdateResults={onUpdateResults}
              setShowAddManualResult={setShowAddManualResult}
              showAddManualResult={showAddManualResult}
              selectedScheduledMatchId={selectedScheduledMatchId}
              handleSelectScheduledMatch={handleSelectScheduledMatch}
              setNewResultIsHome={setNewResultIsHome}
              newResultIsHome={newResultIsHome}
              newResultErrorMsg={newResultErrorMsg}
              newResultSuccessMsg={newResultSuccessMsg}
              newResultIsCustomCategory={newResultIsCustomCategory}
              newResultCategory={newResultCategory}
              setNewResultIsCustomCategory={setNewResultIsCustomCategory}
              setNewResultCategory={setNewResultCategory}
              availableFfbbTeams={availableFfbbTeams}
              newResultOpponent={newResultOpponent}
              setNewResultOpponent={setNewResultOpponent}
              setNewResultErrorMsg={setNewResultErrorMsg}
              newResultDate={newResultDate}
              setNewResultDate={setNewResultDate}
              setNewResultMode={setNewResultMode}
              newResultMode={newResultMode}
              newResultHomeScore={newResultHomeScore}
              setNewResultHomeScore={setNewResultHomeScore}
              newResultAwayScore={newResultAwayScore}
              setNewResultAwayScore={setNewResultAwayScore}
              setNewResultStatusOutcome={setNewResultStatusOutcome}
              newResultStatusOutcome={newResultStatusOutcome}
              handleAddResultManual={handleAddResultManual}
              setEditingResult={setEditingResult}
              editingResult={editingResult}
              handleSaveEditedResult={handleSaveEditedResult}
            />
          )}

          {/* ========================================================================= */}
          {/* BANQUES D'IMAGES & VISUELS DU CLUB */}
          {/* ========================================================================= */}
          {activeTab === 'image_banks' && (
            <ImageBanksTab
              photos={photos}
              logos={logos}
              setImageBankSubTab={setImageBankSubTab}
              imageBankSubTab={imageBankSubTab}
              consolidatedMediaBank={consolidatedMediaBank}
              sponsors={sponsors}
              events={events}
              visualTemplates={visualTemplates}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              setIsDraggingPhotos={setIsDraggingPhotos}
              handleBatchPhotosUpload={handleBatchPhotosUpload}
              isDraggingPhotos={isDraggingPhotos}
              newPhotoTitle={newPhotoTitle}
              setNewPhotoTitle={setNewPhotoTitle}
              newPhotoFolder={newPhotoFolder}
              setNewPhotoFolder={setNewPhotoFolder}
              onUpdatePhotos={onUpdatePhotos}
              setIsDraggingSponsors={setIsDraggingSponsors}
              handleBatchSponsorsUpload={handleBatchSponsorsUpload}
              isDraggingSponsors={isDraggingSponsors}
              newSponsorName={newSponsorName}
              setNewSponsorName={setNewSponsorName}
              newSponsorTier={newSponsorTier}
              setNewSponsorTier={setNewSponsorTier}
              onUpdateSponsors={onUpdateSponsors}
              setIsDraggingLogos={setIsDraggingLogos}
              handleBatchLogosUpload={handleBatchLogosUpload}
              isDraggingLogos={isDraggingLogos}
              newLogoName={newLogoName}
              setNewLogoName={setNewLogoName}
              newLogoCategory={newLogoCategory}
              setNewLogoCategory={setNewLogoCategory}
              onUpdateLogos={onUpdateLogos}
              setIsDraggingEvents={setIsDraggingEvents}
              handleBatchEventsUpload={handleBatchEventsUpload}
              isDraggingEvents={isDraggingEvents}
              newEventTitle={newEventTitle}
              setNewEventTitle={setNewEventTitle}
              newEventDate={newEventDate}
              setNewEventDate={setNewEventDate}
              onUpdateEvents={onUpdateEvents}
              teamVisuals={teamVisuals}
              uploadMultipleFiles={uploadMultipleFiles}
              setSelectedAlertVisualUrl={setSelectedAlertVisualUrl}
              setSelectedAlertVisualType={setSelectedAlertVisualType}
              setAlertPreviewType={setAlertPreviewType}
              selectedAlertVisualUrl={selectedAlertVisualUrl}
              selectedAlertVisualType={selectedAlertVisualType}
              updateActiveConfig={updateActiveConfig}
              activeEditingConfig={activeEditingConfig}
              alertPreviewType={alertPreviewType}
              setAlertPreviewTeam={setAlertPreviewTeam}
              alertPreviewTeam={alertPreviewTeam}
              widestTeamInfo={widestTeamInfo}
              allCandidateTeams={allCandidateTeams}
              teamsMeasureRef={teamsMeasureRef}
              currentPreviewFont={currentPreviewFont}
              currentPreviewScale={currentPreviewScale}
              currentPreviewTitleTemplate={currentPreviewTitleTemplate}
              currentPreviewIsWin={currentPreviewIsWin}
              effectivePreviewTeam={effectivePreviewTeam}
              clubSettings={clubSettings}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB: PASSERELLE RÉSEAUX SOCIAUX (INSTAGRAM • TIKTOK • FACEBOOK) */}
          {/* ========================================================================= */}
          {activeTab === 'social' && (
            <SocialTab
              isOpen={isOpen}
              onClose={onClose}
              matches={matches}
              results={results}
              birthdays={birthdays}
              clubSettings={clubSettings}
              visualTemplates={visualTemplates}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              onUpdateClubSettings={onUpdateClubSettings}
              setActiveTab={setActiveTab}
              socialForm={socialForm}
              setSocialForm={setSocialForm}
              handleTestSocialWebhook={handleTestSocialWebhook}
              socialWebhookStatus={socialWebhookStatus}
              setSocialSaveSuccess={setSocialSaveSuccess}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 4: BOT TELEGRAM */}
          {/* ========================================================================= */}
          {activeTab === 'telegram' && (
            <TelegramTab
              telegramStatusLoading={telegramStatusLoading}
              telegramStatus={telegramStatus}
              effectiveLastTelegramMessage={effectiveLastTelegramMessage}
              fetchTelegramStatus={fetchTelegramStatus}
              formatTelegramDate={formatTelegramDate}
              activeAlerts={activeAlerts}
              onRemoveAlert={onRemoveAlert}
              telegramActionMsg={telegramActionMsg}
              setTelegramActionMsg={setTelegramActionMsg}
              adminPasswordPrompt={adminPasswordPrompt}
              adminPasswordInput={adminPasswordInput}
              setAdminPasswordInput={setAdminPasswordInput}
              handleConnectTelegram={handleConnectTelegram}
              telegramConnecting={telegramConnecting}
              setAdminPasswordPrompt={setAdminPasswordPrompt}
              handleDisconnectTelegram={handleDisconnectTelegram}
              telegramDisconnecting={telegramDisconnecting}
              setTelegramSimText={setTelegramSimText}
              telegramSimText={telegramSimText}
              handleTestTelegramMessage={handleTestTelegramMessage}
              telegramSimLoading={telegramSimLoading}
              telegramSimFeedback={telegramSimFeedback}
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
              onUpdateClubSettings={onUpdateClubSettings}
              clubSettings={clubSettings}
              photos={photos}
              categories={categories}
              handleToggleCategory={handleToggleCategory}
              handleDurationChange={handleDurationChange}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 7: ANNIVERSAIRES (EXCEL & GESTION PAR SEMAINE) */}
          {/* ========================================================================= */}
          {activeTab === 'excel' && (
            <ExcelTab
              setBirthdaysSubTab={setBirthdaysSubTab}
              birthdaysSubTab={birthdaysSubTab}
              birthdays={birthdays}
              visualTemplates={visualTemplates}
              onUpdateVisualTemplates={onUpdateVisualTemplates}
              matches={matches}
              results={results}
              clubSettings={clubSettings}
              setIsAddingManualBday={setIsAddingManualBday}
              isAddingManualBday={isAddingManualBday}
              handleAddManualBirthday={handleAddManualBirthday}
              manualBdayFirstName={manualBdayFirstName}
              setManualBdayFirstName={setManualBdayFirstName}
              manualBdayCategory={manualBdayCategory}
              setManualBdayCategory={setManualBdayCategory}
              manualBdayDate={manualBdayDate}
              setManualBdayDate={setManualBdayDate}
              birthdayWeekOffset={birthdayWeekOffset}
              handleSelectWeekOffset={handleSelectWeekOffset}
              allMembers={allMembers}
              allMembersPool={allMembersPool}
              onUpdateBirthdays={onUpdateBirthdays}
              isParsingExcel={isParsingExcel}
              excelInputRef={excelInputRef}
              handleExcelFileUpload={handleExcelFileUpload}
              excelSuccessMsg={excelSuccessMsg}
              saveStatus={saveStatus}
              saveErrorMessage={saveErrorMessage}
              excelErrors={excelErrors}
              editingBirthdayId={editingBirthdayId}
              handleCancelEditBirthday={handleCancelEditBirthday}
              editBdayFirstName={editBdayFirstName}
              setEditBdayFirstName={setEditBdayFirstName}
              editBdayCategory={editBdayCategory}
              setEditBdayCategory={setEditBdayCategory}
              editBdayDate={editBdayDate}
              setEditBdayDate={setEditBdayDate}
              handleSaveEditBirthday={handleSaveEditBirthday}
              handleStartEditBirthday={handleStartEditBirthday}
              handleDeleteBirthday={handleDeleteBirthday}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB: IDENTITÉ DU CLUB */}
          {/* ========================================================================= */}
          {activeTab === 'club_identity' && (
            <ClubIdentityTab
              clubSettings={clubSettings}
              onUpdateClubSettings={onUpdateClubSettings}
              setActiveTab={setActiveTab}
              ffbbTeams={ffbbTeams}
              setIsDraggingLogo={setIsDraggingLogo}
              handleLogoFileUpload={handleLogoFileUpload}
              isDraggingLogo={isDraggingLogo}
              isUploadingLogo={isUploadingLogo}
              logoFileInputRef={logoFileInputRef}
              setSocialForm={setSocialForm}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 8: FFBB */}
          {/* ========================================================================= */}
          {activeTab === 'ffbb' && (
            <FfbbTab
              clubSettings={clubSettings}
              onUpdateClubSettings={onUpdateClubSettings}
              handleSyncFFBB={handleSyncFFBB}
              isSyncingFFBB={isSyncingFFBB}
              setFilterToCurrentWeekend={setFilterToCurrentWeekend}
              syncStartDate={syncStartDate}
              syncEndDate={syncEndDate}
              setSyncStartDate={setSyncStartDate}
              setSyncEndDate={setSyncEndDate}
              syncMessage={syncMessage}
              syncIsError={syncIsError}
              setActiveTab={setActiveTab}
              onOpenVisualExporter={onOpenVisualExporter}
              matches={matches}
              ffbbTeams={ffbbTeams}
              handleTrackAllTeams={handleTrackAllTeams}
              handleUntrackAllTeams={handleUntrackAllTeams}
              handleToggleTrackTeam={handleToggleTrackTeam}
              handleUpdateTeamCustomName={handleUpdateTeamCustomName}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 9: GUIDE FULLY KIOSK BROWSER */}
          {/* ========================================================================= */}
          {activeTab === 'fullykiosk' && (
            <FullykioskTab
            />
          )}
        </div>
      </div>

    </div>
  );
};
