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

- `MediaPlaybackWarning` présente la dernière erreur vidéo locale avec sa date et
  son heure (heure du club). Fermer l'avertissement efface uniquement la liste
  locale `club_media_errors`, jamais les médias ni les réglages. Une nouvelle
  erreur de lecture crée un nouvel avertissement ; ne pas désactiver le diagnostic.

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


## Calendrier des matchs « Par équipe »

- Uniquement dans la passerelle réseaux sociaux, `teamFilterEnabled && contentType === 'matches'` : une ligne par adversaire, date et domicile/extérieur de l'aller à gauche, adversaire au centre, retour à droite. Le style poster-red, les fonds, les calques, couleurs et polices existants sont réutilisés. Aucun logo adverse ajouté.
- `teamCalendarHelpers.ts` construit les paires sans modifier les rencontres : catégorie, saison (juillet à juin), compétition, poule, nom de l'adversaire avec son numéro d'équipe. Un retour suppose un sens domicile/extérieur opposé. Contexte de compétition ou adversaire inconnu : pas de regroupement incertain. Exemptions séparées.
- Les paires sont construites avant le filtre de période. Si seul le retour est dans la période, il reste à droite. Une date absente n'est pas inventée. La pagination et la capacité comptent les lignes/adversaires ; une paire ne se sépare pas entre deux affiches. Les légendes sociales globales continuent de couvrir tous les matchs filtrés.
- `TeamCalendarRows.tsx` réutilise les pastilles arrondies et le texte auto-adaptatif. Le nom de l'équipe est sous le titre personnalisable. Le même élément `cardRef` pilote aperçu, téléchargement et partage.
- Résultats, notifications, affiches du week-end et diffusion TV : présentation inchangée. Ne pas appliquer automatiquement cette organisation à ces autres vues.
- Test `scripts/test_team_calendar.ts` : regroupement, phases/poules/saisons, numéros d'équipes, doublons officiels, retour absent, période, pagination et structure rendue dans les quatre formats. Le rendu HTML serveur ne remplace pas une vérification visuelle dans le navigateur.

### Parité de composition TV / passerelle réseaux

Pour les matchs et résultats en style `poster-red`, `MatchesSlide` et `ResultsSlide`
réutilisent `VisualThemePosterRedSection` avec `contentOnly` sur le canevas TV
1920 × 1080 et le même padding que l'export 16:9. Le titre, les rangées, les tailles
et les modes de résultats ont ainsi une seule composition. Les composants TV
conservent la sélection des rencontres, les médias, les calques interactifs et leurs
événements vidéo. Ne pas réintroduire une seconde mise en page pour ces éléments.
Le test `test_tv_social_parity.ts` compare le contenu rendu, avec données fictives.

### Radio de fond TV

La liste de stations est centralisée dans `src/utils/radioStations.ts` : Radio
Paradise et les flux HTTPS MP3 officiels Fréquence 3, Gold et Dance. Source des
liens : https://www.frequence3.com/howlisten/ . Un ajout de station ne change pas
la sélection enregistrée et ne doit pas activer la radio chez les clubs existants.
Radio Swiss Pop utilise son flux MP3 officiel (page `/en/reception/internet` de
radioswisspop.ch). Radio Odyssey utilise le flux RadioKing publié dans le lecteur
de radio-odyssey.com ; sa programmation inclut des séquences de bien-être.
Les libellés des stations indiquent leur style. COTN (lounge), Chilltrax (électro
douce), Mellow Rock (rock doux) et Fréquence 3 Stroboscope (dance années 90)
complètent la liste. COTN, Chilltrax et Stroboscope utilisent les flux directs de
leurs lecteurs officiels. Le flux Mellow Rock HLS est référencé par Radio Browser
(fiche MellowRock.com, homepage mellowrock.com) et servi par indexcom.com.
`hls.js` est chargé uniquement pour cette station si le navigateur ne sait pas
lire HLS nativement. `radioHlsSource` recrée le lecteur HLS en reconnexion et le
détruit à l'arrêt ; ne jamais appeler audio.load() pendant sa lecture. Aucun
proxy ni conversion du son n'est ajouté. L'ajout des stations ne résout pas à lui
seul un éventuel problème de qualité sonore sur un appareil.

`BackgroundRadio` est monté uniquement en mode TV, hors du composant animé des
diapositives et de `VideoPlaybackBoundary`. Ne pas le remonter lors d'un changement
de diapositive ni le synchroniser sur la pause du carrousel. Les vidéos restent
muettes. Les réglages facultatifs `clubSettings.radioStationId` / `radioCustomUrl`
passent par les sauvegardes existantes ; absence de station = radio désactivée.
Le choix est dans Paramètres Carrousel & TV. Le flux est lu directement par le
navigateur (pas de proxy Cloudflare), sans lecteur visible ni volume logiciel.
Le navigateur peut exiger un geste avant le son : afficher seulement alors le
bouton d'activation. Le volume se règle sur la TV. Les erreurs réseau déclenchent
une reconnexion bornée ; quitter le mode TV ou désactiver la station libère le flux.
Les liens personnalisés doivent être des flux HTTPS directs MP3/AAC sans identifiants.
Le test `test_background_radio.ts` utilise un lecteur et des horloges simulés,
sans connexion radio ni écriture de production.

### Gestion des sponsors

