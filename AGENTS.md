# GUIDE POUR LES ASSISTANTS IA ET DÉVELOPPEURS (AGENTS.md)

> Ce fichier est destiné aux modèles d'IA (Gemini, Claude, GPT, Cursor, Copilot, etc.) et aux développeurs consultant ou modifiant ce dépôt. Il documente le rôle, l'architecture et le fonctionnement interne de l'application, **sans impacter l'interface visuelle de diffusion TV**.

---

## 1. Présentation & Rôle de l'Application

### À quoi sert cette application ?
Cette application est un **système complet d'affichage dynamique (Digital Signage TV)** conçu spécifiquement pour les **clubs sportifs** (notamment basket-ball, football, omnisports) et leurs clubhouses / gymnases / buvettes.

L'application est optimisée pour tourner en continu en mode plein écran (format **16:9**, typiquement 1920x1080) sur des téléviseurs connectés, boîtiers Android TV ou tablettes utilisant des navigateurs kiosque (comme **Fully Kiosk Browser**).

### Principales fonctionnalités :
1. **Carrousel autonome de diapositives (Slideshow 16:9) :**
   - **Matchs à venir** : Calendrier des rencontres du week-end (équipes, adversaires, logos, date, heure, salle/gymnase, niveau de compétition).
   - **Résultats du week-end** : Scores des matchs joués avec badge de victoire/défaite et affichage dynamique des gagnants.
   - **Anniversaires du mois/semaine** : Mise en valeur festive des licenciés, joueurs et bénévoles célébrant leur anniversaire (importation possible via fichiers Excel / tableurs).
   - **Partenaires & Sponsors** : Grille et carrousel valorisant les sponsors officiels avec leurs logos, catégories de partenariat et visuels promotionnels.
   - **Identité & Logos du Club** : Affichage prestige des armoiries, logos et devises du club.
   - **Galerie Photos & Vie du Club** : Diaporamas d'ambiance des matchs, événements, stages et tournois.
   - **Événements & Soirées** : Annonces des prochains événements (lotos, galas, tournois internes, stages).
   - **Mode Alerte Match en Direct (`MatchAlertSlide`)** : Interruption momentanée du carrousel pour afficher une bannière ou une alerte en direct.

