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
  Globe,
  Radio,
  Clock,
  MapPin,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { MatchItem, ClubSettings, FinishedMatchNotification } from '../types';

interface VisualExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'matches' | 'results' | 'victory' | 'defeat';
  matches: MatchItem[];
  results: MatchItem[];
  clubSettings: ClubSettings;
  specificNotification?: FinishedMatchNotification | null;
}

export const VisualExporterModal: React.FC<VisualExporterModalProps> = ({
  isOpen,
  onClose,
  type: initialType,
  matches,
  results,
  clubSettings,
  specificNotification,
}) => {
  const [contentType, setContentType] = useState<'matches' | 'results' | 'notification'>(
    initialType === 'victory' || initialType === 'defeat'
      ? 'notification'
      : initialType === 'results'
      ? 'results'
      : 'matches'
  );

  // Aspect ratio for social media: 9:16 (TikTok / Story), 1:1 (Post feed), 16:9 (Landscape)
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [visualTheme, setVisualTheme] = useState<'brick' | 'modern'>('brick');
  const [selectedSocialTab, setSelectedSocialTab] = useState<'instagram' | 'tiktok' | 'facebook' | 'webhook'>('instagram');

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [webhookStatus, setWebhookStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });

  const cardRef = useRef<HTMLDivElement>(null);

  // Generate captions for Instagram, TikTok, and Facebook
  const generatedCaptions = useMemo(() => {
    const clubTag = clubSettings.instagramHandle || `@${clubSettings.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const fbTag = clubSettings.facebookPage || clubSettings.name;
    const ttTag = clubSettings.tiktokHandle || `@${clubSettings.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}_basket`;

    if (contentType === 'matches') {
      const matchLines = matches.slice(0, 6).map((m) =>
        `🏀 ${m.category} : ${m.teamHome} vs ${m.teamAway} (${m.time} - ${m.isHomeMatch ? '🏠 Domicile' : '🚗 Déplacement'})`
      ).join('\n');

      return {
        instagram: `🔥 PROGRAMME DU WEEK-END | ${clubSettings.shortName.toUpperCase()} 🔥\n\nC'est l'heure du matchday ! Retrouvez toutes nos équipes sur les parquets ce week-end :\n\n${matchLines}\n\n📍 Rendez-vous au ${clubSettings.gymnasiumDefault} pour soutenir nos couleurs !\nBuvette & ambiance au rendez-vous ☕🍿\n\nIdentifiez-nous sur vos photos & stories : ${clubTag} 📸\n\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #MatchDay #Basketball #FFBB #BasketFrance #ProgrammeDuWeekend #TeamSpirit #GameDay`,
        tiktok: `🏀 Le programme basket du week-end est là ! Qui vient nous encourager au gymnase ? 🔥⚡ Commente ton équipe préférée ! 👇\n\n${matches.slice(0, 4).map((m) => `👉 ${m.category} à ${m.time} (${m.isHomeMatch ? 'Domicile' : 'Extérieur'})`).join('\n')}\n\n#fyp #pourtoi #basketball #hoops #basketfrance #matchday #basketclub #viral #sports`,
        facebook: `🏀 PROGRAMME DU WEEK-END - ${clubSettings.name.toUpperCase()} 🏀\n\nChers supporters, licenciés et familles,\nVoici le planning complet de nos rencontres pour ce week-end :\n\n${matchLines}\n\nVenez nombreux applaudir nos joueuses et joueurs au ${clubSettings.gymnasiumDefault} ! La buvette du club vous accueillera tout le week-end avec boissons chaudes, fraîches et petite restauration.\n\nAllez le ${clubSettings.shortName} ! 🧡🖤\n\nPage officielle : ${fbTag}\n#Basketball #${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #FFBB #TousAuGymnase`,
      };
    }

    if (contentType === 'results') {
      const wins = results.filter((r) => r.result === 'win').length;
      const total = results.length;
      const resultLines = results.slice(0, 6).map((r) =>
        `${r.result === 'win' ? '✅ VICTOIRE' : '❌ DÉFAITE'} [${r.category}] : ${r.teamHome} ${r.homeScore ?? ''} - ${r.awayScore ?? ''} ${r.teamAway}`
      ).join('\n');

      return {
        instagram: `🏆 RÉSULTATS DU WEEK-END | ${clubSettings.shortName.toUpperCase()} 🏆\n\nBilan du week-end : ${wins} victoires sur ${total} matchs joués ! Bravo à tous nos collectifs pour leur combativité sur le terrain. 👏🔥\n\n${resultLines}\n\nMerci à tous les supporters, coachs, arbitres et bénévoles présents ! ❤️\n\nIdentifiez vos moments forts : ${clubTag}\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #Resultats #Victoire #Basketball #FFBB #BasketFrance #TeamBCA`,
        tiktok: `🏆 Les résultats basket du week-end sont tombés ! ${wins} victoires au compteur 🔥💪 Quelle équipe t'a le plus impressionné ? Dis-le en commentaire ! 🏀✨\n\n#fyp #pourtoi #basketball #resultats #victoire #basketfrance #hoops #buzzerbeater`,
        facebook: `🏆 BILAN DES RENCONTRES DU WEEK-END - ${clubSettings.name.toUpperCase()} 🏆\n\nFélicitations à l'ensemble de nos équipes pour leur engagement ce week-end ! Bilan global : ${wins} victoires sur ${total} rencontres.\n\n${resultLines}\n\nUn immense merci à nos bénévoles qui ont tenu la table de marque et la buvette, ainsi qu'aux fidèles supporters venus donner de la voix dans les tribunes !\n\nProchains rendez-vous très vite sur notre page : ${fbTag}\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #Basketball #ResultatsWeekend #FFBB`,
      };
    }

    // Specific alert / notification
    const alert = specificNotification;
    const isWin = alert ? alert.isWin : true;
    const team = alert?.team || 'Seniors 1';
    const ourScore = alert?.ourScore ?? 78;
    const oppScore = alert?.opponentScore ?? 72;
    const opp = alert?.opponent || 'Adversaire';

    return {
      instagram: `${isWin ? '🚨 VICTOIRE ÉCLATANTE ! 🏆' : '🚨 FIN DU MATCH ! 🏀'}\n\nScore final : ${team} ${ourScore} - ${oppScore} ${opp} !\n${isWin ? 'Énorme prestation collective de nos joueurs qui décrochent une superbe victoire !' : 'Gros combat sur le parquet, on garde la tête haute et on se remobilise pour le prochain match !'}\n\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #BasketFrance #${isWin ? 'Victoire' : 'TeamSpirit'} #FFBB`,
      tiktok: `${isWin ? '🏆 VICTOIRE !!' : '🏀 Fin de match intense !'} ${team} l'emporte ${ourScore}-${oppScore} contre ${opp} ! Quel match ! 🔥⚡ #fyp #pourtoi #basketball #victoire #buzzerbeater`,
      facebook: `${isWin ? '🏆 SUPERBE VICTOIRE DE NOTRE ÉQUIPE ! 🏆' : '🏀 RÉSULTAT DE LA RENCONTRE 🏀'}\n\n${team} s'impose ${ourScore} à ${oppScore} face à ${opp} !\nFélicitations aux joueurs et au staff pour cette performance.\n\n#${clubSettings.shortName.replace(/[^a-zA-Z0-9]/g, '')} #FFBB #Basketball`,
    };
  }, [contentType, matches, results, specificNotification, clubSettings]);

  if (!isOpen) return null;

  // Copy text helper
  const handleCopyText = (text: string, key: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  // Download High-Resolution Image PNG
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2, // High resolution Retina 2x
      });

      const link = document.createElement('a');
      const formatLabel = aspectRatio === '9:16' ? 'tiktok_story' : aspectRatio === '1:1' ? 'post_carre' : 'paysage';
      link.download = `${clubSettings.shortName.toLowerCase().replace(/\s+/g, '_')}_${contentType}_${formatLabel}_${Date.now()}.png`;
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

  // Direct Mobile Web Share API (Passerelle directe vers Instagram, TikTok, WhatsApp, Facebook)
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
        `${clubSettings.shortName.toLowerCase().replace(/\s+/g, '_')}_${contentType}.png`,
        { type: 'image/png' }
      );

      const title =
        contentType === 'matches'
          ? `Programme des Matchs - ${clubSettings.shortName}`
          : contentType === 'results'
          ? `Résultats du Week-end - ${clubSettings.shortName}`
          : `Alerte Match - ${clubSettings.shortName}`;

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
        // Fallback: copy text and trigger image download
        handleCopyText(text, 'share-fallback');
        handleDownloadImage();
      }
    } catch (err) {
      console.log('Partage annulé ou non supporté:', err);
    } finally {
      setIsSharing(false);
    }
  };

  // Webhook / Passerelle API Trigger
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
          title: `${clubSettings.shortName} • ${contentType}`,
          caption: activeCaption,
          matches: contentType === 'matches' ? matches : [],
          results: contentType === 'results' ? results : [],
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase font-bebas tracking-wide flex items-center gap-2">
                PASSERELLE RÉSEAUX SOCIAUX • INSTAGRAM • TIKTOK • FACEBOOK
              </h3>
              <p className="text-xs text-slate-400">
                Générez le visuel optimisé et diffusez en 1 clic sur vos réseaux sociaux préférés
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

        {/* Content Type & Aspect Ratio Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-950/70 border-b border-slate-800">
          {/* Content Type Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setContentType('matches')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-bebas tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                contentType === 'matches'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Matchs à venir</span>
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

          {/* Social Aspect Ratio & Visual Theme Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">Thème :</span>
              <button
                onClick={() => setVisualTheme('brick')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  visualTheme === 'brick'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visuels officiels Briques & Mascotte SRC Basket"
              >
                <span>🧱 Briques & Mascotte</span>
              </button>
              <button
                onClick={() => setVisualTheme('modern')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  visualTheme === 'modern'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Style Élite Dark Modern"
              >
                <span>✨ Dark Modern</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">Format :</span>

              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  aspectRatio === '9:16'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format vertical parfait pour TikTok & Instagram Stories"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>TikTok & Story (9:16)</span>
              </button>

              <button
                onClick={() => setAspectRatio('1:1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  aspectRatio === '1:1'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format carré pour publication Feed Instagram & Facebook"
              >
                <span>Post Carré (1:1)</span>
              </button>

              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  aspectRatio === '16:9'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format paysage pour TV & bannière Facebook"
              >
                <span>Paysage (16:9)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns (Visual Preview on Left, Social Bridge Tools on Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 bg-slate-950/90">
          {/* ========================================================================= */}
          {/* LEFT: THE DYNAMIC LIVE CAPTURABLE VISUAL CARD */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center min-h-[420px] p-2 bg-black/40 rounded-3xl border border-slate-800/80 overflow-hidden relative">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Aperçu Réel Haute Résolution ({aspectRatio})</span>
            </div>

            {/* CARD CONTAINER WITH CHOSEN ASPECT RATIO */}
            <div
              ref={cardRef}
              className={`w-full border-2 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden text-white flex flex-col justify-between ${
                visualTheme === 'brick'
                  ? 'bg-[#3b120c] border-red-900/80'
                  : 'bg-gradient-to-br from-slate-950 via-slate-900 to-black border-orange-500/40'
              } ${
                aspectRatio === '9:16'
                  ? 'max-w-[340px] aspect-[9/16] py-6'
                  : aspectRatio === '1:1'
                  ? 'max-w-[420px] aspect-square'
                  : 'max-w-[540px] aspect-[16/9]'
              }`}
            >
              {/* THEME 1: BRICK WALL & WATERMARK STENCIL BACKGROUND */}
              {visualTheme === 'brick' ? (
                <>
                  {/* SVG Brick Texture */}
                  <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="brick-pat-modal" width="50" height="25" patternUnits="userSpaceOnUse">
                        <rect width="50" height="25" fill="#4a1610" />
                        <path d="M 0 0 L 50 0 M 0 12.5 L 50 12.5 M 0 25 L 50 25 M 25 0 L 25 12.5 M 0 12.5 L 0 25 M 50 12.5 L 50 25" stroke="#1f0704" strokeWidth="2" fill="none" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#brick-pat-modal)" />
                  </svg>

                  {/* Gradient Vignette & Spotlight */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85 pointer-events-none" />

                  {/* White Wall Stencil Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <svg viewBox="0 0 200 200" className="w-72 h-72 text-white fill-current">
                      <path d="M100 10 A90 90 0 1 0 100 190 A90 90 0 1 0 100 10 Z" fill="none" stroke="currentColor" strokeWidth="5" />
                      <path d="M10 100 H190 M100 10 V190 M35 35 Q100 70 165 35 M35 165 Q100 130 165 165" fill="none" stroke="currentColor" strokeWidth="3" />
                      <text x="100" y="125" textAnchor="middle" fontSize="18" fontWeight="900" letterSpacing="1">
                        {clubSettings.shortName.toUpperCase()}
                      </text>
                      <text x="100" y="145" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1">
                        SRC BASKET
                      </text>
                    </svg>
                  </div>

                  {/* 16:9 Landscape Mascot Illustration */}
                  {aspectRatio === '16:9' && (
                    <div className="absolute right-2 bottom-0 w-2/5 h-5/6 flex items-end justify-center pointer-events-none z-10">
                      <div className="text-7xl sm:text-8xl filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]">
                        🐂
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* THEME 2: DARK MODERN AMBIENT LIGHTING */
                <>
                  <div className="absolute top-0 right-0 w-44 h-44 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                </>
              )}

              {/* CARD TOP HEADER */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 p-0.5 flex items-center justify-center shadow-md">
                    <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center font-bebas font-black text-amber-400 text-xs">
                      {clubSettings.shortName.substring(0, 3).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="font-bebas text-base font-black tracking-wide leading-none text-white drop-shadow">
                      {clubSettings.name}
                    </div>
                    <div className="text-[9px] text-slate-300 font-mono">
                      FFBB N° {clubSettings.codeFFBB}
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase font-bebas tracking-wider shadow-sm">
                  {contentType === 'matches' ? 'MatchDay' : contentType === 'results' ? 'Résultats' : 'Alerte'}
                </span>
              </div>

              {/* CARD BODY: MATCHES LIST */}
              {contentType === 'matches' && (
                <div className="relative z-10 flex-1 my-2 flex flex-col justify-center">
                  <div className="text-center mb-2">
                    <h4 className="text-xl sm:text-2xl font-black font-bebas tracking-wide text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {visualTheme === 'brick' ? 'Les rencontres de la semaine' : 'LE PROGRAMME DU WEEK-END'}
                    </h4>
                  </div>

                  {visualTheme === 'brick' ? (
                    /* STYLE BRIQUES : STACKED WHITE & RED PILLS */
                    <div className="space-y-1.5 max-h-[220px] overflow-hidden">
                      {matches.slice(0, aspectRatio === '9:16' ? 7 : 5).map((m) => (
                        <div key={m.id} className="flex items-center justify-between gap-1.5 py-0.5">
                          <div className="bg-white text-black font-black px-2 py-1 rounded-md text-[11px] sm:text-xs uppercase truncate w-[42%] text-center shadow-md border border-slate-300">
                            {m.category}
                          </div>

                          <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0">
                            <div className="text-white text-[10px] font-bold flex items-center gap-1 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                              <span>{m.time}</span>
                              <span>{m.isHomeMatch ? '🏠' : '✈️'}</span>
                            </div>
                            <span className="bg-red-600 text-white font-black italic px-2 py-0.5 rounded text-[10px] tracking-wider shadow-md transform -skew-x-12">
                              VS
                            </span>
                          </div>

                          <div className="bg-white text-black font-black px-2 py-1 rounded-md text-[11px] sm:text-xs uppercase truncate w-[42%] text-center shadow-md border border-slate-300">
                            {m.isHomeMatch ? m.teamAway : m.teamHome || 'Exempt'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* STYLE MODERN : SLATE CARDS */
                    <div className="space-y-1.5">
                      {matches.slice(0, aspectRatio === '9:16' ? 5 : 4).map((m) => (
                        <div
                          key={m.id}
                          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 shadow-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[9px] text-orange-400 font-bold uppercase">
                              <span>{m.category}</span>
                              <span className="text-slate-500">•</span>
                              <span className={m.isHomeMatch ? 'text-emerald-400' : 'text-amber-400'}>
                                {m.isHomeMatch ? '🏠 DOMICILE' : '🚗 EXTÉRIEUR'}
                              </span>
                            </div>
                            <div className="font-bebas text-xs sm:text-sm font-black text-white truncate">
                              {m.teamHome} <span className="text-slate-500 font-normal">vs</span> {m.teamAway}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-[11px] font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                              {m.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CARD BODY: RESULTS LIST */}
              {contentType === 'results' && (
                <div className="relative z-10 flex-1 my-2 flex flex-col justify-center">
                  <div className="text-center mb-2">
                    <h4 className="text-xl sm:text-2xl font-black font-bebas tracking-wide text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      {visualTheme === 'brick' ? 'Les résultats du week-end' : 'LES SCORES DU WEEK-END'}
                    </h4>
                  </div>

                  {visualTheme === 'brick' ? (
                    /* STYLE BRIQUES : NEON GREEN (WIN) & RED (LOSS) CATEGORY PILLS */
                    <div className="space-y-1.5 max-h-[220px] overflow-hidden">
                      {results.slice(0, aspectRatio === '9:16' ? 7 : 5).map((r) => {
                        const isWin = r.result === 'win';
                        const isLoss = r.result === 'loss';

                        return (
                          <div key={r.id} className="flex items-center justify-between gap-1.5 py-0.5">
                            <div
                              className={`font-black px-2 py-1 rounded-md text-[11px] sm:text-xs uppercase truncate w-[42%] text-center shadow-md border ${
                                isWin
                                  ? 'bg-[#00ff22] text-black border-lime-300'
                                  : isLoss
                                  ? 'bg-[#ff0022] text-white border-red-600'
                                  : 'bg-white text-black border-slate-300'
                              }`}
                            >
                              {r.category}
                            </div>

                            <div className="flex flex-col items-center justify-center min-w-[50px] shrink-0">
                              <div className="text-white text-[10px] font-bold flex items-center gap-1 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                                <span>{r.time || '18h30'}</span>
                                <span>{r.isHomeMatch ? '🏠' : '✈️'}</span>
                              </div>
                              <span className="bg-red-600 text-white font-black italic px-2 py-0.5 rounded text-[10px] tracking-wider shadow-md transform -skew-x-12">
                                VS
                              </span>
                            </div>

                            <div className="bg-white text-black font-black px-2 py-1 rounded-md text-[11px] sm:text-xs uppercase truncate w-[42%] text-center shadow-md border border-slate-300">
                              {r.isHomeMatch ? r.teamAway : r.teamHome || 'Exempt'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* STYLE MODERN : SLATE CARDS */
                    <div className="space-y-1.5">
                      {results.slice(0, aspectRatio === '9:16' ? 5 : 4).map((r) => {
                        const isWin = r.result === 'win';
                        return (
                          <div
                            key={r.id}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 shadow-sm ${
                              isWin
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-100'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase">
                                <span className="text-white">{r.category}</span>
                                <span className="text-slate-500">•</span>
                                <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                                  {isWin ? 'VICTOIRE' : 'DÉFAITE'}
                                </span>
                              </div>
                              <div className="font-bebas text-xs sm:text-sm font-black truncate text-slate-200">
                                {r.teamHome} vs {r.teamAway}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div
                                className={`text-xs sm:text-sm font-black font-teko px-2 py-0.5 rounded-md shadow-sm ${
                                  isWin ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                }`}
                              >
                                {r.homeScore} : {r.awayScore}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CARD BODY: SPECIFIC NOTIFICATION ALERT */}
              {contentType === 'notification' && specificNotification && (
                <div className="relative z-10 flex-1 my-2 flex flex-col items-center justify-center text-center">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2 shadow-lg ${
                      specificNotification.isWin ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    <Trophy className="w-7 h-7" />
                  </div>
                  <h4
                    className={`text-2xl sm:text-3xl font-black font-bebas tracking-wide leading-none ${
                      specificNotification.isWin ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {specificNotification.isWin ? 'VICTOIRE DU CLUB !' : 'COUP DE SIFFLET FINAL'}
                  </h4>
                  <div className="text-xs text-slate-200 font-semibold mt-1">
                    {specificNotification.category || specificNotification.team}
                  </div>

                  <div className="w-full bg-black/60 rounded-2xl border border-white/20 p-3 my-2 flex items-center justify-center gap-2 backdrop-blur-sm">
                    <div className="text-right flex-1 truncate font-bebas text-xs sm:text-sm">
                      {specificNotification.ourTeam || clubSettings.shortName}
                    </div>
                    <div className="px-3 py-1 bg-red-600 rounded-xl text-2xl sm:text-3xl font-black font-teko text-white border border-red-500 shadow-md">
                      {specificNotification.ourScore} : {specificNotification.opponentScore}
                    </div>
                    <div className="text-left flex-1 truncate font-bebas text-xs sm:text-sm text-slate-300">
                      {specificNotification.opponent || 'Adversaire'}
                    </div>
                  </div>
                </div>
              )}

              {/* CARD FOOTER WITH SOCIAL TAGS */}
              <div className="relative z-10 border-t border-white/20 pt-1.5 flex items-center justify-between text-[9px] text-slate-300">
                <span className="truncate max-w-[150px] font-medium">{clubSettings.gymnasiumDefault}</span>
                <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
                  <span>{clubSettings.instagramHandle || `#${clubSettings.shortName}`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT: SOCIAL BRIDGE CONTROLS (INSTAGRAM, TIKTOK, FACEBOOK, WEBHOOK) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            {/* Social Platform Tabs */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-orange-400" />
                  <span>Choisir la passerelle de diffusion</span>
                </span>

                <span className="text-[10px] text-slate-500 font-mono">
                  1-Clic Copy & Partage
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
                    setAspectRatio('9:16'); // Recommend 9:16 for TikTok
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
            <div className="flex-1 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
              {/* INSTAGRAM PANEL */}
              {selectedSocialTab === 'instagram' && (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-pink-400 text-xs font-bold">
                      <Instagram className="w-4 h-4" />
                      <span>Légende prête pour Instagram (Story ou Post Feed)</span>
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
                      rows={7}
                      className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Conseil : Utilisez le format <strong>Story (9:16)</strong> ou <strong>Post (1:1)</strong>
                    </span>

                    <button
                      onClick={() => handleCopyText(generatedCaptions.instagram, 'insta')}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      {copiedKey === 'insta' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copié dans le presse-papier !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier la Légende Instagram</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TIKTOK PANEL */}
              {selectedSocialTab === 'tiktok' && (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                      <Flame className="w-4 h-4 text-cyan-400" />
                      <span>Passerelle TikTok (Format Story / Photo Slide 9:16)</span>
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

                  <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-cyan-200 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                      Idée TikTok Carrousel / Photo :
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Téléchargez l'image en 9:16, importez-la sur TikTok en mode photo et ajoutez un son énergique ou un son tendance basket !
                    </p>
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
                          <span>Texte TikTok Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier la Description TikTok</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* FACEBOOK PANEL */}
              {selectedSocialTab === 'facebook' && (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                      <Facebook className="w-4 h-4" />
                      <span>Publication Facebook (Communauté & Familles)</span>
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
                      rows={7}
                      className="w-full h-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      Format conseillé : <strong>Post Carré (1:1)</strong> ou <strong>Bannière (16:9)</strong>
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
                          <span>Copier le Post Facebook</span>
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
                      Diffusez automatiquement les matchs ou résultats vers votre page Facebook, compte Instagram ou Discord via un webhook.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <label className="text-[11px] text-slate-400 block font-medium">
                      URL du Webhook configuré (Make, Zapier, Meta Graph API ou n8n) :
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={clubSettings.socialWebhookUrl || 'Non configuré (optionnel dans Réglages)'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
                    />
                    <p className="text-[10px] text-slate-500">
                      Vous pouvez définir votre Webhook dans l'onglet <strong>Réglages Club</strong> pour automatiser la publication à chaque fin de week-end.
                    </p>
                  </div>

                  {webhookStatus.message && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
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
                {/* 1-Click Native Mobile Share */}
                <button
                  onClick={handleNativeShare}
                  disabled={isSharing || isExporting}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all hover:scale-105 disabled:opacity-50"
                  id="btn-native-social-share"
                  title="Partage direct dans l'application mobile Instagram, TikTok ou Facebook"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isSharing ? 'Préparation...' : 'Partager Directement (Mobile / App)'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadImage}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 border border-slate-700"
                  id="btn-download-social-image"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Téléchargé (PNG Retina) !</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-orange-400" />
                      <span>{isExporting ? 'Génération...' : `Télécharger l'Affiche (${aspectRatio})`}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Notice */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950 text-center flex items-center justify-between text-[11px] text-slate-400">
          <span>
            🏀 Passerelle officielle du club • Format Retina haute fidélité pour <strong>Instagram</strong>, <strong>TikTok</strong> et <strong>Facebook</strong>
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
