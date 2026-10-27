# Installer Affichage TV Club sur Cloudflare

Ce guide installe une NOUVELLE application dans le compte du club. Il ne transfère ni les ressources ni les données d'une autre installation. Les intitulés du tableau de bord peuvent varier.

## 1. Préparer sa copie GitHub

1. Créer un compte GitHub et un compte Cloudflare si nécessaire.
2. Copier les sources génériques dans son propre dépôt, de préférence privé pour l'installation personnalisée.
3. Conserver le dépôt générique public séparé de cette copie. Ne jamais y publier de données, médias, mots de passe ou adresse privée du club.
4. Ouvrir `wrangler.json` avec le bouton crayon de GitHub. Les seules valeurs à personnaliser pour le stockage sont indiquées aux étapes suivantes.

## 2. Créer le stockage des données

Dans Cloudflare, ouvrir **Storage & databases → KV** (ou **Workers KV**), puis **Create instance / Créer un espace**.

- Nom de l'espace : par exemple `affichage-club-donnees`.
- Après création, copier son identifiant KV.
- Dans `wrangler.json`, remplacer uniquement `REMPLACER_PAR_VOTRE_ID_KV` par cet identifiant.
- Garder le nom de liaison `AFFICHAGE_KV`.

Il n'est pas nécessaire d'ajouter manuellement une clé `app-data` : l'application enregistrera ses données.

## 3. Créer le stockage des images et vidéos

Dans Cloudflare, ouvrir **R2 Object Storage**, activer le service si nécessaire, puis créer un bucket, par exemple `affichage-club-medias`.

Vérifier les conditions et tarifs affichés par Cloudflare avant toute activation. Ce guide ne souscrit aucun abonnement.

Dans `wrangler.json` :

- remplacer `votre-banque-medias` par le nom exact du bucket créé ;
- garder le nom de liaison `AFFICHAGE_R2` ;
- ne pas rendre le bucket public : l'application sert les médias via son Worker.

## 4. Nommer l'application

Dans `wrangler.json`, remplacer la valeur de `name` par le nom choisi pour le nouveau Worker, par exemple `affichage-tv-mon-club`.

Ne pas modifier `worker/index.ts`, `./dist`, `ASSETS`, `APP_DATA_COORDINATOR`, `AppDataCoordinator`, ni la migration `new_sqlite_classes`. Le premier déploiement configure le coordinateur des sauvegardes à partir de ce fichier.

Enregistrer les modifications dans sa copie GitHub.

## 5. Relier GitHub à Cloudflare Workers

Dans Cloudflare : **Workers & Pages → Create application / Créer une application → Import a repository / Connect to Git**.

1. Choisir GitHub et autoriser uniquement le dépôt nécessaire.
2. Sélectionner sa copie du projet et la branche `main`.
3. Choisir un déploiement **Workers**, pas un site Pages statique.
4. Configurer :

| Champ | Valeur |
|---|---|
| Nom du Worker | Même valeur que `name` dans `wrangler.json` |
| Répertoire racine | Racine du dépôt |
| Commande de compilation | `npm run build` |
| Commande de déploiement | `npx wrangler deploy` |
| Version de Node.js | 24 si ce choix est proposé |

Les dépendances sont installées par la plateforme. La sortie du frontend est `dist`, mais le déploiement inclut aussi le Worker et les liaisons déclarées dans `wrangler.json`.

**Protection avant ouverture au public :** renseigner `ADMIN_PASSWORD` comme secret D'EXÉCUTION avant le premier déploiement public si le parcours le permet. Les variables de compilation ne protègent pas l'administration. Si le parcours ne permet pas de préparer ce secret avant publication, utiliser la méthode en terminal ci-dessous pour le premier déploiement. Sans ce secret, cette application autorise l'administration sans mot de passe.

### Premier déploiement par terminal, si nécessaire

Sur un ordinateur avec Node.js 24 installé, télécharger sa copie du dépôt et ouvrir un terminal dans le dossier du projet :

```bash
npm install
npx wrangler login
npm run build
npx wrangler deploy --secrets-file .env.production
```

