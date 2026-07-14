# Refonte frontend Mon Coran

Date : 2026-07-12
Branche : `refonte/frontend-cherif`
Statut : conception validee

## 1. Objectif

Reconstruire l'interface de Mon Coran sur une base visuelle et technique propre, tout en conservant la parite fonctionnelle avec l'application actuelle. La nouvelle interface doit etre testee par l'equipe avant toute validation humaine afin que le test final ne serve jamais de session de debogage.

La refonte ne doit ajouter aucune nouvelle fonctionnalite avant la fin de la migration. Une fonction existante manifestement cassee, redondante ou sans comportement fiable est isolee et documentee avant toute decision de reprise.

## 2. Principes directeurs

- L'ancienne interface reste accessible sous `/legacy/*` pendant toute la migration.
- Les routes principales accueillent progressivement la nouvelle interface.
- Le legacy est une reference fonctionnelle et visuelle, pas une architecture a reproduire.
- La migration se fait par parcours verticaux complets et validables.
- Aucun composant moderne n'importe les feuilles CSS du legacy.
- Une phase n'est presentee pour validation finale qu'apres une recette fonctionnelle et visuelle complete.
- Les modes clair et sombre sont concus ensemble des la premiere phase.
- La lecture du Coran reste le coeur prioritaire de l'experience.

## 3. Strategie de migration

La strategie retenue est une migration progressive par parcours.

Deux interfaces coexistent temporairement :

- `/legacy/*` charge l'application actuelle, conservee comme reference stable ;
- les routes principales chargent la nouvelle application et remplacent les parcours un par un.

Les services metier, les donnees, l'audio et les preferences restent communs. Des adaptateurs peuvent etre introduits entre les nouveaux composants et les services existants afin de rendre les contrats explicites sans dupliquer la logique.

Une fonctionnalite quitte le legacy seulement lorsque sa parite utile, ses etats d'erreur, son accessibilite et son rendu responsive sont valides.

## 4. Architecture cible

La nouvelle interface est organisee par domaines independants :

- `shell` : structure globale, navigation, zones persistantes et limites d'erreur ;
- `home` : accueil, reprise de lecture, progression et contenus recents ;
- `reader` : lecture, navigation, affichage du texte, traduction et actions de verset ;
- `audio` : lecteur, recitateurs, file d'attente et reprise ;
- `search` : recherche et resultats ;
- `study` : memorisation, wird, khatma, quiz et statistiques ;
- `settings` : preferences, langues, themes, polices et accessibilite.

Chaque domaine expose des composants et contrats comprehensibles sans connaitre ses details internes. Les composants de presentation ne lisent pas directement les API, `localStorage` ou IndexedDB.

Le systeme visuel commun fournit les tokens et primitives utilises par tous les domaines : couleurs, typographies, espacements, tailles, rayons, bordures, ombres, transitions, elevations et etats interactifs.

## 5. Direction visuelle

La direction retenue est **Serenite editoriale**.

L'experience doit etre calme, chaleureuse et centree sur le texte. Les outils secondaires restent discrets sans rendre les actions essentielles difficiles a trouver.

### Typographie

- Texte arabe : `Scheherazade New`, deja embarquee dans l'application.
- Interface francaise et anglaise : police editoriale lisible, choisie pendant la phase Fondations et chargee localement si possible.
- Tailles, interlignages et largeurs de ligne arabes sont definis par mode de lecture et testes avec diacritiques complets.

### Couleurs

- Theme clair : ivoire, vert profond, gris mineraux et accent dore modere.
- Theme sombre : charbon chaud, surfaces vert-noir et texte ivoire.
- Le theme sombre est concu separement et n'est pas une simple inversion automatique.

### Interaction

- Les controles familiers utilisent des icones explicites et des infobulles si necessaire.
- Les actions secondaires sont regroupees pour conserver une hierarchie calme.
- Les transitions sont courtes et respectent `prefers-reduced-motion`.
- Les zones tactiles mesurent au minimum 44 x 44 px.
- Le focus clavier est toujours visible.
- Le contraste vise WCAG AA au minimum.

## 6. Compatibilite des donnees

La premiere version moderne conserve les formats existants pour :

- preferences ;
- favoris ;
- notes ;
- progression et reprise de lecture ;
- historique ;
- listes et reprise audio.

Les nouveaux composants accedent a ces donnees via les services existants ou des adaptateurs types. Les acces directs disperses au stockage sont centralises progressivement dans le domaine concerne.

