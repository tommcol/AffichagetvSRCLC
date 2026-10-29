# Reprendre le projet avec une IA

À fournir à l'assistant IA en complément de `AGENTS.md` et du README.

## Objectif

Maintenir une application générique d'affichage TV pour des clubs de basket. Ne pas reconstruire le projet. Aucun club, domaine, compte Cloudflare, média personnel, code FFBB ou secret ne doit être codé en dur.

## Architecture

- React / TypeScript / Vite / Tailwind pour l'interface.
- `src/App.tsx` orchestre les données et les modes administration / TV.
- `src/components/Admin/AdminPanel.tsx` et ses sections gèrent l'administration.
- `StudioGraphiqueWorkbench.tsx` et `VisualExporterModal.tsx` gèrent les calques, les aperçus et les images PNG.
- `src/components/slides/` contient les rendus TV.
- `src/utils/` contient les règles de périodes, anniversaires, listes de diffusion, médias, exports et sauvegardes. Réutiliser ces modules.
- `worker/index.ts` route les API Cloudflare ; les modules Worker gèrent les médias, FFBB, Telegram, l'IA et le stockage.
- Les écritures partagées utilisent le coordinateur Durable Object (`worker/appDataCoordinator.ts`). Ne pas le contourner.
- KV conserve les données et alertes ; R2 conserve les médias. Chaque installation possède ses propres ressources.
- Express (`server.ts`) sert au développement local. `npm run demo` isole les données fictives et bloque les services externes.

## Comportements à préserver

- Distinguer l'historique enregistré et les rencontres réellement diffusées pendant la période sélectionnée.
- Réglages de présentation Tous / Séparé indépendants pour matchs et résultats.
- Titres domicile / extérieur / tous conservés lors des changements de présentation.
- Respect des cases individuelles de diffusion.
- Anniversaires de la semaine calculés selon l'heure du club.
- Préserver les noms personnalisés et les corrections manuelles lors des imports.
- Aperçus et exports adaptés au format choisi et au nombre de rencontres.
- Respect des calques masqués et des conditions victoire / défaite.
- Lecture et durée des vidéos prises en compte dans le carrousel ; l'export MP4 n'est pas disponible.
- Pas de logos adverses ni de bouton de test Telegram à réintroduire.

## Limites des services

Le service tiers FFBB peut fournir un calendrier partiel. Une liste vide ne prouve pas l'absence de rencontres. Ne jamais inventer de scores ni effacer l'historique pour compenser une réponse incomplète.

## Méthode de travail

1. Lire les instructions existantes, rechercher les fonctionnalités déjà présentes et définir un périmètre limité.
2. Tester dans une copie isolée, avec données fictives.
3. Exécuter les vérifications du README et contrôler réellement les interfaces concernées.
4. Distinguer résultats observés, tests techniques, hypothèses et éléments non testés.
5. Ne pas déployer, modifier une installation réelle, envoyer des messages ou publier de contenu sans instruction explicite.
6. Expliquer les changements simplement ; ne jamais annoncer une validation non effectuée.

## Documents à consulter

- `AGENTS.md` : règles de contribution.
- `README.md` : présentation et commandes.
- `docs/INSTALLATION_CLOUDFLARE.md` : installation dans le compte du club.
- `COMPTE_RENDU_MODIFICATIONS.txt` : historique technique générique, à confronter au code actuel.
- `docs/VALIDATION_VERSION_GENERIQUE.md` : portée des vérifications de cette version.

### Paramètres privés de déploiement

Le script `scripts/configure-cloudflare.mjs` génère `wrangler.private.json` hors des
assets et ignoré par Git. Lire le chapitre dédié dans INSTALLATION_CLOUDFLARE.md.
Les identifiants viennent des variables de compilation DEPLOY_*, jamais du dépôt.
Préserver le repère de migration et le nom d'instance transactionnelle existants.
Le Worker accepte `APP_DATA_INSTANCE_NAME` et `TELEGRAM_SECRET_SUFFIX` pour assurer
la continuité des installations antérieures ; leurs valeurs ne doivent pas être
codées en dur. La préparation ne constitue ni un déploiement ni une sauvegarde.

### Équipes FFBB et phases de championnat

L'administration utilise `groupFfbbTeams` pour présenter une seule fiche par catégorie
structurée, sexe et saison lorsqu'elle est fournie. Les engagements FFBB sont conservés
dans `engagementIds`, l'identité enregistrée est stable et le nom personnalisé est
préservé. Le niveau de division et la phase ne définissent pas une nouvelle équipe.
Les catégories non structurées restent séparées : aucun rapprochement hasardeux.
Les matchs/résultats ne sont ni supprimés ni réécrits par ce regroupement. Les réglages
de suivi restent pilotés par la catégorie. Les données FFBB doivent appartenir au club
et à la saison sélectionnés ; sans saison fournie, le helper ne peut pas la déduire.

### Import de secours du calendrier FFBB

Dans Matchs, `CalendarImportModal` lit les exports Excel/CSV FFBB via la dépendance
XLSX déjà présente (chargée à la demande). `excelMatchParser` valide les lignes,
propose les catégories et permet de choisir le club/les équipes avant confirmation.
Aucune écriture lors du choix du fichier ni de l'annulation. Les nouvelles rencontres
sont décochées pour la TV ; leur sélection se fait dans la liste habituelle.
Une ligne de coupe sans catégorie déductible demande un choix explicite. Les forfaits
et lignes invalides doivent être vérifiés et décochés avant validation.
Les rencontres avec deux scores valides vont dans Résultats.

`calendarImportIdentity` prépare la reprise Excel → API, utilisée dans la synchro
manuelle et les tâches automatiques locale/Worker. Les noms d'équipes sont nettoyés
sans changer les noms personnalisés. Le numéro court de l'export n'est jamais utilisé
comme identifiant API global. L'identité d'import conserve compétition, saison et
équipes pour les réimports. La reprise API préfère catégorie/équipes/sens/date ; si
la date change, elle n'utilise le couple saison/équipes que si le rapprochement est
unique dans les deux listes. Elle neutralise les marqueurs manuels de la rencontre
Excel pour laisser l'API prioritaire, mais conserve le choix TV et l'identité d'import.
Un nouvel import ne remplace pas une rencontre déjà prise en charge par l'API.
Une réponse vide de l'API n'efface rien. Si plusieurs confrontations sont ambiguës,
ne jamais fusionner au hasard : elles restent distinctes et nécessitent vérification.
Les noms officiels et la catégorie doivent permettre le rapprochement ; aucune
promesse de rapprochement automatique si la source fournit des noms incompatibles.

Tests dédiés : `test_excel_match_import.ts` et `test_excel_api_cron.ts` avec clubs
fictifs exclusivement. Ne jamais versionner les exports réels d'un club.
