import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

interface ActiveMatchAlert {
  id: string;
  team: string;
  isWin: boolean;
  ourScore?: number;
  opponentScore?: number;
  opponent?: string;
  customImageUrl?: string;
  triggeredBy: "telegram" | "ffbb" | "manual";
  timestamp: number;
  expiresAt: number; // Default + 1 hour (3600000 ms)
  rawMessage?: string;
}

const app = express();
const PORT = 3000;

// Setup upload directory
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Multer storage for high-performance direct streaming of videos and photos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith("video/") ? ".mp4" : ".png");
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    const uniqueSuffix = Date.now() + "-" + Math.random().toString(36).substring(2, 8);
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // Up to 500MB per video/file
  },
});

// Support larger JSON payloads (photos, logos, sponsor visuals, base64 exports)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Serve uploaded videos and images statically with proper caching and byte-range streaming
app.use("/uploads", express.static(UPLOADS_DIR));

// In-memory active alerts (injected into the TV loop for 1 hour)
let activeAlerts: ActiveMatchAlert[] = [];
let telegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  allowedChatIds: [] as string[],
};

// Periodic cleanup of expired alerts (> 1 hour)
function cleanExpiredAlerts() {
  const now = Date.now();
  activeAlerts = activeAlerts.filter((a) => a.expiresAt > now);
}

// Helper to parse natural text or command from Telegram
export function parseTelegramMatchMessage(text: string): {
  isWin: boolean | null;
  team: string;
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

  // Fallback default team if empty
  if (!teamPart) {
    teamPart = "Seniors Garçons 1";
  }

  return {
    isWin: isWin ?? true,
    team: teamPart,
    ourScore,
    opponentScore,
    opponent,
  };
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// 1b. Direct File Upload (Images & Videos) - High performance, zero RAM exhaustion
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    const publicUrl = `/uploads/${req.file.filename}`;
    const isVideo = req.file.mimetype.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(req.file.filename);

    console.log(`[UPLOAD] Fichier téléversé : ${req.file.originalname} -> ${publicUrl} (${(req.file.size / (1024 * 1024)).toFixed(2)} MB)`);

    return res.json({
      success: true,
      url: publicUrl,
      fileName: req.file.originalname,
      mediaType: isVideo ? "video" : "image",
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err: any) {
    console.error("Erreur lors de l'upload:", err);
    return res.status(500).json({ error: err.message || "Erreur lors du traitement du fichier" });
  }
});

// 1c. Batch File Upload (Multiple Images / Videos in 1 request)
app.post("/api/upload-multiple", upload.array("files", 30), (req, res) => {
  try {
    const rawFiles = req.files as Express.Multer.File[] | undefined;
    if (!rawFiles || rawFiles.length === 0) {
      return res.status(400).json({ error: "Aucun fichier reçu" });
    }

    const uploadedFiles = rawFiles.map((file) => {
      const publicUrl = `/uploads/${file.filename}`;
      const isVideo = file.mimetype.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.filename);
      return {
        url: publicUrl,
        fileName: file.originalname,
        mediaType: isVideo ? "video" : "image",
        size: file.size,
        mimetype: file.mimetype,
      };
    });

    console.log(`[UPLOAD MULTIPLE] ${uploadedFiles.length} fichiers téléversés avec succès`);

    return res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    });
  } catch (err: any) {
    console.error("Erreur upload multiple:", err);
    return res.status(500).json({ error: err.message || "Erreur upload multiple" });
  }
});

// 1d. Persistent App Data Storage (Server-side JSON file)
const APP_DATA_FILE = path.join(DATA_DIR, "saved-app-data.json");