Toute migration future du stockage doit etre versionnee, testee sur des donnees existantes et reversible.

## 7. Etats et gestion des erreurs

Chaque ecran prend explicitement en charge :

- chargement initial ;
- contenu vide ;
- mode hors-ligne ;
- erreur recuperable avec nouvelle tentative ;
- erreur bloquante avec explication et chemin de sortie.

Les erreurs restent contenues dans leur domaine grace a des limites d'erreur dediees. Une erreur reseau ne doit pas effacer l'etat de lecture. Le lecteur audio et la position de lecture doivent survivre a une navigation et a un rafraichissement lorsque le comportement legacy le permet deja.

## 8. Phases de livraison

### Phase 1 - Fondations

Mettre en place `/legacy`, la nouvelle coquille, la navigation, les tokens, les themes clair et sombre, les primitives UI et les regles d'accessibilite.

### Phase 2 - Accueil

Migrer la reprise de lecture, l'acces aux sourates, la progression et les contenus recents.

### Phase 3 - Lecture

Migrer les modes sourate, page et juz, la navigation, les traductions, le tajwid et les actions sur les versets.

### Phase 4 - Audio

Migrer le lecteur, les recitateurs, la file d'attente, la reprise audio et les comportements reseau.

### Phase 5 - Organisation

Migrer la recherche, les favoris, les notes, l'historique et le partage.

### Phase 6 - Etude

Migrer la memorisation, le wird, la khatma, les quiz et les statistiques.

### Phase 7 - Preferences

Finaliser les reglages, langues, polices, themes, options d'accessibilite et le responsive transversal.

### Phase 8 - Durcissement

Valider la PWA, le hors-ligne, les performances, la securite et la recette complete de l'application.

Une phase ne peut commencer son activation sur les routes principales tant que la phase precedente n'est pas validee.

## 9. Porte de validation par phase

Chaque phase suit la meme boucle :

1. Inventorier le parcours equivalent dans `/legacy`.
2. Ajouter ou completer les tests de caracterisation des comportements utiles.
3. Construire le nouveau parcours avec les composants partages.
4. Tester les actions, chargements, cas vides, erreurs et reprises.
5. Executer les tests unitaires, d'integration et E2E concernes.
6. Construire l'application en mode production.
7. Parcourir reellement l'interface dans Chromium.
8. Verifier la console et les requetes reseau.
9. Inspecter les rendus clair et sombre aux largeurs 360, 390, 768 et 1440 px.
10. Corriger toute anomalie et recommencer la boucle depuis le parcours fonctionnel.
11. Produire les captures finales et un court rapport de recette.
12. Presenter la phase pour validation finale uniquement lorsque tous les controles sont verts.

### Matrice visuelle minimale

Chaque ecran critique est controle sur huit combinaisons minimales :

| Largeur | Theme clair | Theme sombre |
| --- | --- | --- |
| 360 px | obligatoire | obligatoire |
| 390 px | obligatoire | obligatoire |
| 768 px | obligatoire | obligatoire |
| 1440 px | obligatoire | obligatoire |

Les controles couvrent les debordements, superpositions, textes tronques, hierarchie, alignements, contrastes, focus, clavier, zones tactiles, etats interactifs et affichage du texte arabe.

## 10. Definition de termine

Une phase est terminee seulement si :

- la parite fonctionnelle utile avec le legacy est demontree ;
- aucun ecran incomplet n'est actif sur les routes principales ;
- tous les tests concernes passent ;
- le build de production passe ;
- la console ne contient aucune erreur ni avertissement pertinent ;
- aucune requete 4xx ou 5xx non geree n'est observee ;
- la matrice visuelle minimale est validee ;
- le texte arabe utilise la bonne police et reste lisible ;
- la navigation clavier et le focus sont utilisables ;
- les captures et le rapport de recette sont disponibles ;
- la validation finale de la phase a ete obtenue.

## 11. Hors perimetre avant la fin de la migration

- nouvelles fonctionnalites produit ;
- changement de fournisseur de donnees coraniques ;
- remplacement global des services metier ;
- migration non necessaire du stockage local ;
- suppression du legacy avant la recette finale ;
- refactorisation de modules sans lien avec le parcours en cours.

## 12. Sortie de migration

Apres validation de la phase 8, une recette complete compare les routes modernes aux parcours utiles du legacy. Le retrait de `/legacy` fait l'objet d'une decision et d'une livraison separees afin de conserver un retour arriere jusqu'a la validation globale.
