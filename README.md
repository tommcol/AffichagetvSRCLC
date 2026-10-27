# Affichage TV Club

Application d'affichage dynamique pour un club de basket : rencontres, résultats, anniversaires, partenaires, photos, annonces et création de visuels.

Ce dépôt est un modèle générique. Aucun calendrier réel, adhérent, sponsor, code club, adresse de production ou identifiant Cloudflare n'est fourni. Chaque club configure son identité depuis l'administration et possède son propre stockage.

## Documentation

- [Tutoriel Cloudflare pas à pas](docs/INSTALLATION_CLOUDFLARE.md)
- [Contexte de reprise pour une IA](docs/CONTEXTE_IA.md)
- [Consignes de contribution IA](AGENTS.md)
- [Historique technique générique](COMPTE_RENDU_MODIFICATIONS.txt)

## Essayer localement

Prérequis : Node.js 24 et npm.

```bash
npm install
npm run demo
```

Le mode démonstration utilise uniquement des données fictives, isolées dans `.demo-data/`. Les appels FFBB, Telegram et les publications externes y sont bloqués. L'adresse et le port sont affichés au lancement.

Pour le développement local avec persistance dans `data/` :

```bash
npm run dev
```

Ne copiez pas les données, médias ou secrets d'un club dans les fichiers versionnés.

## Configurer son club

Dans **Identité du club**, renseignez le nom, le nom court, la ville et le code FFBB de votre club. Configurez ensuite vos catégories, vos médias et vos visuels. Les rencontres et les équipes sont initialement vides. La synchronisation programmée ne fait rien tant qu'aucun code FFBB n'est enregistré.

## Déployer sur Cloudflare Workers

1. Créez vos propres ressources KV et R2.
2. Dans `wrangler.json`, remplacez `REMPLACER_PAR_VOTRE_ID_KV`, le nom du Worker et `votre-banque-medias` par vos ressources.
3. Conservez les bindings `AFFICHAGE_KV`, `AFFICHAGE_R2`, `ASSETS` et `APP_DATA_COORDINATOR`. Le Durable Object coordonne les sauvegardes.
4. Configurez les secrets d'exécution dans votre compte Cloudflare : `ADMIN_PASSWORD`, et, si utilisés, `TELEGRAM_BOT_TOKEN` et `GEMINI_API_KEY`. Configurez `APP_URL` avec votre propre adresse. `.env.example` contient uniquement des exemples.
5. Configurez le secret obligatoire `ADMIN_PASSWORD` avant publication. Suivez le tutoriel détaillé pour le premier déploiement ; ne contournez pas la validation des secrets.

```bash
npm run build
npx wrangler deploy --secrets-file .env.production
```

Un fichier `.env` n'est jamais destiné à GitHub. Masquer l'adresse d'un site dans le dépôt ne remplace pas le contrôle d'accès à son administration.

## FFBB et services facultatifs

La récupération sportive utilise le service tiers [FFBB Data Client](https://github.com/nickdesi/ffbb-data-client). Il ne s'agit pas d'un service officiel de la FFBB. La disponibilité et la complétude des réponses dépendent du fournisseur ; un succès réseau ne garantit pas un calendrier complet. Les données déjà enregistrées doivent rester conservées lors d'une indisponibilité.

Telegram et la génération de légendes sont facultatifs. Ne publiez aucun jeton, webhook privé, identifiant de compte ou mot de passe dans le dépôt.

## Vérifier le projet

```bash
npm run lint
npm run lint:worker
npm run build
npm test
```

Les tests automatisés ne remplacent pas les contrôles visuels du carrousel et des exports. L'export MP4 n'est pas pris en charge.

## Partager une installation personnalisée

Conservez les réglages du club dans son stockage applicatif, jamais dans les valeurs par défaut du code. Publiez une copie générique avec un nouvel historique si le dépôt d'origine contenait des informations personnelles. Les anciennes branches, commits, discussions, pièces jointes et copies externes ne sont pas nettoyés par la modification des fichiers actuels.
