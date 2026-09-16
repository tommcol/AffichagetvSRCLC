import React, { useState, useRef } from 'react';
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
  Settings,
  Pencil,
  Video,
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
import { isMatchLive } from '../../utils/matchStatus';
import { isVideoMedia } from '../../utils/mediaUtils';
import { FFBBService } from '../../services/ffbbService';
import { parseExcelBirthdays, generateClubBirthdayTemplate } from '../../utils/excelBirthdayParser';


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
    | 'matches'
    | 'results'
    | 'photos'
    | 'sponsors'
    | 'logos'
    | 'events'
    | 'categories'
    | 'folders'
    | 'templates'
    | 'team_visuals'
    | 'social'
    | 'telegram'
    | 'alerts'
    | 'excel'
    | 'ffbb'
    | 'fullykiosk'
    | 'settings'
  >('matches');

  const [selectedFolderCategory, setSelectedFolderCategory] = useState<'photos' | 'sponsors' | 'events'>('photos');
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);



  // New Match Form State
  const [newMatchCategory, setNewMatchCategory] = useState('Seniors Garçons 1');
  const [newMatchOpponent, setNewMatchOpponent] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('Samedi 20 Septembre');
  const [newMatchTime, setNewMatchTime] = useState('20:30');
  const [newMatchGymnasium, setNewMatchGymnasium] = useState(clubSettings.gymnasiumDefault || 'Gymnase intercommunal');
  const [newMatchIsHome, setNewMatchIsHome] = useState(true);

  // New Result Form State
  const [newResultCategory, setNewResultCategory] = useState('Seniors Garçons 1');
  const [newResultOpponent, setNewResultOpponent] = useState('');
  const [newResultHomeScore, setNewResultHomeScore] = useState<string>('82');
  const [newResultAwayScore, setNewResultAwayScore] = useState<string>('74');

  // FFBB Sync State & Real Teams State
  const [isSyncingFFBB, setIsSyncingFFBB] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
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

  // Excel parsing state
  const [isParsingExcel, setIsParsingExcel] = useState<boolean>(false);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState<string | null>(null);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const excelInputRef = useRef<HTMLInputElement>(null);

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
  const [socialForm, setSocialForm] = useState({
    instagramHandle: clubSettings.instagramHandle || '@bc_valdesaone',
    facebookPage: clubSettings.facebookPage || 'BasketClubValDeSaone',
    tiktokHandle: clubSettings.tiktokHandle || '@bcvs_basket',
    socialWebhookUrl: clubSettings.socialWebhookUrl || '',
  });

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

  // Add Manual Result
  const handleAddResultManual = () => {
    if (!newResultOpponent.trim()) return;
    const club = clubSettings.shortName || clubSettings.name || 'Notre Club';
    const hScore = parseInt(newResultHomeScore) || 0;
    const aScore = parseInt(newResultAwayScore) || 0;
    const isWin = hScore > aScore;

    const newRes: MatchItem = {
      id: `res-m-${Date.now()}`,
      date: 'Week-end dernier',
      time: 'Terminé',
      category: newResultCategory.trim() || 'Seniors',
      competition: 'Régionale / Départementale',
      teamHome: club,
      teamAway: newResultOpponent.trim(),
      isHomeMatch: true,
      ourClubName: club,
      gymnasium: clubSettings.gymnasiumDefault,
      city: clubSettings.city,
      homeScore: hScore,
      awayScore: aScore,
      status: 'finished',
      result: isWin ? 'win' : 'loss',
    };
    onUpdateResults([newRes, ...results]);
    setNewResultOpponent('');
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

  // Generic image & video upload helper to DataURL
  const handleMediaFileChange = (file: File, callback: (url: string, isVideo: boolean) => void) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        callback(e.target.result as string, isVideo);
      }
    };
    reader.readAsDataURL(file);
  };

  // Legacy helper for places that only expect an image URL but can also receive videos
  const handleImageFileChange = (file: File, callback: (dataUrl: string) => void) => {
    handleMediaFileChange(file, (url) => callback(url));
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
    
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    
    setSyncStartDate(friday.toISOString().slice(0, 10));
    setSyncEndDate(monday.toISOString().slice(0, 10));
  };

  // Sync with FFBB
  const handleSyncFFBB = async () => {
    setIsSyncingFFBB(true);
    setSyncMessage(null);
    try {
      const res = await FFBBService.fetchClubData(clubSettings.codeFFBB);
      if (res.matches && res.matches.length > 0) {
        let filteredMatches = res.matches || [];
        let filteredResults = res.results || [];

        if (syncStartDate || syncEndDate) {
          if (syncStartDate) {
            filteredMatches = filteredMatches.filter((m) => m.date >= syncStartDate);
            filteredResults = filteredResults.filter((r) => r.date >= syncStartDate);
          }
          if (syncEndDate) {
            filteredMatches = filteredMatches.filter((m) => m.date <= syncEndDate);
            filteredResults = filteredResults.filter((r) => r.date <= syncEndDate);
          }
        }

        onUpdateMatches(filteredMatches);
        if (filteredResults.length > 0) {
          onUpdateResults(filteredResults);
        } else {
          onUpdateResults([]); // empty results if none match
        }

        if (res.clubInfo?.teamsList && res.clubInfo.teamsList.length > 0) {
          setFfbbTeams(res.clubInfo.teamsList);
          try {
            localStorage.setItem('ffbb_club_teams_cache', JSON.stringify(res.clubInfo.teamsList));
          } catch (e) {}
        }
        
        const sourceInfo = "API FFBB Officielle (ffbb-api.desimone.fr)";
        const filterMsg = (syncStartDate || syncEndDate) 
          ? ` (filtré du ${formatDateToEuropean(syncStartDate)} au ${formatDateToEuropean(syncEndDate)})` 
          : '';
        setSyncMessage(`Synchronisation réussie (${sourceInfo})${filterMsg} ! ${filteredMatches.length} rencontres importées, ${filteredResults.length} résultats, et ${res.clubInfo?.teamsList?.length || ffbbTeams.length} équipes officielles.`);
      } else {
        setSyncMessage(res.message || 'Calendrier FFBB officiel interrogé : aucune rencontre programmée pour ce club.');
      }
    } catch (err) {
      console.error(err);
      setSyncMessage('Erreur de connexion à l\'API FFBB officielle.');
    } finally {
      setIsSyncingFFBB(false);
    }
  };

  // Excel upload handler
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setExcelSuccessMsg(null);
    setExcelErrors([]);

    try {
      const result = await parseExcelBirthdays(file);
      if (result.weekBirthdays && result.weekBirthdays.length > 0) {
        onUpdateBirthdays(result.weekBirthdays);
        setExcelSuccessMsg(
          `${result.weekBirthdays.length} anniversaire(s) cette semaine extrait(s) avec succès du fichier ${file.name} !`
        );
      } else if (result.totalParsed > 0) {
        setExcelSuccessMsg(`Fichier ${file.name} lu avec succès (${result.totalParsed} licenciés), mais aucun anniversaire ne tombe dans la semaine actuelle.`);
      } else if (result.errors && result.errors.length > 0) {
        setExcelErrors(result.errors);
      } else {
        setExcelErrors(['Aucun licencié trouvé dans ce fichier']);
      }
    } catch (err) {
      console.error(err);
      setExcelErrors(['Erreur inattendue lors du traitement du fichier Excel']);
    } finally {
      setIsParsingExcel(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  // Social Caption Generator Helper
  const getSocialCaption = (platform: 'instagram' | 'tiktok' | 'facebook', type: 'matches' | 'results') => {
    if (aiCustomCaptions[platform]) {
      return aiCustomCaptions[platform]!;
    }

    const clubName = clubSettings.name || clubSettings.shortName || 'Notre Club';
    const shortClub = clubSettings.shortName || 'BCVS';
    const insta = socialForm.instagramHandle || clubSettings.instagramHandle || '@bc_valdesaone';
    const fb = socialForm.facebookPage || clubSettings.facebookPage || 'BasketClubValDeSaone';
    const tiktok = socialForm.tiktokHandle || clubSettings.tiktokHandle || '@bcvs_basket';

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

        return `🔥 PROGRAMME DU WEEK-END • ${shortClub.toUpperCase()} 🔥\n\nVenez soutenir nos équipes en nombre ce week-end !\n\n📍 À DOMICILE (${clubSettings.gymnasiumDefault}) :\n${homeList}\n\n📍 À L'EXTÉRIEUR :\n${awayList}\n\nBuvette & ambiance au rendez-vous ! 🔴⚪\n.\n.\n#Basket #MatchDay #${shortClub.replace(/[^a-zA-Z0-9]/g, '')} #TeamSpirit #FFBB #Basketball #GameDay\n📲 Suivez-nous : ${insta}`;
      } else if (platform === 'tiktok') {
        return `C'est le match day pour ${shortClub} ! 🏀🔥 Qui sera là pour faire du bruit ce week-end ? Rendez-vous sur le terrain ! ⚡💥\n\n#basketball #basket #matchday #pourtoi #fyp #${shortClub.replace(/[^a-zA-Z0-9]/g, '')} #foryou #viral #hoops #bball @${tiktok.replace(/^@/, '')}`;
      } else {
        const homeList = buildGroupedMatchesText(homeMatches, true);
        const awayList = buildGroupedMatchesText(awayMatches, false);

        return `🏀 PROGRAMME DU WEEK-END — ${clubName.toUpperCase()} 🏀\n\nCe week-end, nos équipes sont d'attaque pour défendre nos couleurs ! Retrouvez ci-dessous le calendrier complet des rencontres :\n\n📍 À DOMICILE (${clubSettings.gymnasiumDefault}) :\n${homeList}\n\n📍 À L'EXTÉRIEUR :\n${awayList}\n\nBuvette et restauration sur place pour les matchs à domicile ! Venez encourager nos joueuses et joueurs ! 👏\n\nRetrouvez toute l'actualité du club sur notre page : fb.com/${fb}`;
      }
    } else {
      const wins = results.filter((r) => r.result === 'win').length;
      const losses = results.filter((r) => r.result === 'loss').length;

      if (platform === 'instagram') {
        const resultsList = results.map((r) => {
          const opponent = r.isHomeMatch ? r.teamAway : r.teamHome;
          const score = `${r.homeScore ?? '-'} - ${r.awayScore ?? '-'}`;
          return `${r.result === 'win' ? '✅' : '❌'} ${r.category} : ${score} (${r.isHomeMatch ? 'vs ' + opponent : '@ ' + opponent})`;
        }).join('\n');

        return `🏆 RÉSULTATS DU WEEK-END • ${shortClub.toUpperCase()} 🏆\n\nBilan de nos équipes : ${wins} Victoire(s) et ${losses} Défaite(s) ! 💥\n\n${resultsList}\n\nFélicitations à l'ensemble des joueuses, joueurs et entraîneurs pour leur engagement ! Merci également aux arbitres, OTM et supporters ! 👏❤️\n.\n.\n#BasketResultats #Victoire #${shortClub.replace(/[^a-zA-Z0-9]/g, '')} #Basket #FFBB #Team`;
      } else if (platform === 'tiktok') {
        return `Le bilan du week-end pour ${shortClub} : ${wins} Victoires et ${losses} Défaites ! 🏀🔥 Identifie ton coéquipier en commentaire 👇\n\n#basket #resultats #victoire #basketball #pourtoi #fyp #bball #hooper @${tiktok.replace(/^@/, '')}`;
      } else {
        const resultsList = results.map((r) => {
          const opponent = r.isHomeMatch ? r.teamAway : r.teamHome;
          const score = `${r.homeScore ?? '-'} - ${r.awayScore ?? '-'}`;
          return `• ${r.category} : ${score} contre ${opponent} (${r.result === 'win' ? 'VICTOIRE ✌️' : 'DÉFAITE'})`;
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

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto scrollbar-none text-xs md:text-sm">
          <button
            onClick={() => setActiveTab('matches')}
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
            onClick={() => setActiveTab('results')}
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
            onClick={() => setActiveTab('photos')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'photos'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Photos ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sponsors')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'sponsors'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-4 h-4 text-yellow-400" />
            <span>Sponsors ({sponsors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logos')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'logos'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-cyan-400" />
            <span>Banque Logos ({logos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'events'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Événements ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
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
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'templates'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Gabarits Graphiques</span>
          </button>

          <button
            onClick={() => setActiveTab('team_visuals')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'team_visuals'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Visuels Victoire/Défaite</span>
          </button>

          <button
            onClick={() => setActiveTab('social')}
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
            onClick={() => setActiveTab('telegram')}
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
            onClick={() => setActiveTab('ffbb')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'ffbb'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Sync FFBB</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'categories'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Paramètres Club & Carrousel</span>
          </button>

          <button
            onClick={() => setActiveTab('fullykiosk')}
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: MATCHS À VENIR */}
          {/* ========================================================================= */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
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
                </div>

                {/* Widget de Synchronisation Rapide FFBB Directe */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mt-2 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                        Synchronisation Rapide FFBB (Par dates)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
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
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium transition-all"
                        >
                          Effacer le filtre
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Date de début :</span>
                      <input
                        type="date"
                        value={syncStartDate}
                        onChange={(e) => setSyncStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Date de fin :</span>
                      <input
                        type="date"
                        value={syncEndDate}
                        onChange={(e) => setSyncEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncFFBB}
                      disabled={isSyncingFFBB}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFFBB ? 'animate-spin' : ''}`} />
                      <span>{isSyncingFFBB ? 'Synchronisation...' : 'Récupérer depuis la FFBB'}</span>
                    </button>
                  </div>

                  {syncMessage && (
                    <p className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
                      {syncMessage}
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
                </div>
              </div>

              {/* Liste des matchs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matches.map((m) => {
                  const isEditing = editingMatch?.id === m.id;
                  const isSelected = m.selectedForWeekend !== false;

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
                            <input
                              type="date"
                              value={editingMatch.date}
                              onChange={(e) => setEditingMatch({ ...editingMatch, date: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block text-[10px] font-bold mb-0.5">Heure :</label>
                            <input
                              type="time"
                              value={editingMatch.time}
                              onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })}
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

                  const isLive = isMatchLive(m);

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isLive
                          ? 'bg-red-950/20 border-red-500/50 shadow-md shadow-red-950/20'
                          : isSelected
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-90'
                      }`}
                    >
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Bouton rapide En cours / À venir */}
                        <button
                          type="button"
                          onClick={() => {
                            const newStatus: MatchStatus = isLive ? 'upcoming' : 'live';
                            const updated = matches.map((item) =>
                              item.id === m.id ? { ...item, status: newStatus } : item
                            );
                            onUpdateMatches(updated);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isLive
                              ? 'bg-red-600/30 text-red-300 border-red-500/60 hover:bg-red-600/50'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                          }`}
                          title={isLive ? 'Repasser en statut à venir' : 'Activer le mode EN COURS sur la TV'}
                        >
                          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`}></span>
                          <span className="hidden md:inline">{isLive ? 'En cours' : 'Mettre en cours'}</span>
                        </button>
                        <button
                          onClick={() => setEditingMatch({ ...m })}
                          className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition-all"
                          title="Modifier la date ou l'heure de ce match"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onUpdateMatches(matches.filter((item) => item.id !== m.id))}
                          className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all"
                          title="Supprimer ce match"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: RÉSULTATS DU WEEK-END */}
          {/* ========================================================================= */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-xl font-black text-white font-bebas tracking-wide flex items-center gap-2">
                    <span>RÉSULTATS ET SCORES DU WEEK-END ({results.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Saisissez les résultats des matchs pour les afficher dans le carrousel TV et générer les visuels Victoire/Défaite.
                  </p>
                </div>


              </div>

              {/* Formulaire de saisie rapide de résultat */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h4 className="text-sm font-black text-white font-bebas tracking-wide flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>SAISIR UN NOUVEAU RÉSULTAT</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Catégorie :</label>
                    <input
                      type="text"
                      placeholder="Ex: Seniors Garçons 1"
                      value={newResultCategory}
                      onChange={(e) => setNewResultCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Adversaire :</label>
                    <input
                      type="text"
                      placeholder="Ex: Basket Club Mâcon"
                      value={newResultOpponent}
                      onChange={(e) => setNewResultOpponent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Score Notre Club :</label>
                    <input
                      type="number"
                      placeholder="82"
                      value={newResultHomeScore}
                      onChange={(e) => setNewResultHomeScore(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Score Adversaire :</label>
                    <input
                      type="number"
                      placeholder="74"
                      value={newResultAwayScore}
                      onChange={(e) => setNewResultAwayScore(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-rose-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleAddResultManual}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Enregistrer ce résultat</span>
                  </button>
                </div>
              </div>

              {/* Liste des résultats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((r) => {
                  const isWin = (r.homeScore || 0) > (r.awayScore || 0);
                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
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
                          {r.date && r.date !== 'Week-end dernier' && (
                            <>
                              <span className="text-slate-400 font-mono text-[11px] font-bold">
                                {formatDateToEuropean(r.date)}
                              </span>
                              <span className="text-slate-600">•</span>
                            </>
                          )}
                          <span className={isWin ? 'text-emerald-300' : 'text-rose-300'}>
                            {isWin ? 'VICTOIRE' : 'DÉFAITE'}
                          </span>
                        </div>
                        <div className="text-base font-black text-white font-mono tracking-wider">
                          {r.teamHome} {r.homeScore} - {r.awayScore} {r.teamAway}
                        </div>
                      </div>

                      <button
                        onClick={() => onUpdateResults(results.filter((item) => item.id !== r.id))}
                        className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all shrink-0"
                        title="Supprimer ce résultat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PHOTOS DU CLUB */}
          {/* ========================================================================= */}
          {activeTab === 'photos' && (
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

              {/* Upload Box for Photos */}
              <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/80 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                <Camera className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER DES PHOTOS AU CARROUSEL TV
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Sélectionnez un fichier image (JPG, PNG). Les photos seront affichées en plein écran.
                </p>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Titre de la photo :</label>
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
                  <span>Choisir une photo ou vidéo (MP4/WebM)</span>
                  <input
                    type="file"
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaFileChange(file, handleAddPhoto);
                    }}
                  />
                </label>
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
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-32 object-cover"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] font-black bg-orange-500 text-slate-950 px-1 py-0.5 rounded uppercase">
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
          {activeTab === 'sponsors' && (
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

              <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/80 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                <Building2 className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER UN PARTENAIRE
                </h4>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-left">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Nom du Partenaire :</label>
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
                  <span>Déposer un logo ou clip vidéo partenaire</span>
                  <input
                    type="file"
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaFileChange(file, handleAddSponsor);
                    }}
                  />
                </label>
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
                            autoPlay
                            loop
                            muted
                            playsInline
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
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black bg-orange-500 text-slate-950 px-1 py-0.5 rounded uppercase">
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
          {activeTab === 'logos' && (
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

              {/* Upload Box for Logos */}
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER UN NOUVEAU LOGO / VIDÉO
                </h4>
                <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
                  Formats acceptés : PNG / SVG transparents, JPG, ou séquences vidéos courtes (MP4 / WebM).
                </p>

                <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nom du Logo / Média :</label>
                    <input
                      type="text"
                      placeholder="Ex: Logo Officiel HD ou Clip Animé"
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
                  <span>Importer un fichier (Image PNG/SVG ou Vidéo MP4)</span>
                  <input
                    type="file"
                    accept="image/*,video/*,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaFileChange(file, handleAddLogo);
                    }}
                  />
                </label>
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
                            autoPlay
                            loop
                            muted
                            playsInline
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
                          <span className="absolute bottom-1 right-1 text-[9px] font-black bg-cyan-500 text-slate-950 px-1 py-0.5 rounded uppercase">
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
          {activeTab === 'events' && (
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

              <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/80 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                <Sparkles className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                  AJOUTER UNE AFFICHE D'ÉVÉNEMENT
                </h4>

                <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Titre de l'événement :</label>
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
                    <span>Déposer l'affiche de l'événement</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileChange(file, (dataUrl) => handleAddEvent(dataUrl));
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
          {/* TAB 1: DOSSIERS IMAGES & DEPÔT */}
          {/* ========================================================================= */}
          {activeTab === 'folders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                    DÉPÔT D'IMAGES PAR DOSSIER DE CATÉGORIE
                  </h3>
                  <p className="text-xs text-slate-400">
                    Déposez vos photos, logos ou affiches directement dans le dossier correspondant pour alimenter la boucle de la télévision.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFolderCategory('photos')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                      selectedFolderCategory === 'photos'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Photos ({photos.length})</span>
                  </button>
                  <button
                    onClick={() => setSelectedFolderCategory('sponsors')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                      selectedFolderCategory === 'sponsors'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Sponsors ({sponsors.length})</span>
                  </button>
                  <button
                    onClick={() => setSelectedFolderCategory('events')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 ${
                      selectedFolderCategory === 'events'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Affiches Événements ({events.length})</span>
                  </button>
                </div>
              </div>

              {/* Sub-view: Photos Folder */}
              {selectedFolderCategory === 'photos' && (
                <div className="space-y-4">
                  {/* Upload Box for Photos */}
                  <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/80 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                    <Camera className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                    <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                      AJOUTER DES PHOTOS AU DOSSIER "VIE DU CLUB"
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                      Glissez vos photos ici ou sélectionnez un fichier image (JPG, PNG). Elles seront immédiatement intégrées au carrousel TV.
                    </p>

                    <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Titre de la photo :</label>
                        <input
                          type="text"
                          placeholder="Ex: Victoire en prolongation"
                          value={newPhotoTitle}
                          onChange={(e) => setNewPhotoTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Dossier / Équipe :</label>
                        <input
                          type="text"
                          placeholder="Ex: Seniors 1, Stages..."
                          value={newPhotoFolder}
                          onChange={(e) => setNewPhotoFolder(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                      <Upload className="w-4 h-4" />
                      <span>Choisir une photo sur l'ordinateur</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFileChange(file, handleAddPhoto);
                        }}
                      />
                    </label>
                  </div>

                  {/* Photo Gallery Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 group"
                      >
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-2">
                          <p className="text-xs font-bold text-white truncate">{p.title}</p>
                          <span className="text-[10px] text-orange-400 block">{p.categoryFolder || 'Général'}</span>
                        </div>
                        <button
                          onClick={() => onUpdatePhotos(photos.filter((item) => item.id !== p.id))}
                          className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-view: Sponsors Folder */}
              {selectedFolderCategory === 'sponsors' && (
                <div className="space-y-4">
                  {/* Upload Box for Sponsors */}
                  <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/80 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                    <Building2 className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                    <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                      AJOUTER UN SPONSOR OU PARTENAIRE
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                      Déposez le logo ou l'affiche du partenaire pour l'intégrer au carrousel TV.
                    </p>

                    <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-left">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-400 block mb-1">Nom de l'entreprise :</label>
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
                      <span>Déposer le logo du partenaire</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFileChange(file, handleAddSponsor);
                        }}
                      />
                    </label>
                  </div>

                  {/* Sponsors List */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {sponsors.map((sp) => (
                      <div
                        key={sp.id}
                        className="relative rounded-2xl p-3 border border-slate-800 bg-slate-950 flex flex-col items-center text-center group"
                      >
                        <div className="w-20 h-16 bg-white rounded-xl p-2 flex items-center justify-center mb-2">
                          <img
                            src={sp.logoUrl}
                            alt={sp.name}
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
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
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-view: Events Folder */}
              {selectedFolderCategory === 'events' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/80 rounded-3xl p-6 bg-slate-950/60 text-center transition-all">
                    <Sparkles className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                    <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                      AJOUTER UNE AFFICHE D'ÉVÉNEMENT (TOURNOI, SOIRÉE, STAGE)
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                      Cette affiche apparaîtra en plein écran dans la rotation TV.
                    </p>

                    <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Titre de l'événement :</label>
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

                    <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs cursor-pointer shadow-lg transition-all hover:scale-105">
                      <Upload className="w-4 h-4" />
                      <span>Déposer l'affiche de l'événement</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFileChange(file, (dataUrl) => handleAddEvent(dataUrl));
                        }}
                      />
                    </label>
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
                            className="w-full h-32 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="p-3">
                          <h4 className="text-sm font-black text-white font-bebas">{ev.title}</h4>
                          <p className="text-xs text-orange-400">{ev.date}</p>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GABARITS & VISUELS SUPPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 p-5 rounded-3xl border border-orange-500/30">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Layers className="w-4 h-4" />
                  <span>Emplacement pour vos futurs visuels supports</span>
                </div>
                <h3 className="text-xl font-black text-white font-bebas tracking-wide">
                  GABARITS & FONDS VISUELS DU CLUB
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl mt-1">
                  Vous avez mentionné que vous fournirez plus tard vos propres visuels supports pour les <strong>Matchs à venir</strong>, 
                  les <strong>Résultats du week-end précédent</strong> et les <strong>Anniversaires</strong>. 
                  Vous pouvez dès maintenant déposer ou remplacer l'image de fond ici en 1 clic. L'application appliquera automatiquement vos couleurs et textes par-dessus.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Template 1: Matchs */}
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-black text-white font-bebas">Gabarit Matchs à Venir</h4>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold">16:9 • Image / Vidéo</span>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-900 border border-slate-800 mb-3">
                      {isVideoMedia(visualTemplates.matchesBackgroundUrl) ? (
                        <video
                          src={visualTemplates.matchesBackgroundUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={visualTemplates.matchesBackgroundUrl}
                          alt="Gabarit Matchs"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-white px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                          {isVideoMedia(visualTemplates.matchesBackgroundUrl) ? 'Vidéo active' : 'Fond actif'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Ce fond ou vidéo habille l'affiche des rencontres du club du week-end.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Remplacer</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFileChange(file, (dataUrl) =>
                              onUpdateVisualTemplates({ ...visualTemplates, matchesBackgroundUrl: dataUrl })
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Template 2: Résultats */}
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-black text-white font-bebas">Gabarit Résultats Week-end</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">16:9 • Image / Vidéo</span>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-900 border border-slate-800 mb-3">
                      {isVideoMedia(visualTemplates.resultsBackgroundUrl) ? (
                        <video
                          src={visualTemplates.resultsBackgroundUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={visualTemplates.resultsBackgroundUrl}
                          alt="Gabarit Résultats"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-white px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                          {isVideoMedia(visualTemplates.resultsBackgroundUrl) ? 'Vidéo active' : 'Fond actif'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Utilisé pour la récapitulation des victoires et défaites passées.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Remplacer</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFileChange(file, (dataUrl) =>
                              onUpdateVisualTemplates({ ...visualTemplates, resultsBackgroundUrl: dataUrl })
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Template 3: Anniversaires */}
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-black text-white font-bebas">Gabarit Anniversaires</h4>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold">16:9 • Image / Vidéo</span>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-900 border border-slate-800 mb-3">
                      {isVideoMedia(visualTemplates.birthdaysBackgroundUrl) ? (
                        <video
                          src={visualTemplates.birthdaysBackgroundUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={visualTemplates.birthdaysBackgroundUrl}
                          alt="Gabarit Anniversaires"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-white px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                          {isVideoMedia(visualTemplates.birthdaysBackgroundUrl) ? 'Vidéo active' : 'Fond actif'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Utilisé pour afficher les licenciés fêtant leur anniversaire dans la semaine.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Remplacer</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFileChange(file, (dataUrl) =>
                              onUpdateVisualTemplates({ ...visualTemplates, birthdaysBackgroundUrl: dataUrl })
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: VISUELS ÉQUIPES (VICTOIRE / DÉFAITE) */}
          {/* ========================================================================= */}
          {activeTab === 'team_visuals' && (
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

          {/* ========================================================================= */}
          {/* TAB: PASSERELLE RÉSEAUX SOCIAUX (INSTAGRAM • TIKTOK • FACEBOOK) */}
          {/* ========================================================================= */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 p-5 rounded-3xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-pink-600/30">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          Passerelle Multi-Réseaux
                        </span>
                        <span className="text-xs text-slate-400">• Instagram, TikTok, Facebook</span>
                      </div>
                      <h3 className="text-2xl font-black text-white font-bebas tracking-wide mt-0.5">
                        DIFFUSION RÉSEAUX SOCIAUX • MATCHS & RÉSULTATS
                      </h3>
                    </div>
                  </div>

                  {onOpenVisualExporter && (
                    <button
                      onClick={() => onOpenVisualExporter(socialContentType)}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-pink-600/20 transition-all hover:scale-105 shrink-0"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Ouvrir le Studio Graphique Plein Écran</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Cette passerelle convertit automatiquement les données de vos <strong>Matchs à Venir</strong> et de vos <strong>Résultats du week-end</strong> (synchronisés avec la FFBB ou saisis manuellement) en visuels captivants et en légendes pré-formatées pour Instagram, TikTok et Facebook.
                </p>
              </div>

              {/* Selector: Matchs à Venir vs Résultats */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSocialContentType('matches')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${
                      socialContentType === 'matches'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Matchs à Venir ({matches.length})</span>
                  </button>

                  <button
                    onClick={() => setSocialContentType('results')}
                    className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-all ${
                      socialContentType === 'results'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                    <span>Résultats du week-end ({results.length})</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Gymnase par défaut :</span>
                  <span className="font-semibold text-slate-200 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                    {clubSettings.gymnasiumDefault}
                  </span>
                </div>
              </div>

              {/* Filtre de sélection du week-end pour la passerelle */}
              {socialContentType === 'matches' && (
                <div className="bg-slate-900/90 border border-pink-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white uppercase font-bebas tracking-wide">
                          SYNCHRONISATION AVEC LA SÉLECTION DU WEEK-END
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[11px] font-bold font-mono">
                          {matches.filter((m) => m.selectedForWeekend !== false).length} / {matches.length} matchs retenus
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Choisissez si les légendes et publications doivent inclure uniquement les rencontres cochées dans la sélection du week-end ou tous les matchs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSocialOnlySelectedMatches(true);
                        setAiCustomCaptions({});
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        socialOnlySelectedMatches
                          ? 'bg-pink-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Matchs cochés du week-end ({matches.filter((m) => m.selectedForWeekend !== false).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSocialOnlySelectedMatches(false);
                        setAiCustomCaptions({});
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !socialOnlySelectedMatches
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Tous les matchs ({matches.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Module Assistant IA Générateur de Légendes */}
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 rounded-3xl border border-purple-500/30 p-5 space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          IA Intégrée Gratuitement
                        </span>
                        <span className="text-xs text-slate-400">• Gemini 2.5 Flash</span>
                      </div>
                      <h4 className="text-lg font-black text-white font-bebas tracking-wide mt-0.5">
                        ASSISTANT RÉDACTEUR IA • GÉNÉRATION DE TEXTES & LÉGENDES
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateAICaption('all')}
                    disabled={aiLoading}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Générer les légendes avec l'IA</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Ton & Style */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>Ton & Style de rédaction :</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiTone('supporter')}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                          aiTone === 'supporter'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span>🔥 Survolté / Supporter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiTone('officiel')}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                          aiTone === 'officiel'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>🏛️ Officiel / Club</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiTone('fun')}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                          aiTone === 'fun'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>⚡ TikTok / Jeune</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiTone('buvette')}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                          aiTone === 'buvette'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Cake className="w-3.5 h-3.5 text-pink-400" />
                        <span>🍿 Buvette & Ambiance</span>
                      </button>
                    </div>
                  </div>

                  {/* Consignes spéciales */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>Instruction spéciale ou événement du jour (optionnel) :</span>
                    </label>
                    <input
                      type="text"
                      value={aiExtraContext}
                      onChange={(e) => setAiExtraContext(e.target.value)}
                      placeholder="Ex: Soirée crêpes à la buvette, entrée gratuite, derby contre Charolles..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>L'IA adaptera automatiquement les textes selon vos consignes.</span>
                      {Object.keys(aiCustomCaptions).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setAiCustomCaptions({})}
                          className="text-purple-400 hover:underline font-bold"
                        >
                          Réinitialiser les textes
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Petit diviseur et Outil de Réécriture */}
                <div className="border-t border-purple-500/20 pt-4 mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                    <h5 className="text-xs font-bold text-purple-200 tracking-wider uppercase">
                      OPTIMISEUR & CORRECTEUR DE TEXTE RAPIDE (IA GEMINI)
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Saisissez un texte brut en vrac ci-dessous (brouillon de match, annonce de dernière minute) : l'IA va le corriger, l'embellir et vous pourrez ensuite l'appliquer directement à vos réseaux d'un clic !
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Saisie brute et consignes */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-300">Votre texte brut / brouillon :</span>
                        <textarea
                          value={customRewriteInput}
                          onChange={(e) => setCustomRewriteInput(e.target.value)}
                          placeholder="Saisissez votre texte brut ici... Ex: victoire facile des seniors filles contre Macon 78 a 42, match difficile mais super ambiance !"
                          rows={3}
                          className="w-full bg-slate-950 rounded-xl p-2.5 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-300">Consignes de style de l'IA (Ex: limiter les emojis, écrire comme le coach...) :</span>
                        <input
                          type="text"
                          value={customRewriteInstructions}
                          onChange={(e) => setCustomRewriteInstructions(e.target.value)}
                          placeholder="Ex: Limiter les émojis à 2 maximum, écrire avec l'autorité du coach..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCustomRewrite}
                        disabled={isRewriting || !customRewriteInput.trim()}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                      >
                        {isRewriting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Correction et amélioration en cours...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                            <span>Corriger & Améliorer le texte par l'IA</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Proposition de l'IA et Boutons d'application */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400">Proposition optimisée par l'IA :</span>
                          {customRewriteOutput && (
                            <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                              Prêt à appliquer
                            </span>
                          )}
                        </div>
                        {customRewriteOutput ? (
                          <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            {customRewriteOutput}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic flex items-center justify-center h-28 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 text-center px-4">
                            Saisissez un texte à gauche et cliquez sur "Corriger & Améliorer" pour voir la proposition de l'IA ici.
                          </div>
                        )}
                      </div>

                      {customRewriteOutput && (
                        <div className="space-y-2 pt-1 border-t border-slate-900">
                          <span className="text-[10px] font-bold text-slate-400 block">Injecter cette proposition dans :</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApplyRewriteToPlatform('instagram')}
                              className="py-1.5 px-2 rounded-lg bg-pink-950/40 hover:bg-pink-900 text-pink-300 border border-pink-500/20 font-bold text-[10px] transition-all text-center"
                            >
                              Instagram 📸
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyRewriteToPlatform('tiktok')}
                              className="py-1.5 px-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/20 font-bold text-[10px] transition-all text-center"
                            >
                              TikTok ⚡
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyRewriteToPlatform('facebook')}
                              className="py-1.5 px-2 rounded-lg bg-blue-950/40 hover:bg-blue-900 text-blue-300 border border-blue-500/20 font-bold text-[10px] transition-all text-center"
                            >
                              Facebook 👥
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyRewriteToPlatform('all')}
                              className="py-1.5 px-2 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-500/40 font-black text-[10px] transition-all text-center col-span-2 sm:col-span-1"
                            >
                              Partout ✨
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Anti-Doublon & Preparation Checklist (Trame 1 par 1) */}
              <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-base font-black text-white font-bebas tracking-wide">
                      PRÉPARATION 1 PAR 1 À PARTIR D'UNE TRAME • SUIVI ANTI-DOUBLONS
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {socialContentType === 'matches' ? `${matches.length} matchs` : `${results.length} résultats`} •{' '}
                    <strong className="text-emerald-400">
                      {socialContentType === 'matches'
                        ? matches.filter((m) => preparedItemIds.includes(m.id)).length
                        : results.filter((r) => preparedItemIds.includes(r.id)).length} prêts
                    </strong>
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Cochez chaque affiche au fur et à mesure que vous la préparez ou la publiez pour éviter tout doublon de publication.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                  {socialContentType === 'matches'
                    ? matches.map((m) => {
                        const isPrep = preparedItemIds.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                              isPrep
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                                : 'bg-slate-950 border-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-400">
                                <span>{m.category}</span>
                                <span className="text-slate-600">•</span>
                                <span>{m.time}</span>
                              </div>
                              <div className="text-xs font-bold text-white truncate">
                                {m.teamHome} vs {m.teamAway}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => togglePreparedItem(m.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                                isPrep
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isPrep ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Prêt / Publié</span>
                                </>
                              ) : (
                                <span>Marquer comme prêt</span>
                              )}
                            </button>
                          </div>
                        );
                      })
                    : results.map((r) => {
                        const isPrep = preparedItemIds.includes(r.id);
                        return (
                          <div
                            key={r.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                              isPrep
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                                : 'bg-slate-950 border-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                                <span>{r.category}</span>
                                <span className="text-slate-600">•</span>
                                <span>Score : {r.homeScore} - {r.awayScore}</span>
                              </div>
                              <div className="text-xs font-bold text-white truncate">
                                {r.teamHome} vs {r.teamAway}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => togglePreparedItem(r.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                                isPrep
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isPrep ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Prêt / Publié</span>
                                </>
                              ) : (
                                <span>Marquer comme prêt</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                </div>
              </div>

              {/* Grid: 3 Platform Captions (Instagram, TikTok, Facebook) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. INSTAGRAM */}
                <div className="bg-slate-900/90 rounded-3xl border border-pink-500/20 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 flex items-center justify-center text-white">
                          <Instagram className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Instagram (Post & Story)</h4>
                          <span className="text-[10px] text-slate-400">Format 1:1 Carré ou 9:16 Story</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGenerateAICaption('instagram')}
                          disabled={aiLoading}
                          title="Régénérer avec l'IA"
                          className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 text-pink-300 border border-pink-500/20 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <span className="text-[11px] font-mono font-bold text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded-md border border-pink-500/20">
                          {socialForm.instagramHandle}
                        </span>
                      </div>
                    </div>

                    <textarea
                      value={getSocialCaption('instagram', socialContentType)}
                      onChange={(e) => setAiCustomCaptions((prev) => ({ ...prev, instagram: e.target.value }))}
                      rows={8}
                      className="w-full bg-slate-950 rounded-2xl p-3.5 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto focus:outline-none focus:border-pink-500 resize-none"
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleCopySocialCaption('instagram', getSocialCaption('instagram', socialContentType))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        socialCopiedPlatform === 'instagram'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white'
                      }`}
                    >
                      {socialCopiedPlatform === 'instagram' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{socialCopiedPlatform === 'instagram' ? 'Légende Copiée !' : 'Copier la Légende'}</span>
                    </button>

                    <a
                      href="https://www.instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Ouvrir Instagram"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 2. TIKTOK */}
                <div className="bg-slate-900/90 rounded-3xl border border-cyan-500/20 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-cyan-400 font-bold">
                          <Flame className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">TikTok & Shorts</h4>
                          <span className="text-[10px] text-slate-400">Format Vertical 9:16 Plein Écran</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGenerateAICaption('tiktok')}
                          disabled={aiLoading}
                          title="Régénérer avec l'IA"
                          className="p-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/20 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          {socialForm.tiktokHandle}
                        </span>
                      </div>
                    </div>

                    <textarea
                      value={getSocialCaption('tiktok', socialContentType)}
                      onChange={(e) => setAiCustomCaptions((prev) => ({ ...prev, tiktok: e.target.value }))}
                      rows={8}
                      className="w-full bg-slate-950 rounded-2xl p-3.5 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto focus:outline-none focus:border-cyan-500 resize-none"
                    />

                    <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-2.5 text-[11px] text-cyan-300 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                      <span>💡 <strong>Conseil TikTok :</strong> Ajoutez une musique tendance ("Trap Basket" ou "Hip Hop Workout") lors de la publication !</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleCopySocialCaption('tiktok', getSocialCaption('tiktok', socialContentType))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        socialCopiedPlatform === 'tiktok'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {socialCopiedPlatform === 'tiktok' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{socialCopiedPlatform === 'tiktok' ? 'Texte Copié !' : 'Copier le Texte TikTok'}</span>
                    </button>

                    <a
                      href="https://www.tiktok.com/creator-center/upload"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Ouvrir TikTok Studio"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 3. FACEBOOK */}
                <div className="bg-slate-900/90 rounded-3xl border border-blue-500/20 p-5 flex flex-col justify-between shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                          <Facebook className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Facebook (Page & Groupe)</h4>
                          <span className="text-[10px] text-slate-400">Post avec détails gymnase & buvette</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGenerateAICaption('facebook')}
                          disabled={aiLoading}
                          title="Régénérer avec l'IA"
                          className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-500/20 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-500/20">
                          {socialForm.facebookPage}
                        </span>
                      </div>
                    </div>

                    <textarea
                      value={getSocialCaption('facebook', socialContentType)}
                      onChange={(e) => setAiCustomCaptions((prev) => ({ ...prev, facebook: e.target.value }))}
                      rows={8}
                      className="w-full bg-slate-950 rounded-2xl p-3.5 border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleCopySocialCaption('facebook', getSocialCaption('facebook', socialContentType))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        socialCopiedPlatform === 'facebook'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {socialCopiedPlatform === 'facebook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{socialCopiedPlatform === 'facebook' ? 'Post Copié !' : 'Copier le Post Facebook'}</span>
                    </button>

                    <a
                      href="https://www.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Ouvrir Facebook"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Account Settings & Webhook Section */}
              <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="text-lg font-black text-white font-bebas tracking-wide">
                      PARAMÈTRES DES COMPTES SOCIAUX & PASSERELLE AUTOMATIQUE (WEBHOOK)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Renseignez les identifiants de votre club pour personnaliser automatiquement les textes et configurez une passerelle Webhook (Make, Zapier, n8n ou Meta API).
                    </p>
                  </div>

                  {socialSaveSuccess && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Paramètres sauvegardés avec succès !
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveSocialSettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-pink-400" />
                        <span>Compte Instagram</span>
                      </label>
                      <input
                        type="text"
                        value={socialForm.instagramHandle}
                        onChange={(e) => setSocialForm({ ...socialForm, instagramHandle: e.target.value })}
                        placeholder="@bc_valdesaone"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-pink-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Compte TikTok</span>
                      </label>
                      <input
                        type="text"
                        value={socialForm.tiktokHandle}
                        onChange={(e) => setSocialForm({ ...socialForm, tiktokHandle: e.target.value })}
                        placeholder="@bcvs_basket"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5 text-blue-400" />
                        <span>Page Facebook</span>
                      </label>
                      <input
                        type="text"
                        value={socialForm.facebookPage}
                        onChange={(e) => setSocialForm({ ...socialForm, facebookPage: e.target.value })}
                        placeholder="BasketClubValDeSaone"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
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
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-orange-600/20 transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer les comptes sociaux</span>
                    </button>
                  </div>
                </form>
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
          {/* TAB 7: ANNIVERSAIRES (EXCEL) */}
          {/* ========================================================================= */}
          {activeTab === 'excel' && (
            <div className="space-y-6">
              <div className="bg-slate-800/60 p-5 rounded-3xl border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                    EXTRACTION AUTOMATIQUE DES ANNIVERSAIRES DEPUIS EXCEL
                  </h3>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Déposez votre fichier Excel (.xlsx, .xls) ou CSV de vos licenciés. L'application filtre automatiquement les personnes fêtant leur anniversaire dans la semaine en cours.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={generateClubBirthdayTemplate}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>Télécharger modèle Excel</span>
                  </button>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-3xl p-8 bg-slate-950/60 text-center transition-all">
                <Cake className="w-12 h-12 text-pink-400 mx-auto mb-3" />
                <h4 className="text-xl font-black text-white font-bebas tracking-wide">
                  IMPORTER LE FICHIER DES LICENCIÉS DU CLUB
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                  Colonnes détectées automatiquement : Nom, Prénom, Date de Naissance, Équipe / Catégorie.
                </p>

                <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs md:text-sm cursor-pointer shadow-lg shadow-pink-600/20 transition-all hover:scale-105">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isParsingExcel ? 'Extraction en cours...' : 'Sélectionner le fichier Excel (.xlsx)'}</span>
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

              {/* Current Birthdays preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Anniversaires enregistrés pour cette semaine ({birthdays.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {birthdays.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{b.fullName}</p>
                        <p className="text-xs text-pink-400">{b.birthDayFormatted} {b.age ? `(${b.age} ans)` : ''}</p>
                        <span className="text-[10px] text-slate-400">{b.teamCategory}</span>
                      </div>
                      <button
                        onClick={() => onUpdateBirthdays(birthdays.filter((item) => item.id !== b.id))}
                        className="p-1 text-slate-500 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
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
                        <span>Filtre par dates / calendrier (Évite d'importer toute la saison) :</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Sélectionnez une période pour ne synchroniser que les matchs de ce week-end ou de ces dates.
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Date de début :</span>
                      <input
                        type="date"
                        value={syncStartDate}
                        onChange={(e) => setSyncStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Date de fin :</span>
                      <input
                        type="date"
                        value={syncEndDate}
                        onChange={(e) => setSyncEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {syncMessage && (
                  <p className="text-xs text-emerald-400 font-medium bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30">
                    {syncMessage}
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

              {/* FFBB Teams Overview */}
              <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-orange-400" />
                    <h3 className="text-lg font-black text-white font-bebas tracking-wide">
                      TOUTES LES ÉQUIPES DU CLUB ({ffbbTeams.length} ÉQUIPES OFFICIELLES FFBB)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> API FFBB Directe
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Équipes officielles engagées par <strong>{clubSettings.name}</strong> ({clubSettings.codeFFBB}) pour la saison en cours, directement récupérées du registre FFBB :
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ffbbTeams.map((team, idx) => (
                    <div
                      key={team.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-2 hover:border-orange-500/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">{team.name}</span>
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
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20 block">
                          {team.matchesCount} matchs
                        </span>
                        <span className="text-[9px] text-slate-500 mt-1 block">OK FFBB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
