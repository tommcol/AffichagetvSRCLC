import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), process.env.APP_DEMO === '1' ? '.demo-data' : 'data');

// Historique persistant des résultats FFBB : évite de recréer une alerte après expiration/redémarrage.
export interface FfbbAlertMonitor {
  processed: Record<string, { team: string; isWin: boolean; ourScore?: number; opponentScore?: number; detectedAt: number; alertCreatedAt?: number }>;
  uniqueResults: number;
  alertsCreated: number;
  duplicatesIgnored: number;
  lastResult?: { team: string; isWin: boolean; ourScore?: number; opponentScore?: number; detectedAt: number };
  telegramChatId?: string | number;
}
const FFBB_MONITOR_FILE = path.join(DATA_DIR, "ffbb-alert-monitor.json");
export const readFfbbMonitor = (): FfbbAlertMonitor => {
  try {
    if (fs.existsSync(FFBB_MONITOR_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FFBB_MONITOR_FILE, "utf-8"));
      return {
        processed: parsed?.processed && typeof parsed.processed === "object" ? parsed.processed : {},
        uniqueResults: Number(parsed?.uniqueResults) || 0,
        alertsCreated: Number(parsed?.alertsCreated) || 0,
        duplicatesIgnored: Number(parsed?.duplicatesIgnored) || 0,
        lastResult: parsed?.lastResult,
        telegramChatId: parsed?.telegramChatId,
      };
    }
  } catch (error) {
    console.error("[FFBB MONITOR] Lecture historique impossible:", error);
  }
  return { processed: {}, uniqueResults: 0, alertsCreated: 0, duplicatesIgnored: 0 };
};
export const writeFfbbMonitor = (monitor: FfbbAlertMonitor) => {
  try {
    fs.writeFileSync(FFBB_MONITOR_FILE, JSON.stringify(monitor, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("[FFBB MONITOR] Écriture historique impossible:", error);
    return false;
  }
};
export const ffbbSignature = (matchId: unknown, ourScore: unknown, opponentScore: unknown) =>
  `${String(matchId || "").trim()}:${String(ourScore ?? "")}-${String(opponentScore ?? "")}`;
export const sendTelegramText = async (chatId: string | number | undefined, text: string) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken || !chatId) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return response.ok;
  } catch (error) {
    console.error("[TELEGRAM FFBB] Envoi impossible:", error);
    return false;
  }
};

// In-memory active alerts (injected into the TV loop for 1 hour)
