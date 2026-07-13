# Lisibilite du lecteur

## Objectif

Rendre le texte coranique immediatement lisible et adoucir les selecteurs du lecteur, sur ordinateur comme sur mobile, sans retirer les reglages de personnalisation existants.

## Design retenu

- Utiliser `36px` comme taille par defaut du texte arabe dans la configuration moderne.
- Conserver le curseur de taille afin que chaque utilisateur puisse augmenter ou reduire cette valeur.
- Ne plus reduire fortement le texte arabe lorsque le mode centre sur la traduction est actif.
- Maintenir une taille confortable dans la vue Mushaf mobile, tout en evitant le debordement horizontal.
- Donner aux `select` du lecteur une hauteur tactile stable, un rayon de `11px`, un espacement interne plus genereux et un chevron visuellement centre.
- Appliquer le meme traitement au selecteur de tafsir expose depuis le lecteur.

## Portee technique

Les changements restent limites aux valeurs par defaut des preferences modernes et aux styles du lecteur. Les preferences deja enregistrees restent valides et continuent de s'appliquer.

## Validation

- Verifier les vues `/surah/1` et `/page/3` en bureau et en mobile.
- Confirmer les tailles calculees du texte arabe et le rayon des selecteurs.
- Verifier l'absence de debordement, d'erreur console et de requete en echec.
- Executer les tests unitaires et les tests E2E du lecteur concernes.
