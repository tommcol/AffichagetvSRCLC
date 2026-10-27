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
