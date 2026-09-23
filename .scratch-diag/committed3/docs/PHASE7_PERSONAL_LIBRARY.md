# Phase 7 - Bibliotheque personnelle

La phase 7 regroupe les nouvelles fonctions dans un seul module differe,
accessible depuis **Espace outils**. Le lecteur, l'accueil et le player ne
chargent pas ce code au demarrage.

## Bibliotheque hors connexion

- Une sourate audio est telechargee pour la riwaya et le recitateur actifs.
- Le panneau expose l'etat, la progression, le nombre de fichiers et une
  estimation de la taille du cache.
- Un telechargement peut etre annule, repris ou supprime. La suppression totale
  reste soumise a une confirmation.
- Le registre est valide avant chaque lecture. Une entree corrompue ne peut pas
  devenir un etat d'interface implicite.

Les audios utilisent la Cache API du navigateur. Ils ne constituent pas une
sauvegarde durable : le navigateur ou le systeme peut les evincer, notamment
quand l'espace disque devient faible. L'utilisateur doit toujours pouvoir
relancer un telechargement.

## Notes et favoris portables

L'export cible n'inclut pas les reglages. Trois formats sont proposes :

- JSON pour restaurer ou transferer les donnees;
- Markdown pour une lecture humaine;
- CSV UTF-8 pour un tableur, avec neutralisation des cellules commencant par un
  caractere de formule.

Le JSON importe les notes et favoris en fusionnant les identifiants. Une entree
importee remplace l'entree locale portant le meme identifiant.

Tous ces fichiers sont lisibles en clair, y compris lorsque le mode protege est
actif et deverrouille. Ils doivent donc etre consideres comme des fichiers
sensibles.

## Parcours de memorisation

Un parcours definit :

- un perimetre (preset ou sourate choisie);
- un nombre de versets par seance;
- une file quotidienne priorisant les niveaux les moins consolides.

La progression reutilise les niveaux 0 a 5 deja attribues aux versets. Les
niveaux 4 et 5 comptent comme consolides; le niveau 5 comme maitrise. Changer de
parcours ne supprime jamais ces niveaux.

## Index thematique

L'index fournit des reperes non exhaustifs en francais, anglais et arabe. Il ne
contient aucune interpretation automatique : chaque sujet ouvre directement
une reference de sourate et de verset. Il ne remplace ni la lecture du contexte
ni un tafsir.

## Passerelle cloud avec consentement

La synchronisation est volontairement manuelle et limitee aux notes/favoris :

1. l'utilisateur selectionne les collections;
2. il confirme que le fichier contient ces donnees;
3. le navigateur ouvre son panneau de partage et l'utilisateur choisit lui-meme
   un disque ou une application cloud;
4. dans l'autre sens, il selectionne explicitement un fichier JSON a restaurer.

MushafPlus ne demande aucun compte cloud, ne conserve aucun jeton OAuth, ne
transfere rien en arriere-plan et n'ajoute aucun domaine externe a la CSP. Si le
partage de fichiers n'est pas disponible, l'application telecharge le JSON et
laisse l'utilisateur le deposer lui-meme. Il n'existe pas de synchronisation
automatique ni de resolution silencieuse de conflits.

## Contrats de validation

- Les references thematiques doivent pointer vers des ayahs existantes.
- Les objectifs de memorisation sont bornes a 1-20 versets par seance.
- Le cloud reste desactive sans consentement explicite.
- Le centre doit rester contenu dans un viewport mobile de 390 px.
- Les onglets suivent le motif clavier Fleches, Debut et Fin.
- Le module reste differe et respecte les budgets initial, gzip et asset unique.
