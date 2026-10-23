# Reprise des corrections et validation — 23 octobre 2026

## Périmètre

Branche `fix/audit-src-2026-10-23`, après le commit `1f37845831ef03dbf8b1871385f9c0c7f7478f56`.
Aucune modification de production, aucun déploiement, aucune suppression dans une banque du club.

Les essais interactifs utilisent une **copie isolée**, des seniors fictifs, des anniversaires adultes fictifs, des images SVG et des vidéos locales de test. FFBB, Telegram et la publication externe y sont bloqués. Le superviseur d’aperçu Sites donne accès à cette copie dans Chrome via `http://terminal.local:4173/`. L’autorisation du nom d’hôte est limitée à la configuration de cette copie ; elle ne change pas celle de production.

## Défauts repris après l’audit réel

| Défaut | Correction | Vérification |
|---|---|---|
| N01 — Le PNG diffère de l’aperçu | Instantané du document avec ses styles calculés, intégration des polices sans imposer un format susceptible d’écarter une police ; aucune image vide utilisée pour cacher un échec de ressource. | PNG réellement téléchargés et ouverts : 2, 3 et 4 matchs, dans les 4 ratios. Noms longs conservés dans les bulles. |
| N02 — Sortie du studio pendant l’export | Capture indépendante de l’éditeur avant toute attente asynchrone ; nettoyage après succès ou erreur. | Sortie vers un autre onglet pendant « Génération… » ; le PNG final conserve les deux rencontres. |
| N03 — Aperçu anniversaire sur une semaine différente de la TV | Le studio reçoit la collection de la semaine courante, distincte de la collection consultée. Indication explicite au-dessus du studio. | Consultation d’Alex Démo en semaine suivante ; le studio continue de montrer Camille Démo de la semaine courante. |
| N04 — Historique, période et diffusion confondus | Libellés de sélection et calendrier clarifiés. La consultation « toute la saison » utilise uniquement le mode de liste : elle ne vide plus les dates TV. | Six rencontres consultables ; seules les deux du week-end suivant dans le studio. Un résultat historique reste enregistré mais l’aperçu de la nouvelle période est vide. |
| N05 — Invitation à réimporter les licenciés sur une semaine vide | Message d’absence d’anniversaire sans prétendre que le fichier manque. | Rendu réel du composant contrôlé par test de régression. |
| N06 — « Ce week-end » sur une longue période | Formulations adaptées aux sélections par équipe/période, sur les trois plateformes et pour matchs/résultats ; texte personnalisé préservé. | Sélection réelle des 24 et 30 octobre ; légende sur la période sélectionnée. Tests des trois styles et plateformes. |

Autres défauts repérés pendant la reprise et traités :

- Story et carré : les cartes utilisent désormais la largeur complète, au lieu de deux colonnes qui rendaient les noms illisibles.
- Les boutons « Cocher pour la TV » subsistaient dans la vue au calendrier replié : ils sont retirés pour matchs et résultats.
- Les alias de visuels n’ajoutent plus de fausses équipes au test de largeur lorsqu’une liste FFBB officielle existe ; aucun alias Telegram n’est supprimé.
- Les légendes de notifications ne fabriquent plus un score 78–72 quand il est inconnu et ne parlent plus d’une victoire lors d’une défaite.
- L’aide au déplacement des calques est placée sous l’aperçu au lieu de recouvrir le titre.
- Le « (0) » du raccourci « Semaine actuelle » était un décalage de semaine, facilement pris pour un nombre d’anniversaires : supprimé du libellé.
- Les messages de liste vide précisent désormais « pour cette période » plutôt que de laisser croire que toute la base est vide.
- Les calques d’affiche respectent leur activation et la condition de victoire. Les vidéos sont lues dans l’aperçu et figées sur leur image courante lors de l’export PNG ; un média non chargé provoque un message explicite. Un export avec fond vidéo de 5 s, calque vidéo de 2 s et calque désactivé a été téléchargé et ouvert depuis le client compilé.
- Les légendes détectent également une période du calendrier située hors du week-end courant, même sans passer par le mode Par équipe.

## Relecture des 34 décisions

Les statuts distinguent les manipulations de navigateur des tests techniques et des vérifications qui nécessitent encore le matériel ou le service réel.

