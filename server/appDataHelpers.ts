import fs from "fs";
import path from "path";
import { mergeMatchItems } from "../src/utils/ffbbMergeUtils";
import { normalizeCategoryKey } from "./ffbbDataHelpers";

// 1d. Persistent App Data Storage (Server-side JSON file)
const DATA_DIR = process.env.SRC_DEMO === '1'
  ? path.join(process.cwd(), '.demo-data')
  : path.join(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const APP_DATA_FILE = path.join(DATA_DIR, "saved-app-data.json");

export const getSavedAppData = () => {
  try {
    if (fs.existsSync(APP_DATA_FILE)) {
      const raw = fs.readFileSync(APP_DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Erreur lecture saved-app-data:", err);
  }
  return null;
};

export const saveAppDataToFile = (data: any) => {
  try {
    const temporary = APP_DATA_FILE + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(temporary, APP_DATA_FILE);
    return true;
  } catch (err) {
    console.error("Erreur écriture saved-app-data:", err);
    return false;
  }
};

export const normalizeLocalResultText = (value?: string): string =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function findLocalTelegramMatch(savedData: any, teamMatch: any, officialTeamName: string, opponent?: string, now = Date.now()): any | null {
  const matches = Array.isArray(savedData?.matches) ? savedData.matches : [];
  if (matches.length === 0) return null;

  const teamKeys = new Set(
    [officialTeamName, teamMatch?.team?.name, teamMatch?.team?.category]
      .map((value) => normalizeCategoryKey(value))
      .filter(Boolean)
  );
  const normalizedOpponent = normalizeLocalResultText(opponent);

  const candidates = matches
    .filter((match: any) => match && match.selectedForWeekend !== false)
    .filter((match: any) => {
      if (teamMatch?.team?.id && match.ffbbTeamId === teamMatch.team.id) return true;
      return teamKeys.has(normalizeCategoryKey(match.category));
    })
    .map((match: any) => {
      const opponentSide = match.isHomeMatch ? match.teamAway : match.teamHome;
      const opponentKey = normalizeLocalResultText(opponentSide);
      const opponentMatch = Boolean(normalizedOpponent && opponentKey) &&
        (opponentKey.includes(normalizedOpponent) || normalizedOpponent.includes(opponentKey));
      const parsedDate = Date.parse(String(match.date || '').slice(0, 10) + 'T12:00:00');
      const dateDistance = Number.isFinite(parsedDate) ? Math.abs(parsedDate - now) / 86400000 : 30;
      const ffbbIdentity = Boolean(teamMatch?.team?.id && match.ffbbTeamId === teamMatch.team.id);
      return {
        match,
        score: (ffbbIdentity ? 1000 : 0) + (opponentMatch ? 500 : 0) - Math.min(dateDistance, 30),
      };
    })
    .sort((a: any, b: any) => b.score - a.score);

  return candidates[0]?.match || null;
}

export function hasLocalMatchResult(match: any): boolean {
  return Boolean(
    match &&
    (
      match.result === 'win' ||
      match.result === 'loss' ||
      (match.homeScore !== undefined && match.awayScore !== undefined)
    )
  );
}

export function persistLocalTelegramMatchResult(
  savedData: any,
  teamMatch: any,
  officialTeamName: string,
  parsed: any,
  now = Date.now()
): {
  status: 'created' | 'duplicate_ffbb' | 'duplicate_existing' | 'not_found';
  match?: any;
} {
  const match = findLocalTelegramMatch(savedData, teamMatch, officialTeamName, parsed.opponent, now);
  if (!match) return { status: 'not_found' };

  if (
    match.resultSource === 'ffbb' ||
    (hasLocalMatchResult(match) && match.resultSource !== 'telegram' && match.resultSource !== 'manual')
  ) {
    return { status: 'duplicate_ffbb', match };
  }

  if (hasLocalMatchResult(match) || match.resultSource) {
    return { status: 'duplicate_existing', match };
  }

  const isWin = parsed.isWin ?? true;
  const updatedMatch = {
    ...match,
    status: 'finished',
    result: isWin ? 'win' : 'loss',
    resultSource: 'telegram',
    resultReceivedAt: now,
    finishedAt: now,
    ...(match.isHomeMatch
      ? {
          ...(parsed.ourScore !== undefined ? { homeScore: parsed.ourScore } : {}),
          ...(parsed.opponentScore !== undefined ? { awayScore: parsed.opponentScore } : {}),
        }
      : {
          ...(parsed.opponentScore !== undefined ? { homeScore: parsed.opponentScore } : {}),
          ...(parsed.ourScore !== undefined ? { awayScore: parsed.ourScore } : {}),
        }),
  };

  savedData.matches = (Array.isArray(savedData.matches) ? savedData.matches : []).map((item: any) =>
    item?.id === match.id ? updatedMatch : item
  );
  savedData.results = mergeMatchItems(
    Array.isArray(savedData.results) ? savedData.results : [],
    [updatedMatch],
    savedData?.clubSettings?.customTeamNames || {}
  );
  savedData.version = (typeof savedData.version === 'number' ? savedData.version : 0) + 1;
  saveAppDataToFile(savedData);

  return { status: 'created', match: updatedMatch };
}

// Réversion d'un résultat injecté par Telegram (commande "supprimer").
// Règle club : le message Telegram supprimé = erreur de saisie → on efface AUSSI
// le résultat persisté (score + victoire/défaite) sur la slide Matchs.
// Les résultats FFBB et manuels ne sont JAMAIS touchés.
export function revertLocalTelegramMatchResult(
  savedData: any,
  matchId?: string
): { reverted: boolean; match?: any } {
  const matches = Array.isArray(savedData?.matches) ? savedData.matches : [];
  let target = matchId
    ? matches.find((m: any) => m?.id === matchId && m?.resultSource === 'telegram')
    : undefined;
  if (!target) {
    target = matches
      .filter((m: any) => m?.resultSource === 'telegram')
      .sort((a: any, b: any) => (b.resultReceivedAt || 0) - (a.resultReceivedAt || 0))[0];
  }
  if (!target) return { reverted: false };

  const restored: any = { ...target };
  delete restored.status;
  delete restored.result;
  delete restored.resultSource;
  delete restored.resultReceivedAt;
  delete restored.finishedAt;
  delete restored.homeScore;
  delete restored.awayScore;

  savedData.matches = matches.map((m: any) => (m?.id === target.id ? restored : m));
  savedData.results = (Array.isArray(savedData.results) ? savedData.results : []).filter(
    (r: any) => !(r?.id === target.id && r?.resultSource === 'telegram')
  );
  savedData.version = (typeof savedData.version === 'number' ? savedData.version : 0) + 1;
  saveAppDataToFile(savedData);
  return { reverted: true, match: restored };
}




