import { MatchItem } from '../types';

/**
 * Normalise un identifiant ou numéro de match FFBB en supprimant les préfixes "ffbb-" et "FFBB-"
 * Ex: "FFBB-12345" -> "12345", "ffbb-12345" -> "12345", "ffbb-FFBB-12345" -> "12345"
 */
export function normalizeFfbbNumber(raw?: string): string | null {
  if (!raw) return null;
  let clean = String(raw).trim();
  if (!clean) return null;
  while (/^ffbb-/i.test(clean)) {
    clean = clean.replace(/^ffbb-/i, '').trim();
  }
  return clean ? clean.toLowerCase() : null;
}

/**
 * Extrait la clé FFBB normalisée et stable pour un MatchItem
 */
export function getFfbbKey(m: MatchItem): string | null {
  if (m.ffbbMatchNumber) {
    const num = normalizeFfbbNumber(m.ffbbMatchNumber);
    if (num) return `ffbb-${num}`;
  }
  if (m.id && /^ffbb-/i.test(m.id)) {
    const num = normalizeFfbbNumber(m.id);
    if (num) return `ffbb-${num}`;
  }
  return null;
}

/**
 * Fusionne intelligemment une liste de rencontres existantes avec une nouvelle liste venant de la FFBB.
 * Les données officielles FFBB (compétition, poule, ville, etc.) sont actualisées
 * sauf si l'utilisateur a explicitement modifié le champ concerné dans l'application.
 * Le nom personnalisé d'affichage est strictement conservé et ne sera jamais écrasé par le nom FFBB.
 */
