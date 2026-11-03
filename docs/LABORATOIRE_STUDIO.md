# Laboratoire du studio

Cette branche part de la version principale existante. Le nouveau studio est repris uniquement dans ce laboratoire, après autorisation explicite. L’objectif est de tester les prochaines modifications avant de décider de leur intégration.

## Séparation obligatoire

- Une branche GitHub dédiée et un Worker Cloudflare distinct pour le laboratoire.
- Un espace KV neuf, un bucket R2 neuf et un espace Durable Object propre au Worker de test.
- Aucune copie des données, médias, secrets ou connexions du club.
- Les changements de cette branche doivent être exclus des déclencheurs de compilation du Worker habituel.
- La fusion dans la branche principale reste une décision explicite après validation.

## Configuration privée de la copie de test

Le générateur de configuration accepte `DEPLOY_DEMO=1` pour un Worker dont le nom finit par `-test`. Il active alors `APP_DEMO=1`, retire les tâches planifiées et permet un laboratoire public sans mot de passe administrateur obligatoire. Les autres variables `DEPLOY_*` doivent désigner exclusivement les nouvelles ressources du laboratoire. Les identifiants restent dans les variables privées de Cloudflare, jamais dans cette branche.

L’API bloque Telegram, génération IA et publication sociale lorsque `APP_DEMO=1`. FFBB reste désactivée par défaut. `DEPLOY_DEMO_FFBB=1` autorise explicitement la lecture des rencontres et la recherche FFBB pour tester un vrai code club ; les sauvegardes restent exclusivement dans le laboratoire, sans cron ni modification de la FFBB. Le diagnostic FFBB et les requêtes FFBB autres que GET restent bloqués. Les sauvegardes, médias, aperçus et exports de la copie restent utilisables. Une bannière « LABORATOIRE » permet d’identifier l’environnement. Les propriétés d’authentification de l’installation habituelle ne sont pas modifiées.

La copie est publique et modifiable pour les essais : n’y mettre aucune donnée personnelle, aucun vrai secret ni document privé.

## Données fictives

`scripts/studioDemoData.ts` produit un club fictif, six rencontres seniors sur deux week-ends, deux résultats, un anniversaire, un sponsor, un logo et une image de démonstration. Les visuels SVG sont autonomes. Cette graine initialise uniquement un stockage neuf avant son premier démarrage ; ne jamais l’envoyer dans un stockage existant ni l’appliquer à la production.

## Utilisation

1. Ouvrir l’adresse du laboratoire, vérifier la bannière et le nom « Club Démonstration ».
2. Tester les menus, filtres, affiches et sauvegardes avec ces données fictives.
3. Préparer les changements de studio uniquement sur cette branche.
4. Examiner ensemble le rendu et les fichiers téléchargés.
5. Après accord explicite, préparer une proposition d’intégration dans la branche principale. Ne pas fusionner automatiquement cette configuration de laboratoire.

Le studio peut évoluer sur cette copie sans changer l’affichage du club. Un changement sauvegardé ici concerne uniquement le laboratoire.

## Console de diagnostic

La bannière ouvre une console locale à ce navigateur : erreurs JavaScript, promesses
rejetées, appels API échoués, médias non chargés et avertissements de l’application.
La copie ou le téléchargement du diagnostic est volontaire. Aucune donnée de
requête/réponse API ni fichier importé n’est enregistré. Les paramètres des URL et
motifs de secrets sont masqués. Le journal est limité à 150 entrées et 24 heures.
Vider le journal ne supprime aucune donnée ni aucun média de l’application.
La console ne remplace pas la vérification visuelle et ne capture pas tous les bugs.
