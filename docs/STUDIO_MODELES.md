# Modèles d’affiches et polices du club

## Utiliser chaque semaine

Dans la Passerelle Réseaux, choisissez Matchs ou Résultats, votre période et vos rencontres comme auparavant. Le choix « Modèle de l’affiche » permet d’utiliser Classique ou un modèle enregistré. Les choix Matchs et Résultats sont indépendants.

Les rencontres remplissent automatiquement les champs du modèle. Notre équipe reste à gauche, y compris à l’extérieur ; les scores restent associés à la bonne équipe. La date est centrée par défaut et ne répète pas l’heure. Les rencontres supplémentaires sont réparties sur plusieurs pages selon la place et la capacité choisie. Utilisez les commandes de pages et les téléchargements existants.

## Créer son modèle

1. Ouvrez « Mes modèles · 10 inspirations ».
2. Choisissez une base : Énergie, Tribune, Épuré, Contours, Élégance, Émeraude, Nuit électrique, Journal, Bleu glacier ou Contraste.
3. Nommez votre copie. Choisissez le format à régler.
4. Sélectionnez le titre, notre équipe, l’adversaire, l’heure/score ou la date. Réglez sa police, ses tailles souhaitée/minimale, sa couleur, sa forme, sa bordure et son alignement.
5. Réglez le rectangle de cet élément. Pour les rencontres, les positions sont relatives à **une ligne type**, répétée automatiquement. Pour le titre, elles sont relatives à l’affiche.
6. Réglez la zone des rencontres, son espacement, ses hauteurs minimale/maximale et le maximum par page. Quelques rencontres peuvent occuper de plus grandes lignes ; la hauteur maximale évite une croissance excessive.
7. Examinez les essais fictifs à 2, 4 et 6 rencontres, dont un nom long. Vérifiez les quatre formats.
8. Cliquez « Valider et utiliser le modèle ». Les changements de modèle sont alors transmis au mécanisme de sauvegarde habituel de l’application ; attendez son indicateur de fin d’enregistrement avant de quitter.

Le bouton « Annuler les modifications » abandonne le brouillon. Annuler/Rétablir conserve jusqu’à 40 modifications du brouillon. Dupliquer permet de créer une autre version sans remplacer l’original.

Les couleurs, formes et polices sont communes aux quatre formats d’un modèle. Les positions, dimensions, espacements et capacités sont indépendants : déplacer une ligne en portrait ne déplace pas celle en paysage. Trois associations de polices sont proposées : Sport, Sobre et Impact. Elles restent ensuite personnalisables élément par élément.

## Importer ses polices

Dans l’éditeur, ouvrez « Importer une police ». Confirmez que vous disposez des droits d’utilisation et d’intégration, puis choisissez un fichier WOFF2, WOFF, TTF ou OTF, de moins de 5 Mo. WOFF2 est recommandé pour son poids. Chaque fichier représente une variante de police (normal, gras…).

L’application vérifie l’extension, la signature du fichier et sa lecture par le navigateur avant l’envoi. Le fichier rejoint le stockage de médias existant de l’installation, sans être ajouté à la banque d’images ni au dépôt GitHub. Sa référence est conservée dans la bibliothèque du club. La police devient disponible pour les cinq champs et tous les modèles de cette installation.

**Importer est une action distincte : la police est ajoutée immédiatement à la bibliothèque, même si le brouillon du modèle est ensuite annulé.** Cette action ne supprime aucun média existant. Une connexion à l’installation et l’accès administrateur habituel sont nécessaires.

Les polices importées sont chargées dans l’aperçu et intégrées au PNG par le mécanisme d’export existant. Une police manquante ou non chargée bloque l’export du modèle ; aucun remplacement silencieux n’est autorisé pour ces polices.

## Lisibilité

Un texte revient à la ligne, puis diminue jusqu’à la taille minimale choisie. S’il dépasse encore, un cadre orange apparaît et le téléchargement est bloqué. Agrandissez le bloc, réduisez sa taille souhaitée ou diminuez la capacité par page. Aucun nom n’est abrégé automatiquement par le nouveau moteur.

Les blocs qui dépassent de leur zone ou se chevauchent empêchent la validation du modèle. Les pages ne suppriment aucune rencontre. Les noms de la FFBB et les données sportives ne sont pas réécrits.

## Périmètre de cette première livraison

- Affiches de matchs et de résultats en 4:5, 9:16, 1:1 et 16:9.
- Classique conserve son rendu et les anciens réglages. Les nouveaux modèles utilisent leur propre design et éventuellement le fond sélectionné de l’affiche. Les calques 3/4 et réglages graphiques du studio classique ne sont pas appliqués aux nouveaux modèles ; ils restent enregistrés pour Classique et la TV.
- Le calendrier par équipe aller/retour, les notifications, anniversaires et la diffusion TV conservent leurs rendus actuels.
- Les nouveaux modèles ne constituent pas encore un éditeur libre de décorations/calques ni une interface de déplacement à la souris. Le positionnement se fait par valeurs numériques.
- Aucun export vidéo, publication sociale automatique ou synchronisation FFBB supplémentaire.
- La bibliothèque est versionnée (`schemaVersion: 1`) et ajoutée sans remplacer les réglages existants. Une bibliothèque d’une version future n’est pas écrasée par cet éditeur.

## Vérifications réalisées

Sur des données fictives uniquement : contrôles TypeScript frontend et Worker, compilation et suite automatisée ; tests de conservation des données/modèles, indépendance des variantes, pagination, détection des chevauchements, ordre équipe/score à l’extérieur, signatures des quatre formats de polices et blocage de l’export si texte débordant ou police en attente. Le serveur de démonstration a reçu puis restitué à l’octet près un vrai fichier TTF ; le fichier de données de démonstration n’a pas changé.

Ces contrôles techniques ne constituent pas une validation visuelle. L’accès du navigateur de test à l’instance locale étant bloqué dans cet environnement, les clics, la mesure réelle des noms longs, le sélecteur Android, le chargement des polices dans un autre navigateur et la comparaison PNG/aperçu restent à vérifier dans une instance isolée accessible. Aucune capture d’écran ni validation visuelle n’est revendiquée. Aucun test d’écriture n’a été fait en production.