Les fiches sponsors ont un champ facultatif `enabled` : absent ou true = actif,
false = conservé mais exclu de tous les passages TV et du rendu de secours.
Les boutons Désactiver/Réactiver et Supprimer sont toujours visibles, y compris
sur téléphone. La suppression demande une confirmation et retire définitivement
la fiche via la sauvegarde partagée habituelle ; elle ne supprime aucun fichier
de la banque de médias, qui peut être réutilisé ailleurs.

### Suppression physique des fichiers médias

`StoredMediaManager` dans Banques d’images → Médias → Fichiers stockés affiche
les objets R2 et les anciennes clés KV `media:` (pagination séparée, 100 par page).
La taille indiquée est celle des fichiers affichés, pas une mesure du quota ni
une garantie de gratuité. Les fichiers sans fiche restent accessibles dans la liste.
`/api/media-storage` est réservé à l’administration. DELETE exige une confirmation,
un nom de fichier plat valide et vérifie les usages sur le document partagé actuel
et les alertes actives. Les références `/uploads/` et `/api/media/` sont équivalentes.
Un média référencé, même masqué/désactivé, doit d’abord être retiré des rubriques
concernées et les réglages enregistrés. L’index `visualTemplates.mediaBank` seul ne
constitue pas une utilisation. En cas d’échec de lecture des données, suppression
refusée. Aucun nettoyage automatique ni suppression en masse.
La suppression efface l’objet R2 et son éventuelle copie KV ; seul l’index du fichier
est ensuite nettoyé par la sauvegarde habituelle du navigateur. Les sauvegardes des
réglages ne restaurent pas les octets supprimés. Les caches des navigateurs peuvent
encore garder une copie jusqu’à expiration. Le retrait depuis la bibliothèque est
une opération distincte qui ne libère pas le stockage. La démo utilise exclusivement
ses fichiers locaux, jamais le stockage d’une installation réelle.

### Sources FFBB parallèles et vérification les jours de rencontres

Le calendrier club est récupéré en parallèle depuis l’origine mobile et le REST
Desimone, avec cache limité à la synchronisation en cours. Les identifiants officiels
servent au dédoublonnage. L’identité du club, de l’engagement et le sens des équipes
restent vérifiés par l’origine officielle : aucune ligne tierce invérifiable n’est
importée. La source officielle est prioritaire ; une paire de scores Desimone
complète uniquement une paire officielle absente. Ne jamais mélanger deux demi-scores.
Si les sources échouent ou sont invérifiables, conserver les données existantes.
Les corrections manuelles, noms personnalisés, sélections TV et alertes restent
régis par les règles de fusion existantes. Une réponse vide ne retire pas un score.

Seul le déclenchement automatique (Worker scheduled et intervalle Express) est
conditionné par `isClubMatchDay` : date du club en Europe/Paris, au moins une
rencontre réelle, hors exemptions/annulations/reports. Le rafraîchissement manuel
reste disponible chaque jour. Le système s’appuie sur les dates déjà enregistrées :
un calendrier déplacé ou une rencontre nouvelle doit être récupéré manuellement
si aucun match n’était prévu ce jour-là. Aucun rattrapage nocturne hors jours de match.

Le rapprochement Excel/API accepte un engagement FFBB identique même si son libellé
de catégorie a changé, seulement avec les mêmes équipes/sens/saison et un candidat
unique des deux côtés. Un Exempt Excel peut rapprocher un adversaire API inconnu
uniquement à la même date et avec le même engagement. Une exemption explicitement
connue est conservée tant que la source ne fournit pas un vrai adversaire. Une
correspondance ambiguë n’est pas fusionnée. Les fiches API déjà présentes ne sont
pas conservées en double avec la ligne Excel adoptée ; préserver les corrections
manuelles de la fiche API existante. Aucun nettoyage direct du stockage en production.

Dans les listes Matchs et Résultats : filtre Tous / Domicile / Extérieur / Exempts,
indépendant de la période et de la présentation TV. Les exemptions n’appartiennent
ni à Domicile ni à Extérieur. Cela ne modifie aucune sélection de diffusion.

Les filtres Domicile/Extérieur de `posterDataHelpers` excluent également les
exemptions de leurs compteurs et de leurs listes (aperçus, exports et légendes).
La même exclusion s’applique aux diapositives TV séparées, dans la construction de
la liste et dans `TVSlideRenderer`. Le mode Tous et le filtre Exempts conservent
les exemptions ; aucune rencontre enregistrée ni sélection TV n’est supprimée.


### Rattrapage individuel des scores

Après fusion des calendriers, les rencontres officielles commencées sans paire de
scores sont interrogées individuellement via `ffbbserver_rencontres/{id}` avec au
plus quatre requêtes simultanées. Identité, organisme et engagement du côté club
sont vérifiés avant acceptation de deux scores numériques complets. Les rencontres
sans heure, exemptions, reports et annulations sont exclus. Un échec laisse les
données intactes. Une paire déjà enregistrée ou un score manuel arrête les appels
individuels. Les fusions et alertes existantes restent responsables de la sauvegarde.
`shouldPollFfbb` autorise également le cron les jours sans rencontre tant qu'une
rencontre officielle commencée reste sans score, y compris marquée terminée.
Aucune limite de lendemain n'est imposée ; les anciennes rencontres jamais scorées
peuvent donc rester en attente jusqu'à correction du calendrier ou réception du score.