export function mergeMatchItems(
  existingList: MatchItem[],
  incomingList: MatchItem[],
  customTeamNames?: Record<string, string>
): MatchItem[] {
  const incomingFfbbMap = new Map<string, MatchItem>();
  incomingList.forEach((inc) => {
    const key = getFfbbKey(inc);
    if (key) {
      incomingFfbbMap.set(key, inc);
    }
  });

  const merged: MatchItem[] = [];
  const processedFfbbKeys = new Set<string>();

  // 1. Parcourir les rencontres existantes
  existingList.forEach((existing) => {
    const key = getFfbbKey(existing);

    // Si c'est un match amical / local ou non présent dans cette réponse FFBB :
    if (!key || !incomingFfbbMap.has(key)) {
      merged.push(existing);
      if (key) processedFfbbKeys.add(key);
      return;
    }

    // Rencontre FFBB correspondante trouvée
    processedFfbbKeys.add(key);
    const incoming = incomingFfbbMap.get(key)!;

    // Date & Heure : mettre à jour avec FFBB sauf si modifiés manuellement
    const finalDate = existing.isDateManual ? existing.date : (incoming.date || existing.date);
    const finalTime = existing.isTimeManual ? existing.time : (incoming.time || existing.time);

    // Gymnase : mettre à jour avec FFBB sauf si modifié manuellement
    const finalGymnasium = existing.isGymnasiumManual
      ? existing.gymnasium
      : (incoming.gymnasium || existing.gymnasium);

    // Logo adverse : préserver le logo sélectionné manuellement ou existant
    const finalOpponentLogo = existing.isOpponentLogoManual || existing.opponentLogo
      ? existing.opponentLogo
      : incoming.opponentLogo;

    // Résultat : FFBB devient la source prioritaire lorsqu'il arrive après Telegram.
    // Une arrivée FFBB met à jour le résultat existant sans recréer ni prolonger d'alerte TV.
    let finalHomeScore = incoming.homeScore;
    let finalAwayScore = incoming.awayScore;
    let finalResult = incoming.result;
    let finalStatus = incoming.status;
    let finalIsScoreManual = existing.isScoreManual;
    let finalResultSource = existing.resultSource;
    let finalResultReceivedAt = existing.resultReceivedAt;
    let finalFinishedAt = existing.finishedAt;

    const incomingHasResult =
      incoming.result === 'win' ||
      incoming.result === 'loss' ||
      (incoming.homeScore !== undefined && incoming.awayScore !== undefined);

    const existingHasResult =
      existing.result === 'win' ||
      existing.result === 'loss' ||
      (existing.homeScore !== undefined && existing.awayScore !== undefined);

    if (existing.isScoreManual) {
      // Une correction manuelle explicite reste prioritaire.
      finalHomeScore = existing.homeScore;
      finalAwayScore = existing.awayScore;
      finalResult = existing.result;
      finalStatus = existing.status || incoming.status;
    } else if (incomingHasResult) {
      // FFBB est autoritaire dès qu'il fournit le résultat : cela permet de corriger
      // un résultat Telegram arrivé 10, 30 ou 60 minutes plus tôt.
      finalHomeScore = incoming.homeScore;
      finalAwayScore = incoming.awayScore;
      finalResult = incoming.result;
      finalStatus = 'finished';
      finalResultSource = 'ffbb';
      finalResultReceivedAt = existing.resultReceivedAt ?? Date.now();
      finalFinishedAt = existing.finishedAt ?? Date.now();
    } else if (existingHasResult || existing.resultSource) {
      // Une synchronisation FFBB sans score ne doit jamais effacer un résultat déjà reçu.
      finalHomeScore = existing.homeScore;
      finalAwayScore = existing.awayScore;
      finalResult = existing.result;
      finalStatus = existing.result === 'win' || existing.result === 'loss'
        ? 'finished'
        : existing.status;
    } else if (existing.homeScore !== undefined) {
      // Aucun nouveau résultat officiel : conserver un score local partiel existant.
      finalHomeScore = existing.homeScore;
      finalAwayScore = existing.awayScore;
      finalResult = existing.result;
    }

    // Choix individuel de diffusion TV (selectedForWeekend) : TOUJOURS conserver le choix utilisateur
    const finalSelectedForWeekend = existing.selectedForWeekend !== undefined
      ? existing.selectedForWeekend
      : (incoming.selectedForWeekend !== false);

    // Résolution du nom affiché de l'équipe (personnalisation préservée, jamais écrasée par FFBB)
    const teamId = existing.ffbbTeamId || incoming.ffbbTeamId;
    const rawCategory = existing.rawFfbbCategory || incoming.rawFfbbCategory || incoming.category;
    let finalCategory = existing.category || incoming.category;

    if (customTeamNames) {
      if (teamId && customTeamNames[teamId]) {
        finalCategory = customTeamNames[teamId];
      } else if (rawCategory && customTeamNames[rawCategory]) {
        finalCategory = customTeamNames[rawCategory];
      }
    }

    // On part des données entrantes OFFICIELLES (pour actualiser compétition, poule, ville, etc.)
    // et on applique les surcharges et protections locales
    merged.push({
      ...incoming,
      id: existing.id || incoming.id,
      category: finalCategory,
      rawFfbbCategory: rawCategory,
      ffbbTeamId: teamId,
      ffbbMatchNumber: incoming.ffbbMatchNumber || existing.ffbbMatchNumber,
      date: finalDate,
      time: finalTime,
      gymnasium: finalGymnasium,
      homeScore: finalHomeScore,
      awayScore: finalAwayScore,
      result: finalResult,
      resultSource: finalResultSource,
      resultReceivedAt: finalResultReceivedAt,
      status: finalStatus,
      finishedAt: finalFinishedAt,
      opponentLogo: finalOpponentLogo,
      teamLogo: existing.teamLogo || incoming.teamLogo,
      selectedForWeekend: finalSelectedForWeekend,
      isDateManual: existing.isDateManual,
      isTimeManual: existing.isTimeManual,
      isScoreManual: finalIsScoreManual,
      isGymnasiumManual: existing.isGymnasiumManual,
      isOpponentLogoManual: existing.isOpponentLogoManual,
      isManualMatch: existing.isManualMatch,
    });
  });

  // 2. Ajouter les nouvelles rencontres FFBB reçues
  incomingList.forEach((inc) => {
    const key = getFfbbKey(inc);
    if (key && !processedFfbbKeys.has(key)) {
      const teamId = inc.ffbbTeamId;
      const rawCategory = inc.rawFfbbCategory || inc.category;
      let finalCategory = inc.category;

      if (customTeamNames) {
        if (teamId && customTeamNames[teamId]) {
          finalCategory = customTeamNames[teamId];
        } else if (rawCategory && customTeamNames[rawCategory]) {
          finalCategory = customTeamNames[rawCategory];
        }
      }

      merged.push({
        ...inc,
        category: finalCategory,
        rawFfbbCategory: rawCategory,
        selectedForWeekend: inc.selectedForWeekend !== false,
      });
      processedFfbbKeys.add(key);
    }
  });

  return merged;
}
