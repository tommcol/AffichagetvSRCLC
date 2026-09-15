export type SlideCategory = 'photos' | 'sponsors' | 'matches' | 'results' | 'birthdays' | 'events' | 'active_alert' | 'logos';

export interface CategoryConfig {
  id: SlideCategory;
  label: string;
  shortLabel: string;
  enabled: boolean;
  durationSeconds: number; // Durée d'affichage spécifique en secondes
  icon: string;
  description: string;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished';
export type MatchResult = 'win' | 'loss' | null;

export interface MatchItem {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  category: string; // e.g. "Seniors Garçons 1", "U15 Filles", "U17 Région"
  competition: string; // e.g. "Pré-Nationale M", "Régionale 2", "Départementale 1"
  teamHome: string;
  teamAway: string;
  isHomeMatch: boolean;
  ourClubName: string;
  gymnasium: string; // e.g. "Gymnase de la Verrerie"
  city: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  result?: MatchResult; // 'win' -> vert, 'loss' -> rouge
  ffbbMatchNumber?: string;
  finishedAt?: number; // timestamp when match ended
}

export interface ActiveMatchAlert {
  id: string;
  team: string; // Nom de l'équipe (ex: "Seniors Garçons 1")
  ourTeam?: string;
  matchId?: string;
  category?: string;
  competition?: string;
  isWin: boolean;
  ourScore?: number;
  opponentScore?: number;
  opponent?: string;
  customImageUrl?: string; // Visuel spécifique sélectionné
  triggeredBy: 'telegram' | 'ffbb' | 'manual';
  timestamp: number; // Date de fin du match
  expiresAt: number; // Date d'expiration (+1h / 60 minutes)
  gymnasium?: string;
  rawMessage?: string;
}

export type FinishedMatchNotification = ActiveMatchAlert;

// Visual support templates for the generated slides (Matchs, Résultats, Anniversaires)
export interface VisualTemplatesConfig {
  matchesBackgroundUrl: string;
  resultsBackgroundUrl: string;
  birthdaysBackgroundUrl: string;
  defaultVictoryBackgroundUrl: string;
  defaultDefeatBackgroundUrl: string;
}

// Pre-made Win / Loss visuals per team in the club
export interface TeamVisualItem {
  id: string;
  teamName: string; // e.g. "Seniors Garçons 1"
  shortAliases: string[]; // e.g. ["sg1", "seniors 1", "nm3", "prenat"]
  category: string; // "Seniors", "U20", "U18", "U15", etc.
  winVisualUrl: string; // Image visuelle Victoire 16:9
  lossVisualUrl: string; // Image visuelle Défaite 16:9
}

export interface BirthdayItem {
  id: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD or DD/MM/YYYY
  birthDayFormatted: string; // e.g. "Jeudi 18 Septembre"
  age?: number;
  teamCategory: string; // e.g. "U15 Garçons", "Coach Seniors", "Bénévole Buvette"
  photoUrl?: string;
  isThisWeek: boolean;
  isVideo?: boolean;
}

export interface SponsorItem {
  id: string;
  name: string;
  tier: 'gold' | 'silver' | 'bronze' | 'partenaire';
  logoUrl: string;
  tagline?: string;
  categoryFolder?: string;
  website?: string;
  displayUntil?: string;
  isVideo?: boolean;
  mediaType?: 'image' | 'video';
}

export interface ClubLogoItem {
  id: string;
  name: string;
  logoUrl: string;
  category: 'club' | 'sponsor' | 'comite' | 'ligue' | 'autre';
  isTransparent?: boolean;
  isVideo?: boolean;
  mediaType?: 'image' | 'video';
}

export interface ClubPhotoItem {
  id: string;
  title: string;
  categoryFolder?: string;
  imageUrl: string;
  date: string;
  caption?: string;
  photographer?: string;
  isVideo?: boolean;
  mediaType?: 'image' | 'video';
}

export interface ClubEventItem {
  id: string;
  title: string;
  date: string; // e.g. "Samedi 28 Septembre"
  time?: string; // e.g. "À partir de 19h30"
  location: string;
  description: string;
  categoryFolder?: string;
  imageUrl?: string;
  badge?: string; // e.g. "Soirée Club", "Tournoi 3x3", "Stage Basket"
  isVideo?: boolean;
  mediaType?: 'image' | 'video';
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  webhookUrl: string;
  autoReply: boolean;
}

export interface ClubSettings {
  name: string;
  shortName: string;
  codeFFBB: string;
  logoUrl: string;
  primaryColor: string; // e.g. "#ea580c"
  secondaryColor: string;
  city: string;
  gymnasiumDefault: string;
  victoryNotificationMinutes: number; // default 60 (1 heure)
  tickerText: string;
  showClock: boolean; // default false (selon demande utilisateur)
  autoPlayCarousel: boolean;
  instagramHandle?: string; // ex: "@bc_valdesaone"
  facebookPage?: string; // ex: "BasketClubValDeSaone"
  tiktokHandle?: string; // ex: "@bcvs_basket"
  socialWebhookUrl?: string; // Webhook Zapier / Make / Meta Business / Discord
  purePhotoSlidesOnly?: boolean; // Mode 100% photo/image pur sans aucun texte superposé
  hideTextOverlays?: boolean; // Masquer le texte sur les diapos photos
  balancedLoopMode?: boolean; // Alternance équilibrée des catégories (1 match, 1 sponsor, 1 photo, 1 résultat...)
}
