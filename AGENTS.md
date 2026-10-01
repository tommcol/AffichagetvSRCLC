# Affichage TV — SRC Basket La Clayette

## Architecture actuelle (Cloudflare Worker)

- **Hébergement** : Cloudflare Workers (avec assets statiques), pas Netlify, pas Cloudflare Pages classique.
- **Stockage partagé** : Cloudflare KV, namespace lié à la variable `AFFICHAGE_KV` (voir `wrangler.json`). Deux clés utilisées : `app-data` (tous les réglages/matchs/sponsors) et `alerts` (alertes victoire/défaite actives).
- **Point d'entrée serveur unique** : `worker/index.ts`. Toutes les routes `/api/...` y sont gérées manuellement (pas de routage automatique par dossier). Tout le reste (page principale, fichiers) est servi automatiquement par Cloudflare via le binding `ASSETS`.
- **Mot de passe admin** : variable d'environnement `ADMIN_PASSWORD`, configurée dans Cloudflare > le projet > Settings > Variables et secrets, section "Exécution" (pas "Build").
- **Légendes IA** : variable d'environnement `GEMINI_API_KEY` (optionnelle). Sans elle, un générateur de texte de secours local prend le relais automatiquement.
- **API FFBB réelle** : passe par `ffbb-api.desimone.fr` (API non officielle tierce). Le numéro d'organisme du club (9422) est résolu automatiquement à partir du code FFBB dans `worker/index.ts`.

## Ce qui n'est plus utilisé (historique, gardé pour référence)
- `server.ts` : ancien serveur Express, utile uniquement pour `npm run dev` en local (aperçu visuel rapide, les données ne se sauvegardent pas vraiment en local).
- Le dossier `functions/` a existé un temps pour une tentative Cloudflare Pages, abandonnée au profit de Cloudflare Workers — a été supprimé.

## Composants principaux
- `src/App.tsx` : composant racine, bascule entre la boucle TV et la page admin, charge/enregistre les données via `/api/get-app-data` et `/api/save-app-data`.
- `src/components/Admin/AdminPanel.tsx` : interface d'administration complète (réglages, banques de contenu, synchronisation FFBB, réseaux sociaux).
- `src/components/Admin/StudioGraphiqueWorkbench.tsx` : éditeur visuel par calques pour personnaliser chaque type de diapositive.
- `src/components/slides/` : un composant par type de diapositive (sponsors, matchs, résultats, anniversaires, logos, événements, photos).
- `src/services/ffbbService.ts` : appelle les routes `/api/ffbb/matches` et `/api/ffbb/search`.

## Identité du club
Sports Réunis Clayettois (SRC Basket), La Clayette, code FFBB BFC0071024, numéro d'organisme FFBB 9422.

## Telegram — point mis de côté et suite prévue
- **Saisie du token dans l'application** : la saisie du token dans l'application est reportée. Ne pas créer de champ pour saisir le token dans l'application.
- **Secret Cloudflare** : le token est déjà enregistré dans Cloudflare comme secret `TELEGRAM_BOT_TOKEN` (section "Exécution"). Ne JAMAIS inscrire sa valeur dans le code, l'application, les journaux ou ce fichier.
- **Fonctionnement côté serveur & interface** :
  - Ajouter/maintenir dans l'application un bouton pour connecter et vérifier le bot en utilisant ce secret côté serveur (`/api/telegram/connect` et `/api/telegram/status`).
  - L'utilisateur ne doit pas avoir à ressaisir le token ni à retourner dans Cloudflare pour connecter le webhook.
  - Le serveur configure le webhook auprès de Telegram avec signature secrète (`secret_token`) et rejette (403) les messages non signés via `X-Telegram-Bot-Api-Secret-Token`.
  - L'action de connexion/déconnexion est protégée par `ADMIN_PASSWORD`.

## Important pour toute IA qui reprend ce projet
- Toujours vérifier ce fichier en le comparant à la structure réelle du projet avant de s'y fier aveuglément.
- Le mot de passe admin se configure dans la section "Exécution" des variables Cloudflare, pas "Build" — c'est une source d'erreur fréquente.
- Le secret Telegram `TELEGRAM_BOT_TOKEN` est également dans la section "Exécution" de Cloudflare et ne doit jamais être exposé.
