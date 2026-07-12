# Phase 4 - Audio moderne

## Perimetre valide

- Lecture audio depuis chaque verset du lecteur moderne.
- Lecteur persistant avec lecture/pause, precedent, suivant et progression.
- Bibliotheque de recitateurs Hafs/Warsh compatible avec les reglages existants.
- Recherche et changement de recitateur.
- File d'attente persistante et restauree apres navigation.
- Reprise audio depuis la derniere position sauvegardee.
- Etats de chargement, mise en tampon et erreur recuperable.
- Avatars locaux de secours pour les photos distantes indisponibles.

## Verification automatisee

- Modele audio et lecteur : 8/8 tests unitaires cibles.
- Parcours audio : bibliotheque, recitateur, file, moteur et reprise valides.
- Parcours lecteur moderne : 3/3.
- Securite : 6/6.
- Compilation de production : reussie.

## Verification reelle

- Recitation An-Nas chargee depuis le CDN audio reel.
- Progression automatique constatee du verset 1 au verset 4.
- Pause, navigation et restauration des six versets de la file validees.
- Rendus bureau et mobile controles sans debordement horizontal.
- Aucune erreur ni alerte console applicative.

## Risque residuel connu

- La disponibilite d'une voix depend de son CDN. Le moteur conserve ses tentatives et ses etats d'erreur, et l'utilisateur peut choisir une autre voix.
