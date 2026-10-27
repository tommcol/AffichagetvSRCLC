# Vérification de la version générique

- Valeurs initiales sans club FFBB, équipes, rencontres, résultats ou adhérents réels.
- Identité et code FFBB propres à chaque installation.
- Synchronisation programmée testée avec deux identifiants fictifs distincts ; aucun appel FFBB sans configuration.
- Ressources Cloudflare remplacées par des valeurs à renseigner.
- Documentation et exemples génériques ; anciens comptes rendus spécifiques non distribués.
- Médias enregistrés non distribués. Fonds locaux remplacés par un dessin SVG neutre.
- Recherche textuelle des identifiants, noms et adresses connus de l'installation d'origine : aucune occurrence dans les fichiers distribués.
- Recherche de formats courants de jetons : aucun jeton détecté. Ce contrôle n'est pas une certification exhaustive de sécurité.
- Vérification TypeScript du client et du Worker : réussie.
- Compilation : réussie, avec l'avertissement existant sur la taille du JavaScript.
- Tests : 48 suites réussies.

Cette archive contient uniquement les sources de la version générique. Aucun ancien historique Git, dossier de données, dépendance installée ou fichier de compilation n'est inclus.

La version déployée d'une installation existante n'est pas modifiée par cette préparation. Cette vérification ne constitue pas un nouvel audit visuel complet.

## Publication

Créer un nouveau dépôt vide et y importer ces sources avec un premier historique neuf. Ne pas importer l'ancien dossier `.git`, ses branches ou ses commits. Choisir la licence de diffusion avant publication. La création d'un nouveau dépôt ne masque pas les anciennes versions du dépôt précédent : sa visibilité doit être traitée séparément si nécessaire.
