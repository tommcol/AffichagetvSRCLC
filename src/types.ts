export type SlideCategory = 'photos' | 'sponsors' | 'matches' | 'results' | 'birthdays' | 'events' | 'active_alert' | 'logos' | 'standby';

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
  teamLogo?: string;
  opponentLogo?: string;
  poule?: string;
  pouleId?: string;
  selectedForWeekend?: boolean;
  // Identifiant de rattachement FFBB et nom d'origine
  ffbbTeamId?: string;
  rawFfbbCategory?: string;
  // Provenance et indicateurs de modifications manuelles (pour la fusion FFBB)
  isManualMatch?: boolean;
  isDateManual?: boolean;
  isTimeManual?: boolean;
  isScoreManual?: boolean;
  isGymnasiumManual?: boolean;
  isOpponentLogoManual?: boolean;
}

export interface FFBBTeamItem {
  id: string;
  name: string;
  customName?: string; // Nom personnalisé affiché dans l'application, le carrousel et Telegram
  category: string;
  gender: 'M' | 'F' | 'Mixte';
  competition: string;
  poule?: string;
  pouleId?: string;
  matchesCount: number;
  divisionCode?: string;
  status?: 'active' | 'pending' | 'inactive';
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
  titleConfig?: VisualTitleConfig; // Configuration graphique spécifique attachée au visuel
  triggeredBy: 'telegram' | 'ffbb' | 'manual';
  timestamp: number; // Date de fin du match
  expiresAt: number; // Date d'expiration (+1h / 60 minutes)
  gymnasium?: string;
  rawMessage?: string;
}

export type FinishedMatchNotification = ActiveMatchAlert;

// Visual support templates for the generated slides (Matchs, Résultats, Anniversaires)
export type FontFamilyOption =
  | 'Bebas Neue'
  | 'Teko'
  | 'Montserrat'
  | 'Outfit'
  | 'Oswald'
  | 'Anton'
  | 'Russo One'
  | 'Kanit'
  | 'Poppins'
  | 'Changa'
  | 'Fredoka'
  | 'Permanent Marker';

export interface ForegroundMascotConfig {
  enabled: boolean;
  mediaUrl: string; // URL (video MP4 / WebM / image GIF / PNG)
  mediaType: 'video' | 'image';
  useChromaKey: boolean; // suppression automatique du fond vert
  chromaKeyColor: string; // ex: "#00ff00"
  chromaTolerance: number; // 0.1 à 0.6 (défaut 0.35)
  chromaSmoothness: number; // 0.0 à 0.2 (défaut 0.08)
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'center-right';
  scale: number; // 0.6 à 1.5 (défaut 1.0)
  opacity: number; // 0.2 à 1.0 (défaut 1.0)
  animationStyle: 'bounce' | 'pulse' | 'float' | 'none';
  showOnMatches: boolean;
  showOnResults: boolean;
  showOnBirthdays?: boolean; // Afficher sur le slide des anniversaires
  onlyOnVictory: boolean;
}

export interface SlideDesignTheme {
  primaryColor: string; // Couleur d'accentuation (ex: "#ea580c" ou "#dc2626")
  secondaryColor: string; // Couleur secondaire (ex: "#0f172a")
  cardBgColor: string; // Couleur de fond des cartes (ex: "#020617")
  cardOpacity: number; // 0.1 à 1.0 (défaut 0.85)
  cardBlur: number; // 0 à 20 (défaut 8)
  fontFamilyHeader: FontFamilyOption; // 'Bebas Neue' | 'Montserrat' | 'Outfit' | 'Teko'
  fontFamilyScore: FontFamilyOption; // 'Teko' | 'Bebas Neue' | 'Outfit' | 'Montserrat'
  fontFamilyBody?: FontFamilyOption;
  textColor?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  resultDisplayMode?: 'both' | 'score' | 'status';
  backgroundBrightness: number; // 0.1 à 1.0 (défaut 0.35)
  backgroundBlur: number; // 0 à 20px (défaut 0)
  backgroundMediaType?: 'image' | 'video';
  customHeaderTitle?: string;
  customHeaderTitleHome?: string;
  customHeaderTitleAway?: string;
  matchDisplayScope?: 'split' | 'all';
  visualStyle?: 'poster-red' | 'cards';
  showClubLogoWatermark?: boolean; // Filigrane central du logo du club
  headerTitleAlignment?: 'left' | 'center' | 'right';
  removeWhiteBgLogos?: boolean;
}

