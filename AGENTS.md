# Affichage TV Club — consignes de contribution

Application React/TypeScript, Vite, serveur Express local et Cloudflare Worker en production.

- Le point d'entrée du Worker est `worker/index.ts` ; les données partagées passent par `readSharedAppData` et `commitSharedAppData` du coordinateur.
- Aucun club ne doit être codé en dur : utiliser `clubSettings` et le code FFBB configuré.
- Aucune adresse de déploiement, identité de compte Cloudflare, donnée d'adhérent, média personnel ou secret ne doit être ajouté aux fichiers versionnés.
- Conserver les banques de médias et les données dans les stockages propres à l'installation.
- Les secrets d'exécution appartiennent au compte Cloudflare de l'administrateur : `ADMIN_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`. Ne jamais les afficher.
- Utiliser `npm run demo` pour les interactions de test : stockage isolé et appels externes bloqués.
- Vérifier `npm run lint`, `npm run lint:worker`, `npm run build` et `npm test`, puis les interfaces concernées.
- Ne pas déployer, envoyer de messages Telegram, publier sur les réseaux sociaux ou modifier une installation réelle pour un test.
- Réutiliser les utilitaires existants et limiter chaque modification à son objectif.
- Conserver les paramètres de calques et les modes Tous / Séparé. Ne pas réintroduire l'export MP4.

Lire aussi `docs/CONTEXTE_IA.md` pour la reprise et `docs/INSTALLATION_CLOUDFLARE.md` pour installer une nouvelle instance. Le secret `ADMIN_PASSWORD` est obligatoire au déploiement.
