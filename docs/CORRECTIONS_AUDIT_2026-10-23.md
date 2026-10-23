# Corrections validées avec le responsable du club — 23 octobre 2026

> État après les essais réels et la seconde passe : voir [VALIDATION_REPRISE_2026-10-23.md](VALIDATION_REPRISE_2026-10-23.md). L’accès navigateur à une copie isolée est désormais obtenu ; les anciennes limites et résultats ci-dessous décrivent la première passe, pas la validation finale.

Branche : `fix/audit-src-2026-10-23`. Base : `0922561c1994e8ccca58dcb9e61f58fd0b15879c`.
Aucun changement de production ou déploiement n'est réalisé par ce chantier.

## Décisions et réalisation

| Point | Décision retenue | Réalisation dans la branche |
|---|---|---|
| 24 — à faire en premier | Faire démarrer une copie isolée | Dossier local manquant défini ; `npm run demo` crée uniquement des seniors fictifs, utilise `.demo-data`, bloque FFBB, Telegram et la publication ; les imports de médias restent locaux. |
| 1 | L'aperçu doit suivre la période | Filtrage commun calendrier / studio / affiche / TV. |
| 2 | PNG identique à l'aperçu ; tailles adaptées | Intégration des polices, attente des médias, ajustement des noms à leurs dimensions mesurées ; conservation du dimensionnement 2 > 3 > 4 matchs. Vérification visuelle finale encore requise. |
| 3 | Anniversaires : nouvelle semaine lundi 00 h française | Calcul au chargement et à la transition de semaine selon Europe/Paris ; une semaine vide reste vide. |
| 4 | Garder le filtre après retour de TV | Retour en mode liste filtrée, restauration des dates depuis les réglages partagés. |
| 5 | Aperçu plein écran 16:9 | Suppression de Taille réelle et réutilisation du plein écran existant ; proportions conservées ; sortie Échap. |
| 6 | Corriger l'aperçu Victoire uniquement | Utilisation des médias communs/équipe configurés ; message en cas d'image indisponible. Aucun changement des médias enregistrés. |
| 7 | Titres selon Domicile / Extérieur / Tous / Par équipe | Libellés explicites pour matchs et résultats ; nom de l'équipe ; priorité au titre personnalisé. |
| 8 | Garder l'historique d'une équipe non suivie | Arrêt du filtrage destructif dans le cron et dans les commandes de suivi administrateur. |
| 9 | Garder les noms personnalisés | Application des correspondances aux rencontres nouvelles et existantes dans le cron. |
| 10 | Match passé sans score : attendre le résultat ; match reprogrammé : à venir | Statut temporel recalculé ; correction du format d'heure dans le cron ; aucun score inventé. |
| 11 | Un calque désactivé ne bloque pas | Pilotage vidéo par les éléments réellement montés ; correction de l'ordre des hooks lors de l'activation d'un calque. |
| 12 | Pause / reprise vidéo et défilement | Pause de tous les médias présents ; reprise sans remise à zéro ; temps déjà écoulé conservé pour les images. |
| 13 | Continuer si une vidéo ne démarre pas | Détection d'erreur et délai de 8 s sans progression ; diagnostic local consultable en administration sur cet appareil. |
| 14 | Éviter l'écrasement entre sauvegardes | File de sauvegarde côté navigateur ; coordinateur transactionnel partagé admin / cron / Telegram ; conflit explicite. |
| 15 | Reprendre aussi logos et réglages sur une TV ouverte | Instantané complet reçu par polling et appliqué au passage suivant, sans remplacer une vidéo pendant sa lecture. |
| 16 | Retirer les logos adverses | Recherche, cache actif et commandes retirés ; aucun logo adverse rendu ; anciennes données conservées pour compatibilité. Logo du club et sponsors préservés. |
| 17 | Enregistrement automatique clair | État en cours / enregistré / échec ; protection contre la fermeture pendant une écriture ou une erreur ; erreur HTTP ou JSON explicitement traitée. |
| 18 | Calendrier puis cases individuelles, sans boutons groupés | Choisir une nouvelle période complète sélectionne ses rencontres ; décochage individuel conservé ; doublons de sélection groupée retirés pour matchs/résultats. |
| 19 | NE PAS simplifier les panneaux de calques | Tous les réglages techniques restent disponibles. Aucun panneau Options avancées ajouté. |
| 20 | Lire les vidéos de la banque de logos | Bouton Lire l'aperçu ; fenêtre avec contrôles ; fermeture Échap. |
| 21 | Une entrée par équipe dans les tests Victoire/Défaite | Liste issue des équipes canoniques ; conservation des alias Telegram et des identités FFBB. |
| 22 | Pas de compte social inventé | Mention Instagram uniquement si renseignée. |
| 23 | Retirer le test Telegram | Simulateur retiré de l'interface ; connexion, état et réception du bot préservés. |
| 25 | Compteurs explicites | Total de la période, sélection TV et total conservé distincts. |
| 26 | Zéro coché = aperçu vide | Fin du repli automatique sur toute la saison ; message de sélection vide, téléchargement vide refusé. |
| 27 | Charger les vidéos par morceaux | Réponses HTTP 206 / Content-Range, suffixes, plages invalides et HEAD pour les médias. |
| 28 — fin du chantier | Vérifier le vrai contrôle du mot de passe | Validation serveur et cookie signé HttpOnly ; écritures protégées si ADMIN_PASSWORD est configuré ; diffusion publique conservée. |
| 29 | Corriger l'accès d'enregistrement incohérent | GET et POST /api/app-data suivent leurs méthodes respectives. |
| 30 | Consultation des anniversaires indépendante de la TV | Navigation de semaine et Afficher tous purement locaux ; diffusion calculée depuis les licenciés de la semaine courante. |
| 31 | La vidéo visible la plus longue fixe la durée | Coordination des vidéos effectivement présentes ; les vidéos courtes ne coupent plus les longues. |
| 32 | Réduire les sauvegardes / synchronisations inutiles | Fin des appels FFBB attachés à chaque slide ; absence de réécriture des données inchangées ; garde anti-chevauchement dans une instance ; conflits inter-instances protégés par le coordinateur. |
| 33 | Pas d'anciens résultats dans une nouvelle période TV | Même sélection de dates utilisée pour construire puis rendre la boucle. |
| 34 | Deux choix : Tous / Séparé, pour matchs et résultats | Réglage existant déplacé au-dessus de l'aperçu ; mêmes données enregistrées et diffusées ; navigation d'aperçu Domicile/Extérieur uniquement en mode séparé. Pas de nouvelle pagination imposée. |

