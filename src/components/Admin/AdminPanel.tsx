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
  FFBBTeamItem,
} from '../../types';
import { isMatchLive, isMatchWin, isClubHomeMatch, getMatchOurAndOpponentScores } from '../../utils/matchStatus';
import { isVideoMedia } from '../../utils/mediaUtils';
import { FFBBService, isTeamCategoryIgnored, normalizeCategoryKey } from '../../services/ffbbService';
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
import { VisualExporterModal } from '../VisualExporterModal';


const formatDateToEuropean = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleaned = dateStr.trim();
  
  // Try to match YYYY-MM-DD format
  const yyyymmdd = cleaned.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (yyyymmdd) {
    return `${yyyymmdd[3]}/${yyyymmdd[2]}/${yyyymmdd[1]}`;
  }

  // Try to match DD-MM-YYYY or DD/MM/YYYY
  const dd_mm_yyyy = cleaned.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dd_mm_yyyy) {
    return `${dd_mm_yyyy[1]}/${dd_mm_yyyy[2]}/${dd_mm_yyyy[3]}`;
  }

  return cleaned;
};


const DEFAULT_REAL_FFBB_TEAMS: FFBBTeamItem[] = [
  {
    id: 'team-200000005335541',
    name: 'Seniors Filles 1',
    category: 'Seniors F1',
    gender: 'F',
    competition: 'Départementale féminine seniors - Division 3',
    poule: 'Poule C',
    pouleId: '200000003054576',
    matchesCount: 22,
    status: 'active',
  },
  {
    id: 'team-200000005335759',
    name: 'Seniors Garçons 1',
    category: 'Seniors M1',
    gender: 'M',
    competition: 'Départementale masculine seniors - Division 4',
    poule: 'Poule E',
    pouleId: '200000003054623',
    matchesCount: 16,
    status: 'active',
  },
  {
    id: 'team-200000005361201',
    name: 'U18 Filles 1',
    category: 'U18 F1',
    gender: 'F',
    competition: 'Départementale féminine U18 - Division 3',
    poule: 'Poule D',
    pouleId: '200000003058138',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005360595',
    name: 'U18 Garçons 1',
    category: 'U18 M1',
    gender: 'M',
    competition: 'Départementale masculine U18 - Division 3',
    poule: 'Poule D',
    pouleId: '200000003058058',
    matchesCount: 4,
    status: 'active',
  },
  {
    id: 'team-200000005361338',
    name: 'U15 Filles 1',
    category: 'U15 F1',
    gender: 'F',
    competition: 'Départementale féminine U15 - Division 3',
    poule: 'Poule D',
    pouleId: '200000003058157',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005360457',
    name: 'U13 Garçons 1',
    category: 'U13 M1',
    gender: 'M',
    competition: 'Départementale masculine U13 - Division 3',
    poule: 'Poule F',
    pouleId: '200000003058036',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005360524',
    name: 'U13 Filles 1',
    category: 'U13 F1',
    gender: 'F',
    competition: 'Départementale féminine U13 - Division 3',
    poule: 'Poule F',
    pouleId: '200000003058047',
    matchesCount: 8,
    status: 'active',
  },
  {
    id: 'team-200000005360525',
    name: 'U13 Filles 2',
    category: 'U13 F2',
    gender: 'F',
    competition: 'Départementale féminine U13 - Division 3',
    poule: 'Poule F',
    pouleId: '200000003058048',
    matchesCount: 8,
    status: 'active',
  },
  {
    id: 'team-200000005363537',
    name: 'U11 Filles 1',
    category: 'U11 F1',
    gender: 'F',
    competition: 'Départementale féminine U11 - Division 3',
    poule: 'Poule E',
    pouleId: '200000003058517',
    matchesCount: 5,
    status: 'active',
  },
  {
    id: 'team-200000005363354',
    name: 'U11 Garçons 1',
    category: 'U11 M1',
    gender: 'M',
    competition: 'Départementale masculine U11 - Division 3',
    poule: 'Poule F',
    pouleId: '200000003058489',
    matchesCount: 5,
    status: 'active',
  },
];

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
  teamVisuals: TeamVisualItem[];
  onUpdateTeamVisuals: (newVisuals: TeamVisualItem[]) => void;
  visualTemplates: VisualTemplatesConfig;
  onUpdateVisualTemplates: (newTemplates: VisualTemplatesConfig) => void;
  activeAlerts: ActiveMatchAlert[];
  onAddAlert: (alert: ActiveMatchAlert) => void;
  onRemoveAlert: (alertId: string) => void;
  onSwitchToTvMode: () => void;
  onOpenVisualExporter?: (type: 'matches' | 'results' | 'victory' | 'defeat') => void;
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
  teamVisuals,
  onUpdateTeamVisuals,
  visualTemplates,
  onUpdateVisualTemplates,
  activeAlerts,
  onAddAlert,
  onRemoveAlert,
  onSwitchToTvMode,
  onOpenVisualExporter,
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

  const [imageBankSubTab, setImageBankSubTab] = useState<'photos' | 'sponsors' | 'logos' | 'events' | 'team_visuals'>('photos');

  const [selectedFolderCategory, setSelectedFolderCategory] = useState<'photos' | 'sponsors' | 'events' | 'opponent_logos'>('photos');
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  // Sous-onglets par catégorie pour intégrer directement le Studio Calques sur place
  const [matchesSubTab, setMatchesSubTab] = useState<'list' | 'calques'>('list');
  const [resultsSubTab, setResultsSubTab] = useState<'list' | 'calques'>('list');
  const [birthdaysSubTab, setBirthdaysSubTab] = useState<'list' | 'calques'>('list');



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
  const [ffbbTeams, setFfbbTeams] = useState<FFBBTeamItem[]>(() => {
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

  // Telegram Simulator State
  const [telegramSimText, setTelegramSimText] = useState<string>('Victoire Seniors 1 82-74');
  const [telegramSimResponse, setTelegramSimResponse] = useState<string | null>(null);
  const [telegramSimLoading, setTelegramSimLoading] = useState<boolean>(false);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [telegramBotToken, setTelegramBotToken] = useState<string>('');

  // Excel & Birthday parsing/editing state
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState<string | null>(null);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [birthdayWeekOffset, setBirthdayWeekOffset] = useState<number>(0);
  const [allMembersPool, setAllMembersPool] = useState<BirthdayItem[]>(() => {
    try {
      const saved = localStorage.getItem('club_all_members_pool');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });
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
      const activeMatches = socialOnlySelectedMatches
        ? matches.filter((m) => m.selectedForWeekend !== false)
        : matches;

      if (targetPlatform === 'all') {
        const [resInsta, resTikTok, resFB] = await Promise.all([
          fetch('/api/generate-caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'instagram',
              type: socialContentType,
              matches: activeMatches,
              results,
              clubName: clubSettings.name || clubSettings.shortName || 'Notre Club',
              shortClub: clubSettings.shortName || 'BCVS',
              gymnasium: clubSettings.gymnasiumDefault || 'Gymnase du Club',
              tone: aiTone,
              extraContext: aiExtraContext.trim(),
            }),
          }).then((r) => r.json()).catch(() => null),

          fetch('/api/generate-caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'tiktok',
              type: socialContentType,
              matches: activeMatches,
              results,
              clubName: clubSettings.name || clubSettings.shortName || 'Notre Club',
              shortClub: clubSettings.shortName || 'BCVS',
              gymnasium: clubSettings.gymnasiumDefault || 'Gymnase du Club',
              tone: aiTone,
              extraContext: aiExtraContext.trim(),
            }),
          }).then((r) => r.json()).catch(() => null),

          fetch('/api/generate-caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: 'facebook',
              type: socialContentType,
              matches: activeMatches,
              results,
              clubName: clubSettings.name || clubSettings.shortName || 'Notre Club',
              shortClub: clubSettings.shortName || 'BCVS',
              gymnasium: clubSettings.gymnasiumDefault || 'Gymnase du Club',
              tone: aiTone,
              extraContext: aiExtraContext.trim(),
            }),
          }).then((r) => r.json()).catch(() => null),
        ]);

        setAiCustomCaptions({
          instagram: resInsta?.caption || undefined,
          tiktok: resTikTok?.caption || undefined,
          facebook: resFB?.caption || undefined,
        });
      } else {
        const res = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: targetPlatform,
            type: socialContentType,
            matches: activeMatches,
            results,
            clubName: clubSettings.name || clubSettings.shortName || 'Notre Club',
            shortClub: clubSettings.shortName || 'BCVS',
            gymnasium: clubSettings.gymnasiumDefault || 'Gymnase du Club',
            tone: aiTone,
            extraContext: aiExtraContext.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.caption) {
          setAiCustomCaptions((prev) => ({ ...prev, [targetPlatform]: data.caption }));
        }
      }
    } catch (err) {
      console.error('Erreur génération IA:', err);
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
          shortClub: clubSettings.shortName || 'BCVS',
          gymnasium: clubSettings.gymnasiumDefault || 'Gymnase du Club',
          tone: aiTone,
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
    setAiCustomCaptions((prev) => {
      const next = { ...prev };
      if (platform === 'all' || platform === 'instagram') next.instagram = customRewriteOutput;
      if (platform === 'all' || platform === 'tiktok') next.tiktok = customRewriteOutput;
      if (platform === 'all' || platform === 'facebook') next.facebook = customRewriteOutput;
      return next;
    });
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
      city: clubSettings.city || 'La Clayette',
      status: 'upcoming',
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
    onUpdateResults(results.map((r) => (r.id === updated.id ? updated : r)));
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

    // 1. Prioritize direct server upload
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

    // 2. Safe local fallback
    return new Promise((resolve) => {
      // For videos, use blob URL to avoid huge base64 strings in memory
      if (isVideo) {
        try {
          const blobUrl = URL.createObjectURL(file);
          resolve({ url: blobUrl, isVideo: true, fileName: file.name });
          return;
        } catch {
          // fallback
        }
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          url: (e.target?.result as string) || '',
          isVideo,
          fileName: file.name,
        });
      };
      reader.onerror = () => {
        resolve({
          url: URL.createObjectURL(file),
          isVideo,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
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

    // 1. Try batch upload API
    try {
      const formData = new FormData();
      fileArray.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/upload-multiple', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.files) && data.files.length > 0) {
          return data.files.map((df: any) => ({
            url: df.url,
            isVideo: df.mediaType === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(df.fileName),
            fileName: df.fileName,
          }));
        }
      }
    } catch (err) {
      console.warn('Upload multiple via API indisponible, bascule par fichier:', err);
    }

    // 2. Fallback: upload one by one
    const results: Array<{ url: string; isVideo: boolean; fileName: string }> = [];
    for (const f of fileArray) {
      const single = await uploadSingleFile(f);
      results.push(single);
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
    const customImg = isWin ? team.winVisualUrl : team.lossVisualUrl;
    const alert: ActiveMatchAlert = {
      id: 'alert-' + Date.now(),
      team: team.teamName,
      isWin,
      ourScore: isWin ? Math.max(ourScore, oppScore) : Math.min(ourScore, oppScore),
      opponentScore: isWin ? Math.min(ourScore, oppScore) : Math.max(ourScore, oppScore),
      opponent: 'Adversaire',
      customImageUrl: customImg,
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
          tv.teamName.toLowerCase().includes(data.parsed.team.toLowerCase()) ||
          tv.shortAliases.some((alias) => data.parsed.team.toLowerCase().includes(alias.toLowerCase()))
        );

        if (teamMatch) {
          data.alert.customImageUrl = data.alert.isWin ? teamMatch.winVisualUrl : teamMatch.lossVisualUrl;
        }

        onAddAlert(data.alert);
        setTelegramSimResponse(data.confirmationMessage || 'Message Telegram traité avec succès !');
      } else {
        setTelegramSimResponse('Erreur lors du traitement du message');
      }
    } catch (e) {
      console.error(e);
      setTelegramSimResponse('Erreur de connexion au serveur API');
    } finally {
      setTelegramSimLoading(false);
    }
  };

  // Copy Webhook URL
  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/telegram-webhook` : '/api/telegram-webhook';
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
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
    const club = clubSettings.shortName || clubSettings.name || 'SRC Basket';
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

    const allOpponents = Array.from(
      new Set(
        [...targetMatches, ...targetResults]
          .map((m) => (m.isHomeMatch ? m.teamAway : m.teamHome))
          .filter(
            (name) =>
              name &&
              name.trim().length > 1 &&
              !name.toLowerCase().includes('clayette') &&
              !name.toLowerCase().includes('src basket')
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

        // Marquer comme sélectionnés pour la TV les matchs qui tombent dans la période du calendrier si spécifiée
        if (syncStartDate || syncEndDate) {
          allSeasonMatches = allSeasonMatches.map((m) => {
            const inRange =
              (!syncStartDate || m.date >= syncStartDate) &&
              (!syncEndDate || m.date <= syncEndDate);
            return {
              ...m,
              selectedForWeekend: inRange,
            };
          });
        }

        // Marquer comme sélectionnés pour la TV les résultats qui tombent dans la période du calendrier si spécifiée
        if (resultsStartDate || resultsEndDate) {
          allSeasonResults = allSeasonResults.map((r) => {
            const inRange =
              (!resultsStartDate || (r.date && r.date >= resultsStartDate)) &&
              (!resultsEndDate || (r.date && r.date <= resultsEndDate));
            return {
              ...r,
              selectedForWeekend: inRange,
            };
          });
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

        onUpdateMatches(allSeasonMatches);
        onUpdateResults(allSeasonResults);

        // Si l'option d'auto-récupération des logos adverses est cochée, lancer la recherche en arrière-plan
        if (autoFetchOpponentLogos) {
          handleFetchOpponentLogos(allSeasonMatches, allSeasonResults);
        }

        if (res.clubInfo?.teamsList && res.clubInfo.teamsList.length > 0) {
          setFfbbTeams(res.clubInfo.teamsList);
          try {
            localStorage.setItem('ffbb_club_teams_cache', JSON.stringify(res.clubInfo.teamsList));
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
        setAllMembersPool(result.allMembers);
        try {
          localStorage.setItem('club_all_members_pool', JSON.stringify(result.allMembers));
        } catch (e) {}

        const filtered = filterAndSortBirthdaysForWeek(result.allMembers, new Date(), birthdayWeekOffset);
        onUpdateBirthdays(filtered);

        const bounds = getWeekBounds(new Date(), birthdayWeekOffset);
        setExcelSuccessMsg(
          `Fichier ${file.name} importé avec succès (${result.allMembers.length} licenciés trouvés). ${filtered.length} anniversaire(s) sélectionné(s) pour la ${bounds.shortLabel} !`
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
    if (allMembersPool.length > 0) {
      const filtered = filterAndSortBirthdaysForWeek(allMembersPool, new Date(), offset);
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
    onUpdateBirthdays(updatedBirthdays);

    if (allMembersPool.length > 0) {
      const updatedPool = sortBirthdaysByHierarchy(updateList(allMembersPool));
      setAllMembersPool(updatedPool);
      try {
        localStorage.setItem('club_all_members_pool', JSON.stringify(updatedPool));
      } catch (e) {}
    }

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
    onUpdateBirthdays(nextList);

    const nextPool = sortBirthdaysByHierarchy([newItem, ...allMembersPool]);
    setAllMembersPool(nextPool);
    try {
      localStorage.setItem('club_all_members_pool', JSON.stringify(nextPool));
    } catch (e) {}

    setManualBdayFirstName('');
    setManualBdayCategory('U15');
    setManualBdayDate('');
    setIsAddingManualBday(false);
  };

  const handleDeleteBirthday = (id: string) => {
    const nextList = birthdays.filter((b) => b.id !== id);
    onUpdateBirthdays(nextList);
    if (allMembersPool.length > 0) {
      const nextPool = allMembersPool.filter((b) => b.id !== id);
      setAllMembersPool(nextPool);
      try {
        localStorage.setItem('club_all_members_pool', JSON.stringify(nextPool));
      } catch (e) {}
    }
  };

  // Social Caption Generator Helper
  const getSocialCaption = (platform: 'instagram' | 'tiktok' | 'facebook', type: 'matches' | 'results') => {
    if (aiCustomCaptions[platform]) {
      return aiCustomCaptions[platform]!;
    }

    const clubName = String(clubSettings?.name || clubSettings?.shortName || 'Notre Club').trim();
    const shortClub = String(clubSettings?.shortName || clubSettings?.name || 'SRC Basket').trim();
    const gym = String(clubSettings?.gymnasiumDefault || 'Gymnase').trim();
    const insta = socialForm.instagramHandle || clubSettings?.instagramHandle || '@src_basket';
    const fb = socialForm.facebookPage || clubSettings?.facebookPage || 'SRC Basket';
    const tiktok = socialForm.tiktokHandle || clubSettings?.tiktokHandle || '@src_basket';

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

          <button
            type="button"
            onClick={handleDismissIdentityProposal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors self-end sm:self-auto"
            title="Ignorer la proposition"
          >
            <X className="w-4 h-4" />
          </button>
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
            {/* Quick Keyboard shortcuts badge on desktop */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">F</span> Plein écran
              <span className="text-slate-600">•</span>
              <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">C</span> Switch TV
            </div>

            {onOpenVisualExporter && (
              <button
                onClick={() => onOpenVisualExporter(socialContentType)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
                title="Ouvrir le Studio Visuel & Passerelle Réseaux (Instagram, TikTok, Facebook)"
                id="btn-header-social-exporter"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Passerelle Réseaux</span>
              </button>
            )}

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
            <div className="space-y-6">
              {/* Barre de sous-onglets : Matchs vs Studio Calques */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMatchesSubTab('list')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      matchesSubTab === 'list'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 ring-1 ring-orange-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span>Matchs & Calendrier ({matches.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMatchesSubTab('calques')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      matchesSubTab === 'calques'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>🎨 Design & Studio Calques Matchs</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 hidden sm:inline-block pr-2 font-medium">
                  {matchesSubTab === 'list' ? 'Saisie & Import FFBB des rencontres' : 'Fond, mascottes & visuels 16:9 de cette diapositive'}
                </span>
              </div>

              {matchesSubTab === 'calques' ? (
                <StudioGraphiqueWorkbench
                  visualTemplates={visualTemplates}
                  onUpdateVisualTemplates={onUpdateVisualTemplates}
                  matches={matches}
                  results={results}
                  birthdays={birthdays}
                  clubSettings={clubSettings}
                  defaultCategory="matches"
                  hideCategorySelector={true}
                  onNavigateToCategoryTab={() => setMatchesSubTab('list')}
                />
              ) : (
                <>
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>PROGRAMME DES MATCHS DU WEEK-END ({matches.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ces rencontres sont affichées dans la boucle TV et exportables sur Instagram/TikTok/Facebook.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMatchesSubTab('calques')}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Régler le fond & les calques de la diapositive</span>
                  </button>
                </div>

                {/* Widget de Filtrage Instantané par Calendrier & Synchronisation FFBB */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mt-2 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                        Filtrage instantané par date (En mémoire • Sans recharger FFBB)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowCalendarInMatches(!showCalendarInMatches)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Calendar className="w-3 h-3 text-orange-400" />
                        <span>{showCalendarInMatches ? 'Masquer le calendrier' : 'Afficher le calendrier'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={setFilterToCurrentWeekend}
                        className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/35 text-orange-300 border border-orange-500/30 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        🔥 Ce week-end
                      </button>
                      {(syncStartDate || syncEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSyncStartDate('');
                            setSyncEndDate('');
                            setMatchesFilterMode('all');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium transition-all cursor-pointer"
                        >
                          Voir toute la saison
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calendrier visuel interactif : filtrage 100% instantané en mémoire */}
                  {showCalendarInMatches ? (
                    <div className="flex flex-col md:flex-row items-stretch gap-4 pt-1">
                      <div className="shrink-0 flex justify-center">
                        <MiniCalendarPicker
                          startDate={syncStartDate}
                          endDate={syncEndDate}
                          onChangeRange={(start, end) => {
                            setSyncStartDate(start);
                            setSyncEndDate(end);
                            if (start || end) {
                              setMatchesFilterMode('range');
                            }
                          }}
                          title="Sélectionner les dates à afficher"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                              Filtre actif :
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                              {
                                (syncStartDate || syncEndDate
                                  ? matches.filter((m) => (!syncStartDate || m.date >= syncStartDate) && (!syncEndDate || m.date <= syncEndDate))
                                  : matches
                                ).length
                              } match(s) trouvé(s)
                            </span>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            {syncStartDate && syncEndDate ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-orange-400 block">
                                  Du {formatDateToReadableFrench(syncStartDate)}
                                </span>
                                <span className="text-xs font-bold text-orange-400 block">
                                  Au {formatDateToReadableFrench(syncEndDate)}
                                </span>
                              </div>
                            ) : syncStartDate ? (
                              <span className="text-xs font-bold text-orange-400">
                                À partir du {formatDateToReadableFrench(syncStartDate)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Aucun filtre : toute la saison ({matches.length} matchs) est affichée.
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            💡 <strong>Cliquez simplement sur une date du calendrier</strong> : le filtre s'applique instantanément sur la base sans aucun chargement réseau.
                          </p>
                        </div>

                        {/* Actions directes sur la sélection filtrée */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/80">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const list = (syncStartDate || syncEndDate)
                                  ? matches.filter((m) => (!syncStartDate || m.date >= syncStartDate) && (!syncEndDate || m.date <= syncEndDate))
                                  : matches;
                                handleSelectOnlyFilteredMatchesForTV(list);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                              title="Coche uniquement les matchs de cette période pour la boucle TV et décoche les autres"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Cocher cette période pour la TV</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleSyncFFBB}
                              disabled={isSyncingFFBB}
                              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                              title="Utile si une nouvelle phase (Phase 2, Phase 3 jeunes) a débuté ou si des horaires ont été modifiés sur la FFBB"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                              <span>Actualiser depuis FFBB</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Vue compacte si le calendrier est replié */
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        <span>
                          {syncStartDate && syncEndDate ? (
                            <>Période filtrée : <strong>{formatDateToReadableFrench(syncStartDate)}</strong> au <strong>{formatDateToReadableFrench(syncEndDate)}</strong></>
                          ) : (
                            <span className="text-slate-400 italic">Aucune période filtrée (Toute la saison : {matches.length} matchs)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const list = (syncStartDate || syncEndDate)
                              ? matches.filter((m) => (!syncStartDate || m.date >= syncStartDate) && (!syncEndDate || m.date <= syncEndDate))
                              : matches;
                            handleSelectOnlyFilteredMatchesForTV(list);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                        >
                          Cocher pour la TV
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFetchOpponentLogos()}
                          disabled={isFetchingOpponentLogos}
                          className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/35 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Rechercher et télécharger automatiquement les logos officiels FFBB des équipes adverses"
                        >
                          <Search className={`w-3.5 h-3.5 text-sky-400 ${isFetchingOpponentLogos ? 'animate-spin' : ''}`} />
                          <span>{isFetchingOpponentLogos ? 'Recherche logos...' : 'Logos adverses (FFBB)'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCalendarInMatches(true)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                        >
                          Ouvrir le calendrier
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncFFBB}
                          disabled={isSyncingFFBB}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          title="Actualiser la base avec la FFBB (utile pour les nouvelles phases)"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                          <span>Actualiser FFBB</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={autoFetchOpponentLogos}
                        onChange={(e) => setAutoFetchOpponentLogos(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                      />
                      <span>Récupérer automatiquement les logos officiels FFBB des clubs adverses à chaque synchronisation</span>
                    </label>
                  </div>

                  {syncMessage && (
                    <p className={`text-[11px] font-medium p-2.5 rounded-xl border ${
                      syncIsError
                        ? 'text-red-400 bg-red-950/40 border-red-500/20'
                        : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20'
                    }`}>
                      {syncIsError ? '⚠ ' : '✓ '}{syncMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Barre d'action et sélection des matchs pour le week-end */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase font-bebas tracking-wide">
                        SÉLECTION DES MATCHS DU WEEK-END
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono">
                        {matches.filter((m) => m.selectedForWeekend !== false).length} / {matches.length} cochés pour la TV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cochez ou décochez les matchs à diffuser sur l'écran TV et les réseaux sociaux ce week-end.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSocialOnlySelectedMatches(true);
                      setActiveTab('social');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-pink-600/20"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Passerelle Réseaux ({matches.filter((m) => m.selectedForWeekend !== false).length} cochés)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMatches(matches.map((m) => ({ ...m, selectedForWeekend: true })))}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold transition-all"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMatches(matches.map((m) => ({ ...m, selectedForWeekend: false })))}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold transition-all"
                  >
                    Tout décocher
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMatches(matches.map((m) => ({ ...m, selectedForWeekend: m.isHomeMatch })))}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 font-bold transition-all"
                  >
                    Domicile uniquement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddManualMatch(!showAddManualMatch)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un match</span>
                  </button>
                </div>
              </div>

              {/* Formulaire manuel d'ajout de match avec Sélecteur de date Calendrier */}
              {showAddManualMatch && (
                <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-sm font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-400" />
                      <span>AJOUTER UNE RENCONTRE MANUELLE</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddManualMatch(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Catégorie :</label>
                      <input
                        type="text"
                        placeholder="Ex: Seniors Garçons 1"
                        value={newMatchCategory}
                        onChange={(e) => setNewMatchCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Adversaire :</label>
                      <input
                        type="text"
                        placeholder="Ex: Basket Club Mâcon"
                        value={newMatchOpponent}
                        onChange={(e) => setNewMatchOpponent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Date du match :</label>
                      <SingleDatePicker
                        value={newMatchDate}
                        onChange={(french, iso) => setNewMatchDate(french || iso)}
                        placeholder="Choisir la date..."
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Heure :</label>
                      <input
                        type="time"
                        value={newMatchTime}
                        onChange={(e) => setNewMatchTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-bold">Lieu :</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewMatchIsHome(true)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            newMatchIsHome
                              ? 'bg-orange-600 text-white shadow-md'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          Domicile
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewMatchIsHome(false)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            !newMatchIsHome
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          Extérieur
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleAddMatchManual();
                        setShowAddManualMatch(false);
                      }}
                      disabled={!newMatchOpponent.trim()}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer la rencontre</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Barre d'action & Filtre d'affichage des matchs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2 font-bold text-slate-300">
                  <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Afficher dans la liste :</span>
                  <button
                    type="button"
                    onClick={() => setMatchesFilterMode('all')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      matchesFilterMode === 'all'
                        ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Toute la saison ({matches.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchesFilterMode('range')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      matchesFilterMode === 'range'
                        ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Période du calendrier ({
                      syncStartDate || syncEndDate
                        ? matches.filter(
                            (m) =>
                              (!syncStartDate || m.date >= syncStartDate) &&
                              (!syncEndDate || m.date <= syncEndDate)
                          ).length
                        : matches.length
                    })
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = matches.map((item) => ({ ...item, selectedForWeekend: true }));
                      onUpdateMatches(updated);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer"
                    title="Cocher tous les matchs affichés pour la diffusion TV"
                  >
                    ✓ Tout cocher pour la TV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = matches.map((item) => ({ ...item, selectedForWeekend: false }));
                      onUpdateMatches(updated);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-all cursor-pointer"
                    title="Décocher tous les matchs"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>

              {/* Liste des matchs */}
              {matches.filter((m) => {
                if (matchesFilterMode === 'range' && (syncStartDate || syncEndDate)) {
                  if (syncStartDate && m.date < syncStartDate) return false;
                  if (syncEndDate && m.date > syncEndDate) return false;
                }
                return true;
              }).length === 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                  <Calendar className="w-7 h-7 text-slate-500 mx-auto opacity-60" />
                  <p className="text-xs font-bold text-slate-300">
                    {matches.length === 0
                      ? 'Aucune rencontre dans la base de données.'
                      : `Aucune rencontre trouvée pour la période sélectionnée (${formatDateToReadableFrench(syncStartDate)} au ${formatDateToReadableFrench(syncEndDate)}).`}
                  </p>
                  {matches.length > 0 && (
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSyncStartDate('');
                          setSyncEndDate('');
                          setMatchesFilterMode('all');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        Afficher toute la saison ({matches.length} matchs)
                      </button>
                      <button
                        type="button"
                        onClick={setFilterToCurrentWeekend}
                        className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Voir ce week-end
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matches
                  .filter((m) => {
                    if (matchesFilterMode === 'range' && (syncStartDate || syncEndDate)) {
                      if (syncStartDate && m.date < syncStartDate) return false;
                      if (syncEndDate && m.date > syncEndDate) return false;
                    }
                    return true;
                  })
                  .map((m) => {
                  const isEditing = editingMatch?.id === m.id;
                  const isSelected = m.selectedForWeekend !== false;
                  const isLive = isMatchLive(m);
                  const isPastOrFinished =
                    m.status === 'finished' || (m.date && m.date < new Date().toISOString().slice(0, 10));
                  const isNeedsResult =
                    isPastOrFinished && m.homeScore === undefined && m.awayScore === undefined && !m.result;

                  if (isEditing && editingMatch) {
                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-2xl bg-slate-900 border-2 border-orange-500/60 shadow-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-orange-400 font-mono">
                            MODIFIER LA RENCONTRE
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {m.teamHome} vs {m.teamAway}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Date :</label>
                            <SingleDatePicker
                              value={editingMatch.date}
                              onChange={(french, iso) => setEditingMatch({ ...editingMatch, date: french || iso })}
                              placeholder="Choisir la date..."
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Heure :</label>
                            <input
                              type="text"
                              value={editingMatch.time || ''}
                              onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })}
                              placeholder="ex: 14:30 ou Horaire à fixer"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Catégorie :</label>
                            <input
                              type="text"
                              value={editingMatch.category}
                              onChange={(e) => setEditingMatch({ ...editingMatch, category: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                              placeholder="ex: U18 F1, U18 M1"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Gymnase / Salle :</label>
                            <input
                              type="text"
                              value={editingMatch.gymnasium || ''}
                              onChange={(e) => setEditingMatch({ ...editingMatch, gymnasium: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                              placeholder="ex: COSEC"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Statut du match :</label>
                            <select
                              value={editingMatch.status || 'upcoming'}
                              onChange={(e) => setEditingMatch({ ...editingMatch, status: e.target.value as MatchStatus })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-bold"
                            >
                              <option value="upcoming">À venir (Passe en cours à l'heure du match)</option>
                              <option value="live">🔴 En cours (Direct)</option>
                              <option value="finished">✅ Terminé</option>
                            </select>
                          </div>
                          {(editingMatch.status === 'live' || editingMatch.status === 'finished') && (
                            <div className="col-span-2 grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                              <div>
                                <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Score Domicile :</label>
                                <input
                                  type="number"
                                  value={editingMatch.homeScore ?? ''}
                                  onChange={(e) => setEditingMatch({ ...editingMatch, homeScore: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                                  placeholder="Score Domicile"
                                />
                              </div>
                              <div>
                                <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Score Extérieur :</label>
                                <input
                                  type="number"
                                  value={editingMatch.awayScore ?? ''}
                                  onChange={(e) => setEditingMatch({ ...editingMatch, awayScore: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                                  placeholder="Score Extérieur"
                                />
                              </div>
                            </div>
                          )}
                          <div className="col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                              <input
                                type="checkbox"
                                checked={editingMatch.selectedForWeekend !== false}
                                onChange={(e) => setEditingMatch({ ...editingMatch, selectedForWeekend: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                              />
                              <span>Diffuser cette rencontre sur l'écran TV ce week-end</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                          <button
                            onClick={() => setEditingMatch(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => {
                              onUpdateMatches(matches.map((item) => (item.id === editingMatch.id ? editingMatch : item)));
                              setEditingMatch(null);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Enregistrer</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border flex flex-col gap-3 transition-all ${
                        isLive
                          ? 'bg-red-950/20 border-red-500/50 shadow-md shadow-red-950/20'
                          : isNeedsResult
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                          : isSelected
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 min-w-0">
                        {/* Checkbox pour choisir d'afficher ou non le match ce week-end */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = matches.map((item) =>
                              item.id === m.id ? { ...item, selectedForWeekend: !isSelected } : item
                            );
                            onUpdateMatches(updated);
                          }}
                          className={`shrink-0 p-2 sm:px-3 sm:py-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10'
                              : 'bg-slate-900/90 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                          }`}
                          title={
                            isSelected
                              ? 'Match coché pour la TV du week-end (cliquer pour masquer)'
                              : 'Match masqué de la TV (cliquer pour cocher et afficher)'
                          }
                        >
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="hidden sm:inline font-mono text-[11px]">
                            {isSelected ? 'Ce week-end' : 'Masqué'}
                          </span>
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs font-bold mb-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono text-[11px] font-bold">
                              {m.category}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-300 font-mono">{formatDateToEuropean(m.date)} - {m.time}</span>
                            {isLive && (
                              <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                EN COURS
                              </span>
                            )}
                            {isNeedsResult && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-[10px] font-bold animate-pulse flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                                En attente du résultat
                              </span>
                            )}
                            {m.competition && (
                              <>
                                <span className="text-slate-600 hidden sm:inline">•</span>
                                <span className="text-[10px] text-slate-500 truncate max-w-[170px] hidden sm:inline" title={m.competition}>
                                  {m.competition}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-sm font-bold text-white truncate">
                            {m.teamHome} vs {m.teamAway}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            📍 {m.gymnasium || clubSettings.gymnasiumDefault}
                            {m.poule && <span className="text-orange-400/80 ml-2 font-medium">({m.poule})</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingMatch({ ...m })}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 transition-all"
                            title="Modifier la rencontre"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateMatches(matches.filter((item) => item.id !== m.id))}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 transition-all"
                            title="Supprimer la rencontre"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Actions Rapides en 1 Clic : Victoire / Défaite / Saisir le Score */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Résultat direct :
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleQuickMatchOutcome(m, 'win')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Enregistrer une Victoire en 1 clic et transférer dans Résultats"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Victoire</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickMatchOutcome(m, 'loss')}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Enregistrer une Défaite en 1 clic et transférer dans Résultats"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Défaite</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (quickScoreMatchId === m.id) {
                                setQuickScoreMatchId(null);
                              } else {
                                setQuickScoreMatchId(m.id);
                                setQuickHomeScore(m.homeScore?.toString() || '');
                                setQuickAwayScore(m.awayScore?.toString() || '');
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              quickScoreMatchId === m.id
                                ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                            title="Saisir un score numérique (ex: 78 - 65)"
                          >
                            <span className="font-mono font-black text-sky-400">#</span>
                            <span>Score</span>
                          </button>
                        </div>
                      </div>

                      {/* Popover / Formulaire Inline pour Saisie Rapide du Score */}
                      {quickScoreMatchId === m.id && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-sky-500/50 space-y-2.5 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                            <span>🔢 Saisie du score final chiffré :</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Saisissez les points puis validez pour envoyer dans Résultats
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-slate-300 block mb-1 font-bold truncate">
                                {m.teamHome} (Dom.)
                              </label>
                              <input
                                type="number"
                                value={quickHomeScore}
                                onChange={(e) => setQuickHomeScore(e.target.value)}
                                placeholder="ex: 78"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:border-sky-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-300 block mb-1 font-bold truncate">
                                {m.teamAway} (Ext.)
                              </label>
                              <input
                                type="number"
                                value={quickAwayScore}
                                onChange={(e) => setQuickAwayScore(e.target.value)}
                                placeholder="ex: 65"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:border-sky-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setQuickScoreMatchId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              disabled={!quickHomeScore.trim() || !quickAwayScore.trim()}
                              onClick={() => {
                                const h = parseInt(quickHomeScore, 10);
                                const a = parseInt(quickAwayScore, 10);
                                if (!isNaN(h) && !isNaN(a)) {
                                  handleQuickMatchOutcome(m, 'score', { homeScore: h, awayScore: a });
                                  setQuickScoreMatchId(null);
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Valider & Transférer dans Résultats</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: RÉSULTATS DU WEEK-END */}
          {/* ========================================================================= */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              {/* Barre de sous-onglets : Résultats vs Studio Calques */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResultsSubTab('list')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      resultsSubTab === 'list'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <span>Scores & Résultats ({results.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultsSubTab('calques')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      resultsSubTab === 'calques'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>🎨 Design & Studio Calques Résultats</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 hidden sm:inline-block pr-2 font-medium">
                  {resultsSubTab === 'list' ? 'Saisie des scores du week-end' : 'Fond, mascottes de victoire & visuels 16:9'}
                </span>
              </div>

              {resultsSubTab === 'calques' ? (
                <StudioGraphiqueWorkbench
                  visualTemplates={visualTemplates}
                  onUpdateVisualTemplates={onUpdateVisualTemplates}
                  matches={matches}
                  results={results}
                  birthdays={birthdays}
                  clubSettings={clubSettings}
                  defaultCategory="results"
                  hideCategorySelector={true}
                  onNavigateToCategoryTab={() => setResultsSubTab('list')}
                />
              ) : (
                <>
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>PROGRAMME DES RÉSULTATS DU WEEK-END ({results.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ces rencontres sont affichées dans la boucle TV et exportables sur Instagram/TikTok/Facebook.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setResultsSubTab('calques')}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Régler le fond & les calques de la diapositive</span>
                  </button>
                </div>

                {/* Widget de Filtrage Instantané par Calendrier & Synchronisation FFBB */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mt-2 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                        Filtrage instantané par date (En mémoire • Sans recharger FFBB)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowCalendarInResults(!showCalendarInResults)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <Calendar className="w-3 h-3 text-orange-400" />
                        <span>{showCalendarInResults ? 'Masquer le calendrier' : 'Afficher le calendrier'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={setResultsFilterToCurrentWeekend}
                        className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/35 text-orange-300 border border-orange-500/30 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        🔥 Ce week-end
                      </button>
                      <button
                        type="button"
                        onClick={setResultsFilterToLastWeekend}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-bold transition-all cursor-pointer"
                        title="Afficher les résultats du week-end passé"
                      >
                        ⏮️ Week-end passé
                      </button>
                      {(resultsStartDate || resultsEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setResultsStartDate('');
                            setResultsEndDate('');
                            setResultsFilterMode('all');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium transition-all cursor-pointer"
                        >
                          Voir toute la saison
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calendrier visuel interactif : filtrage 100% instantané en mémoire */}
                  {showCalendarInResults ? (
                    <div className="flex flex-col md:flex-row items-stretch gap-4 pt-1">
                      <div className="shrink-0 flex justify-center">
                        <MiniCalendarPicker
                          startDate={resultsStartDate}
                          endDate={resultsEndDate}
                          onChangeRange={(start, end) => {
                            setResultsStartDate(start);
                            setResultsEndDate(end);
                            if (start || end) {
                              setResultsFilterMode('range');
                            }
                          }}
                          title="Sélectionner les dates à afficher"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                              Filtre actif :
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                              {
                                (resultsStartDate || resultsEndDate
                                  ? results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate)))
                                  : results
                                ).length
                              } match(s) trouvé(s)
                            </span>
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            {resultsStartDate && resultsEndDate ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-orange-400 block">
                                  Du {formatDateToReadableFrench(resultsStartDate)}
                                </span>
                                <span className="text-xs font-bold text-orange-400 block">
                                  Au {formatDateToReadableFrench(resultsEndDate)}
                                </span>
                              </div>
                            ) : resultsStartDate ? (
                              <span className="text-xs font-bold text-orange-400">
                                À partir du {formatDateToReadableFrench(resultsStartDate)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Aucun filtre : toute la saison ({results.length} résultats) est affichée.
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            💡 <strong>Cliquez simplement sur une date du calendrier</strong> : le filtre s'applique instantanément sur la base sans aucun chargement réseau.
                          </p>
                        </div>

                        {/* Actions directes sur la sélection filtrée */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/80">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const list = (resultsStartDate || resultsEndDate)
                                  ? results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate)))
                                  : results;
                                handleSelectOnlyFilteredResultsForTV(list);
                              }}
                              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                              title="Coche uniquement les résultats de cette période pour la boucle TV et décoche les autres"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Cocher cette période pour la TV</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleSyncFFBB}
                              disabled={isSyncingFFBB}
                              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                              title="Utile si des scores ont été actualisés sur la FFBB"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                              <span>Actualiser depuis FFBB</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Vue compacte si le calendrier est replié */
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        <span>
                          {resultsStartDate && resultsEndDate ? (
                            <>Période filtrée : <strong>{formatDateToReadableFrench(resultsStartDate)}</strong> au <strong>{formatDateToReadableFrench(resultsEndDate)}</strong></>
                          ) : (
                            <span className="text-slate-400 italic">Aucune période filtrée (Toute la saison : {results.length} résultats)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const list = (resultsStartDate || resultsEndDate)
                              ? results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate)))
                              : results;
                            handleSelectOnlyFilteredResultsForTV(list);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                        >
                          Cocher pour la TV
                        </button>
                        <button
                          type="button"
                          onClick={handleSyncFFBB}
                          disabled={isSyncingFFBB}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                          <span>Actualiser FFBB</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCalendarInResults(true)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          Ouvrir le calendrier
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={autoFetchOpponentLogos}
                        onChange={(e) => setAutoFetchOpponentLogos(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0"
                      />
                      <span>Récupérer automatiquement les logos officiels FFBB des clubs adverses à chaque synchronisation</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Barre d'action et sélection des résultats pour le week-end */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white uppercase font-bebas tracking-wide">
                        SÉLECTION DES RÉSULTATS DU WEEK-END
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold font-mono">
                        {results.filter((r) => r.selectedForWeekend !== false).length} / {results.length} cochés pour la TV
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cochez ou décochez les résultats à diffuser sur l'écran TV et les réseaux sociaux ce week-end.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSocialOnlySelectedMatches(true);
                      setActiveTab('social');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-pink-600/20 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Passerelle Réseaux ({results.filter((r) => r.selectedForWeekend !== false).length} cochés)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateResults(results.map((r) => ({ ...r, selectedForWeekend: true })))}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold transition-all cursor-pointer"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateResults(results.map((r) => ({ ...r, selectedForWeekend: false })))}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold transition-all cursor-pointer"
                  >
                    Tout décocher
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateResults(results.map((r) => ({ ...r, selectedForWeekend: isMatchWin(r, clubSettings.name, clubSettings.shortName) })))}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold transition-all cursor-pointer"
                  >
                    🏆 Victoires uniquement
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateResults(results.map((r) => ({ ...r, selectedForWeekend: isClubHomeMatch(r, clubSettings.name, clubSettings.shortName) })))}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 font-bold transition-all cursor-pointer"
                  >
                    Domicile uniquement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddManualResult(!showAddManualResult)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddManualResult ? 'Masquer la saisie' : 'Ajouter un résultat'}</span>
                  </button>
                </div>
              </div>

              {/* Formulaire et saisie rapide (repliable via showAddManualResult) */}
              {showAddManualResult && (
                <>
                  {/* Raccourci 1 : Pré-remplissage depuis un match programmé du week-end */}
                  {matches.length > 0 && (
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Saisie rapide 1-Clic depuis le calendrier du week-end :</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      Pré-remplit catégorie, adversaire & date
                    </span>
                  </div>

                  <select
                    value={selectedScheduledMatchId}
                    onChange={(e) => handleSelectScheduledMatch(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-amber-400"
                  >
                    <option value="">
                      -- Cliquez ici pour choisir un match programmé (remplissage automatique) --
                    </option>
                    {matches.map((m) => {
                      const opponentName = m.isHomeMatch ? m.teamAway : m.teamHome;
                      const locationLabel = m.isHomeMatch ? '🏠 Domicile' : '🚗 Extérieur';
                      return (
                        <option key={m.id} value={m.id}>
                          [{m.category}] {locationLabel} vs {opponentName} ({formatDateToEuropean(m.date)} - {m.time})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Formulaire de saisie de résultat */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-black text-white font-bebas tracking-wide flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>ENREGISTRER LE SCORE D'UN MATCH</span>
                  </h4>

                  {/* Toggle Domicile / Extérieur */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Lieu :</span>
                    <button
                      type="button"
                      onClick={() => setNewResultIsHome(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        newResultIsHome
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Home className="w-3 h-3" />
                      <span>À Domicile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewResultIsHome(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        !newResultIsHome
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Navigation className="w-3 h-3" />
                      <span>À l'Extérieur</span>
                    </button>
                  </div>
                </div>

                {/* Notifications & Alertes Feedback */}
                {newResultErrorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-semibold">{newResultErrorMsg}</span>
                  </div>
                )}

                {newResultSuccessMsg && (
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{newResultSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 text-xs">
                  
                  {/* 1. Équipe FFBB Synchronisée (MENU DÉROULANT DEMANDÉ) */}
                  <div className="lg:col-span-4 space-y-1.5">
                    <label className="text-slate-300 block font-bold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-orange-400" />
                      <span>Équipe du club (Synchronisée FFBB) :</span>
                    </label>

                    <select
                      value={newResultIsCustomCategory ? '__custom__' : newResultCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setNewResultIsCustomCategory(true);
                          setNewResultCategory('');
                        } else {
                          setNewResultIsCustomCategory(false);
                          setNewResultCategory(val);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-orange-500 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      {availableFfbbTeams.map((t, idx) => (
                        <option key={`${t.name}-${idx}`} value={t.name}>
                          🏀 {t.name} {t.category ? `(${t.category})` : ''}
                        </option>
                      ))}
                      <option value="__custom__">✏️ Autre équipe (Saisie manuelle personnalisée)</option>
                    </select>

                    {newResultIsCustomCategory && (
                      <input
                        type="text"
                        placeholder="Ex: Baby Basket, Anciens, Loisirs..."
                        value={newResultCategory}
                        onChange={(e) => setNewResultCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-orange-500/70 rounded-xl px-3 py-2 text-white mt-1 animate-in fade-in"
                        autoFocus
                      />
                    )}
                  </div>

                  {/* 2. Adversaire */}
                  <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-slate-300 block font-bold">
                      Équipe adverse : <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Basket Club Mâcon"
                      value={newResultOpponent}
                      onChange={(e) => {
                        setNewResultOpponent(e.target.value);
                        if (newResultErrorMsg) setNewResultErrorMsg(null);
                      }}
                      className={`w-full bg-slate-950 border rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none transition-colors ${
                        newResultErrorMsg && !newResultOpponent.trim()
                          ? 'border-rose-500 ring-1 ring-rose-500'
                          : 'border-slate-700 hover:border-slate-600 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* 3. Date du match */}
                  <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-slate-300 block font-bold">Date du match :</label>
                    <SingleDatePicker
                      value={newResultDate}
                      onChange={(french, iso) => setNewResultDate(french || iso)}
                      placeholder="Choisir date..."
                    />
                  </div>

                  {/* Choix du Mode de Saisie du Résultat */}
                  <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-slate-300 block font-bold">Saisie du résultat :</label>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setNewResultMode('score')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                          newResultMode === 'score'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Saisir les scores numériques exacts (ex: 82-74)"
                      >
                        🔢 Score
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewResultMode('status')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                          newResultMode === 'status'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Sélectionner directement Victoire ou Défaite (Sans score)"
                      >
                        🏆 Victoire/Défaite
                      </button>
                    </div>
                  </div>

                  {/* 4. Champs de score OU Boutons Victoire/Défaite */}
                  {newResultMode === 'score' ? (
                    <>
                      {/* Score Notre Club */}
                      <div className="lg:col-span-1.5 space-y-1.5">
                        <label className="text-emerald-400 block font-bold truncate" title="Notre Club">
                          Notre score : <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="82"
                          value={newResultHomeScore}
                          onChange={(e) => {
                            setNewResultHomeScore(e.target.value);
                            if (newResultErrorMsg) setNewResultErrorMsg(null);
                          }}
                          className="w-full bg-slate-950 border border-emerald-500/50 hover:border-emerald-400 focus:border-emerald-400 rounded-xl px-3 py-2.5 text-white font-mono font-black text-base text-center text-emerald-400 focus:outline-none"
                        />
                      </div>

                      {/* Score Adversaire */}
                      <div className="lg:col-span-1.5 space-y-1.5">
                        <label className="text-rose-400 block font-bold truncate" title="Adversaire">
                          Score adv. : <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="74"
                          value={newResultAwayScore}
                          onChange={(e) => {
                            setNewResultAwayScore(e.target.value);
                            if (newResultErrorMsg) setNewResultErrorMsg(null);
                          }}
                          className="w-full bg-slate-950 border border-rose-500/50 hover:border-rose-400 focus:border-rose-400 rounded-xl px-3 py-2.5 text-white font-mono font-black text-base text-center text-rose-400 focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="lg:col-span-3 space-y-1.5">
                      <label className="text-slate-300 block font-bold">Résultat direct :</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewResultStatusOutcome('win')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 ${
                            newResultStatusOutcome === 'win'
                              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                              : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <span>🏆 VICTOIRE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewResultStatusOutcome('loss')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1 ${
                            newResultStatusOutcome === 'loss'
                              ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50'
                              : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <span>❌ DÉFAITE</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Score Live Preview Indicator */}
                {newResultMode === 'score' && newResultHomeScore.trim() !== '' && newResultAwayScore.trim() !== '' && (
                  <div className="pt-2 flex items-center justify-between text-xs font-bold px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Aperçu :</span>
                      <span className="font-mono text-white text-sm">
                        {newResultIsHome
                          ? `${newResultCategory || 'Notre Club'} ${newResultHomeScore} - ${newResultAwayScore} ${newResultOpponent || 'Adversaire'}`
                          : `${newResultOpponent || 'Adversaire'} ${newResultAwayScore} - ${newResultHomeScore} ${newResultCategory || 'Notre Club'}`}
                      </span>
                    </div>

                    <div>
                      {parseInt(newResultHomeScore, 10) > parseInt(newResultAwayScore, 10) ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <span>🏆 Victoire (+{parseInt(newResultHomeScore, 10) - parseInt(newResultAwayScore, 10)} pts)</span>
                        </span>
                      ) : parseInt(newResultHomeScore, 10) < parseInt(newResultAwayScore, 10) ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <span>Défaite (-{parseInt(newResultAwayScore, 10) - parseInt(newResultHomeScore, 10)} pts)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Égalité
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {newResultMode === 'status' && (
                  <div className="pt-2 flex items-center gap-2 text-xs font-bold px-1">
                    <span className="text-slate-400">Aperçu :</span>
                    <span className="text-white">
                      {newResultCategory || 'Notre Club'} vs {newResultOpponent || 'Adversaire'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      newResultStatusOutcome === 'win' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {newResultStatusOutcome === 'win' ? '🏆 VICTOIRE' : '❌ DÉFAITE'}
                    </span>
                  </div>
                )}

                {/* Bouton d'enregistrement */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    💡 <em>Astuce : Vous pouvez aussi cliquer sur le bouton <strong>"Score"</strong> directement depuis la liste des matchs.</em>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddResultManual}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black font-bebas text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
                    id="btn-save-manual-result"
                  >
                    <Trophy className="w-4 h-4 text-emerald-200" />
                    <span>ENREGISTRER CE RÉSULTAT</span>
                  </button>
                </div>
              </div>
              </>
              )}

              {/* Liste des résultats enregistrés */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>
                      {resultsStartDate || resultsEndDate ? (
                        <>Résultats filtrés ({
                          results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate))).length
                        } / {results.length}) :</>
                      ) : (
                        <>Tous les résultats enregistrés ({results.length}) :</>
                      )}
                    </span>
                  </h4>
                  {results.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onUpdateResults([])}
                      className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Effacer tous les résultats
                    </button>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                    <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Aucun résultat enregistré pour le moment.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Sélectionnez une équipe FFBB ci-dessus pour ajouter le score du week-end.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const filteredList = (resultsStartDate || resultsEndDate)
                      ? results.filter((r) => (!resultsStartDate || (r.date && r.date >= resultsStartDate)) && (!resultsEndDate || (r.date && r.date <= resultsEndDate)))
                      : results;

                    if (filteredList.length === 0) {
                      return (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 space-y-2">
                          <Calendar className="w-7 h-7 text-slate-500 mx-auto opacity-60" />
                          <p className="text-xs font-bold text-slate-300">
                            Aucun résultat trouvé pour la période sélectionnée ({formatDateToReadableFrench(resultsStartDate)} au {formatDateToReadableFrench(resultsEndDate)}).
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setResultsStartDate('');
                              setResultsEndDate('');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            Afficher tous les {results.length} résultats de la saison
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredList.map((r) => {
                          const isWin = isMatchWin(r, clubSettings.name, clubSettings.shortName);
                          const isHome = isClubHomeMatch(r, clubSettings.name, clubSettings.shortName);
                          return (
                            <div
                              key={r.id}
                              className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all hover:border-slate-600 ${
                                isWin
                                  ? 'bg-emerald-950/20 border-emerald-500/30'
                                  : 'bg-rose-950/20 border-rose-500/30'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs font-bold mb-1 flex-wrap">
                                  <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                                    {r.category}
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-bold">
                                    {isHome ? '🏠 Domicile' : '🚗 Extérieur'}
                                  </span>
                                  {r.date && r.date !== 'Week-end dernier' && (
                                    <>
                                      <span className="text-slate-600">•</span>
                                      <span className="text-slate-400 font-mono text-[11px] font-bold">
                                        {formatDateToEuropean(r.date)}
                                      </span>
                                    </>
                                  )}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      isWin ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                    }`}
                                  >
                                    {isWin ? 'VICTOIRE 🏆' : 'DÉFAITE'}
                                  </span>
                                </div>
                                <div className="text-base font-black text-white font-mono tracking-wider">
                                  {r.teamHome} {r.homeScore !== undefined && r.awayScore !== undefined ? `${r.homeScore} - ${r.awayScore}` : ''} {r.teamAway}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isSelected = r.selectedForWeekend !== false;
                                    const updated = results.map((item) =>
                                      item.id === r.id ? { ...item, selectedForWeekend: !isSelected } : item
                                    );
                                    onUpdateResults(updated);
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                                    r.selectedForWeekend !== false
                                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                                  }`}
                                  title={r.selectedForWeekend !== false ? 'Diffusé sur la TV (cliquez pour masquer)' : 'Masqué de la TV (cliquez pour diffuser)'}
                                >
                                  <CheckCircle2 className={`w-3.5 h-3.5 ${r.selectedForWeekend !== false ? 'text-emerald-400' : 'text-slate-600'}`} />
                                  <span className="text-[11px]">{r.selectedForWeekend !== false ? 'Coché TV' : 'Non diffusé'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingResult({ ...r })}
                                  className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                                  title="Modifier ce score ou la rencontre"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onUpdateResults(results.filter((item) => item.id !== r.id))}
                                  className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all cursor-pointer"
                                  title="Supprimer ce résultat"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Modal d'édition d'un résultat existant */}
              {editingResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-lg font-black text-white font-bebas flex items-center gap-2">
                        <Pencil className="w-4 h-4 text-blue-400" />
                        <span>MODIFIER LE RÉSULTAT</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingResult(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Catégorie :</label>
                        <input
                          type="text"
                          value={editingResult.category}
                          onChange={(e) => setEditingResult({ ...editingResult, category: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Équipe 1 :</label>
                          <input
                            type="text"
                            value={editingResult.teamHome}
                            onChange={(e) => setEditingResult({ ...editingResult, teamHome: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Équipe 2 :</label>
                          <input
                            type="text"
                            value={editingResult.teamAway}
                            onChange={(e) => setEditingResult({ ...editingResult, teamAway: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-emerald-400 block mb-1 font-bold truncate">
                            Score {editingResult.teamHome || 'Équipe 1'} :
                          </label>
                          <input
                            type="number"
                            placeholder="Optionnel"
                            value={editingResult.homeScore !== undefined ? editingResult.homeScore : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setEditingResult({ ...editingResult, homeScore: undefined });
                              } else {
                                const newHome = parseInt(val, 10);
                                const updated = { ...editingResult, homeScore: isNaN(newHome) ? undefined : newHome };
                                if (updated.homeScore !== undefined && updated.awayScore !== undefined) {
                                  const win = isMatchWin(updated, clubSettings.name, clubSettings.shortName);
                                  setEditingResult({ ...updated, result: win ? 'win' : 'loss' });
                                } else {
                                  setEditingResult(updated);
                                }
                              }
                            }}
                            className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-center text-emerald-400"
                          />
                        </div>
                        <div>
                          <label className="text-rose-400 block mb-1 font-bold truncate">
                            Score {editingResult.teamAway || 'Équipe 2'} :
                          </label>
                          <input
                            type="number"
                            placeholder="Optionnel"
                            value={editingResult.awayScore !== undefined ? editingResult.awayScore : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setEditingResult({ ...editingResult, awayScore: undefined });
                              } else {
                                const newAway = parseInt(val, 10);
                                const updated = { ...editingResult, awayScore: isNaN(newAway) ? undefined : newAway };
                                if (updated.homeScore !== undefined && updated.awayScore !== undefined) {
                                  const win = isMatchWin(updated, clubSettings.name, clubSettings.shortName);
                                  setEditingResult({ ...updated, result: win ? 'win' : 'loss' });
                                } else {
                                  setEditingResult(updated);
                                }
                              }
                            }}
                            className="w-full bg-slate-950 border border-rose-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-center text-rose-400"
                          />
                        </div>
                      </div>

                      {(editingResult.homeScore !== undefined || editingResult.awayScore !== undefined) && (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => setEditingResult({ ...editingResult, homeScore: undefined, awayScore: undefined })}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline"
                          >
                            🗑️ Effacer les scores numériques (garder uniquement Victoire/Défaite)
                          </button>
                        </div>
                      )}

                      {/* Sélecteur forcé Résultat / Type de match */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Lieu du match :</label>
                          <select
                            value={editingResult.isHomeMatch ? 'home' : 'away'}
                            onChange={(e) => {
                              const isHome = e.target.value === 'home';
                              const updated = { ...editingResult, isHomeMatch: isHome };
                              const win = isMatchWin(updated, clubSettings.name, clubSettings.shortName);
                              setEditingResult({
                                ...updated,
                                result: win ? 'win' : 'loss',
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                          >
                            <option value="home">🏠 Domicile</option>
                            <option value="away">🚗 Extérieur</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 font-bold">Résultat :</label>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingResult({ ...editingResult, result: 'win' })}
                              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                                editingResult.result === 'win'
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                                  : 'bg-slate-950 text-slate-400 border border-slate-700'
                              }`}
                            >
                              🏆 Victoire
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingResult({ ...editingResult, result: 'loss' })}
                              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                                editingResult.result === 'loss'
                                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                                  : 'bg-slate-950 text-slate-400 border border-slate-700'
                              }`}
                            >
                              ❌ Défaite
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-bold">Date :</label>
                        <input
                          type="text"
                          value={editingResult.date}
                          onChange={(e) => setEditingResult({ ...editingResult, date: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingResult(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditedResult(editingResult)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BANQUES D'IMAGES & VISUELS DU CLUB */}
          {/* ========================================================================= */}
          {activeTab === 'image_banks' && (
            <div className="space-y-6">
              {/* Entête & Sous-onglets des Banques d'images */}
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-400" />
                    <span>BANQUES D'IMAGES & VISUELS DU CLUB</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Déposez et gérez l'ensemble des photos, logos, partenaires, affiches et visuels d'équipes.
                  </p>
                </div>

                {/* Sous-onglets de navigation */}
                <div className="flex items-center gap-1.5 flex-wrap bg-slate-950 p-1.5 rounded-2xl border border-slate-800/90 shrink-0">
                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('photos')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'photos'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Photos ({photos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('sponsors')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'sponsors'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Sponsors ({sponsors.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('logos')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'logos'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Banque Logos ({logos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('events')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'events'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Événements ({events.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageBankSubTab('team_visuals')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      imageBankSubTab === 'team_visuals'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Visuels Victoire/Défaite</span>
                  </button>
                </div>
              </div>

              {/* Photos */}
              {imageBankSubTab === 'photos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                    GALERIE & PHOTOS DE LA VIE DU CLUB ({photos.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Déposez les photos des matchs, entraînements et événements du club.
                  </p>
                </div>


              </div>

              {/* Upload Box for Photos (Drag & Drop + Multi-Files) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPhotos(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchPhotosUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDraggingPhotos
                    ? 'border-orange-400 bg-orange-950/40 scale-[1.01] shadow-xl shadow-orange-500/20'
                    : 'border-slate-700 hover:border-orange-500/80 bg-slate-950/60'
                }`}
              >
                <Camera className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDraggingPhotos ? 'text-orange-400 scale-125 animate-bounce' : 'text-orange-400'}`} />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES PHOTOS OU VIDÉOS AU CARROUSEL TV
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Glissez un ou <strong className="text-orange-300">plusieurs fichiers en même temps</strong> ou cliquez pour importer par lot (JPG, PNG, WebP, MP4, WebM).
                </p>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Titre (optionnel si lot) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Victoire Seniors"
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Équipe / Dossier :</label>
                    <input
                      type="text"
                      placeholder="Ex: Seniors 1"
                      value={newPhotoFolder}
                      onChange={(e) => setNewPhotoFolder(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                  <Upload className="w-4 h-4" />
                  <span>Choisir un ou plusieurs fichiers (Photos / Vidéos)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchPhotosUpload(e.target.files);
                      }
                    }}
                  />
                </label>
                <div className="mt-2 text-[11px] text-slate-400">
                  📁 Astuce : Vous pouvez sélectionner des dizaines de photos d'un coup avec Ctrl+A ou Shift !
                </div>
              </div>

              {/* Photo & Video Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {photos.map((p) => {
                  const isVid = p.isVideo || p.mediaType === 'video' || p.imageUrl?.includes('.mp4') || p.imageUrl?.startsWith('data:video/');
                  return (
                    <div
                      key={p.id}
                      className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group"
                    >
                      {isVid ? (
                        <div className="relative h-32 bg-black">
                          <video
                            src={p.imageUrl}
                            preload="metadata"
                            muted
                            playsInline
                            loop
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                            className="w-full h-32 object-cover"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] font-black bg-orange-500 text-slate-950 px-1 py-0.5 rounded uppercase pointer-events-none">
                            VIDÉO
                          </span>
                        </div>
                      ) : (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="p-2">
                        <p className="text-xs font-bold text-white truncate">{p.title}</p>
                        <span className="text-[10px] text-orange-400 block">{p.categoryFolder || 'Général'}</span>
                      </div>
                      <button
                        onClick={() => onUpdatePhotos(photos.filter((item) => item.id !== p.id))}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer la photo / vidéo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SPONSORS & PARTENAIRES */}
          {/* ========================================================================= */}
          {imageBankSubTab === 'sponsors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                    SPONSORS & PARTENAIRES DU CLUB ({sponsors.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ajoutez les logos ou clips vidéos de vos partenaires pour les mettre à l'honneur dans la boucle TV.
                  </p>
                </div>


              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingSponsors(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingSponsors(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingSponsors(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSponsors(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchSponsorsUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDraggingSponsors
                    ? 'border-orange-400 bg-orange-950/40 scale-[1.01] shadow-xl shadow-orange-500/20'
                    : 'border-slate-700 hover:border-orange-500/80 bg-slate-950/60'
                }`}
              >
                <Building2 className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDraggingSponsors ? 'text-orange-400 scale-125 animate-bounce' : 'text-orange-400'}`} />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES PARTENAIRES & SPONSORS
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Glissez un ou <strong className="text-orange-300">plusieurs logos en même temps</strong>. Les noms des partenaires seront automatiquement extraits du nom de vos fichiers !
                </p>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-left">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Nom (optionnel si import groupé) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Boulangerie Ducoin"
                      value={newSponsorName}
                      onChange={(e) => setNewSponsorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Rang :</label>
                    <select
                      value={newSponsorTier}
                      onChange={(e) => setNewSponsorTier(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="gold">Gold (Majeur)</option>
                      <option value="silver">Silver</option>
                      <option value="bronze">Bronze</option>
                      <option value="partenaire">Partenaire</option>
                    </select>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                  <Upload className="w-4 h-4" />
                  <span>Déposer un ou plusieurs logos / clips partenaires</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchSponsorsUpload(e.target.files);
                      }
                    }}
                  />
                </label>
                <div className="mt-2 text-[11px] text-slate-400">
                  📁 Astuce : Vous pouvez sélectionner plusieurs logos d'un coup (PNG, SVG, JPG, MP4).
                </div>
              </div>

              {/* Sponsors Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sponsors.map((sp) => {
                  const isVid = sp.isVideo || sp.mediaType === 'video' || sp.logoUrl?.includes('.mp4') || sp.logoUrl?.startsWith('data:video/');
                  return (
                    <div
                      key={sp.id}
                      className="relative rounded-2xl p-3 border border-slate-800 bg-slate-950 flex flex-col items-center text-center group overflow-hidden"
                    >
                      <div className="w-24 h-16 bg-white rounded-xl p-1 flex items-center justify-center mb-2 relative overflow-hidden">
                        {isVid ? (
                          <video
                            src={sp.logoUrl}
                            preload="metadata"
                            muted
                            playsInline
                            loop
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        ) : (
                          <img
                            src={sp.logoUrl}
                            alt={sp.name}
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {isVid && (
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black bg-orange-500 text-slate-950 px-1 py-0.5 rounded uppercase pointer-events-none">
                            VIDÉO
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate w-full">{sp.name}</h4>
                      <span className="text-[10px] text-amber-400 font-bold uppercase">{sp.tier}</span>
                      <button
                        onClick={() => onUpdateSponsors(sponsors.filter((item) => item.id !== sp.id))}
                        className="absolute top-1.5 right-1.5 p-1 rounded bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BANQUE DÉDIÉE LOGOS (Club, Partenaires, Ligue, Comité) */}
          {/* ========================================================================= */}
          {imageBankSubTab === 'logos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                    <FolderPlus className="w-5 h-5 text-cyan-400" />
                    BANQUE DÉDIÉE LOGOS CLUB & PARTENAIRES ({logos.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Stockage centralisé de vos visuels et logos (PNG / SVG transparents) du club, des partenaires, de la Ligue et du Comité.
                  </p>
                </div>


              </div>

              {/* Upload Box for Logos (Drag & Drop + Multi-Files) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingLogos(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingLogos(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingLogos(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingLogos(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchLogosUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDraggingLogos
                    ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01] shadow-xl shadow-cyan-500/20'
                    : 'border-slate-700 hover:border-cyan-500/80 bg-slate-950/60'
                }`}
              >
                <Upload className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDraggingLogos ? 'text-cyan-400 scale-125 animate-bounce' : 'text-cyan-400'}`} />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES LOGOS OU CLIPS VIDÉOS
                </h4>
                <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
                  Glissez un ou <strong className="text-cyan-300">plusieurs fichiers de logos en même temps</strong> (PNG / SVG transparents, JPG, ou MP4/WebM).
                </p>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nom (optionnel si import groupé) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Logo Officiel HD"
                      value={newLogoName}
                      onChange={(e) => setNewLogoName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Type de Logo :</label>
                    <select
                      value={newLogoCategory}
                      onChange={(e) => setNewLogoCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="club">Logo du Club</option>
                      <option value="sponsor">Logo Partenaire</option>
                      <option value="comite">Comité Départemental</option>
                      <option value="ligue">Ligue Régionale</option>
                      <option value="autre">Autre Organisme</option>
                    </select>
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                  <Upload className="w-4 h-4" />
                  <span>Importer un ou plusieurs fichiers (PNG/SVG/MP4)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchLogosUpload(e.target.files);
                      }
                    }}
                  />
                </label>
                <div className="mt-2 text-[11px] text-slate-400">
                  📁 Astuce : Vous pouvez sélectionner plusieurs logos pour les intégrer en un seul clic !
                </div>
              </div>

              {/* Logos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {logos.map((lg) => {
                  const isVid = lg.isVideo || lg.mediaType === 'video' || lg.logoUrl?.includes('.mp4') || lg.logoUrl?.startsWith('data:video/');
                  return (
                    <div
                      key={lg.id}
                      className="relative rounded-2xl p-4 border border-slate-800 bg-slate-950/80 flex flex-col items-center text-center group hover:border-cyan-500/50 transition-all overflow-hidden"
                    >
                      <div className="w-28 h-20 bg-slate-900/90 border border-slate-800 rounded-xl p-1 flex items-center justify-center mb-3 relative overflow-hidden">
                        {isVid ? (
                          <video
                            src={lg.logoUrl}
                            preload="metadata"
                            muted
                            playsInline
                            loop
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                            className="max-h-full max-w-full object-contain rounded-lg"
                          />
                        ) : (
                          <img
                            src={lg.logoUrl}
                            alt={lg.name}
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {isVid && (
                          <span className="absolute bottom-1 right-1 text-[9px] font-black bg-cyan-500 text-slate-950 px-1 py-0.5 rounded uppercase pointer-events-none">
                            VIDÉO
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white truncate w-full">{lg.name}</h4>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase mt-1 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/60">
                        {lg.category}
                      </span>
                      <button
                        onClick={() => onUpdateLogos && onUpdateLogos(logos.filter((item) => item.id !== lg.id))}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer ce logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ÉVÉNEMENTS */}
          {/* ========================================================================= */}
          {imageBankSubTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                    AFFICHE ÉVÉNEMENTS, TOURNOIS ET SOIRÉES DU CLUB ({events.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ces affiches sont diffusées en plein écran dans la boucle de la télévision.
                  </p>
                </div>


              </div>

              {/* Upload Box for Events (Drag & Drop + Multi-Files) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingEvents(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDraggingEvents(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingEvents(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingEvents(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleBatchEventsUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDraggingEvents
                    ? 'border-orange-400 bg-orange-950/40 scale-[1.01] shadow-xl shadow-orange-500/20'
                    : 'border-slate-700 hover:border-orange-500/80 bg-slate-950/60'
                }`}
              >
                <Sparkles className={`w-10 h-10 mx-auto mb-2 transition-transform ${isDraggingEvents ? 'text-orange-400 scale-125 animate-bounce' : 'text-orange-400'}`} />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES AFFICHES D'ÉVÉNEMENTS
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Glissez une ou <strong className="text-orange-300">plusieurs affiches d'événements d'un coup</strong> (tournois, soirées, lotos, stages).
                </p>

                <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Titre (optionnel si import groupé) :</label>
                    <input
                      type="text"
                      placeholder="Ex: Soirée Fondue du club"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Date :</label>
                    <input
                      type="text"
                      placeholder="Ex: Samedi 26 Septembre"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                    <Upload className="w-4 h-4" />
                    <span>Déposer une ou plusieurs affiches d'événements</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.mp4,.webm,.mov"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleBatchEventsUpload(e.target.files);
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-slate-400">
                    💡 Vos affiches d'événements s'afficheront en plein écran haute fidélité sur les TV sans aucun texte superposé par-dessus pour préserver vos visuels !
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col group relative"
                  >
                    {ev.imageUrl && (
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        className="w-full h-36 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="p-3">
                      <h4 className="text-sm font-black text-white font-bebas">{ev.title}</h4>
                      <p className="text-xs text-orange-400">{ev.date}</p>
                    </div>
                    <button
                      onClick={() => onUpdateEvents(events.filter((item) => item.id !== ev.id))}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ========================================================================= */}
          {/* TAB 3: VISUELS ÉQUIPES (VICTOIRE / DÉFAITE) */}
          {imageBankSubTab === 'team_visuals' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                    BIBLIOTHÈQUE DES VISUELS VICTOIRE & DÉFAITE PAR ÉQUIPE
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Lorsqu'un score est reçu depuis l'<strong>API FFBB</strong> ou depuis un <strong>message Telegram</strong>, 
                    l'application pioche automatiquement le visuel Victoire ou Défaite associé à l'équipe et l'insère dans la boucle TV pendant 1 heure !
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 whitespace-nowrap">
                  {teamVisuals.length} Équipes configurées
                </span>
              </div>

              {/* Grid of Teams */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {teamVisuals.map((team) => (
                  <div
                    key={team.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                      <div>
                        <h4 className="text-xl font-black text-white font-bebas">{team.teamName}</h4>
                        <span className="text-xs text-slate-400">Catégorie : {team.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {team.shortAliases.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Both visuals side by side */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Win visual */}
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5 text-emerald-400 text-xs font-bold">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" /> Victoire
                          </span>
                          <span className="text-[10px] opacity-70">16:9</span>
                        </div>
                        <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900 mb-2 relative">
                          {isVideoMedia(team.winVisualUrl) ? (
                            <video
                              src={team.winVisualUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={team.winVisualUrl}
                              alt="Victoire"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {isVideoMedia(team.winVisualUrl) && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-emerald-300 text-[9px] font-bold flex items-center gap-0.5">
                              <Video className="w-2.5 h-2.5" /> Vidéo
                            </div>
                          )}
                        </div>
                        <label className="text-[11px] text-center font-bold py-1 px-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white cursor-pointer transition-colors mt-auto">
                          Changer visuel (Img / Vidéo)
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFileChange(file, (dataUrl) => {
                                  const updated = teamVisuals.map((tv) =>
                                    tv.id === team.id ? { ...tv, winVisualUrl: dataUrl } : tv
                                  );
                                  onUpdateTeamVisuals(updated);
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      {/* Loss visual */}
                      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-2.5 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5 text-rose-400 text-xs font-bold">
                          <span className="flex items-center gap-1">
                            <Frown className="w-3.5 h-3.5" /> Défaite
                          </span>
                          <span className="text-[10px] opacity-70">16:9</span>
                        </div>
                        <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900 mb-2 relative">
                          {isVideoMedia(team.lossVisualUrl) ? (
                            <video
                              src={team.lossVisualUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={team.lossVisualUrl}
                              alt="Défaite"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {isVideoMedia(team.lossVisualUrl) && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-rose-300 text-[9px] font-bold flex items-center gap-0.5">
                              <Video className="w-2.5 h-2.5" /> Vidéo
                            </div>
                          )}
                        </div>
                        <label className="text-[11px] text-center font-bold py-1 px-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer transition-colors mt-auto">
                          Changer visuel (Img / Vidéo)
                          <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFileChange(file, (dataUrl) => {
                                  const updated = teamVisuals.map((tv) =>
                                    tv.id === team.id ? { ...tv, lossVisualUrl: dataUrl } : tv
                                  );
                                  onUpdateTeamVisuals(updated);
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Quick Simulation Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTriggerMatchOutcome(team, true, 84, 76)}
                          className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-300 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
                          title="Injecter le visuel Victoire pendant 1 heure dans la boucle TV"
                        >
                          <Trophy className="w-3 h-3 text-emerald-500" />
                          <span>Injecter Victoire (1h)</span>
                        </button>

                        <button
                          onClick={() => handleTriggerMatchOutcome(team, false, 68, 74)}
                          className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-300 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
                          title="Injecter le visuel Défaite pendant 1 heure dans la boucle TV"
                        >
                          <Frown className="w-3 h-3 text-rose-500" />
                          <span>Injecter Défaite (1h)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PASSERELLE RÉSEAUX SOCIAUX (INSTAGRAM • TIKTOK • FACEBOOK) */}
          {/* ========================================================================= */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              {/* Studio Graphique & Exporteur Visuel Réseaux Sociaux Intégré Directement */}
              <VisualExporterModal
                isOpen={true}
                onClose={() => {}}
                type="matches"
                matches={matches}
                results={results}
                clubSettings={clubSettings}
                visualTemplates={visualTemplates}
                embeddedInTab={true}
              />

              {/* Account Settings & Webhook Section */}
              <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                      COMPTES SOCIAUX OFFICIELS DU CLUB & PASSERELLE WEBHOOK
                    </h4>
                    <p className="text-xs text-slate-400">
                      Vos comptes officiels renseignés dans Identité du Club sont automatiquement utilisés pour générer les légendes et publications.
                    </p>
                  </div>
                </div>

                {/* Récapitulatif des comptes officiels avec lien vers Identité du Club */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Comptes officiels actuels (Identité du Club) :
                    </span>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-pink-400 bg-pink-950/40 px-3 py-1 rounded-xl border border-pink-500/20">
                        <Instagram className="w-4 h-4" />
                        <span className="text-white">{clubSettings.instagramHandle || '@non_renseigné'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-400 bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-500/20">
                        <Flame className="w-4 h-4" />
                        <span className="text-white">{clubSettings.tiktokHandle || '@non_renseigné'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-blue-400 bg-blue-950/40 px-3 py-1 rounded-xl border border-blue-500/20">
                        <Facebook className="w-4 h-4" />
                        <span className="text-white">{clubSettings.facebookPage || 'Non renseignée'}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('club_identity')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all shrink-0 self-start md:self-auto shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Modifier dans Identité du Club</span>
                  </button>
                </div>

                {/* Configuration Webhook Automatisation */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-orange-400" />
                        <span>URL Webhook Automatisation (Optionnel : Make, Zapier, n8n, Meta Graph)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Appelée lors du déclenchement automatique</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={socialForm.socialWebhookUrl}
                        onChange={(e) => setSocialForm({ ...socialForm, socialWebhookUrl: e.target.value })}
                        placeholder="https://hook.eu1.make.com/xxxx ou https://hooks.zapier.com/hooks/catch/xxxx"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-orange-500 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleTestSocialWebhook}
                        disabled={socialWebhookStatus.loading}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 text-orange-400" />
                        <span>{socialWebhookStatus.loading ? 'Envoi...' : 'Tester le Webhook'}</span>
                      </button>
                    </div>

                    {socialWebhookStatus.message && (
                      <p className={`text-xs mt-1.5 font-medium ${socialWebhookStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {socialWebhookStatus.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateClubSettings({
                          ...clubSettings,
                          socialWebhookUrl: socialForm.socialWebhookUrl,
                        });
                        setSocialSaveSuccess(true);
                        setTimeout(() => setSocialSaveSuccess(false), 3000);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/20 transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer l'URL Webhook</span>
                    </button>
                  </div>
              </div>

              {/* Mobile Share Sheet Notice */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-200">📱 Partage direct depuis smartphone ou tablette :</span>
                  <p>
                    En ouvrant le Studio Graphique depuis votre téléphone (iPhone Safari ou Android Chrome), le bouton <strong>"Partager directement (Mobile)"</strong> utilise la feuille de partage native de votre OS. Vous pouvez envoyer l'affiche et la légende directement dans l'application Instagram, TikTok ou Facebook installée sur votre appareil !
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: BOT TELEGRAM */}
          {/* ========================================================================= */}
          {activeTab === 'telegram' && (
            <div className="space-y-6">
              {/* Telegram Info Banner */}
              <div className="bg-sky-950/40 border border-sky-500/30 p-5 rounded-3xl">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Bot className="w-4 h-4" />
                  <span>Commande à distance par smartphone</span>
                </div>
                <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                  DÉCLENCHER UNE VICTOIRE OU DÉFAITE VIA TELEGRAM
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl mt-1">
                  Au coup de sifflet final sur le terrain, vous pouvez envoyer un simple message Telegram depuis votre smartphone. 
                  L'application analyse automatiquement votre message (équipe, score, résultat) et injecte immédiatement l'affiche dans la boucle TV pendant 1 heure.
                </p>
              </div>

              {/* 3 Step Setup Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center mb-2">
                    1
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Créer le bot sur Telegram</h4>
                  <p className="text-xs text-slate-400">
                    Ouvrez Telegram, cherchez <strong>@BotFather</strong>, envoyez <code>/newbot</code> et donnez un nom à votre bot (ex: <em>BCVS Score Bot</em>).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center mb-2">
                    2
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Copier l'URL Webhook</h4>
                  <p className="text-xs text-slate-400 mb-2">
                    Ce lien permet à Telegram de transmettre les messages à votre carrousel TV.
                  </p>
                  <button
                    onClick={handleCopyWebhook}
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copié !' : 'Copier l\'URL Webhook'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center mb-2">
                    3
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Exemples de messages</h4>
                  <p className="text-xs text-slate-400">
                    Écrivez naturellement à votre bot :<br />
                    <code>Victoire Seniors 1 82-74</code><br />
                    <code>Defaite U15 54-60</code><br />
                    <code>Victoire SG1</code>
                  </p>
                </div>
              </div>

              {/* Interactive Telegram Test Simulator */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-sky-400" />
                  <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                    SIMULATEUR DE MESSAGE TELEGRAM EN DIRECT
                  </h4>
                </div>
                <p className="text-xs text-slate-400">
                  Testez immédiatement ce qui se passe quand vous envoyez un message Telegram depuis votre smartphone.
                </p>

                {/* Preset sample buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Exemples rapides :</span>
                  <button
                    onClick={() => setTelegramSimText('Victoire Seniors 1 88-75')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Victoire Seniors 1 88-75
                  </button>
                  <button
                    onClick={() => setTelegramSimText('Défaite U18 62-68')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Défaite U18 62-68
                  </button>
                  <button
                    onClick={() => setTelegramSimText('Victoire SG2')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Victoire SG2
                  </button>
                  <button
                    onClick={() => setTelegramSimText('Victoire Seniors Filles 1 71-65')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Victoire SF1 71-65
                  </button>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={telegramSimText}
                    onChange={(e) => setTelegramSimText(e.target.value)}
                    placeholder="Tapez un message ex: Victoire Seniors 1 82-74..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleTestTelegramMessage()}
                  />
                  <button
                    onClick={handleTestTelegramMessage}
                    disabled={telegramSimLoading}
                    className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-sky-600/20 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{telegramSimLoading ? 'Analyse...' : 'Tester l\'envoi'}</span>
                  </button>
                </div>

                {/* Result feedback */}
                {telegramSimResponse && (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{telegramSimResponse}</p>
                      <p className="text-xs text-emerald-400/80 mt-1">
                        Le visuel de l'équipe a été injecté dans la rotation TV pour une durée de 1 heure. Vous pouvez le voir dans l'onglet "Alertes 1h en cours" ou en lançant la TV !
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: ALERTES 1H EN COURS */}
          {/* ========================================================================= */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                    VISUELS VICTOIRE / DÉFAITE EN COURS DANS LA BOUCLE TV
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ces affiches tournent actuellement dans le carrousel plein écran. Chaque alerte reste exactement 1 heure à partir de sa réception.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold">
                  {activeAlerts.length} alerte(s) active(s)
                </span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="text-center py-12 px-6 bg-slate-950 rounded-3xl border border-slate-800 max-w-md mx-auto">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <h4 className="text-xl font-black text-white font-bebas">Aucune alerte active dans la boucle</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Envoyez un message sur Telegram ou déclenchez une simulation depuis l'onglet "Visuels Équipes" pour en ajouter une.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAlerts.map((alert) => {
                    const diffMs = alert.expiresAt - Date.now();
                    const minutesLeft = Math.max(0, Math.ceil(diffMs / 60000));

                    return (
                      <div
                        key={alert.id}
                        className={`rounded-3xl p-5 border flex items-center gap-5 justify-between ${
                          alert.isWin
                            ? 'bg-emerald-950/30 border-emerald-500/40'
                            : 'bg-rose-950/30 border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                              alert.isWin ? 'bg-emerald-600 shadow-lg shadow-emerald-600/30' : 'bg-rose-600'
                            }`}
                          >
                            {alert.isWin ? <Trophy className="w-7 h-7" /> : <Frown className="w-7 h-7" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-black uppercase tracking-wider ${
                                  alert.isWin ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {alert.isWin ? 'VICTOIRE' : 'DÉFAITE'}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="text-xs text-slate-400">
                                {alert.triggeredBy === 'telegram' ? 'Via Telegram' : 'Via FFBB / Manuel'}
                              </span>
                            </div>
                            <h4 className="text-xl font-black text-white font-bebas">{alert.team}</h4>
                            {alert.ourScore !== undefined && alert.opponentScore !== undefined && (
                              <p className="text-sm font-bold text-white font-mono">
                                Score : {alert.ourScore} - {alert.opponentScore}
                              </p>
                            )}
                            <p className="text-xs text-orange-400 mt-1 flex items-center gap-1 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              Dans la boucle encore {minutesLeft} min
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveAlert(alert.id)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
                          title="Retirer de la boucle TV"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CARROUSEL & TEMPS D'AFFICHAGE */}
          {/* ========================================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Option 1: Mélange Équilibré de la Boucle TV */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <Shuffle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>MÉLANGE ÉQUILIBRÉ DES CATÉGORIES (DIFFUSION ALTERNÉE)</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        Optimisé pour la TV
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Intercale intelligemment 1 match, 1 sponsor, 1 photo, 1 résultat, 1 événement... ainsi la boucle est dynamiquement variée et s'adapte automatiquement d'une semaine à l'autre selon le nombre d'éléments.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateClubSettings({
                      ...clubSettings,
                      balancedLoopMode: clubSettings.balancedLoopMode === false ? true : false,
                    })
                  }
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
                    clubSettings.balancedLoopMode !== false
                      ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {clubSettings.balancedLoopMode !== false
                      ? 'Actif : Mélange Équilibré Alterné'
                      : 'Séquentiel (Catégorie par catégorie)'}
                  </span>
                </button>
              </div>

              {/* Option 2: Mode 100% Photos / Visuels Purs Option */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>MODE 100% PHOTOS & VISUELS PURS (SANS TEXTE SUPERPOSÉ)</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                        Image Plein Écran
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Masque tous les textes, titres et calques d'écriture sur les diaporamas photos pour n'afficher que les visuels bruts plein écran.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateClubSettings({
                      ...clubSettings,
                      hideTextOverlays: !clubSettings.hideTextOverlays,
                      purePhotoSlidesOnly: !clubSettings.hideTextOverlays,
                    })
                  }
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
                    clubSettings.hideTextOverlays
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {clubSettings.hideTextOverlays
                      ? 'Actif : 100% Photos Sans Texte'
                      : 'Afficher le texte sur les photos'}
                  </span>
                </button>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                    DURÉE D'AFFICHAGE DE CHAQUE CATÉGORIE DU CARROUSEL (3 À 10 SECONDES)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ajustez le temps de passage (de 3s à 10s) de chaque slide sur la télévision.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      cat.enabled
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-base font-black text-white font-bebas">{cat.label}</h4>
                        <p className="text-xs text-slate-400">{cat.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleCategory(cat.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            cat.enabled ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cat.enabled ? 'Actif' : 'Désactivé'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        value={Math.min(10, Math.max(3, cat.durationSeconds))}
                        onChange={(e) => handleDurationChange(cat.id, parseInt(e.target.value, 10))}
                        className="flex-1 accent-orange-500 cursor-pointer"
                        disabled={!cat.enabled}
                      />
                      <span className="w-16 text-right font-mono font-bold text-sm text-orange-400">
                        {Math.min(10, Math.max(3, cat.durationSeconds))} sec
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: ANNIVERSAIRES (EXCEL & GESTION PAR SEMAINE) */}
          {/* ========================================================================= */}
          {activeTab === 'excel' && (
            <div className="space-y-6">
              {/* Barre de sous-onglets : Licenciés vs Studio Calques */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBirthdaysSubTab('list')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      birthdaysSubTab === 'list'
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Cake className="w-4 h-4 text-pink-400" />
                    <span>Licenciés & Import Excel ({birthdays.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBirthdaysSubTab('calques')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      birthdaysSubTab === 'calques'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>🎨 Design & Studio Calques Anniversaires</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 hidden sm:inline-block pr-2 font-medium">
                  {birthdaysSubTab === 'list' ? 'Gestion des licenciés & extraction hebdomadaire' : 'Fond festif, stickers & visuels 16:9'}
                </span>
              </div>

              {birthdaysSubTab === 'calques' ? (
                <StudioGraphiqueWorkbench
                  visualTemplates={visualTemplates}
                  onUpdateVisualTemplates={onUpdateVisualTemplates}
                  matches={matches}
                  results={results}
                  birthdays={birthdays}
                  clubSettings={clubSettings}
                  defaultCategory="birthdays"
                  hideCategorySelector={true}
                  onNavigateToCategoryTab={() => setBirthdaysSubTab('list')}
                />
              ) : (
                <>
              {/* Header & Description */}
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Cake className="w-5 h-5 text-pink-400" />
                    <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                      GESTION & EXTRACTION DES ANNIVERSAIRES PAR SEMAINE
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Importez votre fichier Excel (.xlsx, .csv) de licenciés ou ajoutez-les manuellement.
                    <span className="text-pink-400 font-semibold ml-1">
                      Sur l'écran TV, seuls le Prénom et la Catégorie sont diffusés
                    </span> pour un rendu grand format ultra-lisible.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setBirthdaysSubTab('calques')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Régler le fond & visuels festifs</span>
                  </button>
                  <button
                    onClick={() => setIsAddingManualBday(!isAddingManualBday)}
                    className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-pink-600/20 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingManualBday ? 'Fermer formulaire' : 'Ajouter un licencié'}</span>
                  </button>
                  <button
                    onClick={generateClubBirthdayTemplate}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors whitespace-nowrap"
                    title="Télécharger le modèle Excel prêt à l'emploi"
                  >
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>Modèle Excel</span>
                  </button>
                </div>
              </div>

              {/* Formulaire d'ajout manuel de licencié */}
              {isAddingManualBday && (
                <form
                  onSubmit={handleAddManualBirthday}
                  className="bg-slate-900 p-5 rounded-3xl border-2 border-pink-500/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <Plus className="w-4 h-4 text-pink-400" />
                      AJOUTER UN LICENCIÉ (PRÉNOM & CATÉGORIE)
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingManualBday(false)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Prénom du licencié *
                      </label>
                      <input
                        type="text"
                        value={manualBdayFirstName}
                        onChange={(e) => setManualBdayFirstName(e.target.value)}
                        placeholder="Ex: Lucas, Emma, Juliette..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Catégorie / Équipe (avec F ou M) *
                      </label>
                      <input
                        type="text"
                        value={manualBdayCategory}
                        onChange={(e) => setManualBdayCategory(e.target.value)}
                        placeholder="Ex: U15F, U15M, U13F, Seniors F..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                        required
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['U7', 'U9', 'U11F', 'U11M', 'U13F', 'U13M', 'U15F', 'U15M', 'U17F', 'U17M', 'U18M', 'Seniors F', 'Seniors M', 'Loisirs', 'Coach', 'Bureau'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setManualBdayCategory(cat)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              manualBdayCategory === cat
                                ? 'bg-pink-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Date de naissance (ou date fête)
                      </label>
                      <input
                        type="date"
                        value={manualBdayDate}
                        onChange={(e) => setManualBdayDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingManualBday(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/30 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Enregistrer le licencié
                    </button>
                  </div>
                </form>
              )}

              {/* Barre de tri et sélection par Semaine */}
              <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Filtrer par semaine :
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-950/80 text-pink-300 border border-pink-500/30">
                      {getWeekBounds(new Date(), birthdayWeekOffset).label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleSelectWeekOffset(birthdayWeekOffset - 1)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                      title="Semaine précédente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Précédente</span>
                    </button>

                    <button
                      onClick={() => handleSelectWeekOffset(0)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        birthdayWeekOffset === 0
                          ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      Cette semaine
                    </button>

                    <button
                      onClick={() => handleSelectWeekOffset(birthdayWeekOffset + 1)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                      title="Semaine suivante"
                    >
                      <span className="hidden sm:inline">Suivante</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Boutons de raccourcis rapides de semaines */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">Raccourcis :</span>
                  {[
                    { offset: -1, label: 'Semaine -1' },
                    { offset: 0, label: 'Semaine actuelle (0)' },
                    { offset: 1, label: 'Semaine +1' },
                    { offset: 2, label: 'Semaine +2' },
                    { offset: 3, label: 'Semaine +3' },
                  ].map((w) => (
                    <button
                      key={w.offset}
                      onClick={() => handleSelectWeekOffset(w.offset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        birthdayWeekOffset === w.offset
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                  {allMembersPool.length > 0 && (
                    <button
                      onClick={() => onUpdateBirthdays(allMembersPool)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800 ml-auto"
                    >
                      Afficher tous ({allMembersPool.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                <Cake className="w-10 h-10 text-pink-400 mx-auto mb-2" />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  IMPORTER OU METTRE À JOUR LE FICHIER EXCEL (.XLSX, .CSV)
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                  Détection automatique : Prénom, Nom, Date de Naissance, Catégorie / Équipe.
                </p>

                <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs md:text-sm cursor-pointer shadow-lg shadow-pink-600/20 transition-all hover:scale-105">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isParsingExcel ? 'Extraction en cours...' : 'Sélectionner le fichier Excel'}</span>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleExcelFileUpload}
                    disabled={isParsingExcel}
                  />
                </label>
              </div>

              {excelSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>{excelSuccessMsg}</span>
                </div>
              )}

              {excelErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm space-y-1">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Avertissements lors de l'import :</span>
                  </div>
                  {excelErrors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-300/90 pl-6">• {err}</p>
                  ))}
                </div>
              )}

              {/* Liste des Anniversaires diffusés avec Modification & Suppression */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Anniversaires retenus pour la diffusion TV ({birthdays.length})</span>
                    <span className="text-xs font-normal text-slate-400">
                      (Affichage : Prénom + Catégorie)
                    </span>
                  </h4>
                  {birthdays.length > 0 && (
                    <button
                      onClick={() => onUpdateBirthdays([])}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Tout effacer
                    </button>
                  )}
                </div>

                {birthdays.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center text-slate-400 space-y-2">
                    <Cake className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-300">Aucun anniversaire pour cette sélection</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Changez de semaine avec les boutons ci-dessus, importez un fichier Excel ou cliquez sur "Ajouter un licencié".
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {birthdays.map((b) => {
                      const isEditing = editingBirthdayId === b.id;
                      const displayName = b.firstName || (b.fullName ? b.fullName.trim().split(/\s+/)[0] : 'Licencié');

                      if (isEditing) {
                        return (
                          <div
                            key={b.id}
                            className="p-4 rounded-2xl bg-slate-900 border-2 border-pink-500 shadow-xl space-y-3 animate-in fade-in"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-pink-400 uppercase tracking-wider">
                                MODIFIER LE LICENCIÉ
                              </span>
                              <button
                                onClick={handleCancelEditBirthday}
                                className="text-slate-400 hover:text-white p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                                  Prénom (affiché sur la TV) :
                                </label>
                                <input
                                  type="text"
                                  value={editBdayFirstName}
                                  onChange={(e) => setEditBdayFirstName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-bold focus:border-pink-500 focus:outline-none"
                                  placeholder="Prénom"
                                  autoFocus
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                                  Catégorie / Équipe (avec F ou M) :
                                </label>
                                <input
                                  type="text"
                                  value={editBdayCategory}
                                  onChange={(e) => setEditBdayCategory(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-bold focus:border-pink-500 focus:outline-none"
                                  placeholder="Ex: U15F, U15M, U13F, Seniors F"
                                />
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {['U7', 'U9', 'U11F', 'U11M', 'U13F', 'U13M', 'U15F', 'U15M', 'U17F', 'U17M', 'U18M', 'Seniors F', 'Seniors M', 'Loisirs', 'Coach', 'Bureau'].map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => setEditBdayCategory(cat)}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                                        editBdayCategory === cat
                                          ? 'bg-pink-600 text-white'
                                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                      }`}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                                  Date de naissance :
                                </label>
                                <input
                                  type="date"
                                  value={editBdayDate}
                                  onChange={(e) => setEditBdayDate(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white text-xs focus:border-pink-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                onClick={handleCancelEditBirthday}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleSaveEditBirthday(b.id)}
                                className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-pink-600/30"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const displayCat = formatDisplayCategory(b.teamCategory, b.gender, displayName);

                      return (
                        <div
                          key={b.id}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow-md"
                              style={{ backgroundColor: clubSettings.primaryColor || '#ea580c' }}
                            >
                              <Cake className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-base font-black text-white truncate font-bebas tracking-wide">
                                {displayName}
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="px-2 py-0.5 rounded-lg text-[11px] font-black text-white shrink-0 shadow-sm uppercase tracking-wider font-mono"
                                  style={{ backgroundColor: `${clubSettings.primaryColor || '#ea580c'}cc` }}
                                >
                                  {displayCat}
                                </span>
                                {b.birthDayFormatted && (
                                  <span className="text-[11px] text-pink-400 font-medium">
                                    🎂 {b.birthDayFormatted}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartEditBirthday(b)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Modifier (Prénom, Catégorie, Date)"
                            >
                              <Pencil className="w-4 h-4 text-orange-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteBirthday(b.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: IDENTITÉ DU CLUB */}
          {/* ========================================================================= */}
          {activeTab === 'club_identity' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* En-tête de section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                      <span>IDENTITÉ & COORDONNÉES DU CLUB</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                        Configuration Centrale
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Centralisez ici le nom officiel, le logo, la salle par défaut et les réseaux de votre club.
                    </p>
                  </div>
                </div>

                {/* Badge d'aperçu rapide */}
                <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-700/50">
                  {clubSettings.logoUrl ? (
                    <img
                      src={clubSettings.logoUrl}
                      alt={clubSettings.shortName}
                      className="w-8 h-8 rounded-lg object-contain bg-white/10 p-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center text-orange-400 font-bold text-xs">
                      {(clubSettings.shortName || 'SRC').slice(0, 3)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">{clubSettings.shortName || 'SRC Basket'}</div>
                    <div className="text-[10px] text-slate-400">{clubSettings.city || 'La Clayette'}</div>
                  </div>
                </div>
              </div>

              {/* Grille principale : Coordonnées à gauche, Logo à droite */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Colonne gauche (7 cols) : Infos textuelles & FFBB */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Bloc 1 : Nom et Salle */}
                  <div className="bg-slate-900/70 p-5 rounded-3xl border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-orange-400" />
                      <span>Nom & Lieux Officiels</span>
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Nom officiel complet du club :
                        </label>
                        <input
                          type="text"
                          value={clubSettings.name}
                          onChange={(e) => onUpdateClubSettings({ ...clubSettings, name: e.target.value })}
                          placeholder="Ex: Sports Réunis Clayettois"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Nom officiel déposé à la FFBB ou en préfecture.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Diminutif / Nom d'usage court :
                          </label>
                          <input
                            type="text"
                            value={clubSettings.shortName}
                            onChange={(e) => onUpdateClubSettings({ ...clubSettings, shortName: e.target.value })}
                            placeholder="Ex: SRC Basket"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none font-bold text-orange-400"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Utilisé sur les bandeaux TV, scores et hashtags.
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-1">
                            Ville principale :
                          </label>
                          <input
                            type="text"
                            value={clubSettings.city}
                            onChange={(e) => onUpdateClubSettings({ ...clubSettings, city: e.target.value })}
                            placeholder="Ex: La Clayette"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Sert à identifier les rencontres à domicile.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">
                          Gymnase / Salle principale par défaut :
                        </label>
                        <input
                          type="text"
                          value={clubSettings.gymnasiumDefault}
                          onChange={(e) => onUpdateClubSettings({ ...clubSettings, gymnasiumDefault: e.target.value })}
                          placeholder="Ex: Gymnase intercommunal ou COSEC"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Lieu pré-rempli par défaut sur les matchs joués à domicile.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bloc 2 : Code FFBB */}
                  <div className="bg-slate-900/70 p-5 rounded-3xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-400" />
                        <span>Filiation & Code FFBB</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ffbb')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Ouvrir la synchronisation</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Code Club Officiel FFBB :
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={clubSettings.codeFFBB}
                          onChange={(e) => onUpdateClubSettings({ ...clubSettings, codeFFBB: e.target.value.toUpperCase().trim() })}
                          placeholder="Ex: BFC0071024"
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-blue-500 focus:outline-none uppercase"
                        />
                        <button
                          type="button"
                          onClick={() => setActiveTab('ffbb')}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 shrink-0"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Aller à la synchro</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Code officiel attribué par la fédération (SRC Basket : BFC0071024).
                      </p>
                    </div>

                    {/* Statut rapide des équipes suivies */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-orange-400" />
                        <span className="text-slate-300 font-semibold">Équipes suivies sur la TV :</span>
                        <span className="font-mono font-bold text-orange-400">
                          {ffbbTeams.length - (clubSettings.ignoredTeamCategories || []).filter(c => ffbbTeams.some(t => isTeamCategoryIgnored(t.category, [c]))).length} / {ffbbTeams.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ffbb')}
                        className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Choisir les équipes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Colonne droite (5 cols) : Logo du club (Glisser-Déposer / Upload) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-slate-900/70 p-5 rounded-3xl border border-slate-800 space-y-4">
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Camera className="w-4 h-4 text-orange-400" />
                      <span>Logo Officiel du Club</span>
                    </h4>

                    {/* Zone de Glisser-Déposer */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(true);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleLogoFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                        isDraggingLogo
                          ? 'border-orange-400 bg-orange-950/40 scale-[1.02] shadow-xl shadow-orange-500/20'
                          : 'border-slate-700 hover:border-orange-500/80 bg-slate-950/60'
                      }`}
                    >
                      {clubSettings.logoUrl ? (
                        <div className="space-y-3">
                          <div className="w-28 h-28 mx-auto rounded-2xl bg-slate-900 border border-slate-700/80 p-3 flex items-center justify-center shadow-lg relative group">
                            <img
                              src={clubSettings.logoUrl}
                              alt={clubSettings.name}
                              className="max-w-full max-h-full object-contain"
                            />
                            {isUploadingLogo && (
                              <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                                <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 font-bold">
                            Logo actuel du club
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Glissez une nouvelle image ici pour remplacer le logo
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 py-4">
                          <Upload className={`w-10 h-10 mx-auto text-orange-400 transition-transform ${isDraggingLogo ? 'scale-125 animate-bounce' : ''}`} />
                          <div className="text-sm font-bold text-white">
                            Glissez-déposez le logo ici
                          </div>
                          <p className="text-xs text-slate-400">
                            PNG avec transparence recommandé, SVG ou JPG
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <input
                          ref={logoFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-orange-600/20"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingLogo ? 'Téléversement...' : clubSettings.logoUrl ? 'Changer l\'image' : 'Choisir un fichier'}</span>
                        </button>
                        {clubSettings.logoUrl && (
                          <button
                            type="button"
                            onClick={() => onUpdateClubSettings({ ...clubSettings, logoUrl: '' })}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 font-bold text-xs transition-colors"
                            title="Retirer le logo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Champ URL direct alternatif */}
                    <div className="pt-1">
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Ou URL directe du logo (optionnel) :
                      </label>
                      <input
                        type="url"
                        value={clubSettings.logoUrl}
                        onChange={(e) => onUpdateClubSettings({ ...clubSettings, logoUrl: e.target.value })}
                        placeholder="https://.../logo.png"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloc Réseaux Sociaux */}
              <div className="bg-slate-900/70 p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-pink-400" />
                    <span>Réseaux Sociaux du Club</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Insérés automatiquement dans les légendes et affiches partagées
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      <span>Compte Instagram</span>
                    </label>
                    <input
                      type="text"
                      value={clubSettings.instagramHandle || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateClubSettings({ ...clubSettings, instagramHandle: val });
                        setSocialForm((prev) => ({ ...prev, instagramHandle: val }));
                      }}
                      placeholder="@src_basket"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-pink-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Exemple : @src_basket</p>
                  </div>

                  {/* Facebook */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Facebook className="w-3.5 h-3.5 text-blue-400" />
                      <span>Page Facebook</span>
                    </label>
                    <input
                      type="text"
                      value={clubSettings.facebookPage || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateClubSettings({ ...clubSettings, facebookPage: val });
                        setSocialForm((prev) => ({ ...prev, facebookPage: val }));
                      }}
                      placeholder="SRC Basket"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Exemple : SRC Basket ou facebook.com/srcbasket</p>
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span>Compte TikTok</span>
                    </label>
                    <input
                      type="text"
                      value={clubSettings.tiktokHandle || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateClubSettings({ ...clubSettings, tiktokHandle: val });
                        setSocialForm((prev) => ({ ...prev, tiktokHandle: val }));
                      }}
                      placeholder="@src_basket"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-rose-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Exemple : @src_basket</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: FFBB */}
          {/* ========================================================================= */}
          {activeTab === 'ffbb' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
                <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                  SYNCHRONISATION OFFICIELLE FFBB
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Code Club Officiel FFBB :</label>
                    <input
                      type="text"
                      value={clubSettings.codeFFBB}
                      onChange={(e) => onUpdateClubSettings({ ...clubSettings, codeFFBB: e.target.value })}
                      placeholder="Ex: BFC0071042"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                    />
                  </div>
                  <button
                    onClick={handleSyncFFBB}
                    disabled={isSyncingFFBB}
                    className="self-end px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 transition-all shadow-lg"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                    <span>{isSyncingFFBB ? 'Synchronisation...' : 'Synchroniser les matchs'}</span>
                  </button>
                </div>

                {/* Petit Calendrier de Filtrage des Dates */}
                <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-700/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        <span>Filtre calendrier (Évite d'importer toute la saison) :</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Sélectionnez directement vos dates sur le petit calendrier ci-dessous sans rien taper.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={setFilterToCurrentWeekend}
                        className="px-2.5 py-1 rounded bg-orange-600/20 hover:bg-orange-600/35 text-orange-300 border border-orange-500/30 text-[10px] font-bold transition-all"
                      >
                        📅 Ce week-end
                      </button>
                      {(syncStartDate || syncEndDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSyncStartDate('');
                            setSyncEndDate('');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-bold transition-all"
                        >
                          Effacer le filtre
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start pt-1">
                    <div className="shrink-0 flex justify-center w-full sm:w-auto">
                      <MiniCalendarPicker
                        startDate={syncStartDate}
                        endDate={syncEndDate}
                        onChangeRange={(start, end) => {
                          setSyncStartDate(start);
                          setSyncEndDate(end);
                        }}
                        title="Calendrier FFBB"
                      />
                    </div>
                    <div className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 w-full">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Dates sélectionnées :
                      </span>
                      <div className="text-sm font-bold text-orange-400">
                        {syncStartDate && syncEndDate ? (
                          <>Du {formatDateToReadableFrench(syncStartDate)} au {formatDateToReadableFrench(syncEndDate)}</>
                        ) : syncStartDate ? (
                          <>À partir du {formatDateToReadableFrench(syncStartDate)}</>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Tous les matchs de la saison FFBB</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Cliquez sur les cases du calendrier pour définir la période souhaitée, ou utilisez les raccourcis <strong>Ce week-end</strong> ou <strong>Week-end +1</strong> pour une sélection immédiate en 1 clic.
                      </p>
                    </div>
                  </div>
                </div>

                {syncMessage && (
                  <p className={`text-xs font-medium p-3 rounded-xl border ${
                    syncIsError
                      ? 'text-red-400 bg-red-950/40 border-red-500/30'
                      : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                  }`}>
                    {syncIsError ? '⚠ ' : '✓ '}{syncMessage}
                  </p>
                )}

                {/* Passerelle Réseaux Sociaux Direct Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Passerelle Réseaux Sociaux</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
                          Insta • TikTok • FB
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300">
                        Diffusez les matchs FFBB synchronisés sur vos réseaux sociaux au format story 9:16 ou post 1:1.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTab('social')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
                    >
                      Voir les légendes
                    </button>
                    {onOpenVisualExporter && (
                      <button
                        onClick={() => onOpenVisualExporter('matches')}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Créer le visuel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Étape 3 : Sélection des Équipes Suivies FFBB */}
              {(() => {
                const ignoredList = clubSettings.ignoredTeamCategories || [];
                const ignoredCount = ffbbTeams.filter((t) => isTeamCategoryIgnored(t.category, ignoredList)).length;
                const trackedCount = ffbbTeams.length - ignoredCount;

                return (
                  <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-5">
                    {/* En-tête et compteurs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                              SÉLECTION DES ÉQUIPES SUIVIES SUR LA TV
                            </h3>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                              {trackedCount} / {ffbbTeams.length} actives
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Cochez les équipes à diffuser sur votre écran TV. Décochez celles qui ne jouent pas ou ne doivent pas apparaître (ex: U18F).
                          </p>
                        </div>
                      </div>

                      {/* Boutons d'action globale */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleTrackAllTeams}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                        >
                          Tout cocher
                        </button>
                        <button
                          type="button"
                          onClick={handleUntrackAllTeams}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                        >
                          Tout décocher
                        </button>
                      </div>
                    </div>

                    {/* Explication du comportement */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
                      <span className="text-base leading-none">💡</span>
                      <div>
                        <strong className="text-slate-200">Filtrage persistant :</strong> Chaque synchronisation future ignore automatiquement les équipes décochées. Leurs matchs et résultats ne seront ni enregistrés, ni affichés sur le diaporama.
                      </div>
                    </div>

                    {/* Grille des équipes interactives */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ffbbTeams.map((team, idx) => {
                        const isIgnored = isTeamCategoryIgnored(team.category, ignoredList);
                        const isTracked = !isIgnored;

                        return (
                          <div
                            key={team.id || idx}
                            onClick={() => handleToggleTrackTeam(team.category, team.name)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 group ${
                              isTracked
                                ? 'bg-slate-950 border-slate-700/80 hover:border-orange-500/60 shadow-md'
                                : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-90'
                            }`}
                          >
                            {/* Case à cocher personnalisée */}
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                                  isTracked
                                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/40'
                                    : 'border border-slate-600 bg-slate-900 group-hover:border-slate-500'
                                }`}
                              >
                                {isTracked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>

                            {/* Informations sur l'équipe */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-bold ${isTracked ? 'text-white' : 'text-slate-400 line-through'}`}>
                                  {team.name}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    team.gender === 'M'
                                      ? 'bg-sky-500/20 text-sky-300'
                                      : team.gender === 'F'
                                      ? 'bg-pink-500/20 text-pink-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}
                                >
                                  {team.gender === 'F' ? 'Féminine' : team.gender === 'M' ? 'Masculine' : 'Mixte'}
                                </span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                  {team.category}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                {team.competition}
                                {team.poule && (
                                  <span className="text-orange-400/90 font-medium"> • {team.poule}</span>
                                )}
                              </p>

                              <div className="mt-2 flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold ${
                                    isTracked ? 'text-emerald-400' : 'text-slate-500'
                                  }`}
                                >
                                  {isTracked ? '✓ Diffusée sur TV' : '✕ Ignorée (exclue)'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                  {team.matchesCount} matchs
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: GUIDE FULLY KIOSK BROWSER */}
          {/* ========================================================================= */}
          {activeTab === 'fullykiosk' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                      DIFFUSION TV AVEC FULLY KIOSK BROWSER
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comment faire tourner le diaporama en boucle autonome sur votre écran de télévision
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold text-xs uppercase flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 1. URL de diffusion TV directe
                    </span>
                    <p className="text-xs text-slate-300">
                      Renseignez cette URL dans le champ <strong>Start URL</strong> de Fully Kiosk Browser :
                    </p>
                    <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-700">
                      <code className="text-xs text-orange-400 font-mono flex-1 break-all select-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}?mode=tv` : '?mode=tv'}
                      </code>
                      <button
                        onClick={() => {
                          if (typeof navigator !== 'undefined') {
                            navigator.clipboard.writeText(`${window.location.origin}?mode=tv`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold shrink-0"
                      >
                        Copier
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Avec le paramètre <code>?mode=tv</code>, la TV démarre directement sur le diaporama sans afficher le panneau d'administration.
                    </p>
                  </div>

                  <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2">
                    <span className="text-amber-400 font-bold text-xs uppercase flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> 2. Raccourcis et télécommande
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      <li><strong>Touche C ou A</strong> : bascule entre le Diaporama TV et la Console de Configuration.</li>
                      <li><strong>Touche F</strong> : Activer / Désactiver le plein écran.</li>
                      <li><strong>Flèche Droite / Gauche</strong> : Passer à la slide suivante ou précédente.</li>
                      <li><strong>Barre Espace</strong> : Mettre en pause ou reprendre le diaporama.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs">
                  <strong>💡 Conseil Fully Kiosk :</strong> Activez les options <em>Fullscreen Mode</em>, <em>Keep Screen On</em> (écran toujours allumé) et <em>Autostart on Boot</em> (démarrage automatique à l'allumage de la TV).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
