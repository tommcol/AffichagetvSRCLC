import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Download,
  X,
  Share2,
  Sparkles,
  Trophy,
  Calendar,
  Check,
  Smartphone,
  Instagram,
  Facebook,
  ExternalLink,
  Copy,
  Send,
  Zap,
  Radio,
  Flame,
  CheckCircle2,
  Image as ImageIcon,
  Home,
  Navigation,
  PauseCircle,
  Layers,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Eye,
  EyeOff,
  Palette,
  Upload,
  Trash2,
  Plus,
  Sun,
  RotateCcw,
  Maximize2,
  Type,
  AlertCircle,
  Wand2,
  Loader2,
  Film,
} from 'lucide-react';
import { safeExportPosterToDataUrl, PosterAspectRatio, POSTER_DIMENSIONS } from '../utils/posterExporter';
import { MatchItem, BirthdayItem, ClubSettings, FinishedMatchNotification, VisualTemplatesConfig, FontFamilyOption, CategorySlideTheme, SlideDesignTheme } from '../types';
import { formatMatchDayAndDate, sortMatchesChronologically } from '../utils/matchDateHelper';
import { getEffectiveCategoryConfig } from '../utils/themeUtils';
import { AVAILABLE_FONTS, getFontFamilyClass } from '../utils/fontUtils';
import { isMatchWin, isClubHomeMatch, isMatchLive, isMatchFinished } from '../utils/matchStatus';
import { generateSocialCaptions, isExemptItem } from '../utils/socialCaptionGenerator';
import {
  getWeekendMatches,
  getWeekendResults,
  getPosterItemCounts,
  filterPosterItems,
  getMaxDisplayMatches,
  getTotalPages,
  paginatePosterItems,
} from '../utils/posterDataHelpers';
import {
  resolvePosterBackgroundUrl,
  resolveLayerMediaUrl,
} from '../utils/posterVisualHelpers';
import {
  getLayer2Settings,
  mergeLayer2TemplateSetting,
} from '../utils/posterLayer2Helpers';
import {
  getLayer3PositionClass,
  getLayer3TransformOrigin,
  getLayer3Transform,
  getLayer4PositionClass,
  getLayer4TransformOrigin,
} from '../utils/posterLayerHelpers';
import { readFileAsDataUrl } from '../utils/fileReaderHelpers';
import {
  formatPosterMatchDate,
  formatTeamNameForBadge,
} from '../utils/posterFormattingHelpers';
import { AutoFitTeamName } from './AutoFitTeamName';
import { StudioGraphiqueWorkbench } from './Admin/StudioGraphiqueWorkbench';
import { MediaBankSelectorModal } from './Admin/MediaBankSelectorModal';
import { getPosterBadgeTitle } from '../utils/posterBadgeHelpers';
import {
  getPosterItemKey,
  filterCaptionItems,
  toggleCaptionItemSelection,
} from '../utils/posterCaptionSelectionHelpers';
import {
  getPosterExportFilterLabel,
  getPosterExportRatioLabel,
  getPosterExportPageSuffix,
} from '../utils/posterExportNamingHelpers';
import {
  getSocialCaptionForPlatform,
} from '../utils/posterSocialPlatformHelpers';
import {
  buildPosterAiCaptionRequestPayload,
  buildPosterAiCaptionRewritePayload,
  requestPosterAiCaption,
} from '../utils/posterAiCaptionHelpers';
import { buildPosterExportFilename } from '../utils/posterExportFilenameHelpers';
import { copyTextToClipboard } from '../utils/clipboardHelpers';
import { buildPosterShareTitle } from '../utils/posterShareTextHelpers';
import { buildPosterShareFilename } from '../utils/posterShareFilenameHelpers';
import { getPosterContentItems } from '../utils/posterContentHelpers';
import { getInitialPosterContentType } from '../utils/posterContentTypeHelpers';
import { getAvailablePosterFilter } from '../utils/posterFilterHelpers';
import { getPosterPublicationItems } from '../utils/posterPublicationHelpers';
import { buildPosterSocialWebhookPayload } from '../utils/posterWebhookHelpers';
import { getPosterClubDisplayNames } from '../utils/posterClubHelpers';
import {
  calculatePosterPreviewScale,
  calculateInitialPosterPreviewScale,
} from '../utils/posterPreviewHelpers';
import { buildPosterColorSettings } from '../utils/posterColorHelpers';
import type {
  PosterFilterType,
  PosterThemeType,
  PosterSocialTab,
  PosterRightPanelTab,
  PosterMobileTab,
  PosterContentType,
  PosterInitialContentType,
  PosterSocialPlatform,
} from '../utils/posterTypes';
import defaultPosterBg from '../assets/images/poster_basketball_court_bg_1789586468398.jpg';
import { ContentTypeResultsSection } from './posterSections/ContentTypeResultsSection';
import { VisualThemePosterRedSection } from './posterSections/VisualThemePosterRedSection';
import { VisualThemeBrickSection } from './posterSections/VisualThemeBrickSection';
import { VisualThemeModernSection } from './posterSections/VisualThemeModernSection';
import { RightPanelTabSocialSection } from './posterSections/RightPanelTabSocialSection';


export type { PosterAspectRatio } from '../utils/posterExporter';
export { POSTER_DIMENSIONS } from '../utils/posterExporter';

interface VisualExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: PosterInitialContentType;
  matches: MatchItem[];
  results: MatchItem[];
  birthdays?: BirthdayItem[];
  clubSettings: ClubSettings;
  specificNotification?: FinishedMatchNotification | null;
  visualTemplates?: VisualTemplatesConfig;
  onUpdateVisualTemplates?: (config: VisualTemplatesConfig) => void;
  embeddedInTab?: boolean;
}