// Élément superposé libre (Calque 3 et Calque 4 : élément libre, logo, badge derby, sponsor, sticker...)
export interface OverlayLayerItem {
  id?: string;
  name?: string; // ex: "Élément libre", "Logo Officiel", "Badge Choc", "Partenaire"
  enabled: boolean;
  mediaUrl: string; // Image PNG / WebP / GIF ou Vidéo MP4 / WebM
  mediaType: 'image' | 'video';
  useChromaKey: boolean; // suppression du fond vert
  chromaKeyColor: string; // ex: "#00ff00"
  chromaTolerance: number; // 0.1 à 0.7 (défaut 0.35)
  chromaSmoothness: number; // 0.0 à 0.2 (défaut 0.08)
  x: number; // 0 à 100 (% horizontal par rapport à la gauche)
  y: number; // 0 à 100 (% vertical par rapport au haut)
  scale: number; // 0.2 à 4.0 (défaut 1.0)
  opacity: number; // 0.1 à 1.0 (défaut 1.0)
  animationStyle: 'bounce' | 'pulse' | 'float' | 'none';
  fullScreen?: boolean; // Si activé, s'étend sur toute la page / plein écran 100%
  objectFit?: 'contain' | 'cover'; // Mode d'affichage quand agrandi ('cover' par défaut pour 16:9)
  onlyOnVictory?: boolean; // spécifique Résultats
  // Trajectoire animée / Traversée d'écran (ex: élément traversant l'écran de droite à gauche)
  motionTrajectory?: 'none' | 'right-to-left' | 'left-to-right';
  motionDuration?: number; // Durée de la traversée en secondes (défaut 12)
  flipHorizontal?: boolean; // Effet miroir horizontal pour ajuster l'orientation
}

// Paramétrage visuel dédié pour chaque catégorie (Matchs, Résultats, Anniversaires)
export interface CategorySlideTheme {
  // Calque 1 : Fond
  backgroundUrl?: string; // Image ou vidéo propre à cette catégorie
  backgroundMediaType?: 'image' | 'video'; // Type explicite du média de fond
  backgroundBrightness?: number; // 0.05 à 2.0 (5% à 200%)
  backgroundBlur?: number; // 0 à 20px
  showClubLogoWatermark?: boolean; // Filigrane central du logo du club

  // Calque 2 : Cartes & Données
  customHeaderTitle?: string; // Titre / Entête personnalisée (mode "Tous")
  customHeaderTitleHome?: string; // Titre personnalisé pour le calque Domicile (mode "Domicile / Extérieur")
  customHeaderTitleAway?: string; // Titre personnalisé pour le calque Extérieur (mode "Domicile / Extérieur")
  matchDisplayScope?: 'split' | 'all'; // Mode de regroupement des matchs/résultats ('split' Domicile & Extérieur séparés, 'all' Tout)
  visualStyle?: 'poster-red' | 'cards'; // Style visuel ('poster-red' Affiche Officielle Pill Badges ou 'cards' Cartes)
  primaryColor?: string; // Couleur d'accentuation spécifique
  cardBgColor?: string; // Couleur de fond des cartes
  cardOpacity?: number; // 0.1 à 1.0 (opacité / transparence)
  cardBlur?: number; // 0 à 24px (flou glassmorphism)
  fontFamilyHeader?: FontFamilyOption; // Typographie des grands titres & équipes
  fontFamilyScore?: FontFamilyOption; // Typographie dédiée aux scores & chiffres (Résultats)
  fontFamilyBody?: FontFamilyOption; // Typographie du corps de texte (dates, lieux, sous-titres)
  textColor?: string; // Couleur personnalisée du texte / police principal
  badgeBgColor?: string; // Couleur personnalisée des pastilles / badges (ex: U13M, DOMICILE)
  badgeTextColor?: string; // Couleur du texte à l'intérieur des pastilles / badges