| Point | État vérifié |
|---|---|
| 1 — Aperçu et période | Navigateur : passage au week-end suivant, aperçu limité aux 30/31 octobre. |
| 2 — Formats et noms | Navigateur et fichiers téléchargés : 12 combinaisons 2/3/4 matchs × 4 formats, dimensions natives et inspection visuelle. |
| 3 — Bascule des anniversaires | Tests techniques d’horloge Europe/Paris et changement d’heure ; pas d’attente réelle du lundi à minuit. |
| 4 — Retour de TV | Navigation TV/admin exécutée ; dates et données de sélection conservées. |
| 5 — Plein écran | Commandes et cadre 16:9 essayés lors de l’audit réel ; pas de MiBox physique. |
| 6 — Aperçu Victoire | Média configuré lu lors de l’audit réel ; pas d’alerte du club déclenchée. |
| 7 — Titres | Domicile/Extérieur/Tous essayés sur les matchs ; tests techniques des mêmes règles pour résultats et titres personnalisés. |
| 8 — Historique ignoré | Tests techniques du cron et du suivi avec stockage fictif ; aucune équipe réelle décochée. |
| 9 — Noms personnalisés | Tests techniques de synchronisation fictive. |
| 10 — Match sans score / reprogrammé | Tests techniques et statuts d’attente observés ; pas de score réel modifié. |
| 11 — Vidéo masquée | Navigateur : défaite avec calque réservé aux victoires ; zéro vidéo montée en TV, défilement suivant sans blocage. |
| 12 — Pause | Navigateur : fond de 5 s et calque de 2 s figés à environ 1,020 s pendant 6 s, puis reprise au même instant. |
| 13 — Vidéo absente | Navigateur : média fictif absent, passage aux contenus suivants ; diagnostic lisible dans l’administration du même navigateur. |
| 14 — Sauvegardes concurrentes | Tests techniques du coordinateur transactionnel et des conflits ; migration et simultanéité réelles Cloudflare non validées. |
| 15 — Actualisation TV | Deux onglets : nom court fictif modifié dans l’administration, repris sans rechargement sur une TV ouverte au passage de slide suivant le polling. |
| 16 — Logos adverses | Fonction retirée dans le code ; logos du club et banque conservés. |
| 17 — Sauvegarde automatique | Réglages fictifs enregistrés, relus dans un second onglet et repris par le polling TV ; états enregistrement/enregistré observés. |
| 18 — Calendrier et cases individuelles | Décochage successif 4 → 3 → 2 effectué ; suppression des commandes groupées y compris calendrier replié. |
| 19 — Garder les panneaux | Décision de ne pas les simplifier respectée ; les quatre calques et leurs réglages restent disponibles. |
| 20 — Aperçu logos | Vidéo de logo réellement lue dans sa fenêtre lors de l’audit réel. |
| 21 — Liste de test d’équipes | Liste officielle utilisée sans les variantes provenant des visuels ; reconnaissance Telegram conservée. |
| 22 — Comptes sociaux | Aucun compte inventé par les légendes ; champs officiels vides conservés. |
| 23 — Retirer le test Telegram | Simulateur absent de l’interface ; connexion et état du bot conservés, aucun message envoyé. |
| 24 — Environnement isolé | Démarrage local ET interface dans Chrome obtenus avec une copie fictive. |
| 25 — Compteurs | Total de période / sélection TV / total enregistré distingués ; consultation d’historique indépendante des dates TV. |
| 26 — Zéro sélection | Tests techniques et essai réel d’export vide lors de l’audit : message explicite et absence de repli sur toute la saison. |
| 27 — Lecture partielle des médias | Tests du Worker simulé : plages, réponses 206 et cas invalides ; pas de mesure R2/MiBox en production. |
| 28 — Authentification | Tests techniques des mauvais mots de passe, cookie signé et écritures protégées ; secret Cloudflare de production non changé. |
| 29 — Route POST | Test du vrai routeur Worker sur stockage fictif. |
| 30 — Consultation des anniversaires | Semaine suivante consultée sans modifier la collection TV ; aperçu de la semaine courante vérifié. |
| 31 — Durée vidéo | Navigateur : vidéo courte terminée à 2 s ; même slide encore visible à 4,905 s de la vidéo longue ; passage suivant après sa fin à 5 s. |
| 32 — Synchronisations inutiles | Tests techniques des réponses inchangées et répétées ; aucun appel FFBB manuel de production. |
| 33 — Résultats hors période | Navigateur : historique conservé, aperçu vide sur la nouvelle période ; tests de rendu de deux périodes remplies. |
| 34 — Tous / Séparé | Deux choix conservés, titres indépendants et navigation d’aperçu Domicile / Extérieur. |

## Vérifications automatisées

`npm run lint`, `npm run lint:worker`, `npm run build`, `SRC_DEMO=1 npm test`.
La suite `test_audit_followup.ts` ajoute les régressions de période, de notifications sans score, de collections anniversaire distinctes et de disposition des cartes. Résultat final : **47/47 suites réussies**. Le lint TypeScript, le lint du Worker et la compilation ont réussi. Le test historique de légendes utilise désormais une date du week-end courant, au lieu de dépendre d’une date fixe passée.

## Limites restantes

Ce document ne constitue pas une validation en production de la migration Cloudflare du coordinateur de données. La reprise doit être répétée sur une copie du stockage Cloudflare avant un déploiement. L’authentification réelle dépend du secret déjà configuré. Pas de publication sociale, de Telegram réel, de synchronisation FFBB réelle ni de test d’endurance sur MiBox. L’export MP4 est hors périmètre.

La branche reste une proposition de corrections ; aucune fusion de `main` ni opération Cloudflare n’a été réalisée dans cette reprise.