const getSavedAppData = () => {
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

const saveAppDataToFile = (data: any) => {
  try {
    fs.writeFileSync(APP_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Erreur écriture saved-app-data:", err);
    return false;
  }
};

app.get(["/api/app-data", "/api/get-app-data", "/.netlify/functions/get-app-data"], (req, res) => {
  const data = getSavedAppData();
  res.json({ success: true, data });
});

app.post(["/api/app-data", "/api/save-app-data", "/.netlify/functions/save-app-data"], (req, res) => {
  const { data } = req.body || {};
  if (!data) {
    return res.status(400).json({ error: "Champ data requis" });
  }
  const ok = saveAppDataToFile(data);
  res.json({ ok, success: ok });
});

app.post("/api/verify-password", (_req, res) => {
  res.json({ ok: true, success: true });
});

// 2. Active 1-hour alerts list (polled by the TV carousel)
app.get(["/api/alerts", "/api/get-alerts", "/.netlify/functions/get-alerts"], (req, res) => {
  cleanExpiredAlerts();
  res.json({
    alerts: activeAlerts,
    count: activeAlerts.length,
  });
});

// 3. Create or inject alert manually / via FFBB
app.post(["/api/alerts", "/api/add-alert", "/.netlify/functions/add-alert"], (req, res) => {
  const { team, isWin, ourScore, opponentScore, opponent, customImageUrl, triggeredBy = "manual", durationMinutes = 60 } = req.body;

  if (!team) {
    return res.status(400).json({ error: "L'équipe est requise" });
  }

  const durationMs = (durationMinutes || 60) * 60 * 1000;
  const newAlert: ActiveMatchAlert = {
    id: "alert-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    team,
    isWin: Boolean(isWin),
    ourScore: ourScore ? Number(ourScore) : undefined,
    opponentScore: opponentScore ? Number(opponentScore) : undefined,
    opponent,
    customImageUrl,
    triggeredBy,
    timestamp: Date.now(),
    expiresAt: Date.now() + durationMs, // Exactly 1 hour
  };

  // Add alert to active list
  activeAlerts.unshift(newAlert);
  cleanExpiredAlerts();

  console.log(`[ALERTE TV] ${newAlert.isWin ? "VICTOIRE" : "DÉFAITE"} pour ${newAlert.team} activée pour 60 min`);
  res.json({ success: true, alert: newAlert });
});

// 4. Delete an alert
app.all(["/api/alerts/:id", "/api/delete-alert", "/.netlify/functions/delete-alert"], (req, res) => {
  const id = req.params.id || (req.query.id as string);
  activeAlerts = activeAlerts.filter((a) => a.id !== id);
  res.json({ success: true, count: activeAlerts.length });
});

// 5. Telegram Webhook (Receives messages from Telegram Bot)
app.post("/api/telegram-webhook", async (req, res) => {
  try {
    const update = req.body;
    const message = update?.message || update?.channel_post;

    if (!message || !message.text) {
      return res.status(200).send("OK: pas de texte");
    }

    const text = message.text;
    const chatId = message.chat?.id;
    console.log(`[TELEGRAM INCOMING] ChatId: ${chatId} | Message: "${text}"`);

    // Parse the message
    const parsed = parseTelegramMatchMessage(text);
    const durationMs = 60 * 60 * 1000; // 1 heure

    const newAlert: ActiveMatchAlert = {
      id: "tg-" + Date.now(),
      team: parsed.team,
      isWin: parsed.isWin ?? true,
      ourScore: parsed.ourScore,
      opponentScore: parsed.opponentScore,
      opponent: parsed.opponent,
      triggeredBy: "telegram",
      timestamp: Date.now(),
      expiresAt: Date.now() + durationMs,
      rawMessage: text,
    };

    activeAlerts.unshift(newAlert);
    cleanExpiredAlerts();

    // Reply back on Telegram if token is set
    const botToken = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
    if (botToken && chatId) {
      const outcomeText = newAlert.isWin ? "🏆 VICTOIRE" : "🏀 DÉFAITE";
      const scoreText = newAlert.ourScore !== undefined && newAlert.opponentScore !== undefined
        ? ` (${newAlert.ourScore} - ${newAlert.opponentScore})`
        : "";

      const replyText = `✅ Visuel ${outcomeText} pour *${newAlert.team}*${scoreText} injecté sur l'écran TV !\n⏱ Durée dans la boucle : 1 heure.`;

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: "Markdown",
          }),
        });
      } catch (err) {
        console.error("Erreur envoi réponse Telegram:", err);
      }
    }

    return res.json({ success: true, alert: newAlert });
  } catch (error) {
    console.error("Erreur webhook Telegram:", error);
    return res.status(500).json({ error: "Internal error" });
  }
});

// 6. Test parsing / simulation of Telegram message from web interface
app.post("/api/telegram/test", (req, res) => {
  const { messageText } = req.body;
  if (!messageText) {
    return res.status(400).json({ error: "Message text requis" });
  }

  const parsed = parseTelegramMatchMessage(messageText);
  const newAlert: ActiveMatchAlert = {
    id: "test-" + Date.now(),
    team: parsed.team,
    isWin: parsed.isWin ?? true,
    ourScore: parsed.ourScore,
    opponentScore: parsed.opponentScore,
    opponent: parsed.opponent,
    triggeredBy: "telegram",
    timestamp: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000,
    rawMessage: messageText,
  };

  activeAlerts.unshift(newAlert);
  cleanExpiredAlerts();

  res.json({
    success: true,
    parsed,
    alert: newAlert,
    confirmationMessage: `✅ Visuel ${newAlert.isWin ? "VICTOIRE" : "DÉFAITE"} pour ${newAlert.team} injecté dans la boucle TV pendant 1 heure !`,
  });
});

// 7. Telegram Bot Config
app.get("/api/telegram/config", (req, res) => {
  const hasEnvToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  res.json({
    configured: Boolean(telegramConfig.botToken || hasEnvToken),
    hasBotToken: Boolean(telegramConfig.botToken || hasEnvToken),
    botTokenMasked: telegramConfig.botToken
      ? telegramConfig.botToken.substring(0, 5) + "..." + telegramConfig.botToken.slice(-4)
      : hasEnvToken ? "Configuré via .env" : "",
  });
});

app.post("/api/telegram/config", (req, res) => {
  const { botToken } = req.body;
  if (botToken !== undefined) {
    telegramConfig.botToken = botToken.trim();
  }
  res.json({ success: true, configured: Boolean(telegramConfig.botToken) });
});