  // Calque 3 : Élément superposé 1 (libre : image, vidéo, logo, badge, etc.)
  layer3?: OverlayLayerItem;

  // Calque 4 : Élément superposé 2 (libre : identique au calque 3)
  layer4?: OverlayLayerItem;

  // Mode d'affichage du résultat (Score + Statut, Score seul, Statut seul)
  resultDisplayMode?: 'both' | 'score' | 'status';

  // Alignement du titre (Gauche, Centré, Droite)
  headerTitleAlignment?: 'left' | 'center' | 'right';

  // Enlever le fond blanc des logos (Détourer en transparence)
  removeWhiteBgLogos?: boolean;

  // Rétro-compatibilité
  showMascot?: boolean;
  mascotPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'center-right';
  mascotOnlyOnVictory?: boolean;
}

export interface MediaBankItem {
  id: string;
  name: string;
  url: string;
  mediaType: 'image' | 'video';
  dateAdded?: string;
  size?: number;
}

export interface VisualTemplatesConfig {
  matchesBackgroundUrl: string;
  resultsBackgroundUrl: string;
  birthdaysBackgroundUrl: string;
  defaultVictoryBackgroundUrl: string;
  defaultDefeatBackgroundUrl: string;
  theme?: SlideDesignTheme;
  mascot?: ForegroundMascotConfig;
  // Réglages par catégorie
  matchesSettings?: CategorySlideTheme;
  resultsSettings?: CategorySlideTheme;
  birthdaysSettings?: CategorySlideTheme;
  // Banque commune de médias (Fonds, Calque 3, Calque 4 pour tous les studios)
  mediaBank?: MediaBankItem[];
  // Banque commune de visuels (Victoire / Défaite) pour toutes les équipes
  commonVictoryVisuals?: string[];
  commonDefeatVisuals?: string[];
  // Montage & Positionnement du texte sur le visuel d'alerte (Victoire / Défaite)
  alertLayoutStyle?: 'poster' | 'card' | 'banner' | 'badge' | 'minimal'; // Style de disposition graphique
  alertTextX?: number; // 0 à 100% horizontal (défaut 50 = centré)
  alertTextY?: number; // 0 à 100% vertical (défaut 50)
  alertTextColor?: string; // couleur du texte (défaut #ffffff)
  alertTextFont?: FontFamilyOption; // police du titre (défaut 'Bebas Neue')
  alertTeamFont?: FontFamilyOption; // police de l'équipe/catégorie (défaut 'Montserrat')
  alertScoreFont?: FontFamilyOption; // police des scores (défaut 'Teko')
  alertTextScale?: number; // échelle de taille du bloc (défaut 1.0)
  alertTextBgOpacity?: number; // opacité du fond translucide derrière le texte (0 à 1, défaut 0.6)
  alertWinColor?: string; // couleur d'accent pour la victoire (défaut #10b981)
  alertLossColor?: string; // couleur d'accent pour la défaite (défaut #ef4444)
  alertShowIcon?: boolean; // afficher l'icône coupe / défaite (défaut true)
  alertShowScore?: boolean; // afficher le score si disponible (défaut true)
  alertShowSubtitle?: boolean; // afficher le message de félicitations/encouragements (défaut true)
  alertGlowEffect?: boolean; // effet néon / lueur sportive (défaut true)
  alertCustomWinTitle?: string; // titre personnalisé victoire (défaut "VICTOIRE DES {CATEGORIE}")
  alertCustomLossTitle?: string; // titre personnalisé défaite (défaut "DÉFAITE DES {CATEGORIE}")
  alertTextAlign?: 'left' | 'center' | 'right'; // alignement horizontal du titre (défaut 'center')
  // Configurations graphiques indépendantes par visuel (clé = URL du média)
  visualTitleConfigs?: Record<string, VisualTitleConfig>;
}

