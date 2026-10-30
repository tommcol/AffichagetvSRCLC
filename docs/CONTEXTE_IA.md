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

### Ordre des équipes sur les affiches

Les affiches poster-red (aperçu/export et rendu TV correspondant) présentent toujours
notre catégorie à gauche dans la bulle rouge, l'adversaire à droite et l'heure ou le
score au centre. La date seule est centrée au-dessus de la rencontre ; l'heure ne
figure plus à côté de la date. Le lieu reste indiqué par l'icône domicile/extérieur.
`getClubFirstMatchPresentation` ordonne les libellés et scores pour l'affichage sans
modifier les champs officiels teamHome/teamAway/homeScore/awayScore. Pour un match à
l'extérieur, le score affiché est donc awayScore puis homeScore. Le test
`test_club_first_posters.ts` contrôle les 4 formats, domicile/extérieur et le rendu TV.


## Synchronisation FFBB — origine mobile (2026-10-30)

- `src/utils/ffbbMobileApi.ts` : adaptateur **serveur uniquement**, méthode d'accès documentée par ffbb-data-client v2.4.42. Pas de dépendance Python dans le Worker.
- `worker/ffbb.ts` et `server/ffbbDataHelpers.ts` réutilisent leurs transformations et mécanismes de conservation existants, avec cette source en priorité.
- Configuration publique à la demande, jeton conservé seulement dans la fermeture de la synchronisation. Aucun jeton FFBB dans les données, journaux, réponses au navigateur ou dépôt.
- Poules déduites de tous les engagements, pagination des rencontres, filtre sur les identifiants de club et d'engagement, dédoublonnage par identifiant de rencontre. Les phases ne créent pas de nouvelles équipes locales : conserver `ffbbTeamGrouping`.
- Repli sur REST tiers si indisponible ; `source: ffbb_mobile` ou `ffbb_api_desimone`, `degraded` indique le repli. Ne pas importer cet adaptateur dans les composants/navigateurs.
- Le navigateur refuse les calendriers externes non vérifiés. Les tests de récupération ne doivent jamais appeler la route de synchronisation de production, car elle peut mettre à jour les alertes.
- `scripts/test_ffbb_mobile_api.ts` utilise uniquement des données fictives et vérifie phases, filtres, pagination, scores, confidentialité des jetons et échecs.


## Un seul club sportif actif

- `ffbbClubScope.ts` prépare la synchronisation après succès, compare l'identifiant canonique `clubSettings.ffbbDataClubId` (les alias code/ID du même club ne sont pas un changement). Les nouvelles rencontres portent `ffbbClubId`.
- Le champ code de l'administration est un brouillon partagé entre Identité et Sync FFBB. Il n'est enregistré qu'avec les nouvelles collections récupérées. Réponse obsolète après changement du brouillon : abandon sans remplacement. Erreur : ancien club conservé. Nouveau club vide mais vérifié : remplacement permis. Nouveau club en mode dégradé : refus.
- Même club : fusion et historique conservés. Nouveau club : repartir de collections et équipes vides, réinitialiser les noms personnalisés et catégories ignorées, conserver toutes les données non sportives et les médias. Le nom/nom court suit l'identité officielle ; le logo personnel est conservé.
- Avant remplacement, `commitSharedAppData` et le stockage local créent une sauvegarde privée des collections sportives. Ne pas écrire directement dans le KV de production en court-circuitant le coordinateur.
- Les anciens identifiants non marqués sont vérifiés via `inspectMembership`. Les `foreignMatchIds` sont prouvés étrangers, les `verifiedMatchIds` reçoivent leur propriétaire. Absence de réponse, match inconnu, manuel ou Excel : pas une preuve de suppression. Échec de la vérification : historique conservé et avertissement dans l'administration.
- Tous les matchs renvoyés sont conservés, même pour une équipe décochée ; les cases des équipes pilotent uniquement la diffusion.
- La réparation des anciennes catégories écrites comme des noms de clubs s'applique uniquement aux rencontres retrouvées officiellement ; conserver les vrais noms personnalisés. Compétition sans catégorie (ex. coupe) : catégorie générique d'engagement, jamais un club adverse comme nom d'équipe locale.
- Tests : `test_ffbb_club_scope.ts` et fixtures mobiles isolées. Ne jamais versionner les données ou identifiants de l'installation réelle dans les fixtures.

### Cas incomplets des anciennes rencontres

`inspectMembership` distingue un champ d'organisme absent/inexploitable (preuve
insuffisante, conserver) d'un `null` explicite (aucun club de ce côté). Une rencontre
avec un seul club renseigné est étrangère si ce club ne correspond pas au club actif ;
une rencontre avec notre club et un côté vide reste conservée. Deux côtés nuls ne
suffisent pas pour retirer une rencontre. Les anciennes catégories identiques au nom
officiel de notre club avec suffixe d'équipe sont également réparées lorsque la
catégorie FFBB est déjà connue, même si la rencontre possède déjà `ffbbClubId`.
Les noms personnalisés explicitement configurés restent prioritaires.