// 8. Social Media Bridge Webhook / Dispatcher (Instagram, TikTok, Facebook gateway)
app.post("/api/social/publish", async (req, res) => {
  try {
    const { platform, type, title, caption, matches, results, webhookUrl } = req.body;
    console.log(`[PASSERELLE SOCIALE] Requête pour ${platform || 'tous'} (Type: ${type})`);

    // If external webhookUrl is configured (Zapier, Make, n8n, Meta Graph API proxy, etc.)
    if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "match_social_publish",
            platform: platform || "all",
            type: type || "matches",
            title: title || "Publication Club",
            caption: caption || "",
            matchCount: matches ? matches.length : 0,
            resultCount: results ? results.length : 0,
            matches: matches || [],
            results: results || [],
            timestamp: Date.now(),
          }),
        });
        return res.json({
          success: true,
          forwardedToWebhook: true,
          status: response.status,
          message: `Transmis avec succès au Webhook externe (Code HTTP ${response.status})`,
        });
      } catch (fErr: any) {
        return res.json({
          success: false,
          forwardedToWebhook: true,
          error: fErr.message,
          message: `Échec d'envoi au Webhook : ${fErr.message}`,
        });
      }
    }

    return res.json({
      success: true,
      forwardedToWebhook: false,
      message: `Contenu préparé avec succès pour ${platform || 'les réseaux sociaux'}`,
      data: { platform, type, title },
    });
  } catch (err: any) {
    console.error("Erreur passerelle sociale:", err);
    res.status(500).json({ error: err.message });
  }
});