## Environnement de test

- `npm run demo` : données fictives dans `.demo-data` (non versionné), aucun accès aux fichiers de données du club.
- `npm run lint`, `npm run build`, `npm test`.
- Le lanceur de tests utilise Node + tsx sans canal IPC spécifique ; les suites s'exécutent dans des processus séparés.
- Contrôle supplémentaire du Worker : `node_modules/.bin/tsc --noEmit --types @cloudflare/workers-types --lib ES2022 --module esnext --target es2022 --moduleResolution bundler --skipLibCheck worker/index.ts`.
- Résultat de la dernière exécution : 46 suites réussies sur 46. Compilation et vérifications TypeScript frontend/Worker réussies.
- Nouvelles régressions : deux périodes seniors, rendu HTML TV sans mélange, aucune sélection, titres personnalisés, quatre ratios, passage au lundi en France (y compris changement d'heure), historique ignoré, noms personnalisés, absence de score, synchronisation inchangée, concurrence, authentification et lecture partielle vidéo.

## Mise en ligne : conditions à vérifier avant toute fusion

Le point 14 nécessite le binding `APP_DATA_COORDINATOR` et sa migration SQLite, présents dans `wrangler.json`. Le coordinateur initialise son document depuis la clé KV existante sans supprimer l'historique, puis sérialise toutes les écritures. Les données sont découpées en morceaux internes pour ne pas réduire la taille des documents acceptés. KV reste un miroir compatible ; aucun nouvel abonnement ou secret n'est créé par le code. La migration doit être répétée sur une copie avant un futur déploiement ; conserver un export de sauvegarde avant la bascule.

`ADMIN_PASSWORD` active la protection. Si le secret est absent, l'installation reste en mode de préparation ouvert ; aucun mot de passe n'est créé ou modifié dans ce chantier. Les secrets Telegram et IA restent côté serveur.

## Limites de validation

Le serveur démarre et ses API ont été utilisées sur la copie fictive (enregistrement puis relecture et refus des appels externes). Le navigateur Cloud distant ne peut pas atteindre localhost dans cet environnement : connexion refusée. Les rendus SSR contrôlent le HTML et les périodes mais ne constituent pas une validation visuelle. Le PNG final, les interactions de calques et l'enchaînement réel des vidéos doivent encore être contrôlés dans un navigateur relié à cette copie, puis sur MiBox. Aucune validation visuelle après correction n'est prétendue, aucune capture de production n'est présentée comme une capture du code corrigé.

L'export MP4, la refonte graphique et la simplification des panneaux refusée au point 19 sont hors périmètre.