// Configuration graphique du titre attachée à un visuel spécifique
export interface VisualTitleConfig {
  customTitle?: string; // Modèle de titre personnalisé (ex: "VICTOIRE DES {CATEGORIE}" ou retours à la ligne)
  font?: FontFamilyOption; // Police du titre
  color?: string; // Couleur personnalisée du titre
  scale?: number; // Échelle de taille (0.2 à 1.6, défaut 1.0)
  x?: number; // Position horizontale (5% à 95%, défaut 50)
  y?: number; // Position verticale (5% à 95%, défaut 82)
  align?: 'left' | 'center' | 'right'; // Alignement horizontal
  bgOpacity?: number; // Fond translucide sous le titre (0 à 0.9, défaut 0)
  glowEffect?: boolean; // Effet lueur néon sportive (défaut true)
  isCustomized?: boolean; // Indique si le visuel a sa propre configuration indépendante
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
  firstName?: string; // Prénom du licencié (affiché sur la TV)
  lastName?: string;  // Nom de famille
  gender?: 'F' | 'M' | 'Mixte' | string;
  birthDate: string; // YYYY-MM-DD or DD/MM/YYYY
  birthDayFormatted: string; // e.g. "Jeudi 18 Septembre"
  age?: number;
  teamCategory: string; // e.g. "U15F", "U15M", "Seniors F", "Coach"
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
  victoryPhotoDurationSeconds?: number; // default 10 (durée d'affichage photo Victoire / Défaite)
  tickerText: string;
  showClock: boolean; // default false (selon demande utilisateur)
  autoPlayCarousel: boolean;
  instagramHandle?: string; // ex: "@votre_club"
  facebookPage?: string; // ex: "Nom du club"
  tiktokHandle?: string; // ex: "@votre_club"
  socialWebhookUrl?: string; // Webhook Zapier / Make / Meta Business / Discord
  purePhotoSlidesOnly?: boolean; // Mode 100% photo/image pur sans aucun texte superposé
  hideTextOverlays?: boolean; // Masquer le texte sur les diapos photos
  balancedLoopMode?: boolean; // Alternance équilibrée des catégories (1 match, 1 sponsor, 1 photo, 1 résultat...)
  autoSyncFFBB?: boolean; // Synchronisation automatique périodique avec FFBB
  autoSyncIntervalMinutes?: number; // Fréquence de synchronisation en minutes (défaut 3 min)
  ignoredTeamCategories?: string[]; // Catégories normalisées ignorées (ex: ["U18 F1"]). Par défaut vide = toutes suivies.
  customTeamNames?: Record<string, string>; // Noms personnalisés par équipe FFBB (clé: teamId ou catégorie normalisée -> valeur: nom affiché)
}

export interface CarouselSlide {
  id: string;
  type: 'category' | 'alert';
  categoryId?: SlideCategory;
  alert?: ActiveMatchAlert;
  sponsor?: SponsorItem;
  photo?: ClubPhotoItem;
  event?: ClubEventItem;
  logo?: ClubLogoItem;
  matchesPage?: {
    homeMatches: MatchItem[];
    awayMatches: MatchItem[];
    pageNumber: number;
    totalPages: number;
  };
  filterScope?: 'all' | 'home' | 'away';
  customTitle?: string;
  itemIndex?: number;
  totalItems?: number;
  durationSeconds: number;
  label: string;
}