// 8b. AI Social Caption Generator (Gemini API with smart fallback)
function formatEuropeanDate(dateStr: string): string {
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

app.post("/api/generate-caption", async (req, res) => {
  try {
    const {
      platform = "instagram",
      type = "matches",
      matches = [],
      results = [],
      clubName = "Notre Club",
      shortClub = "BCVS",
      gymnasium = "Gymnase du Club",
      tone = "supporter",
      extraContext = "",
    } = req.body;

    // Group matches by date
    const matchesByDate: Record<string, any[]> = {};
    for (const m of matches || []) {
      const dateKey = m.date || 'Date non précisée';
      if (!matchesByDate[dateKey]) {
        matchesByDate[dateKey] = [];
      }
      matchesByDate[dateKey].push(m);
    }

    // Sort dates or keep them in sequence
    const sortedDates = Object.keys(matchesByDate).sort((a, b) => a.localeCompare(b));

    const matchesSummary = sortedDates.map((dateStr) => {
      const formattedDate = formatEuropeanDate(dateStr);
      const matchesList = matchesByDate[dateStr].map((m) => {
        const place = m.isHomeMatch ? `🏠 vs ${m.teamAway || 'Adversaire'}` : `🚗 @ ${m.teamHome || 'Adversaire'}`;
        const timeStr = m.time ? ` à ${m.time}` : '';
        const categoryStr = m.category || 'Équipe';
        return `  • ${categoryStr} : ${place}${timeStr}`;
      }).join("\n");
      return `📅 ${formattedDate} :\n${matchesList}`;
    }).join("\n\n");

    const resultsSummary = (results || []).map((r: any) => {
      const eurDate = r.date ? ` (le ${formatEuropeanDate(r.date)})` : '';
      return `- ${r.category || 'Équipe'} : ${r.homeScore ?? 0} - ${r.awayScore ?? 0} (${r.result === 'win' ? 'Victoire 🏆' : 'Défaite ❌'}) vs ${r.isHomeMatch ? (r.teamAway || 'Adversaire') : (r.teamHome || 'Adversaire')}${eurDate}`;
    }).join("\n");

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Tu es le Community Manager passionné et créatif du club de basketball "${clubName}" (Aussi appelé ${shortClub}).
Rédige une légende captivante, moderne et prête à être publiée sur le réseau social "${platform.toUpperCase()}".

Contexte du post : ${type === "matches" ? "Annonce des prochains matchs du week-end" : "Bilan et résultats des matchs passés"}.
Ton souhaité : ${tone === "supporter" ? "Survolté, très enthousiaste, esprit d'équipe 🔥" : tone === "officiel" ? "Professionnel, chaleureux et institutionnel 🏛️" : tone === "fun" ? "Dynamique, jeune, punchy avec emojis ⚡" : "Centré sur la buvette, l'ambiance et les supporters 🍿"}.

${type === "matches" ? `Matchs du week-end (${matches.length} rencontres retenues) :\n${matchesSummary || "Matchs à venir du club"}\nLieu principal domicile : ${gymnasium}` : `Résultats des rencontres :\n${resultsSummary || "Résultats récents du club"}`}
${extraContext ? `Instructions supplémentaires du club : ${extraContext}` : ""}

Directives :
1. Structurer clairement avec des sections lisibles et des emojis attrayants.
2. Toutes les dates mentionnées doivent obligatoirement utiliser le format européen jj/mm/annee (par exemple "18/09/2026") ou un format littéral en français (par exemple "Samedi 20 Septembre"), et jamais le format américain aaaa-mm-jj.
3. Regrouper impérativement la liste des matchs par date (par exemple une section '📅 Samedi 20/09' ou '📅 Samedi 20 Septembre' avec les rencontres de cette journée listées dessous, au lieu de répéter la date devant chaque match).
4. Pour Instagram / Facebook, inclure une accroche percutante, la liste des rencontres/résultats, une incitation à venir encourager au gymnase / à la buvette.
5. Pour TikTok, faire une version plus courte, dynamique et avec des hashtags tendance (#basketball #matchday #fyp etc.).
6. Terminer par des hashtags pertinents pour le club.
Restitue uniquement le texte de la légende rédigé, sans guillemets ni meta-commentaires.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
        });

        const captionText = response.text?.trim();
        if (captionText) {
          return res.json({
            success: true,
            provider: "gemini",
            caption: captionText,
          });
        }
      } catch (geminiErr: any) {
        console.warn("[GEMINI API WARNING] Fallback local utilisé :", geminiErr.message);
      }
    }

    // Smart Local Generator Fallback (100% free & reliable if key is absent or offline)
    let generatedCaption = "";
    if (type === "matches") {
      const matchCount = (matches || []).length;
      if (platform === "tiktok") {
        generatedCaption = `⚡ WEEK-END DE BASKET INTENSE POUR ${shortClub.toUpperCase()} ! 🏀🔥\n${matchCount} matchs au programme ce week-end ! Qui vient faire chauffer la salle ? 🥁💥\n\n#basketball #matchday #bball #fyp #pourtoi #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else if (tone === "officiel") {
        generatedCaption = `🏀 PROGRAMME OFFICIEL DES RENCONTRES • ${clubName.toUpperCase()} 🏀\n\nNous vous présentons l'ensemble des matchs programmés pour le week-end :\n\n${matchesSummary || "Rencontres à venir"}\n\n📍 Gymnase : ${gymnasium}\nNous comptons sur votre présence pour soutenir nos joueuses et joueurs ! 🔴⚪\n\n#Basketball #FFBB #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else {
        generatedCaption = `🔥 WEEK-END CHAUD BOUILLANT CHEZ LES ${shortClub.toUpperCase()} ! 🔥\n\nPréparez les tambours et les maillots, voici les ${matchCount} matchs clés sélectionnés du week-end !\n\n${matchesSummary || "Prochaines rencontres"}\n\n🍿 Buvette & petite restauration assurées au ${gymnasium} !\nAllez ${shortClub} ! ❤️🤍\n\n#GameDay #MatchWeek #TeamBasket #FFBB #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
    } else {
      if (platform === "tiktok") {
        generatedCaption = `🏆 BILAN DU WEEK-END DE ${shortClub.toUpperCase()} ! 🏀\nVoici les scores de nos équipes ! Laisse un ❤️ pour féliciter nos joueurs !\n\n#resultats #basket #victoire #fyp #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else {
        generatedCaption = `🏆 RÉSULTATS & BILAN DU WEEK-END — ${clubName.toUpperCase()} 🏆\n\nVoici le résumé complet des rencontres du week-end :\n\n${resultsSummary || "Résultats récents"}\n\nUn grand bravo à toutes nos équipes, coachs et supporters pour leur ferveur ! 👏🔥\n\n#Résultats #Basket #TeamWork #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
    }

    return res.json({
      success: true,
      provider: "smart_local_generator",
      caption: generatedCaption,
    });
  } catch (err: any) {
    console.error("Erreur génération légende IA:", err);
    res.status(500).json({ error: err.message });
  }
});

// 9. FFBB Official API Proxy & Live Data Integration (via ffbb-api.desimone.fr)
app.get("/api/ffbb/desimone/*", async (req, res) => {
  try {
    const endpoint = req.params[0] || "";
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    const targetUrl = `https://ffbb-api.desimone.fr/${endpoint}${queryString ? `?${queryString}` : ""}`;

    console.log(`[API FFBB DE SIMONE] Proxy vers: ${targetUrl}`);
    const apiRes = await fetch(targetUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "FFBB-TV-Applet/1.0",
      },
    }).catch(() => null);

    if (apiRes && apiRes.ok) {
      const data = await apiRes.json();
      return res.json(data);
    } else {
      return res.status(apiRes?.status || 502).json({
        error: "Erreur lors de l'appel à ffbb-api.desimone.fr",
        status: apiRes?.status,
      });
    }
  } catch (err: any) {
    console.error("Erreur proxy ffbb-api.desimone.fr:", err);
    res.status(500).json({ error: err.message });
  }
});

// Direct proxies to official ffbb-api endpoints
app.get("/api/ffbb/club/:id", async (req, res) => {
  try {
    const orgId = req.params.id;
    const apiRes = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}`, {
      headers: { "Accept": "application/json" },
    });
    if (!apiRes.ok) return res.status(apiRes.status).json({ error: "Club non trouvé" });
    const data = await apiRes.json();
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.get("/api/ffbb/club/:id/matches", async (req, res) => {
  try {
    const orgId = req.params.id;
    const team = req.query.team ? `?team=${encodeURIComponent(String(req.query.team))}` : "";
    const apiRes = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/matches${team}`, {
      headers: { "Accept": "application/json" },
    });
    if (!apiRes.ok) return res.status(apiRes.status).json({ error: "Matchs non trouvés", matches: [], count: 0 });
    const data = await apiRes.json();
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message, matches: [], count: 0 });
  }
});

