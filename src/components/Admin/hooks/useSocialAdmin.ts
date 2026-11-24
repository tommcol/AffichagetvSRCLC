import React, { useState, useEffect } from 'react';
import { ClubSettings, MatchItem } from '../../../types';
import { formatDateToEuropean } from '../adminPanelConstants';
import { isClubHomeMatch, isMatchWin } from '../../../utils/matchStatus';

// Code déplacé tel quel depuis AdminPanel.tsx, sans changement de comportement.
interface UseSocialAdminParams {
  clubSettings: ClubSettings;
  onUpdateClubSettings: (newSettings: ClubSettings) => void;
  matches: MatchItem[];
  results: MatchItem[];
}

export function useSocialAdmin({ clubSettings, onUpdateClubSettings, matches, results }: UseSocialAdminParams) {
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

  return {
    socialWebhookStatus,
    setSocialSaveSuccess,
    socialForm,
    setSocialForm,
    handleTestSocialWebhook,
  };
}
