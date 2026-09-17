# 📺 Affichage TV Club Sportif (Digital Signage 16:9)

Système complet d'affichage dynamique TV conçu pour les clubs de sport (basket-ball, football, omnisports) pour une diffusion autonome en continu (mode Kiosk / Smart TV / Fully Kiosk Browser).

> **Note aux modèles d'IA et contributeurs** : Consultez également le fichier [`AGENTS.md`](./AGENTS.md) qui contient les spécifications d'architecture et les directives techniques internes.

---

## 🎯 À quoi sert l'application ?

Cette application transforme n'importe quel téléviseur de clubhouse, buvette ou hall de gymnase en un **panneau d'information dynamique et interactif** :
- **Matchs du week-end** : Horaires, gymnases, adversaires et niveau de compétition.
- **Résultats en direct ou du week-end** : Scores, mise en valeur des victoires avec animations dédiées.
- **Anniversaires des membres** : Célébration festive des anniversaires des licenciés avec confettis et mascottes (import Excel supporté).
- **Partenaires & Sponsors** : Visibilité maximale des partenaires officiels du club (logos, bannières et fiches).
- **Identité du club & Médias** : Logos officiels, diaporamas photos et annonces d'événements.

---

## 🚀 Comment s'en servir ?

### 1. Lancement de la diffusion TV
1. Ouvrez l'application dans un navigateur sur la Smart TV ou la tablette (ex: application **Fully Kiosk Browser**).
2. Cliquez sur l'icône **Plein Écran** (en haut à droite ou touche `F11`) pour passer en mode diffusion pure 16:9.
3. Le carrousel tourne automatiquement selon les durées paramétrées pour chaque diapositive.

### 2. Accès à l'Administration
- Cliquez sur l'icône **Engrenage / Paramètres** pour ouvrir le panneau d'administration (`AdminPanel`).
- Vous pouvez y :
  - Configurer le nom du club, ses couleurs officielles et son logo.
  - Activer ou désactiver des diapositives et ajuster leur temps d'affichage individuel (ex: 12 secondes).
  - Ajouter/modifier des matchs et résultats.
  - Importer des fichiers Excel pour la liste des anniversaires.
  - Gérer les sponsors et leurs visuels.

### 3. Utilisation du Studio Graphique & des Calques (Layers 1 à 4)
Dans l'onglet **Studio Graphique** de l'administration :
- **Calque 1 (Fond)** : Choisissez un fond unicolore, un dégradé ou une vidéo d'arrière-plan.
- **Calque 2 (Contenu)** : Active et positionne les données de la slide.
- **Calques 3 & 4 (Superpositions / Overlays)** :
  - Téléversez une image PNG transparente ou une vidéo (avec ou sans fond vert).
  - **Détourage fond vert (Chroma Key)** : Cochez l'option pour effacer automatiquement le fond vert en temps réel.
  - **Choix du Mode** :
    1. **16:9 Pleine Page** : Idéal pour une vidéo ou un montage plein écran qui couvre 100% de la surface.
    2. **Traversée Animée (Mascotte)** : Idéal si vous avez une vidéo de mascotte marchant sur place. Elle traverse l'écran de droite à gauche de façon fluide et infinie, avec réglage de la vitesse, de la hauteur du sol et effet miroir.
    3. **Position Fixe** : Déplacez librement le visuel à la souris ou avec les curseurs X / Y.

---

## 🛠️ Stack Technique

- **Framework** : React 18 avec TypeScript & Vite
- **Mise en page** : Tailwind CSS (ratio natif 16:9)
- **Backend / Serveur** : Node.js + Express (`server.ts`)
- **Animations** : CSS Keyframes haute performance + `motion/react`
- **Persistance** : `localStorage` + valeurs par défaut dans `src/data/defaultData.ts`

---

## 📦 Commandes de Développement

```bash
# Lancement du serveur de développement
npm run dev

# Vérification TypeScript et Linting
npm run lint

# Compilation de production
npm run build
```
