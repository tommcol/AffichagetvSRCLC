import React, { useRef, useState, useMemo } from 'react';
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
  Video,
  Image as ImageIcon,
  Home,
  Navigation,
  PauseCircle,
  Layers,
  Edit3,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { MatchItem, ClubSettings, FinishedMatchNotification, VisualTemplatesConfig } from '../types';
import { formatMatchDayAndDate } from '../utils/matchDateHelper';
import defaultPosterBg from '../assets/images/poster_basketball_court_bg_1789586468398.jpg';

interface VisualExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'matches' | 'results' | 'victory' | 'defeat';
  matches: MatchItem[];
  results: MatchItem[];
  clubSettings: ClubSettings;
  specificNotification?: FinishedMatchNotification | null;
  onOpenVideoExporter?: () => void;
  visualTemplates?: VisualTemplatesConfig;
}

type PosterFilterType = 'home' | 'away' | 'exempt' | 'all';
type PosterThemeType = 'poster-red' | 'brick' | 'modern';
type PosterAspectRatio = '4:5' | '9:16' | '1:1' | '16:9';

/**
 * Formats date and time into French poster style:
 * e.g. "Samedi 19 septembre | 13h30"
 */
function formatPosterMatchDate(dateStr?: string, timeStr?: string): string {
  const formattedTime = timeStr ? timeStr.replace(':', 'h') : '14h00';

  if (!dateStr || !dateStr.trim()) {
    return `Samedi | ${formattedTime}`;
  }

  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const trimmed = dateStr.trim();

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) {
      const dayName = days[dt.getDay()];
      return `${dayName} ${d} ${months[m]} | ${formattedTime}`;
    }
  }

  // 2. European format: DD/MM/YYYY
  const euroMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (euroMatch) {
    const d = parseInt(euroMatch[1], 10);
    const m = parseInt(euroMatch[2], 10) - 1;
    const y = parseInt(euroMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) {
      const dayName = days[dt.getDay()];
      return `${dayName} ${d} ${months[m]} | ${formattedTime}`;
    }
  }

  // Fallback to helper
  const dInfo = formatMatchDayAndDate(dateStr);
  return `${dInfo.display} | ${formattedTime}`;
}

/**
 * Component that dynamically adapts the font size and line height
 * according to the exact length of the team name, preventing any clipping or overflow.
 * Directly fulfills user requirement: "Pense à ce que la taille de la police s'adapte en fonction du nom".
 */