Avant cette dernière commande, créer localement un fichier `.env.production` contenant une ligne `ADMIN_PASSWORD="votre-mot-de-passe-personnel"`, en remplaçant cet exemple par un mot de passe choisi par le club. Ce fichier est exclu de Git : vérifier qu’il reste uniquement sur son ordinateur. La commande transmet le secret et le code dans le même déploiement. Ne pas placer le mot de passe directement dans une commande, un commit ou une capture. Si la version de Wrangler ne reconnaît pas `--secrets-file`, utiliser une version actuelle de Wrangler ou préparer le secret dans le tableau de bord avant de publier l’application.

## 6. Configurer les variables et secrets d'exécution

Dans le Worker : **Settings → Variables and Secrets**, partie exécution, et non les variables de Build.

| Nom | Type conseillé | Utilité |
|---|---|---|
| `ADMIN_PASSWORD` | Secret | Protection de l'administration et des sauvegardes |
| `APP_URL` | Variable | Adresse HTTPS attribuée à CE Worker, sans chemin ajouté |
| `TELEGRAM_BOT_TOKEN` | Secret facultatif | Connexion du bot du club |
| `GEMINI_API_KEY` | Secret facultatif | Génération de légendes IA |

Le fichier de configuration impose `ADMIN_PASSWORD` avant un déploiement réussi. Ne pas supprimer cette exigence pour contourner un échec : ajouter le secret manquant. Telegram et Gemini restent facultatifs. Ne pas inventer de jeton.

Enregistrer et appliquer le déploiement des réglages selon les instructions Cloudflare. Ne jamais copier ces valeurs dans GitHub ni dans une conversation.

## 7. Vérifier les liaisons

Dans **Bindings**, contrôler :

| Liaison | Ressource |
|---|---|
| `AFFICHAGE_KV` | Son espace KV |
| `AFFICHAGE_R2` | Son bucket R2 |
| `APP_DATA_COORDINATOR` | Classe `AppDataCoordinator` de ce Worker |
| `ASSETS` | Fichiers statiques compilés |

Laisser les médias dans R2 et les données dans le stockage applicatif. Ne pas les importer dans le dépôt.

## 8. Initialiser le club

1. Ouvrir l'adresse attribuée par Cloudflare.
2. Vérifier que le mot de passe est demandé pour l'administration.
3. Dans **Identité du club**, renseigner le nom, le nom court, la ville, les couleurs et le code FFBB du club.
4. Ajouter ses médias via les banques d'images de l'application.
5. Configurer les durées et les calques.
6. Prévisualiser les slides, recharger et vérifier la conservation des réglages.
7. Tester la récupération FFBB en sachant que le fournisseur tiers peut retourner des données incomplètes. Une réponse vide ne prouve pas l'absence de matchs.
8. Lancer le carrousel TV et contrôler son rendu sur l'écran utilisé.

Ne pas utiliser le mode démonstration pour sa production. Ne pas remplacer une banque existante par des fichiers de démonstration.

## 9. Telegram et mises à jour

Pour Telegram, créer son propre bot, stocker son jeton dans le secret d'exécution et utiliser l'interface de connexion de l'application. La connexion installe un webhook ; ne la déclencher que pour son bot.

Une fois GitHub relié, un nouveau commit sur la branche de production déclenche normalement une compilation et un déploiement. Vérifier les journaux et conserver une possibilité de retour à la version précédente. Ne pas modifier les noms de ressources ou la migration pour une simple mise à jour.

## Dépannage

- **Erreur KV** : vérifier l'identifiant KV et `AFFICHAGE_KV` dans le fichier de configuration.
- **Erreur de bucket** : vérifier le nom exact du bucket R2 et la liaison `AFFICHAGE_R2`.
- **Erreur Durable Object** : conserver la classe, la liaison et `new_sqlite_classes` du modèle.
- **Pas de mot de passe demandé** : vérifier `ADMIN_PASSWORD` dans les secrets d'exécution et appliquer la modification.
- **Mot de passe refusé** : utiliser celui configuré dans le Worker, pas le mot de passe GitHub ou Cloudflare.
- **Matchs manquants** : vérifier le code du club et le service FFBB ; ne pas supprimer l'historique.

## Sources officielles

- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/kv/get-started/
- https://developers.cloudflare.com/r2/buckets/create-buckets/
- https://developers.cloudflare.com/durable-objects/

- https://developers.cloudflare.com/workers/configuration/secrets/
