export async function getTelegramSecretToken(botToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(botToken.trim() + ':club-basket-telegram-secret');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}



// Helper to parse natural text or command from Telegram
export function parseTelegramMatchMessage(text: string): {
  isWin: boolean | null;
  team: string;
  teamRaw: string;
  ourScore?: number;
  opponentScore?: number;
  opponent?: string;
} {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  let isWin: boolean | null = null;
  if (lower.startsWith("/victoire") || lower.startsWith("victoire") || lower.includes("gagné") || lower.includes("gagne") || lower.includes("win")) {
    isWin = true;
  } else if (lower.startsWith("/defaite") || lower.startsWith("/défaite") || lower.startsWith("defaite") || lower.startsWith("défaite") || lower.includes("perdu") || lower.includes("loss")) {
    isWin = false;
  }

  // Extract scores if present: e.g. "82-74", "82 - 74", "82/74", "82 74"
  let ourScore: number | undefined;
  let opponentScore: number | undefined;

  const scoreRegex = /(\b\d{2,3}\b)\s*[-–/:]\s*(\b\d{2,3}\b)/;
  const scoreMatch = clean.match(scoreRegex);

  let textWithoutScore = clean;
  if (scoreMatch) {
    const s1 = parseInt(scoreMatch[1], 10);
    const s2 = parseInt(scoreMatch[2], 10);
    textWithoutScore = clean.replace(scoreRegex, "").trim();

    if (isWin === true) {
      ourScore = Math.max(s1, s2);
      opponentScore = Math.min(s1, s2);
    } else if (isWin === false) {
      ourScore = Math.min(s1, s2);
      opponentScore = Math.max(s1, s2);
    } else {
      ourScore = s1;
      opponentScore = s2;
      isWin = s1 >= s2;
    }
  }

  // Remove command or trigger words from text to find the team name
  let teamPart = textWithoutScore
    .replace(/^(\/victoire|\/defaite|\/défaite|victoire|defaite|défaite|gagné|perdu|win|loss)/i, "")
    .replace(/(contre|vs|face à|face a)/i, "contre")
    .trim();

  let opponent: string | undefined;
  if (teamPart.toLowerCase().includes("contre")) {
    const parts = teamPart.split(/contre/i);
    teamPart = parts[0]?.trim() || "";
    opponent = parts[1]?.trim() || undefined;
  }

  return {
    isWin: isWin ?? true,
    teamRaw: teamPart,
    team: teamPart,
    ourScore,
    opponentScore,
    opponent,
  };
}


export function formatEuropeanDate(dateStr: string): string {
  if (!dateStr) return "";
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

  // If it's a standard parsable string with year-month-day
  try {
    if (cleaned.includes("-") && cleaned.length >= 8) {
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }
  } catch (e) {
    // ignore
  }

  return cleaned;
}