2. **Studio Graphique & Régie de Calques Découplés (Layers 1 à 4) :**
   Chaque catégorie de diapositive dispose d'une composition multi-calques configurable en temps réel :
   - **Calque 1 (Arrière-plan)** : Couleur unie, dégradé de club ou vidéo d'ambiance en boucle.
   - **Calque 2 (Contenu principal)** : Données structurées (cartes de matchs, grille d'anniversaires, tableau des scores).
   - **Calques 3 et 4 (Superpositions / Overlays libres)** :
     - Éléments graphiques flottants, sponsors volants, effets visuels ou mascottes animées.
     - **Chroma Key (Détourage fond vert)** intégré en temps réel par traitement Canvas / Shader pour supprimer les fonds verts des vidéos (MP4 / WebM) ou images sans nécessiter de rendu transparent lourd.
     - **3 modes de restitution :**
       1. *16:9 Pleine Page* : Occupe 100% de la surface (pour vidéo de fond vert ou montage plein écran, sans marge).
       2. *🏃 Traversée Animée* : Conçu pour les vidéos de mascotte marchant sur place. La mascotte traverse automatiquement l'écran de droite à gauche (ou de gauche à droite) avec vitesse réglable, ligne de sol (axe Y) ajustable et option d'effet miroir.
       3. *Position Fixe* : Placement libre par drag & drop à la souris ou curseurs X/Y, avec échelle réglable.

3. **Administration & Exportation :**
   - Panneau d'administration complet (`AdminPanel`) accessible discrètement.
   - Personnalisation complète des couleurs, typographies, logos et temps de transition par slide.
   - Outils d'exportation d'images pour réseaux sociaux (`VisualExporterModal`) et d'exportation vidéo MP4 du carrousel (`CarouselVideoExporterModal`).

---

## 2. Architecture Technique

### Stack Logicielle :
- **Frontend** : React 18, TypeScript, Vite.
- **Styling** : Tailwind CSS (utilitaires natifs) avec ratio 16:9 verrouillé pour affichage TV propre (`aspect-video`).
- **Animations** : CSS Keyframes optimisées (`traverseRightToLeft`, `traverseLeftToRight`) + `motion/react`.
- **Backend / Serveur** : Node.js avec Express (`server.ts`), servant les routes d'API, le scraping/proxy des calendriers de ligue sportive et servant le bundle de production.
- **Persistance** : `localStorage` côté client pour les configurations locales et thèmes, couplé aux valeurs par défaut robustes dans `src/data/defaultData.ts`.

### Structure Clé des Dossiers (`/src`) :
```
src/
├── components/
│   ├── Admin/                      # Panneau d'administration et configuration du club
│   │   ├── AdminPanel.tsx          # Tableau de bord d'administration principal
│   │   ├── StudioGraphiqueWorkbench.tsx # Régie de calques 1 à 4 & studio visuel
│   │   ├── MatchesManager.tsx      # Gestionnaire du calendrier des matchs
│   │   ├── ResultsManager.tsx      # Gestionnaire des résultats et scores
│   │   ├── BirthdaysManager.tsx    # Gestionnaire des anniversaires (import Excel)
│   │   ├── SponsorsManager.tsx     # Gestionnaire des partenaires et sponsors
│   │   └── ClubSettingsManager.tsx # Paramètres généraux du club
│   ├── slides/                     # Composants individuels de chaque diapositive 16:9
│   │   ├── MatchesSlide.tsx        # Diapositive des prochains matchs
│   │   ├── ResultsSlide.tsx        # Diapositive des résultats
│   │   ├── BirthdaysSlide.tsx      # Diapositive des anniversaires
│   │   ├── SponsorsSlide.tsx       # Diapositive des sponsors
│   │   ├── PhotosSlide.tsx         # Diapositive galerie photos
│   │   ├── LogosSlide.tsx          # Diapositive des logos officiels
│   │   └── EventsSlide.tsx         # Diapositive des événements
│   ├── FreeOverlayLayer.tsx        # Moteur de rendu des Calques 3 & 4 (Chroma Key + Traversée animée)
│   ├── VisualExporterModal.tsx     # Modal d'export d'affiches / réseaux sociaux
│   └── CarouselVideoExporterModal.tsx # Générateur / exportateur vidéo
├── data/
│   └── defaultData.ts              # Données de démarrage, exemples de matchs et sponsors
├── utils/
│   └── themeUtils.ts               # Thèmes, calculs des calques et styles par défaut
├── types.ts                        # Définitions TypeScript complètes de tous les modèles
├── App.tsx                         # Cœur applicatif, boucle de rotation du carrousel et plein écran
├── main.tsx                        # Point d'entrée React
└── index.css                       # Styles globaux, polices et keyframes de déplacement
```

---

## 3. Modèle de Données Principal (`types.ts`)

- **`OverlayLayerItem`** : Représente la configuration d'un calque de superposition (Calques 3 et 4) :
  - `enabled`: boolean
  - `type`: `'image' | 'video'`
  - `url`: string (URL ou data-uri)
  - `x`, `y`: Coordonnées en pourcentage (0 à 100) pour la position fixe
  - `scale`: Échelle du visuel (0.5 à 4.0)
  - `opacity`: Opacité (0.1 à 1.0)
  - `fullScreen`: boolean (active le mode 16:9 Pleine Page)
  - `objectFit`: `'cover' | 'contain'`
  - `useChromaKey`: boolean (active la suppression de fond vert)
  - `chromaKeyColor`: string (couleur hex du fond vert à retirer)
  - `chromaKeySimilarity`, `chromaKeySmoothness`: Tolérance de découpe
  - `motionTrajectory`: `'none' | 'right-to-left' | 'left-to-right'` (déplacement automatique d'écran)
  - `motionDuration`: Durée de traversée en secondes (ex: 12s)
  - `flipHorizontal`: boolean (retournement miroir de l'image/vidéo)

- **`CategorySlideTheme`** : Représente le thème graphique complet pour une catégorie de diapositive (fond, couleurs d'accentuation, logos de coin, calques 3 et 4 associés).

---

## 4. Règles & Directives pour les Agents IA lors de modifications

Lorsqu'un utilisateur demande d'éditer ou faire évoluer cette application, les agents IA doivent respecter les principes suivants :

1. **Intégrité de la diffusion TV :**
   - L'écran de diffusion principal doit rester **absolument propre** : aucun bandeau publicitaire, aucune barre de défilement parasite (overflow caché requis), aucun bouton d'interface non désiré visible pendant la lecture normale du carrousel.
   - Les boutons d'administration doivent être soit discrets (opacité réduite au repos, positionnés dans un coin) soit masquables.

2. **Respect strict du ratio 16:9 :**
   - Toutes les diapositives et conteneurs doivent s'inscrire dans un conteneur au ratio 16:9 (`aspect-video` ou coordonnées proportionnelles en %). Ne jamais forcer des dimensions fixes en pixels qui casseraient l'affichage sur des résolutions TV différentes (720p, 1080p, 4K).

3. **Performance et autonomie (Kiosk Mode) :**
   - L'application est amenée à tourner 24h/24 sans intervention humaine. Éviter les fuites mémoires (`setInterval` non nettoyés, boucles d'effets infinies, recréations inutiles de balises vidéo).
   - Les balises `<video>` des calques doivent toujours posséder les attributs `autoPlay`, `muted`, `playsInline` et `loop` pour garantir le démarrage automatique sur navigateur TV sans blocage de politique de lecture audio.

4. **Préservation du Chroma Key & de la Traversée :**
   - Le composant `FreeOverlayLayer.tsx` gère le traitement direct par `<canvas>` pour la suppression de fond vert. Tout ajout de fonctionnalité de calque doit conserver la compatibilité avec ce pipeline.