export const VisualExporterModal: React.FC<VisualExporterModalProps> = ({
  isOpen,
  onClose,
  type: initialType,
  matches,
  results,
  birthdays = [],
  clubSettings,
  specificNotification,
  visualTemplates,
  onUpdateVisualTemplates,
  embeddedInTab = false,
}) => {
  const {
    shortName: safeShortName,
    name: safeClubName,
    gymnasium: safeGymnasium,
  } = getPosterClubDisplayNames(clubSettings);

  const [contentType, setContentType] = useState<PosterContentType>(
    getInitialPosterContentType(initialType)
  );

  // Default to 4:5 portrait (1080x1350 for Instagram / Facebook - directly matching user reference images!)
  const [aspectRatio, setAspectRatio] = useState<PosterAspectRatio>('4:5');
  
  // Flagship theme matching user's template and photos: 'poster-red'
  const [visualTheme, setVisualTheme] = useState<PosterThemeType>('poster-red');
  
  // Filter for matches poster: Domicile, Extérieur, Exempt, or All
  const [posterFilter, setPosterFilter] = useState<PosterFilterType>('home');
  
  // Optional custom badge title override
  const [customBadgeTitle, setCustomBadgeTitle] = useState<string>('');

  // Background image customization
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [mediaBankTarget, setMediaBankTarget] = useState<'background' | 'layer3' | 'layer4' | null>(null);

  // Calque 1 (Arrière-plan / Fond) visual settings
  const [layer1Brightness, setLayer1Brightness] = useState<number>(0.55); // 0.1 to 1.5 (default 55%)
  const [layer1Blur, setLayer1Blur] = useState<number>(6); // 0 to 25 px (default 6px)
  const [layer1Scale, setLayer1Scale] = useState<number>(1.05); // 1.0 to 2.5 (default 105%)
  const [layer1Grayscale, setLayer1Grayscale] = useState<boolean>(true); // default N&B
  const [layer1Contrast, setLayer1Contrast] = useState<number>(1.25); // 0.8 to 2.0 (default 125%)

  const [selectedSocialTab, setSelectedSocialTab] = useState<PosterSocialTab>('instagram');
  const [rightPanelTab, setRightPanelTab] = useState<PosterRightPanelTab>('social');

  // Social Media Text Proposals & Match Selection State
  const [selectedItemKeysForCaption, setSelectedItemKeysForCaption] = useState<string[] | null>(null);
  const [captionStyleProposal, setCaptionStyleProposal] = useState<'standard' | 'short' | 'hype'>('standard');
  const [customCaptions, setCustomCaptions] = useState<{ instagram?: string; tiktok?: string; facebook?: string }>({});
  const [isCustomCaptionEdited, setIsCustomCaptionEdited] = useState<{ instagram?: boolean; tiktok?: boolean; facebook?: boolean }>({});
  
  // AI Caption Generator state
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiTone, setAiTone] = useState<'supporter' | 'officiel' | 'fun' | 'ambiance'>('supporter');
  const [aiExtraContext, setAiExtraContext] = useState<string>('');
  const [previousAiCaption, setPreviousAiCaption] = useState<string | null>(null);
  const [showAiRewriteBox, setShowAiRewriteBox] = useState<boolean>(false);
  const [customRewriteInstructions, setCustomRewriteInstructions] = useState<string>('');
  const [isRewriting, setIsRewriting] = useState<boolean>(false);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  // Logical document dimensions source of truth for the current aspect ratio
  const targetDims = POSTER_DIMENSIONS[aspectRatio] || POSTER_DIMENSIONS['4:5'];

  // Zoom de prévisualisation adaptatif calculé dynamiquement
  // La composition reste 100% rigide et native (1080p), seule la vue d'aperçu zoome
  const [previewScale, setPreviewScale] = useState<number>(() =>
    calculateInitialPosterPreviewScale(
      typeof window !== 'undefined' ? window.innerWidth : 0
    )
  );

  useEffect(() => {
    const updateScale = () => {
      if (!previewWrapperRef.current) return;
      const containerWidth = previewWrapperRef.current.clientWidth;
      if (containerWidth > 0) {
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
        setPreviewScale(
          calculatePosterPreviewScale(
            containerWidth,
            viewportHeight,
            targetDims.width,
            targetDims.height
          )
        );
      }
    };

    updateScale();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && previewWrapperRef.current) {
      ro = new ResizeObserver(updateScale);
      ro.observe(previewWrapperRef.current);
    }
    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      if (ro) ro.disconnect();
    };
  }, [aspectRatio, targetDims.width, targetDims.height]);

  // Active matches selection
  const weekendMatches = useMemo(
    () => getWeekendMatches(matches),
    [matches]
  );

  // Active results selection
  const weekendResults = useMemo(
    () => getWeekendResults(results),
    [results]
  );

  // Counts per filter category to grey out empty filter buttons
  const matchCounts = useMemo(
    () => getPosterItemCounts(weekendMatches, isExemptItem),
    [weekendMatches]
  );

  const resultCounts = useMemo(
    () => getPosterItemCounts(weekendResults, isExemptItem),
    [weekendResults]
  );

  // Auto-reset filter to 'all' if active filter has 0 items
  useEffect(() => {
    const counts = contentType === 'matches' ? matchCounts : resultCounts;

    const nextFilter = getAvailablePosterFilter(posterFilter, counts);
    if (nextFilter !== posterFilter) {
      setPosterFilter(nextFilter);
    }
  }, [posterFilter, contentType, matchCounts.home, matchCounts.away, matchCounts.exempt, resultCounts.home, resultCounts.away, resultCounts.exempt]);

  // Filter matches based on posterFilter (DOMICILE / EXTÉRIEUR / EXEMPT / ALL)
  const filteredMatches = useMemo(
    () => filterPosterItems(weekendMatches, posterFilter, isExemptItem),
    [weekendMatches, posterFilter]
  );

  // Filter results based on posterFilter (DOMICILE / EXTÉRIEUR / EXEMPT / ALL)
  const filteredResults = useMemo(
    () => filterPosterItems(weekendResults, posterFilter, isExemptItem),
    [weekendResults, posterFilter]
  );

  // Compute effective header badge title
  const badgeTitle = useMemo(
    () =>
      getPosterBadgeTitle({
        customBadgeTitle,
        contentType,
        posterFilter,
        isWin: specificNotification?.isWin,
      }),
    [customBadgeTitle, contentType, posterFilter, specificNotification?.isWin]
  );

  // Mode d'affichage mobile : 'preview' (Affiche en direct + téléchargement) ou 'settings' (Options & Calques)
  const [mobileTab, setMobileTab] = useState<PosterMobileTab>('preview');

  // Limit of matches to display per visual (auto or manual 3-6)
  const [matchesLimit, setMatchesLimit] = useState<number | 'auto'>('auto');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Background source selection
  const [bgSource, setBgSource] = useState<'default' | 'studio' | 'custom'>('studio');

  // Studio Graphique effective category config (Layer 1, Layer 3, Layer 4)
  const categoryType = contentType === 'results' ? 'results' : 'matches';
  const effectiveCategoryConfig = useMemo(() => {
    return getEffectiveCategoryConfig(categoryType, visualTemplates, clubSettings);
  }, [categoryType, visualTemplates, clubSettings]);

  // Calque 2 (Cartes, Polices & Pastilles) controls
  const [layer2PrimaryColor, setLayer2PrimaryColor] = useState<string>('#c80815');
  const [layer2TextColor, setLayer2TextColor] = useState<string>('#ffffff');
  const [layer2BadgeBgColor, setLayer2BadgeBgColor] = useState<string>('#c80815');
  const [layer2BadgeTextColor, setLayer2BadgeTextColor] = useState<string>('#ffffff');
  const [layer2FontHeader, setLayer2FontHeader] = useState<FontFamilyOption>('Bebas Neue');
  const [layer2FontBody, setLayer2FontBody] = useState<FontFamilyOption>('Montserrat');
  const [resultDisplayMode, setResultDisplayMode] = useState<'both' | 'score' | 'status'>('both');

  const updateTemplateSetting = (partial: Partial<CategorySlideTheme>) => {
    if (partial.primaryColor !== undefined) setLayer2PrimaryColor(partial.primaryColor);
    if (partial.textColor !== undefined) setLayer2TextColor(partial.textColor);
    if (partial.badgeBgColor !== undefined) setLayer2BadgeBgColor(partial.badgeBgColor);
    if (partial.badgeTextColor !== undefined) setLayer2BadgeTextColor(partial.badgeTextColor);
    if (partial.fontFamilyHeader !== undefined) setLayer2FontHeader(partial.fontFamilyHeader);
    if (partial.fontFamilyBody !== undefined) setLayer2FontBody(partial.fontFamilyBody);
    if (partial.resultDisplayMode !== undefined) setResultDisplayMode(partial.resultDisplayMode);

    if (onUpdateVisualTemplates && visualTemplates) {
      onUpdateVisualTemplates(
        mergeLayer2TemplateSetting(
          visualTemplates,
          categoryType,
          partial
        )
      );
    }
  };

  const handleColorChange = (
    primary?: string,
    text?: string,
    badgeBg?: string,
    badgeText?: string
  ) => {
    updateTemplateSetting(
      buildPosterColorSettings(primary, text, badgeBg, badgeText)
    );
  };

  useEffect(() => {
    if (!effectiveCategoryConfig?.categoryTheme) return;

    const settings = getLayer2Settings(
      effectiveCategoryConfig.categoryTheme
    );

    if (settings.primaryColor) {
      setLayer2PrimaryColor(settings.primaryColor);
    }

    if (settings.textColor) {
      setLayer2TextColor(settings.textColor);
    }

    if (settings.badgeBgColor) {
      setLayer2BadgeBgColor(settings.badgeBgColor);
    }

    if (settings.badgeTextColor) {
      setLayer2BadgeTextColor(settings.badgeTextColor);
    }

    if (settings.fontFamilyHeader) {
      setLayer2FontHeader(settings.fontFamilyHeader);
    }

    if (settings.fontFamilyBody) {
      setLayer2FontBody(settings.fontFamilyBody);
    }

    if (settings.resultDisplayMode) {
      setResultDisplayMode(settings.resultDisplayMode);
    }
  }, [effectiveCategoryConfig]);

  // Calque 1 : synchronisation des réglages du fond depuis le Studio
  // (luminosité et flou choisis dans StudioGraphiqueWorkbench -> Calque 1)
  useEffect(() => {
    if (!effectiveCategoryConfig?.categoryTheme) return;

    if (effectiveCategoryConfig.categoryTheme.backgroundBrightness !== undefined) {
      setLayer1Brightness(effectiveCategoryConfig.categoryTheme.backgroundBrightness);
    }

    if (effectiveCategoryConfig.categoryTheme.backgroundBlur !== undefined) {
      setLayer1Blur(effectiveCategoryConfig.categoryTheme.backgroundBlur);
    }
  }, [effectiveCategoryConfig]);

  // Calque 3 (Élément libre 1) controls
  const [customLayer3Image, setCustomLayer3Image] = useState<string | null>(null);
  const [showStudioLayer3, setShowStudioLayer3] = useState<boolean>(true);
  const [studioLayer3Pos, setStudioLayer3Pos] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'center'>('bottom-right');
  const [studioLayer3Scale, setStudioLayer3Scale] = useState<number>(0.85);
  const layer3FileInputRef = useRef<HTMLInputElement>(null);

  // Calque 4 (Sponsor / Logo Studio) controls
  const [customLayer4Image, setCustomLayer4Image] = useState<string | null>(null);
  const [showStudioLayer4, setShowStudioLayer4] = useState<boolean>(true);
  const [studioLayer4Pos, setStudioLayer4Pos] = useState<'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('top-right');
  const [studioLayer4Scale, setStudioLayer4Scale] = useState<number>(0.75);
  const layer4FileInputRef = useRef<HTMLInputElement>(null);

  // Effective Layer 3 and Layer 4 URLs
  const effectiveLayer3Url = useMemo(
    () =>
      resolveLayerMediaUrl(
        customLayer3Image,
        effectiveCategoryConfig.layer3?.mediaUrl
      ),
    [customLayer3Image, effectiveCategoryConfig.layer3?.mediaUrl]
  );

  const effectiveLayer4Url = useMemo(
    () =>
      resolveLayerMediaUrl(
        customLayer4Image,
        effectiveCategoryConfig.layer4?.mediaUrl
      ),
    [customLayer4Image, effectiveCategoryConfig.layer4?.mediaUrl]
  );

  const handleLayer3Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCustomLayer3Image(dataUrl);
      setShowStudioLayer3(true);
    } catch (error) {
      console.error('Erreur lecture fichier calque 3:', error);
    }
  };

  const handleLayer4Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCustomLayer4Image(dataUrl);
      setShowStudioLayer4(true);
    } catch (error) {
      console.error('Erreur lecture fichier calque 4:', error);
    }
  };

  // Max number of matches to display per aspect ratio to ensure no overflow
  const maxDisplayMatches = useMemo(
    () => getMaxDisplayMatches(aspectRatio, matchesLimit),
    [aspectRatio, matchesLimit]
  );

  // Active source items list for pagination
  const allSourceItems = useMemo(
    () => getPosterContentItems(contentType, filteredMatches, filteredResults),
    [contentType, filteredMatches, filteredResults]
  );

  // Total pages
  const totalPages = useMemo(
    () => getTotalPages(allSourceItems.length, maxDisplayMatches),
    [allSourceItems.length, maxDisplayMatches]
  );

  // Auto-reset current page when filter or limits change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Active items for display on the card (paginated)
  const displayedMatches = useMemo(
    () => paginatePosterItems(filteredMatches, currentPage, maxDisplayMatches),
    [filteredMatches, currentPage, maxDisplayMatches]
  );

  const displayedResults = useMemo(
    () => paginatePosterItems(filteredResults, currentPage, maxDisplayMatches),
    [filteredResults, currentPage, maxDisplayMatches]
  );

  // Effective background image URL
  const effectiveBgUrl = useMemo(
    () =>
      resolvePosterBackgroundUrl({
        customBgImage,
        bgSource,
        categoryBackgroundUrl: effectiveCategoryConfig.backgroundUrl,
        visualTemplates,
        defaultPosterBg,
      }),
    [
      customBgImage,
      bgSource,
      effectiveCategoryConfig.backgroundUrl,
      visualTemplates,
    ]
  );

  // Items for caption selection (Global Publication: covers ALL matches/results of this publication regardless of number of posters)
  const allCurrentCaptionItems = allSourceItems;

  const allCurrentCaptionItemKeys = useMemo(() => {
    return allCurrentCaptionItems.map((item, idx) => getPosterItemKey(item, idx));
  }, [allCurrentCaptionItems]);

  const captionMatches = useMemo(() => {
    return filterCaptionItems(filteredMatches, selectedItemKeysForCaption);
  }, [filteredMatches, selectedItemKeysForCaption]);

  const captionResults = useMemo(() => {
    return filterCaptionItems(filteredResults, selectedItemKeysForCaption);
  }, [filteredResults, selectedItemKeysForCaption]);

  // Toggle selection of a match/result for text captions
  const toggleCaptionItemKey = (key: string, allKeys: string[]) => {
    setSelectedItemKeysForCaption(
      toggleCaptionItemSelection(key, allKeys, selectedItemKeysForCaption)
    );
  };

  const selectAllCaptionItems = () => setSelectedItemKeysForCaption(null);
  const deselectAllCaptionItems = () => setSelectedItemKeysForCaption([]);

  // Captions for social media
  const generatedCaptions = useMemo(
    () =>
      generateSocialCaptions({
        contentType,
        badgeTitle,
        captionMatches,
        captionResults,
        captionStyleProposal,
        customCaptions,
        isCustomCaptionEdited,
        specificNotification,
        clubSettings,
        safeShortName,
        safeClubName,
        safeGymnasium,
        formatMatchDate: formatPosterMatchDate,
      }),
    [
      contentType,
      badgeTitle,
      captionMatches,
      captionResults,
      captionStyleProposal,
      customCaptions,
      isCustomCaptionEdited,
      specificNotification,
      clubSettings,
      safeShortName,
      safeClubName,
      safeGymnasium,
    ]
  );

  const handleCopyText = async (text: string, key: string) => {
    try {
      await copyTextToClipboard(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // AI Caption Generation helper using /api/generate-caption (Single global text for the whole publication)
  const handleGenerateAICaption = async (targetPlatform: 'all' | PosterSocialPlatform = 'all') => {
    setAiGenerating(true);
    try {
      const { matches: publicationMatches, results: publicationResults } =
        getPosterPublicationItems(contentType, captionMatches, captionResults);

      if (targetPlatform === 'all') {
        const [resInsta, resTikTok, resFB] = await Promise.all([
          requestPosterAiCaption(buildPosterAiCaptionRequestPayload({
            platform: 'instagram', contentType, matches: publicationMatches, results: publicationResults,
            clubName: safeClubName, shortClub: safeShortName, gymnasium: safeGymnasium,
            tone: aiTone, extraContext: aiExtraContext.trim(),
          })).catch(() => null),
          requestPosterAiCaption(buildPosterAiCaptionRequestPayload({
            platform: 'tiktok', contentType, matches: publicationMatches, results: publicationResults,
            clubName: safeClubName, shortClub: safeShortName, gymnasium: safeGymnasium,
            tone: aiTone, extraContext: aiExtraContext.trim(),
          })).catch(() => null),
          requestPosterAiCaption(buildPosterAiCaptionRequestPayload({
            platform: 'facebook', contentType, matches: publicationMatches, results: publicationResults,
            clubName: safeClubName, shortClub: safeShortName, gymnasium: safeGymnasium,
            tone: aiTone, extraContext: aiExtraContext.trim(),
          })).catch(() => null),
        ]);

        setCustomCaptions((prev) => ({
          ...prev,
          instagram: resInsta?.caption || prev.instagram,
          tiktok: resTikTok?.caption || prev.tiktok,
          facebook: resFB?.caption || prev.facebook,
        }));
        setIsCustomCaptionEdited({ instagram: true, tiktok: true, facebook: true });
      } else {
        const data = await requestPosterAiCaption(buildPosterAiCaptionRequestPayload({
          platform: targetPlatform,
          contentType,
          matches: publicationMatches,
          results: publicationResults,
          clubName: safeClubName,
          shortClub: safeShortName,
          gymnasium: safeGymnasium,
          tone: aiTone,
          extraContext: aiExtraContext.trim(),
        }));
        if (data.success && data.caption) {
          setCustomCaptions((prev) => ({ ...prev, [targetPlatform]: data.caption }));
          setIsCustomCaptionEdited((prev) => ({ ...prev, [targetPlatform]: true }));
        }
      }
    } catch (err) {
      console.error('Erreur génération IA:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // BOUTON 1 : Régénérer avec l'IA (sauvegarde la version actuelle dans previousAiCaption)
  const handleRegenerateWithAI = async (platform: 'instagram' | 'tiktok' | 'facebook') => {
    const currentCaption = customCaptions[platform] || generatedCaptions[platform] || '';
    if (currentCaption) {
      setPreviousAiCaption(currentCaption);
    }
    await handleGenerateAICaption(platform);
  };

  // BOUTON 2 : Modifier le texte actuel avec l'IA selon consignes utilisateur
  const handleApplyAiRewrite = async (platform: 'instagram' | 'tiktok' | 'facebook') => {
    const currentCaption = customCaptions[platform] || generatedCaptions[platform] || '';
    if (!currentCaption.trim() || !customRewriteInstructions.trim()) return;

    setIsRewriting(true);
    try {
      const data = await requestPosterAiCaption(
        buildPosterAiCaptionRewritePayload({
          platform,
          contentType,
          currentCaption,
          instructions: customRewriteInstructions,
          clubName: safeClubName,
          shortClub: safeShortName,
          gymnasium: safeGymnasium,
          tone: aiTone,
        })
      );
      if (data.success && data.caption) {
        setPreviousAiCaption(currentCaption);
        setCustomCaptions((prev) => ({ ...prev, [platform]: data.caption }));
        setIsCustomCaptionEdited((prev) => ({ ...prev, [platform]: true }));
        setShowAiRewriteBox(false);
        setCustomRewriteInstructions('');
      }
    } catch (err) {
      console.error('Erreur lors de la modification IA:', err);
    } finally {
      setIsRewriting(false);
    }
  };

  // BOUTON 3 : Annuler la dernière modification (bascule entre version précédente et actuelle)
  const handleUndoAiCaption = (platform: 'instagram' | 'tiktok' | 'facebook') => {
    if (!previousAiCaption) return;
    const current = customCaptions[platform] || generatedCaptions[platform] || '';
    setCustomCaptions((prev) => ({
      ...prev,
      [platform]: previousAiCaption,
    }));
    setIsCustomCaptionEdited((prev) => ({ ...prev, [platform]: true }));
    setPreviousAiCaption(current);
  };

  // High-Resolution Image Export (Native 1080p exact dimensions on all platforms)
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      setExportError(null);
      const dataUrl = await safeExportPosterToDataUrl(cardRef.current, aspectRatio, 0.98, 1);

      const link = document.createElement('a');
      const filterLabel = getPosterExportFilterLabel(contentType, posterFilter);
      const ratioLabel = getPosterExportRatioLabel(aspectRatio);
      const pageSuffix = getPosterExportPageSuffix(currentPage, totalPages);
      link.download = buildPosterExportFilename({
        shortClubName: safeShortName,
        filterLabel,
        pageSuffix,
        ratioLabel,
        timestamp: Date.now(),
      });
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erreur export image:', err);
      setExportError("La génération a rencontré une restriction navigateur. Veuillez réessayer.");
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Export all pages of the publication
  const handleDownloadAllPages = async () => {
    if (!cardRef.current || totalPages <= 1) {
      await handleDownloadImage();
      return;
    }
    const initialPage = currentPage;
    setIsExportingAll(true);
    setExportError(null);
    try {
      for (let p = 1; p <= totalPages; p++) {
        setCurrentPage(p);
        setExportProgress(`Affiche ${p}/${totalPages}...`);
        await new Promise((resolve) => setTimeout(resolve, 400));
        if (cardRef.current) {
          const dataUrl = await safeExportPosterToDataUrl(cardRef.current, aspectRatio, 0.98, 1);
          const link = document.createElement('a');
          const filterLabel = getPosterExportFilterLabel(contentType, posterFilter);
          const ratioLabel = getPosterExportRatioLabel(aspectRatio);
          const pageSuffix = getPosterExportPageSuffix(p, totalPages);
          link.download = buildPosterExportFilename({
            shortClubName: safeShortName,
            filterLabel,
            pageSuffix,
            ratioLabel,
            timestamp: Date.now(),
          });
          link.href = dataUrl;
          link.click();
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erreur export multi-affiches:', err);
      setExportError("Erreur lors de la génération de toutes les affiches. Téléchargez chaque affiche individuellement.");
    } finally {
      setCurrentPage(initialPage);
      setIsExportingAll(false);
      setExportProgress(null);
    }
  };

  // Mobile Web Share
  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    try {
      setIsSharing(true);
      setExportError(null);
      const dataUrl = await safeExportPosterToDataUrl(cardRef.current, aspectRatio, 0.95, 1);

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        buildPosterShareFilename(safeShortName, badgeTitle || ''),
        { type: 'image/png' }
      );

      const title = buildPosterShareTitle(badgeTitle || '', safeShortName);
      const text = getSocialCaptionForPlatform(selectedSocialTab, generatedCaptions);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text,
        });
      } else if (navigator.share) {
        await navigator.share({
          title,
          text,
          url: window.location.origin,
        });
      } else {
        handleCopyText(text, 'share-fallback');
        handleDownloadImage();
      }
    } catch (err) {
      console.log('Partage annulé ou non supporté:', err);
    } finally {
      setIsSharing(false);
    }
  };

  // Webhook: transmits the single global caption and all publication items
  const handleSendToWebhook = async () => {
    setWebhookStatus({ loading: true });
    try {
      const activeCaption = getSocialCaptionForPlatform(selectedSocialTab, generatedCaptions);

      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          buildPosterSocialWebhookPayload({
            platform: selectedSocialTab,
            contentType,
            badgeTitle,
            shortClubName: safeShortName,
            caption: activeCaption,
            matches: captionMatches,
            results: captionResults,
            totalPages,
            webhookUrl: clubSettings.socialWebhookUrl || '',
          })
        ),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWebhookStatus({
          loading: false,
          success: true,
          message: data.message || 'Transmission réussie à la passerelle !',
        });
      } else {
        setWebhookStatus({
          loading: false,
          success: false,
          message: data.message || "Erreur lors de l'envoi",
        });
      }
    } catch (err: any) {
      setWebhookStatus({
        loading: false,
        success: false,
        message: err.message || 'Impossible de joindre le serveur',
      });
    }

    setTimeout(() => {
      setWebhookStatus((prev) => ({ ...prev, message: undefined }));
    }, 4500);
  };

  // Custom photo upload handler
  const handleCustomBgUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCustomBgImage(dataUrl);
    } catch (err) {
      console.error('Erreur lors de la lecture de l’image :', err);
    }
  };

  if (!isOpen && !embeddedInTab) return null;

  const content = (
    <div className={`relative w-full ${
      embeddedInTab
        ? 'bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl'
        : 'h-full sm:h-[94vh] sm:max-h-[96vh] max-w-full sm:max-w-[96vw] xl:max-w-[94vw] 2xl:max-w-[1700px] bg-slate-900 sm:border border-slate-800 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col'
    }`}>
      {visualTemplates && mediaBankTarget && (
        <MediaBankSelectorModal
          isOpen={true}
          onClose={() => setMediaBankTarget(null)}
          visualTemplates={visualTemplates}
          filterType="image"
          title={mediaBankTarget === 'background' ? 'Choisir un fond ou une photo' : mediaBankTarget === 'layer3' ? 'Choisir le média du calque 3' : 'Choisir le média du calque 4'}
          onSelect={(mediaUrl) => {
            if (mediaBankTarget === 'background') {
              setCustomBgImage(mediaUrl);
              setBgSource('custom');
            } else if (mediaBankTarget === 'layer3') {
              setCustomLayer3Image(mediaUrl);
              setShowStudioLayer3(true);
            } else {
              setCustomLayer4Image(mediaUrl);
              setShowStudioLayer4(true);
            }
            setMediaBankTarget(null);
          }}
        />
      )}
      {/* Modal Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3.5 border-b border-slate-800 bg-slate-950 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-600 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/30 shrink-0">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-xl font-black text-white uppercase font-bebas tracking-wide flex items-center gap-2 truncate">
              STUDIO GRAPHIQUE & PUBLICATION RÉSEAUX SOCIAUX
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
              Générez l'affiche officielle du club (Instagram, Facebook, TikTok), personnalisez les calques et publiez directement
            </p>
          </div>
        </div>
        {!embeddedInTab && (
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* ========================================================================= */}
        {/* BOUTONS NAVIGATION MOBILE : VISIBLE UNIQUEMENT SUR TÉLÉPHONE (< lg)      */}
        {/* ========================================================================= */}
        <div className="flex lg:hidden items-center justify-between p-1.5 sm:p-2 bg-slate-950 border-b border-slate-800 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'preview'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Aperçu de l'Affiche</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('settings')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'settings'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Options & Textes</span>
          </button>
        </div>

        {/* Content Type & Filter Bar : visible uniquement dans l'onglet Options sur mobile, toujours sur PC */}
        <div className={`${mobileTab === 'settings' ? 'flex' : 'hidden'} lg:flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 shrink-0`}>
          
          {/* Main Category Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setContentType('matches');
                setPosterFilter('home');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-bebas tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                contentType === 'matches'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Matchs du week-end</span>
            </button>

            <button
              onClick={() => setContentType('results')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-bebas tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                contentType === 'results'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Résultats du week-end</span>
            </button>

            {specificNotification && (
              <button
                onClick={() => setContentType('notification')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-bebas tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                  contentType === 'notification'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Alerte Victoire/Défaite</span>
              </button>
            )}
          </div>

          {/* Matches & Results Sub-filters: Domicile, Extérieur, Exempt, Tout */}
          {(contentType === 'matches' || contentType === 'results') && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">
                {contentType === 'results' ? 'Filtre Résultats :' : 'Affiche :'}
              </span>
              {/* DOMICILE */}
              {(() => {
                const count = contentType === 'results' ? resultCounts.home : matchCounts.home;
                const isDisabled = count === 0;
                return (
                  <button
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        setPosterFilter('home');
                        setCustomBadgeTitle('');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border border-slate-800/50'
                        : posterFilter === 'home'
                        ? contentType === 'results' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-red-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={
                      isDisabled
                        ? 'Aucun match à domicile ce week-end'
                        : contentType === 'results'
                        ? 'Résultats des matchs joués à domicile (DOMICILE)'
                        : "Générer l'affiche des matchs à domicile (DOMICILE)"
                    }
                  >
                    <Home className="w-3 h-3" />
                    <span>DOMICILE</span>
                    {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
                  </button>
                );
              })()}

              {/* EXTÉRIEUR */}
              {(() => {
                const count = contentType === 'results' ? resultCounts.away : matchCounts.away;
                const isDisabled = count === 0;
                return (
                  <button
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        setPosterFilter('away');
                        setCustomBadgeTitle('');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border border-slate-800/50'
                        : posterFilter === 'away'
                        ? contentType === 'results' ? 'bg-emerald-700 text-white shadow-sm' : 'bg-red-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={
                      isDisabled
                        ? "Aucun match à l'extérieur ce week-end"
                        : contentType === 'results'
                        ? "Résultats des matchs joués à l'extérieur (EXTÉRIEUR)"
                        : "Générer l'affiche des matchs à l'extérieur (EXTÉRIEUR)"
                    }
                  >
                    <Navigation className="w-3 h-3" />
                    <span>EXTÉRIEUR</span>
                    {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
                  </button>
                );
              })()}

              {/* EXEMPT */}
              {contentType === 'matches' && (() => {
                const count = matchCounts.exempt;
                const isDisabled = count === 0;
                return (
                  <button
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        setPosterFilter('exempt');
                        setCustomBadgeTitle('');
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 text-slate-600 border border-slate-800/50'
                        : posterFilter === 'exempt'
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={
                      isDisabled
                        ? 'Aucune équipe exempte ce week-end'
                        : "Générer l'affiche des équipes exemptes (EXEMPT)"
                    }
                  >
                    <PauseCircle className="w-3 h-3" />
                    <span>EXEMPT</span>
                    {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
                  </button>
                );
              })()}

              {/* TOUT */}
              <button
                onClick={() => {
                  setPosterFilter('all');
                  setCustomBadgeTitle('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  posterFilter === 'all'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={contentType === 'results' ? "Afficher tous les résultats du week-end (TOUT)" : "Afficher toutes les rencontres de la semaine (TOUT)"}
              >
                <Layers className="w-3 h-3" />
                <span>TOUT</span>
                <span className="text-[10px] opacity-75">
                  ({contentType === 'results' ? weekendResults.length : weekendMatches.length})
                </span>
              </button>
            </div>
          )}

          {/* Social Aspect Ratio & Visual Theme Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Style :</span>
              <button
                onClick={() => setVisualTheme('poster-red')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  visualTheme === 'poster-red'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Design officiel rouge avec hachures et pilules dynamiques"
              >
                <span>🔴 Affiche Rouge</span>
              </button>
              <button
                onClick={() => setVisualTheme('brick')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  visualTheme === 'brick'
                    ? 'bg-orange-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visuels Briques & Éléments Graphiques"
              >
                <span>🧱 Briques</span>
              </button>
              <button
                onClick={() => setVisualTheme('modern')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  visualTheme === 'modern'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Style Élite Dark Modern"
              >
                <span>✨ Dark</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Format :</span>

              <button
                onClick={() => setAspectRatio('4:5')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  aspectRatio === '4:5'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format portrait officiel 4:5 (1080x1350) pour Instagram & Facebook"
              >
                <span>Portrait 4:5</span>
              </button>

              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  aspectRatio === '9:16'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format vertical plein écran pour TikTok & Instagram Stories"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Story (9:16)</span>
              </button>

              <button
                onClick={() => setAspectRatio('1:1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  aspectRatio === '1:1'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format carré pour post Feed Instagram & Facebook"
              >
                <span>Carré (1:1)</span>
              </button>

              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  aspectRatio === '16:9'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format paysage pour TV & bannière"
              >
                <span>Paysage (16:9)</span>
              </button>
            </div>

            {/* Match limit / Capacity selector (Up to 6 matches) */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Capacité :</span>
              {(['auto', 3, 4, 5, 6] as const).map((limit) => (
                <button
                  key={limit}
                  onClick={() => setMatchesLimit(limit)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    matchesLimit === limit
                      ? 'bg-red-700 text-white shadow-sm font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={limit === 'auto' ? 'Automatique selon le format' : `Forcer ${limit} matchs par visuel`}
                >
                  {limit === 'auto' ? 'Auto' : `${limit} m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-3 sm:p-5 bg-slate-950/90 ${
          embeddedInTab ? 'rounded-b-3xl' : 'flex-1 overflow-y-auto overscroll-contain'
        }`} style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* ========================================================================= */}
          {/* LEFT: THE LIVE CAPTURABLE VISUAL CARD */}
          {/* ========================================================================= */}
          <div className={`lg:col-span-6 ${mobileTab === 'preview' ? 'flex' : 'hidden'} lg:flex flex-col items-center justify-start p-2 sm:p-4 bg-black/40 rounded-2xl sm:rounded-3xl border border-slate-800/80 relative pb-8 ${
            embeddedInTab ? 'lg:sticky lg:top-4 self-start' : ''
          }`}>
            
            {/* MINI BARRE MOBILE : CONTRÔLES EXPRESS AU-DESSUS DE L'AFFICHE (< lg) */}
            <div className="w-full flex lg:hidden flex-col gap-1.5 bg-slate-900/95 p-2 rounded-xl border border-slate-800 mb-2.5 shadow-md">
              <div className="flex items-center justify-between gap-1">
                {/* Type de contenu */}
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setContentType('matches'); }}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                      contentType === 'matches' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Matchs
                  </button>
                  <button
                    type="button"
                    onClick={() => { setContentType('results'); }}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                      contentType === 'results' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Résultats
                  </button>
                </div>

                {/* Sub-filtres rapides : Dom / Ext / Tout */}
                <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setPosterFilter('home'); setCustomBadgeTitle(''); }}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      posterFilter === 'home'
                        ? contentType === 'results' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dom
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosterFilter('away'); setCustomBadgeTitle(''); }}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      posterFilter === 'away'
                        ? contentType === 'results' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ext
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPosterFilter('all'); setCustomBadgeTitle(''); }}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      posterFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tout
                  </button>
                </div>

                {/* Ratios rapides */}
                <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  {(['4:5', '9:16', '1:1', '16:9'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold transition-all ${
                        aspectRatio === r ? 'bg-red-600 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === '9:16' ? '9:16' : r}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileTab('settings')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold flex items-center gap-1 shrink-0"
                  title="Toutes les options graphiques et filtres"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">Options</span>
                </button>
              </div>

              {contentType === 'results' && (
            <ContentTypeResultsSection
              updateTemplateSetting={updateTemplateSetting}
              resultDisplayMode={resultDisplayMode}
            />
          )}
            </div>

            {/* Header info & Quick background / title customizer */}
            <div className="w-full flex items-center justify-between px-2 mb-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
                <span>Aperçu Réel Haute Définition ({aspectRatio})</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Hidden file input for custom background */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCustomBgUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700 transition-colors"
                  title="Changer la photo de fond de l'affiche"
                >
                  <ImageIcon className="w-3 h-3 text-amber-400" />
                  <span>Fond photo</span>
                </button>

                {customBgImage && (
                  <button
                    type="button"
                    onClick={() => setCustomBgImage(null)}
                    className="text-[10px] text-rose-400 hover:text-rose-300"
                    title="Rétablir le fond par défaut"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {/* PAGINATION BAR (When matches exceed capacity) */}
            {totalPages > 1 && (
              <div className="w-full flex items-center justify-between bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border border-red-800/50 rounded-2xl px-3 py-1.5 mb-2.5 shadow-md">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Précédent</span>
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-black text-white font-montserrat uppercase tracking-wider">
                    Affiche {currentPage} / {totalPages}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {contentType === 'matches' ? 'Matchs' : 'Résultats'} {(currentPage - 1) * maxDisplayMatches + 1} à {Math.min(currentPage * maxDisplayMatches, allSourceItems.length)} sur {allSourceItems.length} • 1 seul texte global
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Custom Header / Badge Title Selector & Quick Presets */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 mb-2.5 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-amber-400 font-black uppercase tracking-wider">
                  <Edit3 className="w-3.5 h-3.5 text-red-400" />
                  <span>Titre / Entête du Visuel :</span>
                </span>
                {customBadgeTitle && (
                  <button
                    type="button"
                    onClick={() => setCustomBadgeTitle('')}
                    className="text-[10px] text-slate-400 hover:text-rose-400 font-bold transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customBadgeTitle}
                  onChange={(e) => setCustomBadgeTitle(e.target.value)}
                  placeholder={
                    contentType === 'matches'
                      ? 'LES MATCHS DU WEEK-END'
                      : contentType === 'results'
                      ? 'RÉSULTATS DU WEEK-END'
                      : badgeTitle
                  }
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-bold focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CARD PREVIEW CONTAINER WITH DYNAMIC ZOOM & FIXED LOGICAL DIMENSIONS        */}
            {/* ========================================================================= */}
            <div ref={previewWrapperRef} className="w-full flex items-center justify-center overflow-hidden py-1">
              <div
                style={{
                  width: `${Math.round(targetDims.width * previewScale)}px`,
                  height: `${Math.round(targetDims.height * previewScale)}px`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                className="shrink-0 shadow-2xl rounded-2xl sm:rounded-3xl border border-slate-800"
              >
                <div
                  ref={cardRef}
                  style={{
                    width: `${targetDims.width}px`,
                    height: `${targetDims.height}px`,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    backgroundColor: '#111111',
                  }}
                  className={`overflow-hidden text-white flex flex-col justify-between select-none ${
                    aspectRatio === '4:5'
                      ? 'p-14'
                      : aspectRatio === '9:16'
                      ? 'p-14'
                      : aspectRatio === '1:1'
                      ? 'p-12'
                      : 'p-10'
                  }`}
                >
                  {/* THEME 1: OFFICIAL BASKETBALL RED POSTER (MATCHING USER IMAGES & TEMPLATE) */}
                  {visualTheme === 'poster-red' && (
            <VisualThemePosterRedSection
              effectiveBgUrl={effectiveBgUrl}
              layer1Grayscale={layer1Grayscale}
              layer1Contrast={layer1Contrast}
              layer1Brightness={layer1Brightness}
              layer1Blur={layer1Blur}
              layer1Scale={layer1Scale}
              showStudioLayer3={showStudioLayer3}
              effectiveLayer3Url={effectiveLayer3Url}
              studioLayer3Pos={studioLayer3Pos}
              effectiveCategoryConfig={effectiveCategoryConfig}
              studioLayer3Scale={studioLayer3Scale}
              showStudioLayer4={showStudioLayer4}
              effectiveLayer4Url={effectiveLayer4Url}
              studioLayer4Pos={studioLayer4Pos}
              studioLayer4Scale={studioLayer4Scale}
              aspectRatio={aspectRatio}
              layer2PrimaryColor={layer2PrimaryColor}
              layer2FontHeader={layer2FontHeader}
              layer2BadgeBgColor={layer2BadgeBgColor}
              layer2BadgeTextColor={layer2BadgeTextColor}
              displayedMatches={displayedMatches}
              badgeTitle={badgeTitle}
              contentType={contentType}
              matches={matches}
              posterFilter={posterFilter}
              layer2FontBody={layer2FontBody}
              layer2TextColor={layer2TextColor}
              results={results}
              displayedResults={displayedResults}
              safeClubName={safeClubName}
              safeShortName={safeShortName}
              resultDisplayMode={resultDisplayMode}
              specificNotification={specificNotification}
            />
          )}

                  {/* THEME 2: BRICK WALL & MASCOT */}
                  {visualTheme === 'brick' && (
            <VisualThemeBrickSection
              clubSettings={clubSettings}
              badgeTitle={badgeTitle}
              displayedMatches={displayedMatches}
            />
          )}

                  {/* THEME 3: DARK MODERN */}
                  {visualTheme === 'modern' && (
            <VisualThemeModernSection
              clubSettings={clubSettings}
              badgeTitle={badgeTitle}
              displayedMatches={displayedMatches}
            />
          )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* ACTIONS SUR SMARTPHONE DANS L'ONGLET APERÇU (Téléchargement & Partage)   */}
            {/* ========================================================================= */}
            <div className="w-full mt-4 space-y-2.5 block lg:hidden">
              {exportError && (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}
              {totalPages > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadAllPages}
                  disabled={isExporting || isExportingAll}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-700 to-rose-700 active:from-red-800 active:to-rose-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-700/20 transition-all disabled:opacity-50 mb-2"
                >
                  <Layers className="w-4 h-4 text-white" />
                  <span>{isExportingAll ? (exportProgress || 'Génération...') : `Télécharger les ${totalPages} affiches`}</span>
                </button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isExporting || isExportingAll}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 active:from-red-700 active:to-rose-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 transition-all disabled:opacity-50"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-300" />
                      <span>Affiche Enregistrée !</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>{isExporting ? 'Génération...' : totalPages > 1 ? `Télécharger affiche ${currentPage}/${totalPages}` : `Télécharger l'Affiche (${aspectRatio})`}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={isSharing || isExporting || isExportingAll}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 shadow-md transition-all disabled:opacity-50"
                >
                  <Share2 className="w-5 h-5 text-orange-400" />
                  <span>{isSharing ? 'Préparation...' : 'Partager (WhatsApp / Insta)'}</span>
                </button>
              </div>

              {/* Raccourcis copie de légende pour réseaux sociaux */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-red-400" />
                    <span>Copier la légende du post :</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyText(generatedCaptions.instagram, 'insta')}
                    className="py-2 px-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 border border-pink-500/30 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'insta' ? 'Copié !' : 'Instagram'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyText(generatedCaptions.tiktok, 'tiktok')}
                    className="py-2 px-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'tiktok' ? 'Copié !' : 'TikTok'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyText(generatedCaptions.facebook, 'fb')}
                    className="py-2 px-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'fb' ? 'Copié !' : 'Facebook'}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileTab('settings')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Personnaliser les options (format, calques, titre)</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: STUDIO LAYERS & SOCIAL BRIDGE CONTROLS */}
          {/* ========================================================================= */}
          <div className={`lg:col-span-6 ${mobileTab === 'settings' ? 'flex' : 'hidden'} lg:flex flex-col justify-between space-y-3.5`}>
            
            {/* Raccourci rapide vers l'Aperçu sur smartphone */}
            <div className="block lg:hidden bg-slate-950 p-2.5 rounded-2xl border border-red-900/50">
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-98 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Voir le résultat sur l'affiche</span>
              </button>
            </div>

            {/* SUB-TABS SWITCHER: TEXTES RÉSEAUX SOCIAUX vs CALQUES & DESIGN */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setRightPanelTab('social')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  rightPanelTab === 'social'
                    ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 text-white shadow-lg shadow-pink-600/25 ring-1 ring-pink-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Radio className="w-4 h-4 text-pink-400" />
                <span>💬 Textes Réseaux & Publication</span>
              </button>

              <button
                type="button"
                onClick={() => setRightPanelTab('layers')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  rightPanelTab === 'layers'
                    ? 'bg-slate-800 text-white shadow-md ring-1 ring-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>🎨 Calques &amp; Design Studio</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* OPTION 1: TEXTES RÉSEAUX SOCIAUX & PROPOSITIONS */}
            {/* ========================================================================= */}
            {rightPanelTab === 'social' && (
            <RightPanelTabSocialSection
              setSelectedSocialTab={setSelectedSocialTab}
              selectedSocialTab={selectedSocialTab}
              setAspectRatio={setAspectRatio}
              allCurrentCaptionItems={allCurrentCaptionItems}
              contentType={contentType}
              matches={matches}
              totalPages={totalPages}
              setCaptionStyleProposal={setCaptionStyleProposal}
              setIsCustomCaptionEdited={setIsCustomCaptionEdited}
              captionStyleProposal={captionStyleProposal}
              isCustomCaptionEdited={isCustomCaptionEdited}
              captionMatches={captionMatches}
              captionResults={captionResults}
              selectAllCaptionItems={selectAllCaptionItems}
              deselectAllCaptionItems={deselectAllCaptionItems}
              selectedItemKeysForCaption={selectedItemKeysForCaption}
              toggleCaptionItemKey={toggleCaptionItemKey}
              allCurrentCaptionItemKeys={allCurrentCaptionItemKeys}
              customCaptions={customCaptions}
              generatedCaptions={generatedCaptions}
              setCustomCaptions={setCustomCaptions}
              showAiRewriteBox={showAiRewriteBox}
              setShowAiRewriteBox={setShowAiRewriteBox}
              customRewriteInstructions={customRewriteInstructions}
              setCustomRewriteInstructions={setCustomRewriteInstructions}
              handleApplyAiRewrite={handleApplyAiRewrite}
              isRewriting={isRewriting}
              handleRegenerateWithAI={handleRegenerateWithAI}
              aiGenerating={aiGenerating}
              previousAiCaption={previousAiCaption}
              handleUndoAiCaption={handleUndoAiCaption}
              handleCopyText={handleCopyText}
              copiedKey={copiedKey}
              badgeTitle={badgeTitle}
              clubSettings={clubSettings}
              webhookStatus={webhookStatus}
              handleSendToWebhook={handleSendToWebhook}
              handleNativeShare={handleNativeShare}
              isSharing={isSharing}
              isExporting={isExporting}
              exportError={exportError}
              handleDownloadAllPages={handleDownloadAllPages}
              isExportingAll={isExportingAll}
              exportProgress={exportProgress}
              handleDownloadImage={handleDownloadImage}
              downloadSuccess={downloadSuccess}
              currentPage={currentPage}
              aspectRatio={aspectRatio}
              setRightPanelTab={setRightPanelTab}
            />
          )}

            {/* ========================================================================= */}
            {/* OPTION 2: STUDIO GRAPHIQUE & CALQUES OPTIONS */}
            {/* ========================================================================= */}
            {rightPanelTab === 'layers' && (
              <StudioGraphiqueWorkbench
                visualTemplates={visualTemplates || ({} as VisualTemplatesConfig)}
                onUpdateVisualTemplates={onUpdateVisualTemplates || (() => {})}
                matches={matches}
                results={results}
                birthdays={birthdays}
                clubSettings={clubSettings}
                defaultCategory={contentType === 'results' ? 'results' : 'matches'}
                hideCategorySelector={true}
              />
            )}

            {/* Panneau calques legacy retire (code mort) : remplace par le Studio Graphique ci-dessus */}

            {/* Raccourci bas de page vers l'Aperçu sur smartphone */}
            <div className="block lg:hidden pt-2">
              <button
                type="button"
                onClick={() => setMobileTab('preview')}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-98 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Voir l'Affiche & Télécharger</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Notice */}
        <div className="px-3 sm:px-5 py-2 border-t border-slate-800 bg-slate-950 text-center flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="hidden sm:inline">
            🏀 Affiche officielle générée au ratio <strong>{aspectRatio}</strong> • Police auto-adaptative sans débordement • Prêt pour <strong>Instagram</strong>, <strong>Facebook</strong> et <strong>TikTok</strong>
          </span>
          <span className="sm:hidden text-[11px] text-slate-400">
            Affiche HD prête pour réseaux ({aspectRatio})
          </span>

          {!embeddedInTab && (
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
  );

  if (embeddedInTab) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {content}
    </div>
  );
};