const AutoFitTeamName: React.FC<{
  name: string;
  isExempt?: boolean;
}> = ({ name, isExempt }) => {
  const clean = (name || '').trim();
  const len = clean.length;

  if (isExempt || clean.toLowerCase() === 'exempt') {
    return (
      <div className="w-full h-full flex items-center justify-center text-center px-2 pointer-events-none select-none">
        <span
          className="font-montserrat font-black text-white uppercase tracking-wider text-[15px] drop-shadow-sm"
          style={{ lineHeight: 1.15 }}
        >
          Exempt
        </span>
      </div>
    );
  }

  // Dynamic font sizing based on string length
  let fontSize = '14.5px';
  let lineHeight = '1.15';

  if (len <= 11) {
    // e.g. "U11 Filles", "U15 Filles", "SG1"
    fontSize = '14.5px';
    lineHeight = '1.15';
  } else if (len <= 17) {
    // e.g. "Seniors Filles", "Mably CLP - 1", "U18 Garçons"
    fontSize = '12.5px';
    lineHeight = '1.12';
  } else if (len <= 23) {
    // e.g. "St-Martin/Estreaux", "AS Saint Denis Mars"
    fontSize = '11px';
    lineHeight = '1.08';
  } else if (len <= 28) {
    // e.g. "ST Jean ST Maurice Les Loups", "Marcigny Basket Club"
    fontSize = '10px';
    lineHeight = '1.05';
  } else {
    // Extra long names
    fontSize = '8.5px';
    lineHeight = '1.0';
  }

  return (
    <div className="w-full h-full flex items-center justify-center text-center px-1.5 pointer-events-none select-none">
      <span
        className="font-montserrat font-extrabold text-white text-center uppercase tracking-tight block max-w-full drop-shadow-sm"
        style={{
          fontSize,
          lineHeight,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          maxHeight: '38px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
        title={clean}
      >
        {clean}
      </span>
    </div>
  );
};

export const VisualExporterModal: React.FC<VisualExporterModalProps> = ({
  isOpen,
  onClose,
  type: initialType,
  matches,
  results,
  clubSettings,
  specificNotification,
  onOpenVideoExporter,
  visualTemplates,
}) => {
  const [contentType, setContentType] = useState<'matches' | 'results' | 'notification'>(
    initialType === 'victory' || initialType === 'defeat'
      ? 'notification'
      : initialType === 'results'
      ? 'results'
      : 'matches'
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

  const [selectedSocialTab, setSelectedSocialTab] = useState<'instagram' | 'tiktok' | 'facebook' | 'webhook'>('instagram');

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [webhookStatus, setWebhookStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active matches selection
  const weekendMatches = useMemo(() => {
    const selected = matches.filter((m) => m.selectedForWeekend !== false);
    return selected.length > 0 ? selected : matches;
  }, [matches]);

  // Filter matches based on posterFilter (DOMICILE / EXTÉRIEUR / EXEMPT / ALL)
  const filteredMatches = useMemo(() => {
    if (posterFilter === 'home') {
      const homeOnly = weekendMatches.filter((m) => m.isHomeMatch);
      return homeOnly.length > 0 ? homeOnly : weekendMatches;
    }
    if (posterFilter === 'away') {
      const awayOnly = weekendMatches.filter((m) => !m.isHomeMatch);
      return awayOnly.length > 0 ? awayOnly : weekendMatches;
    }
    if (posterFilter === 'exempt') {
      const exemptOnly = weekendMatches.filter(
        (m) =>
          (m.teamAway && m.teamAway.toLowerCase().includes('exempt')) ||
          (m.teamHome && m.teamHome.toLowerCase().includes('exempt')) ||
          (m.category && m.category.toLowerCase().includes('exempt'))
      );
      if (exemptOnly.length > 0) return exemptOnly;
      // If no exempt match exists in list, synthesize an exempt placeholder from the first available team
      const sampleTeam = weekendMatches[0]?.category || 'Seniors Garçons';
      return [
        {
          id: 'exempt-sample',
          date: weekendMatches[0]?.date || new Date().toISOString().split('T')[0],
          time: '14:00',
          category: sampleTeam,
          competition: 'Championnat',
          teamHome: sampleTeam,
          teamAway: 'Exempt',
          isHomeMatch: true,
          ourClubName: clubSettings.name,
          gymnasium: clubSettings.gymnasiumDefault,
          city: '',
          status: 'upcoming' as const,
        },
      ];
    }
    return weekendMatches;
  }, [weekendMatches, posterFilter, clubSettings]);

  // Compute effective header badge title
  const badgeTitle = useMemo(() => {
    if (customBadgeTitle.trim()) return customBadgeTitle.trim().toUpperCase();

    if (contentType === 'results') return 'RÉSULTATS';
    if (contentType === 'notification') return specificNotification?.isWin ? 'VICTOIRE !' : 'FIN DE MATCH';

    switch (posterFilter) {
      case 'home':
        return 'DOMICILE';
      case 'away':
        return 'EXTÉRIEUR';
      case 'exempt':
        return 'EXEMPT';
      case 'all':
      default:
        return 'MATCHDAY';
    }
  }, [customBadgeTitle, contentType, posterFilter, specificNotification]);

  // Max number of matches to display per aspect ratio to ensure no overflow
  const maxDisplayMatches = useMemo(() => {
    if (aspectRatio === '9:16') return 6;
    if (aspectRatio === '4:5') return 4;
    if (aspectRatio === '1:1') return 3;
    return 4; // 16:9
  }, [aspectRatio]);

  // Active items for display on the card
  const displayedMatches = useMemo(() => {
    return filteredMatches.slice(0, maxDisplayMatches);
  }, [filteredMatches, maxDisplayMatches]);

  const displayedResults = useMemo(() => {
    return results.slice(0, maxDisplayMatches);
  }, [results, maxDisplayMatches]);

  // Effective background image URL
  const effectiveBgUrl = useMemo(() => {
    if (customBgImage) return customBgImage;
    if (visualTemplates?.matchesBackgroundUrl) return visualTemplates.matchesBackgroundUrl;
    return defaultPosterBg;
  }, [customBgImage, visualTemplates]);

  // Captions for social media
  const generatedCaptions = useMemo(() => {
    const clubTag = clubSettings.instagramHandle || `@${clubSettings.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const fbTag = clubSettings.facebookPage || clubSettings.name;
    const ttTag = clubSettings.tiktokHandle || `@${clubSettings.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}_basket`;

    if (contentType === 'matches') {
      const matchLines = displayedMatches.map((m) => {
        const isExempt = m.teamAway?.toLowerCase().includes('exempt') || m.teamHome?.toLowerCase().includes('exempt');
        if (isExempt) {
          return `⏸️ ${m.category} : EXEMPT ce week-end`;
        }
        return `🏀 ${m.category} : ${m.isHomeMatch ? m.teamHome : m.category} vs ${m.isHomeMatch ? m.teamAway : m.teamHome} (${formatPosterMatchDate(m.date, m.time)})`;
      }).join('\n');

      return {
        instagram: `🔥 PROGRAMME ${badgeTitle} | ${clubSettings.shortName.toUpperCase()} 🔥\n\nRetrouvez nos équipes sur les terrains ce week-end :\n\n${matchLines}\n\n📍 Soutenez nos couleurs au ${clubSettings.gymnasiumDefault} !\nBuvette & ambiance assurées ☕🍿\n\nIdentifiez-nous : ${clubTag} 📸\n\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #MatchDay #${badgeTitle.replace(/\s+/g, '')} #Basketball #FFBB #BasketFrance`,
        tiktok: `🏀 Le programme ${badgeTitle} du week-end est là ! Qui vient au gymnase soutenir nos équipes ? 🔥⚡\n\n${displayedMatches.map((m) => `👉 ${m.category} - ${m.time}`).join('\n')}\n\n#fyp #pourtoi #basketball #matchday #${clubSettings.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        facebook: `🏀 PROGRAMME DU WEEK-END [${badgeTitle}] - ${clubSettings.name.toUpperCase()} 🏀\n\nChers supporters, voici le planning de nos rencontres :\n\n${matchLines}\n\nVenez nombreux encourager nos joueuses et joueurs !\n\nAllez le ${clubSettings.shortName} ! 🧡🖤\nPage officielle : ${fbTag}\n#Basketball #FFBB #${badgeTitle.replace(/\s+/g, '')}`,
      };
    }

    if (contentType === 'results') {
      const wins = results.filter((r) => r.result === 'win').length;
      const total = results.length;
      const resultLines = displayedResults.map((r) =>
        `${r.result === 'win' ? '✅ VICTOIRE' : '❌ DÉFAITE'} [${r.category}] : ${r.teamHome} ${r.homeScore ?? ''} - ${r.awayScore ?? ''} ${r.teamAway}`
      ).join('\n');

      return {
        instagram: `🏆 RÉSULTATS DU WEEK-END | ${clubSettings.shortName.toUpperCase()} 🏆\n\nBilan : ${wins} victoires sur ${total} matchs joués ! Bravo à tous pour l'engagement. 👏🔥\n\n${resultLines}\n\nMerci aux supporters, coachs et bénévoles ! ❤️\n\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #Resultats #Victoire #Basketball #FFBB`,
        tiktok: `🏆 Les résultats basket du week-end sont là ! ${wins} victoires au compteur 🔥💪 Quelle équipe t'a le plus impressionné ? 👇\n\n#fyp #pourtoi #basketball #resultats #victoire`,
        facebook: `🏆 BILAN DES RENCONTRES - ${clubSettings.name.toUpperCase()} 🏆\n\nFélicitations à nos équipes pour ce week-end ! Bilan global : ${wins} victoires sur ${total} matchs.\n\n${resultLines}\n\nMerci à nos bénévoles pour la buvette et la table de marque !\n\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #Basketball #ResultatsWeekend`,
      };
    }

    const alert = specificNotification;
    const isWin = alert ? alert.isWin : true;
    const team = alert?.team || 'Seniors 1';
    const ourScore = alert?.ourScore ?? 78;
    const oppScore = alert?.opponentScore ?? 72;
    const opp = alert?.opponent || 'Adversaire';

    return {
      instagram: `${isWin ? '🚨 VICTOIRE ÉCLATANTE ! 🏆' : '🚨 FIN DU MATCH ! 🏀'}\n\nScore final : ${team} ${ourScore} - ${oppScore} ${opp} !\n${isWin ? 'Bravo à toute l’équipe pour cette belle performance !' : 'Gros combat sur le terrain, on se remobilise pour le prochain match !'}\n\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #BasketFrance #FFBB`,
      tiktok: `${isWin ? '🏆 VICTOIRE !!' : '🏀 Fin de match !'} ${team} l'emporte ${ourScore}-${oppScore} contre ${opp} ! 🔥⚡ #fyp #pourtoi #basketball #victoire`,
      facebook: `${isWin ? '🏆 VICTOIRE DE NOTRE ÉQUIPE ! 🏆' : '🏀 RÉSULTAT DE LA RENCONTRE 🏀'}\n\n${team} ${ourScore} - ${oppScore} ${opp} !\nFélicitations aux joueurs et au staff.\n\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #FFBB #Basketball`,
    };
  }, [contentType, badgeTitle, displayedMatches, displayedResults, results, specificNotification, clubSettings]);

  if (!isOpen) return null;

  const handleCopyText = (text: string, key: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  // High-Resolution Image Export (Retina 2.5x -> yields clean 1080x1350 for 4:5 ratio)
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2.5,
      });

      const link = document.createElement('a');
      const filterLabel = contentType === 'matches' ? posterFilter : contentType;
      const ratioLabel = aspectRatio.replace(':', '_');
      link.download = `${clubSettings.shortName.toLowerCase().replace(/\s+/g, '_')}_affiche_${filterLabel}_${ratioLabel}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Mobile Web Share
  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    try {
      setIsSharing(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 0.95,
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `${clubSettings.shortName.toLowerCase().replace(/\s+/g, '_')}_affiche_${badgeTitle.toLowerCase()}.png`,
        { type: 'image/png' }
      );

      const title = `Affiche ${badgeTitle} - ${clubSettings.shortName}`;
      const text =
        selectedSocialTab === 'tiktok'
          ? generatedCaptions.tiktok
          : selectedSocialTab === 'facebook'
          ? generatedCaptions.facebook
          : generatedCaptions.instagram;

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

  // Webhook
  const handleSendToWebhook = async () => {
    setWebhookStatus({ loading: true });
    try {
      const activeCaption =
        selectedSocialTab === 'tiktok'
          ? generatedCaptions.tiktok
          : selectedSocialTab === 'facebook'
          ? generatedCaptions.facebook
          : generatedCaptions.instagram;

      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedSocialTab,
          type: contentType,
          badgeTitle,
          title: `${clubSettings.shortName} • ${badgeTitle}`,
          caption: activeCaption,
          matches: contentType === 'matches' ? displayedMatches : [],
          results: contentType === 'results' ? displayedResults : [],
          webhookUrl: clubSettings.socialWebhookUrl || '',
        }),
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
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomBgImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase font-bebas tracking-wide flex items-center gap-2">
                AFFICHE OFFICIELLE RENCONTRES & PASSERELLE RÉSEAUX SOCIAUX
              </h3>
              <p className="text-xs text-slate-400">
                Générez l'affiche officielle du club (Instagram, Facebook, TikTok) avec police auto-adaptative
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Type & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-950/80 border-b border-slate-800">
          
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

            {onOpenVideoExporter && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVideoExporter();
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold font-bebas tracking-wider uppercase transition-all flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md cursor-pointer ml-1 active:scale-95"
                title="Exporter et télécharger le carrousel complet en vidéo (MP4 / WebM)"
              >
                <Video className="w-3.5 h-3.5 text-purple-200" />
                <span>Export Vidéo (Carrousel)</span>
              </button>
            )}
          </div>

          {/* Matches Sub-filters: Domicile, Extérieur, Exempt, Tout */}
          {contentType === 'matches' && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Affiche :</span>
              <button
                onClick={() => {
                  setPosterFilter('home');
                  setCustomBadgeTitle('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  posterFilter === 'home'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Générer l'affiche des matchs à domicile (DOMICILE)"
              >
                <Home className="w-3 h-3" />
                <span>DOMICILE</span>
              </button>

              <button
                onClick={() => {
                  setPosterFilter('away');
                  setCustomBadgeTitle('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  posterFilter === 'away'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Générer l'affiche des matchs à l'extérieur (EXTÉRIEUR)"
              >
                <Navigation className="w-3 h-3" />
                <span>EXTÉRIEUR</span>
              </button>

              <button
                onClick={() => {
                  setPosterFilter('exempt');
                  setCustomBadgeTitle('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  posterFilter === 'exempt'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Générer l'affiche des équipes exemptes (EXEMPT)"
              >
                <PauseCircle className="w-3 h-3" />
                <span>EXEMPT</span>
              </button>

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
                title="Afficher toutes les rencontres de la semaine"
              >
                <Layers className="w-3 h-3" />
                <span>TOUT</span>
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
                title="Visuels Briques & Mascotte SRC Basket"
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
          </div>
        </div>

        {/* Modal Main Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-5 bg-slate-950/90">
          
          {/* ========================================================================= */}
          {/* LEFT: THE LIVE CAPTURABLE VISUAL CARD */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-2 bg-black/50 rounded-3xl border border-slate-800/80 overflow-hidden relative">
            
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

            {/* Quick Badge Text Editor */}
            <div className="w-full flex items-center gap-2 px-2 mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 shrink-0">
                <Edit3 className="w-3 h-3 text-red-400" />
                <span>Titre du badge :</span>
              </span>
              <input
                type="text"
                value={customBadgeTitle}
                onChange={(e) => setCustomBadgeTitle(e.target.value)}
                placeholder={badgeTitle}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white uppercase font-bold focus:outline-none focus:border-red-500"
              />
              {customBadgeTitle && (
                <button
                  type="button"
                  onClick={() => setCustomBadgeTitle('')}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Défaut
                </button>
              )}
            </div>

            {/* ========================================================================= */}
            {/* CARD CONTAINER WITH SELECTED ASPECT RATIO & RENDERED VISUAL */}
            {/* ========================================================================= */}
            <div
              ref={cardRef}
              className={`w-full relative overflow-hidden text-white flex flex-col justify-between select-none shadow-2xl transition-all ${
                aspectRatio === '4:5'
                  ? 'max-w-[420px] aspect-[4/5] p-5 sm:p-6 rounded-3xl'
                  : aspectRatio === '9:16'
                  ? 'max-w-[340px] aspect-[9/16] p-5 sm:p-6 rounded-3xl'
                  : aspectRatio === '1:1'
                  ? 'max-w-[400px] aspect-square p-4 sm:p-5 rounded-3xl'
                  : 'max-w-[540px] aspect-[16/9] p-4 sm:p-5 rounded-3xl'
              }`}
              style={{
                backgroundColor: '#111111',
              }}
            >
              {/* THEME 1: OFFICIAL BASKETBALL RED POSTER (MATCHING USER IMAGES & TEMPLATE) */}
              {visualTheme === 'poster-red' && (
                <>
                  {/* Photo background with grayscale & blur */}
                  <img
                    src={effectiveBgUrl}
                    alt="Fond affiche basket"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none filter grayscale contrast-125 brightness-[0.55] blur-[6px] transform scale-105"
                  />

                  {/* Radial vignette overlay for maximum readability & high contrast */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                    }}
                  />

                  {/* Subtle sports lighting accent */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-64 h-32 bg-red-600/20 blur-3xl pointer-events-none" />

                  {/* CONTENT WRAPPER */}
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">
                    
                    {/* TOP SECTION: 6 RED STRIPES & HEADER BADGE */}
                    <div className="w-full flex flex-col items-center">
                      
                      {/* 6 Slanted Red Stripes (Exact Match to Photos) */}
                      <div className="flex gap-1.5 transform -skew-x-[25deg] mb-2 z-10">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="w-2 h-4.5 bg-[#c80815] rounded-[1px] shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                          />
                        ))}
                      </div>

                      {/* Header Badge: DOMICILE / EXTÉRIEUR / EXEMPT / RÉSULTATS */}
                      <div
                        className="text-white font-montserrat font-black uppercase tracking-wider text-center border-t border-white/20 z-10"
                        style={{
                          background: 'linear-gradient(180deg, #c80815 0%, #900008 100%)',
                          fontSize: aspectRatio === '1:1' ? '22px' : '26px',
                          padding: '6px 34px',
                          borderRadius: '12px',
                          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                          marginBottom: aspectRatio === '1:1' ? '12px' : '18px',
                          lineHeight: '1.2',
                        }}
                      >
                        {badgeTitle}
                      </div>
                    </div>

                    {/* MATCHES LIST BODY */}
                    {contentType === 'matches' && (
                      <div className="w-full flex-1 flex flex-col justify-center gap-3 my-1">
                        {displayedMatches.map((m) => {
                          const isExempt =
                            posterFilter === 'exempt' ||
                            m.teamAway?.toLowerCase().includes('exempt') ||
                            m.teamHome?.toLowerCase().includes('exempt');

                          const teamLeft = m.isHomeMatch ? m.category : m.category;
                          const teamRight = isExempt ? 'Exempt' : (m.isHomeMatch ? m.teamAway : m.teamHome);

                          return (
                            <div key={m.id} className="w-full flex flex-col items-center">
                              {/* Match Date Header: Samedi 19 septembre | 13h30 */}
                              <div
                                className="font-montserrat font-bold text-[#e0e0e0] text-center mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                                style={{
                                  fontSize: aspectRatio === '1:1' ? '11px' : '12.5px',
                                  letterSpacing: '0.4px',
                                }}
                              >
                                {formatPosterMatchDate(m.date, m.time)}
                              </div>

                              {/* Match Row: [Team Left Pill] (vs) [Team Right Pill] */}
                              <div className="w-full flex items-center justify-between gap-2">
                                
                                {/* Home / Category Pill with Auto-adaptive font */}
                                <div
                                  className="flex-1 rounded-full flex items-center justify-center border-t border-white/25"
                                  style={{
                                    height: '42px',
                                    background: 'linear-gradient(180deg, #c80815 0%, #900008 100%)',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                  }}
                                >
                                  <AutoFitTeamName name={teamLeft} />
                                </div>

                                {/* Center Round VS Badge */}
                                <div
                                  className="w-7 h-7 rounded-full bg-white text-[#111111] font-montserrat font-black flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(0,0,0,0.5)] lowercase select-none"
                                  style={{ fontSize: '10.5px' }}
                                >
                                  vs
                                </div>

                                {/* Away / Opponent Pill with Auto-adaptive font */}
                                <div
                                  className="flex-1 rounded-full flex items-center justify-center border-t border-white/25"
                                  style={{
                                    height: '42px',
                                    background: 'linear-gradient(180deg, #c80815 0%, #900008 100%)',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                  }}
                                >
                                  <AutoFitTeamName name={teamRight} isExempt={isExempt} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* RESULTS LIST BODY */}
                    {contentType === 'results' && (
                      <div className="w-full flex-1 flex flex-col justify-center gap-3 my-1">
                        {displayedResults.map((r) => {
                          const isWin = r.result === 'win';
                          const scoreDisplay = `${r.homeScore ?? 0} - ${r.awayScore ?? 0}`;

                          return (
                            <div key={r.id} className="w-full flex flex-col items-center">
                              {/* Date / Category */}
                              <div
                                className="font-montserrat font-bold text-[#e0e0e0] text-center mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex items-center gap-1.5"
                                style={{
                                  fontSize: aspectRatio === '1:1' ? '11px' : '12.5px',
                                  letterSpacing: '0.4px',
                                }}
                              >
                                <span>{r.category}</span>
                                <span>•</span>
                                <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isWin ? 'VICTOIRE' : 'DÉFAITE'}
                                </span>
                              </div>

                              {/* Row */}
                              <div className="w-full flex items-center justify-between gap-2">
                                <div
                                  className="flex-1 rounded-full flex items-center justify-center border-t border-white/25"
                                  style={{
                                    height: '42px',
                                    background: isWin
                                      ? 'linear-gradient(180deg, #059669 0%, #064e3b 100%)'
                                      : 'linear-gradient(180deg, #c80815 0%, #900008 100%)',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
                                  }}
                                >
                                  <AutoFitTeamName name={r.teamHome} />
                                </div>

                                <div
                                  className="px-2.5 h-7 rounded-full bg-white text-[#111111] font-montserrat font-black flex items-center justify-center shrink-0 shadow-md text-xs font-mono"
                                >
                                  {scoreDisplay}
                                </div>

                                <div
                                  className="flex-1 rounded-full flex items-center justify-center border-t border-white/25"
                                  style={{
                                    height: '42px',
                                    background: isWin
                                      ? 'linear-gradient(180deg, #059669 0%, #064e3b 100%)'
                                      : 'linear-gradient(180deg, #c80815 0%, #900008 100%)',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
                                  }}
                                >
                                  <AutoFitTeamName name={r.teamAway} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* NOTIFICATION BODY */}
                    {contentType === 'notification' && specificNotification && (
                      <div className="w-full flex-1 flex flex-col items-center justify-center text-center my-2">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 shadow-xl ${
                            specificNotification.isWin ? 'bg-emerald-500' : 'bg-red-600'
                          }`}
                        >
                          <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-montserrat font-black text-2xl tracking-wider text-white uppercase drop-shadow-md">
                          {specificNotification.isWin ? 'VICTOIRE DU CLUB !' : 'COUP DE SIFFLET FINAL'}
                        </h4>
                        <div className="font-montserrat font-bold text-slate-300 text-sm mt-1">
                          {specificNotification.category || specificNotification.team}
                        </div>

                        <div className="w-full bg-black/60 rounded-2xl border border-white/20 p-4 my-3 flex items-center justify-center gap-3 backdrop-blur-md">
                          <div className="flex-1 font-montserrat font-extrabold text-sm text-right truncate">
                            {specificNotification.ourTeam || clubSettings.shortName}
                          </div>
                          <div className="px-3.5 py-1 bg-red-600 rounded-xl text-3xl font-black font-teko text-white border border-red-500 shadow-md">
                            {specificNotification.ourScore} : {specificNotification.opponentScore}
                          </div>
                          <div className="flex-1 font-montserrat font-extrabold text-sm text-left truncate text-slate-300">
                            {specificNotification.opponent || 'Adversaire'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FOOTER NOTICE / GYMNASIUM */}
                    <div className="w-full pt-2 flex items-center justify-between text-[9px] font-montserrat font-bold text-slate-300/80 border-t border-white/15">
                      <span className="truncate max-w-[170px]">{clubSettings.gymnasiumDefault}</span>
                      <span className="font-mono text-white/90">
                        {clubSettings.instagramHandle || `#${clubSettings.shortName}`}
                      </span>
                    </div>
                  </div>

                  {/* 3 Zebra White Stripes in Bottom Right (Signature look from reference images) */}
                  <div className="absolute -bottom-3 -right-3 flex flex-col gap-2.5 -rotate-45 pointer-events-none z-20">
                    <div className="w-28 h-3 bg-white shadow-md" />
                    <div className="w-28 h-3 bg-white shadow-md" />
                    <div className="w-28 h-3 bg-white shadow-md" />
                  </div>
                </>
              )}

              {/* THEME 2: BRICK WALL & MASCOT */}
              {visualTheme === 'brick' && (
                <>
                  <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="brick-pat-modal" width="50" height="25" patternUnits="userSpaceOnUse">
                        <rect width="50" height="25" fill="#4a1610" />
                        <path d="M 0 0 L 50 0 M 0 12.5 L 50 12.5 M 0 25 L 50 25 M 25 0 L 25 12.5 M 0 12.5 L 0 25 M 50 12.5 L 50 25" stroke="#1f0704" strokeWidth="2" fill="none" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#brick-pat-modal)" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />

                  <div className="relative z-10 w-full h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/20 pb-2">
                      <div className="font-bebas text-lg font-black text-white">{clubSettings.name}</div>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase font-bebas">
                        {badgeTitle}
                      </span>
                    </div>

                    <div className="my-auto space-y-2">
                      {displayedMatches.map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-1.5 py-0.5">
                          <div className="bg-white text-black font-black px-2 py-1 rounded-md text-xs uppercase truncate w-[42%] text-center shadow-md">
                            <AutoFitTeamName name={m.category} />
                          </div>
                          <span className="bg-red-600 text-white font-black italic px-2 py-0.5 rounded text-[10px] transform -skew-x-12">
                            VS
                          </span>
                          <div className="bg-white text-black font-black px-2 py-1 rounded-md text-xs uppercase truncate w-[42%] text-center shadow-md">
                            <AutoFitTeamName name={m.isHomeMatch ? m.teamAway : m.teamHome} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/20 pt-1 text-[9px] text-slate-300 flex justify-between">
                      <span>{clubSettings.gymnasiumDefault}</span>
                      <span>{clubSettings.instagramHandle || clubSettings.shortName}</span>
                    </div>
                  </div>
                </>
              )}

              {/* THEME 3: DARK MODERN */}
              {visualTheme === 'modern' && (
                <>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 w-full h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="font-bebas text-lg font-black text-amber-400">{clubSettings.name}</div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-bold border border-slate-700">
                        {badgeTitle}
                      </span>
                    </div>

                    <div className="my-auto space-y-2">
                      {displayedMatches.map((m) => (
                        <div key={m.id} className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] text-orange-400 font-bold uppercase">{m.category}</div>
                            <div className="font-bebas text-sm font-black text-white truncate">
                              {m.teamHome} <span className="text-slate-500 font-normal">vs</span> {m.teamAway}
                            </div>
                          </div>
                          <div className="text-[10px] font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {m.time}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-1 text-[9px] text-slate-400 flex justify-between">
                      <span>{clubSettings.gymnasiumDefault}</span>
                      <span>{clubSettings.instagramHandle || clubSettings.shortName}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: SOCIAL BRIDGE CONTROLS (INSTAGRAM, TIKTOK, FACEBOOK, WEBHOOK) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* Social Platform Tabs */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-red-500" />
                  <span>Passerelle de diffusion réseaux sociaux</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  1-Clic Copie & Partage
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => setSelectedSocialTab('instagram')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedSocialTab === 'instagram'
                      ? 'bg-gradient-to-tr from-pink-600 to-rose-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedSocialTab('tiktok');
                    setAspectRatio('9:16');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedSocialTab === 'tiktok'
                      ? 'bg-gradient-to-tr from-cyan-600 via-slate-900 to-pink-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Flame className="w-4 h-4 text-cyan-300" />
                  <span>TikTok</span>
                </button>

                <button
                  onClick={() => setSelectedSocialTab('facebook')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedSocialTab === 'facebook'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </button>

                <button
                  onClick={() => setSelectedSocialTab('webhook')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedSocialTab === 'webhook'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Webhook</span>
                </button>
              </div>
            </div>

            {/* PLATFORM SPECIFIC PANEL */}
            <div className="flex-1 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
              
              {/* INSTAGRAM PANEL */}
              {selectedSocialTab === 'instagram' && (
                <div className="space-y-2.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-pink-400 text-xs font-bold">
                      <Instagram className="w-4 h-4" />
                      <span>Légende Instagram prête à publier ({badgeTitle})</span>
                    </div>

                    <a
                      href="https://www.instagram.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-pink-400 hover:underline flex items-center gap-1"
                    >
                      <span>Ouvrir Instagram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative flex-1">
                    <textarea
                      readOnly
                      value={generatedCaptions.instagram}
                      rows={6}
                      className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Format conseillé : <strong>Portrait (4:5)</strong> ou <strong>Story (9:16)</strong>
                    </span>

                    <button
                      onClick={() => handleCopyText(generatedCaptions.instagram, 'insta')}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      {copiedKey === 'insta' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Légende copiée !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier la Légende</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TIKTOK PANEL */}
              {selectedSocialTab === 'tiktok' && (
                <div className="space-y-2.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                      <Flame className="w-4 h-4 text-cyan-400" />
                      <span>Passerelle TikTok (Mode Photo Slide 9:16)</span>
                    </div>

                    <a
                      href="https://www.tiktok.com/upload"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Ouvrir TikTok Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative flex-1">
                    <textarea
                      readOnly
                      value={generatedCaptions.tiktok}
                      rows={5}
                      className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Hashtags optimisés pour le feed <strong>#PourToi #FYP</strong>
                    </span>

                    <button
                      onClick={() => handleCopyText(generatedCaptions.tiktok, 'tiktok')}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      {copiedKey === 'tiktok' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Description TikTok Copiée !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier la Description</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* FACEBOOK PANEL */}
              {selectedSocialTab === 'facebook' && (
                <div className="space-y-2.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                      <Facebook className="w-4 h-4" />
                      <span>Publication Facebook (Communauté & Supporters)</span>
                    </div>

                    <a
                      href="https://www.facebook.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Ouvrir Facebook</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative flex-1">
                    <textarea
                      readOnly
                      value={generatedCaptions.facebook}
                      rows={6}
                      className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Format idéal : <strong>Portrait (4:5)</strong> ou <strong>Carré (1:1)</strong>
                    </span>

                    <button
                      onClick={() => handleCopyText(generatedCaptions.facebook, 'fb')}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      {copiedKey === 'fb' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Post Facebook Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier le Post</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* WEBHOOK / AUTOMATION PANEL */}
              {selectedSocialTab === 'webhook' && (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                      <Zap className="w-4 h-4" />
                      <span>Passerelle Webhook & Automatisation (Zapier / Make / Meta)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Diffusez automatiquement l'affiche {badgeTitle} vers vos réseaux ou Discord via Webhook.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <label className="text-[11px] text-slate-400 block font-medium">
                      URL du Webhook configuré :
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={clubSettings.socialWebhookUrl || 'Non configuré (optionnel dans Réglages)'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono"
                    />
                  </div>

                  {webhookStatus.message && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        webhookStatus.success
                          ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{webhookStatus.message}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSendToWebhook}
                    disabled={webhookStatus.loading}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {webhookStatus.loading ? 'Envoi en cours...' : 'Déclencher la Passerelle Webhook'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS: NATIVE SHARE & HIGH RES DOWNLOAD */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNativeShare}
                  disabled={isSharing || isExporting}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all hover:scale-105 disabled:opacity-50"
                  id="btn-native-social-share"
                  title="Partage direct dans Instagram, Facebook ou WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isSharing ? 'Préparation...' : 'Partager Directement (App / Mobile)'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadImage}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 shadow-md shadow-red-600/20"
                  id="btn-download-social-image"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Téléchargé (Haute Définition) !</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-white" />
                      <span>{isExporting ? 'Génération...' : `Télécharger l'Affiche (${aspectRatio})`}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Notice */}
        <div className="px-5 py-2 border-t border-slate-800 bg-slate-950 text-center flex items-center justify-between text-[11px] text-slate-400">
          <span>
            🏀 Affiche officielle générée au ratio <strong>{aspectRatio}</strong> • Police auto-adaptative sans débordement • Prêt pour <strong>Instagram</strong>, <strong>Facebook</strong> et <strong>TikTok</strong>
          </span>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
