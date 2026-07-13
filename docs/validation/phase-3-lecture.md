# Phase 3 - Lecture moderne

## Perimetre valide

- Lecture par sourate, page et juz.
- Navigation precedente/suivante et selection directe.
- Traduction francaise activable.
- Affichage tajwid securise pour Hafs.
- Copie, favoris et notes sur chaque verset.
- Reprise de lecture et historique relies au lecteur moderne.
- Conservation de l'interface existante sous `/legacy`.

## Verification automatisee

- Tests unitaires cibles : 8/8.
- Parcours E2E phase 3 : 23/23.
- Compilation de production : reussie.
- Verification responsive : 360, 390, 768 et 1440 px, clair et sombre.
- Aucun debordement horizontal detecte.

## Verification visuelle

- Donnees reelles chargees sur `/surah/1`.
- Police arabe Scheherazade New effectivement appliquee.
- Texte arabe, traduction, reperes de versets et actions lisibles.
- Barre de lecture stable sur bureau et reorganisee sur mobile.
- Aucune erreur console applicative observee.

## Correction de conformite du mode page

- Le mode page utilise une feuille mushaf unique et non des cartes de versets.
- La pagination 1 a 604 reste celle fournie par l'API coranique.
- La Fatiha est composee ligne par ligne; les autres pages utilisent un flux arabe continu.
- Les en-tetes de sourate, basmala, reperes de versets et numero de page sont integres a la feuille.
- Les traductions restent dans un panneau separe pour ne pas modifier la composition arabe.
- Les versets sont rendus dans un flux typographique `inline` continu, sans boite intermediaire.
- Les choix Traduction, Tajwid et mode de lecture utilisent les preferences partagees et persistent entre sourate, page, juz et rechargement.
- La basmala et l'en-tete ne sont affiches que lorsqu'un verset 1 commence reellement une sourate sur la page.
- Apres la Fatiha, les versets d'une page sont empiles verticalement comme dans la vue legacy, avec leur texte interne continu.

## Risque residuel connu

- L'audio reste volontairement hors perimetre de cette phase et sera traite dans la phase suivante.
