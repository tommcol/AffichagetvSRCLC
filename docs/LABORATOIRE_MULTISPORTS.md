# Essais multisports — laboratoire uniquement

Le bouton « Essais autres sports » du bandeau du laboratoire ouvre une fenêtre de lecture indépendante. Les matchs, résultats, équipes, médias et paramètres FFBB existants ne sont jamais remplacés. Aucune sauvegarde partagée ni import dans le carrousel n'est effectué. Fermer la fenêtre libère les données reçues. Pas de cron, compte tiers, publication ni abonnement ajouté.

## Sources étudiées

- **Football** : API JSON utilisée par le site FFF, `https://api-dofa.fff.fr/api/clubs/{cl_no}/calendrier`. Référence de découverte : https://github.com/GeoHolz/Open-FFF-Stats ; implémentation indépendante. Le numéro interne `cl_no` diffère du numéro d'affiliation. La réponse peut être partielle. L'appartenance au club est vérifiée par identifiants ; les lignes invérifiables sont écartées. Un résultat requiert deux scores, une date passée et un statut terminé explicite. Un 403 est un échec affiché, jamais une liste vide de remplacement. Aucun contournement de protection.
- **Handball** : données structurées publiques rendues sur les pages d'équipe `https://www.ffhandball.fr/competitions/…/equipe-…/`. Le site ne fournit pas de contrat public stable. Lecture des blocs `poule-selector` et `rencontre-list` inclus dans la page ; ni jeton ni décodage d'une réponse protégée. Une équipe est suivie par son identifiant fédéral interne. Référence de découverte du format : https://github.com/prohand/gladys-ffhandball ; aucun code de ce projet n'est embarqué.
- **Volley** : calendrier HTML public FFVolley `https://www.ffvbbeach.org/ffvbapp/resu/vbspo_calendrier.php`, paramètres `saison`, `codent`, `poule`, `calend=COMPLET`. Lecture des colonnes publiques match/date/heure/équipes/sets. Les points par set, arbitres et joueurs ne sont pas importés. Choix exact de l'équipe dans la poule. Référence officielle : https://www.ffvbbeach.org/ffvbapp/resu/vbspo_home.php . Le service tiers https://volleyballcalendar.de-latte.fr/ a été étudié, mais n'est pas une dépendance.

Ces interfaces peuvent changer sans préavis. Ce sont des connecteurs expérimentaux à des données publiques, pas une garantie d'accès ou de couverture des calendriers complets. Respecter les conditions des fédérations avant une diffusion publique élargie.

## Utilisation

1. Choisir le sport. Coller le lien de l'équipe handball, celui de la poule volley, ou saisir le numéro interne FFF.
2. Charger, puis sélectionner l'équipe et éventuellement une période.
3. Basculer entre rencontres sans résultat et résultats confirmés. Les rencontres sans date restent dans la liste mais sont exclues de l'affiche.
4. Choisir le modèle et le format, parcourir les pages puis télécharger le PNG.

Le même `GraphicTemplateRenderer` et le même exporteur que le nouveau studio sont réutilisés. Les dix bases et les modèles enregistrés au laboratoire sont disponibles en lecture. Pas de logo importé automatiquement, de police nouvelle ni de modification des modèles ici. Notre équipe reste à gauche, les scores sont inversés visuellement quand elle joue à l'extérieur ; les données officielles restent inchangées. Les égalités et les scores de sets 0–3 sont conservés. Les heures 00:00 sont présentées comme à confirmer.

## Isolation et limites techniques

`GET /api/lab/sports?sport=…&source=…` fonctionne seulement si `APP_DEMO=1`. Hors laboratoire : 404. Autres méthodes : 405. Hôtes et chemins fédéraux limités, redirections interdites, aucune propagation de cookie ou secret. Délai de 18 secondes et réponse limitée à 2 Mo. Les réponses réussies sont conservées cinq minutes dans le cache du Worker de test ; l'heure de lecture apparaît. Aucun stockage dans `app-data`, KV ou R2. La console locale indique les succès et les échecs sans copier les données des réponses.

Le mode Express `npm run demo` conserve son blocage du réseau externe : l'interface fonctionne mais la lecture réelle doit être essayée dans le Worker de laboratoire. Les tests automatisés utilisent des réponses fictives explicitement identifiées. Les rencontres réelles servent uniquement aux essais ponctuels et ne sont pas codées en dur.

Pas encore de synchro programmée multisports, d'agrégation de toutes les équipes d'un club handball/volley, de branchement des alertes/Telegram/TV, ni de pagination FFF complète. Une panne de fédération ne modifie aucune donnée existante.
