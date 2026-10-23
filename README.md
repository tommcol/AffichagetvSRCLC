# 🏀 Affichage TV — SRC Basket La Clayette

Système d'affichage dynamique pour écran TV du club **Sports Réunis Clayettois** (SRC Basket, La Clayette — code FFBB `BFC0071024`, organisme n° `9422`).

Conçu pour tourner en continu sur un écran au club (via [Fully Kiosk Browser](https://www.fully-kiosk.com/) ou un navigateur en plein écran), avec une interface d'administration accessible depuis n'importe quel appareil.

## ✨ Fonctionnalités

- **Boucle TV** : diapositives défilantes — sponsors, matchs à venir, résultats, classements, anniversaires, événements, photos, logos du club.
- **Synchronisation FFBB** : calendriers, résultats et classements récupérés automatiquement pour toutes les équipes du club, rafraîchis toutes les 5 minutes.
- **Alertes matchs** : bandeaux victoire/défaite automatiques à la fin des rencontres du week-end.
- **Anniversaires** : import de licenciés depuis un fichier Excel, affichage automatique la semaine de l'anniversaire.
- **Studio graphique** : éditeur visuel par calques pour personnaliser chaque type de diapositive et créer des affiches exportables (PNG) et partageables sur les réseaux sociaux.
- **Légendes IA** : génération automatique de textes via Gemini, avec générateur de secours local si aucune clé n'est configurée.
- **Bot Telegram** : notifications et publication de contenus, connectable depuis l'interface d'administration.
- **Interface admin protégée** : accès par mot de passe, gestion des médias (photos, vidéos, logos) via une banque de médias.

## 🏗️ Architecture

| Élément | Rôle |
|---|---|
| [Cloudflare Workers](https://workers.cloudflare.com/) | Hébergement : API (`/api/*`) + fichiers statiques |
| Cloudflare KV | Stockage des réglages, matchs, sponsors et alertes |
| Cloudflare R2 | Stockage des médias (photos, vidéos, logos) |
| Cron (toutes les 5 min) | Synchronisation FFBB et rafraîchissement des alertes |
| React 19 + Vite 6 + Tailwind CSS 4 | Interface TV et administration |

## 📁 Structure du projet

```
├── worker/index.ts        # Point d'entrée serveur : toutes les routes /api/*
├── src/
│   ├── App.tsx            # Composant racine (bascule boucle TV / admin)
│   ├── components/
│   │   ├── Admin/         # Interface d'administration + studio graphique
│   │   ├── slides/         # Un composant par type de diapositive
│   │   └── ...            # Header TV, ticker, overlays, export d'affiches
│   ├── services/          # Appels API (FFBB, etc.)
│   └── types.ts           # Types partagés
├── data/                  # Données de référence (aperçu local)
├── scripts/               # Scripts de test
└── wrangler.json          # Configuration Cloudflare
```

## ⚙️ Configuration

Les secrets se configurent dans Cloudflare → le projet → **Settings → Variables and Secrets**, section **« Exécution »** (et non « Build ») :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ | Mot de passe d'accès à l'administration et à la sauvegarde |
| `TELEGRAM_BOT_TOKEN` | — | Bot Telegram (créé via @BotFather) |
| `GEMINI_API_KEY` | — | Légendes IA (sinon fallback local) |

## 🚀 Démarrage

```bash
npm install          # Installer les dépendances
npm run dev          # Développement local (persistance dans data/ ; utiliser demo pour les essais)
npm run build        # Construire le front
npx wrangler deploy  # Déployer sur Cloudflare Workers
```

## ✅ Tests

Le dossier `scripts/` contient une suite de scripts de test :

```bash
npx tsx scripts/test_ffbb_merge.ts
npx tsx scripts/test_telegram_webhook.ts
# ...
```

## ⚠️ Notes

- Les données de matchs proviennent d'une [API FFBB non officielle](https://ffbb-api.desimone.fr) : en cas d'indisponibilité, les dernières données connues restent affichées.
- Ce projet est développé avec l'assistance d'outils d'IA, à destination du club. Toute contribution locale est bienvenue !

---

*SRC Basket La Clayette — Le basket à La Clayette et ses environs.*

## Démonstration isolée et corrections de l'audit

`npm run demo` démarre une copie avec des rencontres seniors fictives et une persistance séparée dans `.demo-data/`. La synchronisation FFBB, les messages Telegram et les publications sont bloqués dans ce mode. Les imports de médias utilisent également ce dossier séparé. Aucune clé Cloudflare n'est requise.

Les décisions point par point, les contrôles et les précautions avant une éventuelle mise en ligne sont décrits dans [le suivi des corrections](docs/CORRECTIONS_AUDIT_2026-10-23.md).