app.get("/api/ffbb/club/:id/teams", async (req, res) => {
  try {
    const orgId = req.params.id;
    const apiRes = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/teams`, {
      headers: { "Accept": "application/json" },
    });
    if (!apiRes.ok) return res.status(apiRes.status).json({ error: "Équipes non trouvées", teams: [], count: 0 });
    const data = await apiRes.json();
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message, teams: [], count: 0 });
  }
});

app.get("/api/ffbb/poule/:id/classement", async (req, res) => {
  try {
    const pouleId = req.params.id;
    const apiRes = await fetch(`https://ffbb-api.desimone.fr/api/v1/poule/${encodeURIComponent(pouleId)}/classement`, {
      headers: { "Accept": "application/json" },
    });
    if (!apiRes.ok) return res.status(apiRes.status).json({ error: "Classement non disponible", classement: [] });
    const data = await apiRes.json();
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message, classement: [] });
  }
});

app.get("/api/ffbb/lives", async (req, res) => {
  try {
    const apiRes = await fetch(`https://ffbb-api.desimone.fr/api/v1/lives`, {
      headers: { "Accept": "application/json" },
    });
    if (!apiRes.ok) return res.status(apiRes.status).json({ lives: [] });
    const data = await apiRes.json();
    return res.json(Array.isArray(data) ? data : []);
  } catch (e: any) {
    return res.status(500).json({ error: e.message, lives: [] });
  }
});

// Club search (real resolution via FFBB endpoints)
app.get("/api/ffbb/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) {
    return res.status(400).json({ error: "Terme de recherche requis", clubs: [] });
  }

  try {
    // 1. If numeric query, check club directly
    if (/^\d+$/.test(query)) {
      const directClub = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${query}`, {
        headers: { "Accept": "application/json" },
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      if (directClub && directClub.nom) {
        return res.json({
          source: "ffbb_api_desimone",
          clubs: [{
            code: directClub.code || query,
            organisme_id: directClub.id || query,
            name: directClub.nom,
            city: directClub.commune?.libelle || "France",
            committee: "FFBB",
          }],
        });
      }
    }

    // 2. Query next-match resolver for club/code resolution
    const resolverRes = await fetch(`https://ffbb.desimone.fr/api/v1/next-match?club_name=${encodeURIComponent(query)}`, {
      headers: { "Accept": "application/json" },
    }).catch(() => null);

    if (resolverRes && resolverRes.ok) {
      const rData = await resolverRes.json();
      if (rData.status === "ok" && rData.club_resolu) {
        return res.json({
          source: "ffbb_api_desimone",
          clubs: [{
            code: rData.club_resolu.code,
            organisme_id: rData.club_resolu.organisme_id,
            name: rData.club_resolu.nom,
            city: rData.club_resolu.ville || "",
            committee: rData.club_resolu.departement || "FFBB",
          }],
        });
      }

      if (rData.status === "ambiguous" && Array.isArray(rData.candidates) && rData.candidates.length > 0) {
        return res.json({
          source: "ffbb_api_desimone",
          clubs: rData.candidates.map((c: any) => ({
            code: c.code,
            organisme_id: c.organisme_id,
            name: c.nom,
            city: c.ville || "",
            committee: c.departement || "FFBB",
          })),
        });
      }
    }
  } catch (err) {
    console.error("[API FFBB Search Error]:", err);
  }

  // Return empty if not found - NO FAKE CLUBS
  res.json({
    source: "ffbb_api_desimone",
    clubs: [],
    message: "Aucun club correspondant trouvé sur les serveurs FFBB.",
  });
});

// Helper to resolve code or name to organism ID
async function resolveOrganismeId(codeOrName: string): Promise<{ organismeId: string; clubResolue?: any } | null> {
  const clean = codeOrName.trim();
  // Known mapping for SRC Basket / Sports Réunis Clayettois
  if (clean.toUpperCase() === "BFC0071024" || clean.toUpperCase().includes("CLAYETTE") || clean.toUpperCase() === "SRC BASKET") {
    return { organismeId: "9422" };
  }

  // Pure numeric string is already an organisme_id
  if (/^\d+$/.test(clean)) {
    return { organismeId: clean };
  }

  try {
    const res = await fetch(`https://ffbb.desimone.fr/api/v1/next-match?club_name=${encodeURIComponent(clean)}`, {
      headers: { "Accept": "application/json" },
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      if (data.status === "ok" && data.club_resolu?.organisme_id) {
        return { organismeId: String(data.club_resolu.organisme_id), clubResolue: data.club_resolu };
      }
      if (data.status === "ambiguous" && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const exactCode = data.candidates.find((c: any) => c.code && c.code.toUpperCase() === clean.toUpperCase());
        if (exactCode) return { organismeId: String(exactCode.organisme_id), clubResolue: exactCode };

        const matchName = data.candidates.find((c: any) => c.nom && c.nom.toUpperCase().includes(clean.toUpperCase()));
        if (matchName) return { organismeId: String(matchName.organisme_id), clubResolue: matchName };

        return { organismeId: String(data.candidates[0].organisme_id), clubResolue: data.candidates[0] };
      }
    }
  } catch (err) {
    console.error("[FFBB Resolver Error]:", err);
  }

  return null;
}

// Helper to normalize team category based on competition and team string
function normalizeFFBBCategory(rawTeam?: string, competition?: string): {
  badgeCategory: string;
  displayName: string;
  gender: 'M' | 'F' | 'Mixte';
} {
  const comp = (competition || '').trim();
  const compLower = comp.toLowerCase();
  const raw = (rawTeam || '').trim();
  const rawLower = raw.toLowerCase();

  const isFem = compLower.includes('féminin') || compLower.includes('feminin') || compLower.includes('fille') || rawLower.includes(' f');
  const isMasc = compLower.includes('masculin') || compLower.includes('garçon') || rawLower.includes(' m');
  const gender: 'M' | 'F' | 'Mixte' = isFem ? 'F' : (isMasc ? 'M' : 'Mixte');

  const uMatch = compLower.match(/u\s*(\d+)/i) || rawLower.match(/u\s*(\d+)/i);
  const numMatch = raw.match(/(\d+)$/) || comp.match(/équipe\s*(\d+)/i) || comp.match(/division\s*(\d+)/i);
  const num = numMatch ? numMatch[1] : '1';

  if (uMatch) {
    const age = uMatch[1];
    const gLetter = isFem ? 'F' : (isMasc ? 'M' : '');
    const gWord = isFem ? 'Filles' : (isMasc ? 'Garçons' : 'Mixte');
    return {
      badgeCategory: `U${age} ${gLetter}${num}`.trim(),
      displayName: `U${age} ${gWord} ${num}`.trim(),
      gender,
    };
  }

  if (compLower.includes('senior') || rawLower.includes('senior')) {
    const gLetter = isFem ? 'F' : 'M';
    const gWord = isFem ? 'Filles' : 'Garçons';
    return {
      badgeCategory: `Seniors ${gLetter}${num}`,
      displayName: `Seniors ${gWord} ${num}`,
      gender,
    };
  }

  return {
    badgeCategory: raw || 'Seniors',
    displayName: raw || comp || 'Équipe Club',
    gender,
  };
}

function normalizeCategoryKey(raw?: string): string {
  if (!raw) return '';
  const clean = String(raw).trim();
  const normalized = normalizeFFBBCategory(clean);
  const key = (normalized.badgeCategory || clean).trim().toUpperCase();
  return key.replace(/\bG(\d*)\b/g, 'M$1').replace(/\s+/g, ' ');
}

function isTeamCategoryIgnored(category: string, ignoredCategories: string[] = []): boolean {
  if (!ignoredCategories || ignoredCategories.length === 0) return false;
  const targetKey = normalizeCategoryKey(category);
  return ignoredCategories.some((item) => normalizeCategoryKey(item) === targetKey);
}

// Core helper to fetch and parse official FFBB club matches with real poule scores
async function fetchOfficialClubData(clubCode: string) {
  const cleanCode = String(clubCode || "BFC0071024").trim();
  const resolved = await resolveOrganismeId(cleanCode);
  if (!resolved || !resolved.organismeId) {
    return {
      success: false,
      clubCode: cleanCode,
      matches: [],
      results: [],
      teams: [],
      totalCount: 0,
      message: `Club FFBB "${cleanCode}" non trouvé sur les registres officiels.`,
    };
  }

  const orgId = resolved.organismeId;

  // Fetch official matches, club details, and teams in parallel
  const [matchesData, clubData, teamsData] = await Promise.all([
    fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/matches`, {
      headers: { "Accept": "application/json" },
    }).then(r => r.ok ? r.json() : { matches: [], count: 0 }).catch(() => ({ matches: [], count: 0 })),

    fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}`, {
      headers: { "Accept": "application/json" },
    }).then(r => r.ok ? r.json() : null).catch(() => null),

    fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/teams`, {
      headers: { "Accept": "application/json" },
    }).then(r => r.ok ? r.json() : { teams: [] }).catch(() => ({ teams: [] })),
  ]);

  const rawMatches = Array.isArray(matchesData?.matches) ? matchesData.matches : [];
  const clubNom = clubData?.nom || resolved.clubResolue?.nom || "Sports Réunis Clayettois";
  const clubCommune = clubData?.commune?.libelle || resolved.clubResolue?.ville || "La Clayette";
  const defaultGym = clubData?.salle?.libelle || "COSEC";

  if (rawMatches.length === 0) {
    return {
      success: true,
      clubCode: cleanCode,
      organismeId: orgId,
      clubName: clubNom,
      city: clubCommune,
      teams: teamsData?.teams || [],
      matches: [],
      results: [],
      totalCount: 0,
      message: `Aucun match trouvé sur le calendrier FFBB officiel pour ${clubNom}.`,
    };
  }

  // Extract unique poule IDs to query official match scores and finished state
  const pouleIds = Array.from(new Set(rawMatches.map((m: any) => m.pouleId).filter(Boolean)));
  const scoreMap = new Map<string, { score1: number; score2: number; joue: boolean; nom1?: string; nom2?: string }>();

  if (pouleIds.length > 0) {
    const pouleResults = await Promise.all(
      pouleIds.map((pid) =>
        fetch(`https://ffbb-api.desimone.fr/api/v1/poule/${encodeURIComponent(String(pid))}`, {
          headers: { "Accept": "application/json" },
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    );

    for (const p of pouleResults) {
      if (p && Array.isArray(p.rencontres)) {
        for (const r of p.rencontres) {
          if (r.id) {
            const hasScore = r.resultatEquipe1 && r.resultatEquipe1 !== "None" && r.resultatEquipe1 !== "null";
            const isPlayed = r.joue === 1 || hasScore;
            if (isPlayed && hasScore) {
              scoreMap.set(String(r.id), {
                score1: parseInt(r.resultatEquipe1, 10) || 0,
                score2: parseInt(r.resultatEquipe2, 10) || 0,
                joue: true,
                nom1: r.nomEquipe1,
                nom2: r.nomEquipe2,
              });
            }
          }
        }
      }
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // Map into MatchItem format with exact scores
  const mappedMatches: any[] = [];
  const resultsList: any[] = [];

  for (let idx = 0; idx < rawMatches.length; idx++) {
    const m = rawMatches[idx];
    const isHome = m.isHome ?? true;
    const ourClubName = clubNom;
    const opp = m.opponent || "Adversaire Inconnu";
    const teamHome = isHome ? ourClubName : opp;
    const teamAway = isHome ? opp : ourClubName;

    let gym = defaultGym;
    if (m.location) {
      const parts = m.location.split(",");
      if (parts[0] && parts[0].trim()) {
        gym = parts[0].trim();
      }
    }

    const dateStr = m.dateISO && m.dateISO.length >= 10 ? m.dateISO.slice(0, 10) : todayStr;
    const normCat = normalizeFFBBCategory(m.team, m.competition);
    const matchId = String(m.ffbbMatchId || idx);
    const pouleScore = scoreMap.get(matchId);

    const hasPouleScore = pouleScore && pouleScore.joue;
    const isPast = dateStr < todayStr || Boolean(hasPouleScore);

    let homeScore: number | undefined = undefined;
    let awayScore: number | undefined = undefined;
    let matchResult: "win" | "loss" | "draw" | null = null;

    if (hasPouleScore && pouleScore) {
      homeScore = pouleScore.score1;
      awayScore = pouleScore.score2;
      const ourScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;
      matchResult = ourScore > oppScore ? "win" : ourScore < oppScore ? "loss" : "draw";
    }

    const matchItem = {
      id: `ffbb-${matchId}`,
      date: dateStr,
      time: m.time && m.time !== "Horaire à fixer" ? m.time : "20:30",
      category: normCat.badgeCategory,
      competition: m.competition || "Championnat FFBB",
      teamHome,
      teamAway,
      isHomeMatch: isHome,
      ourClubName,
      gymnasium: gym,
      city: isHome ? clubCommune : (m.location ? m.location.split(",").pop()?.trim() || "" : ""),
      status: isPast ? "finished" : "upcoming",
      result: matchResult,
      homeScore,
      awayScore,
      ffbbMatchNumber: m.ffbbMatchId ? `FFBB-${m.ffbbMatchId}` : undefined,
      teamLogo: m.teamLogo || (clubData?.logo?.id ? `https://api.ffbb.com/assets/${clubData.logo.id}` : undefined),
      opponentLogo: m.opponentLogo || undefined,
      poule: m.poule || undefined,
      pouleId: m.pouleId || undefined,
    };

    if (hasPouleScore) {
      resultsList.push(matchItem);
    } else {
      mappedMatches.push(matchItem);
    }
  }

  mappedMatches.sort((a: any, b: any) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  resultsList.sort((a: any, b: any) => b.date.localeCompare(a.date));

  // Format teams
  const rawTeams = Array.isArray(teamsData?.teams) ? teamsData.teams : [];
  const formattedTeams = rawTeams.map((t: any, idx: number) => {
    const comp = t.competition || "";
    const norm = normalizeFFBBCategory(`Équipe ${t.team_number || 1}`, comp);
    const teamMatches = [...mappedMatches, ...resultsList].filter((m: any) => m.pouleId === t.poule_id || m.competition === comp);
    const pouleName = teamMatches.find((m: any) => m.poule)?.poule;

    return {
      id: `team-${t.engagement_id || idx}`,
      name: norm.displayName,
      category: norm.badgeCategory,
      gender: norm.gender,
      competition: comp,
      poule: pouleName,
      pouleId: t.poule_id,
      matchesCount: teamMatches.length,
      status: "active",
    };
  });

  formattedTeams.sort((a: any, b: any) => {
    const rank = (str: string) => {
      if (str.includes("Seniors F")) return 1;
      if (str.includes("Seniors G")) return 2;
      if (str.includes("U18 F")) return 3;
      if (str.includes("U18 G")) return 4;
      if (str.includes("U15 F")) return 5;
      if (str.includes("U13 F1")) return 6;
      if (str.includes("U13 F2")) return 7;
      if (str.includes("U13 G")) return 8;
      if (str.includes("U11 F")) return 9;
      if (str.includes("U11 G")) return 10;
      return 99;
    };
    return rank(a.name) - rank(b.name);
  });

  return {
    success: true,
    source: "ffbb_api_desimone",
    clubCode: cleanCode,
    organismeId: orgId,
    clubName: clubNom,
    city: clubCommune,
    gymnasiumDefault: defaultGym,
    logoUrl: clubData?.logo?.id ? `https://api.ffbb.com/assets/${clubData.logo.id}` : undefined,
    teams: formattedTeams,
    matches: mappedMatches,
    results: resultsList,
    totalCount: mappedMatches.length + resultsList.length,
    message: `API FFBB : ${mappedMatches.length} matchs à venir, ${resultsList.length} résultats officiels avec scores enregistrés.`,
  };
}

// Official matches retrieval: strictly real FFBB matches with real scores
app.get("/api/ffbb/matches", async (req, res) => {
  const clubCode = String(req.query.code || "BFC0071024").trim();
  console.log(`[API FFBB] Récupération officielle des rencontres pour : ${clubCode}`);

  try {
    const data = await fetchOfficialClubData(clubCode);
    return res.json(data);
  } catch (err: any) {
    console.error("[API FFBB Fatal Error]:", err);
    return res.status(500).json({
      success: false,
      source: "ffbb_api_desimone",
      clubCode,
      matches: [],
      results: [],
      totalCount: 0,
      error: err.message,
      message: `Erreur lors de la récupération des données FFBB officielles.`,
    });
  }
});

// Explicit endpoint to trigger immediate auto-sync
let lastSyncTimestamp = 0;
let lastSyncResult = { success: true, message: "En attente de synchronisation", matchesCount: 0, resultsCount: 0 };

async function runBackgroundFFBBSync() {
  try {
    const saved = getSavedAppData();
    const clubCode = saved?.clubSettings?.codeFFBB || "BFC0071024";
    console.log(`[AUTO-SYNC FFBB] Déclenchement automatique pour club ${clubCode}...`);

    const ffbbData = await fetchOfficialClubData(clubCode);
    lastSyncTimestamp = Date.now();

    if (ffbbData.success && (ffbbData.matches.length > 0 || ffbbData.results.length > 0)) {
      const ignoredCategories = saved?.clubSettings?.ignoredTeamCategories || [];
      const filteredFfbbMatches = ffbbData.matches.filter((m: any) => !isTeamCategoryIgnored(m.category, ignoredCategories));
      const filteredFfbbResults = ffbbData.results.filter((r: any) => !isTeamCategoryIgnored(r.category, ignoredCategories));

      const existingResults = saved?.results || [];
      const manualResults = existingResults.filter((r: any) => !String(r.id).startsWith("ffbb-"));

      // Merge new official FFBB results with any manual ones
      const combinedResults = [...filteredFfbbResults, ...manualResults];

      // Detect any new victories/defeats to alert
      const todayStr = new Date().toISOString().slice(0, 10);
      for (const r of filteredFfbbResults) {
        if (r.date === todayStr && r.homeScore !== undefined && r.awayScore !== undefined) {
          const alreadyAlerted = activeAlerts.some((a) => a.id === `alert-${r.id}` || a.rawMessage === r.id);
          if (!alreadyAlerted) {
            const ourScore = r.isHomeMatch ? r.homeScore : r.awayScore;
            const oppScore = r.isHomeMatch ? r.awayScore : r.homeScore;
            const isWin = ourScore > oppScore;
            const newAlert: ActiveMatchAlert = {
              id: `alert-${r.id}`,
              team: r.category,
              isWin,
              ourScore,
              opponentScore: oppScore,
              opponent: r.isHomeMatch ? r.teamAway : r.teamHome,
              triggeredBy: "ffbb",
              timestamp: Date.now(),
              expiresAt: Date.now() + 60 * 60 * 1000,
              rawMessage: r.id,
            };
            activeAlerts.unshift(newAlert);
            cleanExpiredAlerts();
            console.log(`[AUTO-SYNC ALERTE] Alerte score créée pour ${r.category} (${isWin ? 'Victoire' : 'Défaite'})`);
          }
        }
      }

      // Update saved app data
      const updatedData = {
        ...(saved || {}),
        matches: filteredFfbbMatches,
        results: combinedResults,
      };
      saveAppDataToFile(updatedData);

      lastSyncResult = {
        success: true,
        message: `Synchronisation réussie : ${filteredFfbbMatches.length} matchs, ${combinedResults.length} résultats (${filteredFfbbResults.length} officiels FFBB)`,
        matchesCount: filteredFfbbMatches.length,
        resultsCount: combinedResults.length,
      };
      console.log(`[AUTO-SYNC FFBB] ${lastSyncResult.message}`);
    }
  } catch (err: any) {
    console.error("[AUTO-SYNC FFBB Error]:", err);
    lastSyncResult = {
      success: false,
      message: `Erreur auto-sync: ${err.message}`,
      matchesCount: 0,
      resultsCount: 0,
    };
  }
}

// Background cron/interval: run every 3 minutes
setInterval(runBackgroundFFBBSync, 180000);
// Initial run 5 seconds after server startup
setTimeout(runBackgroundFFBBSync, 5000);

// Endpoint to trigger manual sync from client
app.all(["/api/ffbb/sync-now", "/api/ffbb/auto-sync"], async (req, res) => {
  await runBackgroundFFBBSync();
  res.json({
    ...lastSyncResult,
    lastSyncTimestamp,
  });
});

app.get("/api/ffbb/sync-status", (req, res) => {
  res.json({
    lastSyncTimestamp,
    lastSyncResult,
    activeAlertsCount: activeAlerts.length,
  });
});

// ----------------------------------------------------
// VITE OR STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Affichage TV Club démarré sur http://localhost:${PORT}`);
  });
}

startServer();
