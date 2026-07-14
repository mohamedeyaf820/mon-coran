# Phase 1 - Plan d'implementation des fondations

Date : 2026-07-12
Branche : `refonte/frontend-cherif`
Specification : `docs/superpowers/specs/2026-07-12-refonte-frontend-cherif-design.md`

## Objectif

Installer une frontiere etanche entre l'application actuelle sous `/legacy/*` et la nouvelle interface sur les routes principales. Livrer une coquille moderne responsive, les themes clair et sombre, les tokens, les primitives UI et la porte de validation automatisee sans migrer encore les parcours metier.

## Risque principal identifie

`src/main.jsx` importe actuellement de nombreuses feuilles CSS globales. Une simple condition dans `App.jsx` ne suffirait donc pas : les styles legacy continueraient a modifier la nouvelle interface.

La phase 1 doit separer les points d'entree React et leurs imports CSS avant toute construction visuelle.

## Regles d'execution

- Ecrire le test ou la caracterisation avant chaque changement de comportement.
- Garder `src/App.jsx` fonctionnellement intact pendant son placement sous legacy.
- Ne pas renommer massivement les composants existants.
- Ne pas migrer l'accueil, la lecture ou l'audio pendant cette phase.
- Ne pas importer de feuille CSS legacy depuis le nouvel arbre moderne.
- Valider chaque lot dans Chromium avant de passer au suivant.
- Conserver des commits petits et centres sur une seule responsabilite.

## Tache 1 - Figer le contrat de routage

### Fichiers

- Creer `src/routing/appSurface.js`.
- Creer `tests/app-surface-routing.test.mjs`.

### Etapes

1. Ecrire des tests pour les chemins `/legacy`, `/legacy/`, `/legacy/surah/1`, `/`, `/surah/1` et les chemins contenant uniquement un prefixe ressemblant a legacy.
2. Definir une fonction pure `resolveAppSurface(pathname)` qui retourne `legacy` uniquement pour `/legacy` et ses descendants, sinon `modern`.
3. Verifier que les query strings et fragments n'influencent pas le choix, car la fonction recoit uniquement `pathname`.
4. Executer `node --test tests/app-surface-routing.test.mjs`.

### Critere de sortie

Le choix legacy/moderne est deterministe, teste et independant de React.

## Tache 2 - Separer les points d'entree

### Fichiers

- Modifier `src/main.jsx`.
- Creer `src/bootstrap/sharedBootstrap.js`.
- Creer `src/legacy/LegacyRoot.jsx`.
- Creer `src/legacy/legacyStyles.js`.
- Creer `src/modern/ModernRoot.jsx`.
- Creer `src/modern/modern.css`.
- Mettre a jour `tests/app-surface-routing.test.mjs` si le contrat evolue.

### Etapes

1. Extraire de `main.jsx` uniquement les comportements de demarrage communs : recuperation de chunks, verification de `#root` et gestion du service worker.
2. Faire charger dynamiquement `LegacyRoot` ou `ModernRoot` selon `resolveAppSurface(window.location.pathname)`.
3. Deplacer les imports des feuilles CSS actuelles dans `src/legacy/legacyStyles.js`.
4. Charger `legacyStyles.js` uniquement depuis `LegacyRoot`.
5. Charger `modern.css` uniquement depuis `ModernRoot`.
6. Conserver `AppProvider`, `ErrorBoundary` et l'application actuelle autour de `App` dans `LegacyRoot`.
7. Ajouter un contenu moderne temporaire minimal avec un titre accessible dans `ModernRoot`.
8. Tester directement `/legacy`, `/legacy/surah/1` et `/` dans le navigateur apres rechargement complet.

### Critere de sortie

Les routes legacy gardent leur interface actuelle. La route moderne ne telecharge et n'applique aucune feuille CSS legacy.

## Tache 3 - Caracteriser la non-regression legacy

### Fichiers

- Creer `tests/e2e/legacy-surface.spec.mjs`.
- Adapter `playwright.config.mjs` seulement si une configuration de projet est necessaire.

### Etapes

1. Verifier que `/legacy` affiche l'accueil actuel.
2. Verifier qu'une route de lecture legacy affiche le contenu attendu.
3. Verifier que les preferences existantes restent accessibles.
4. Verifier qu'aucune erreur JavaScript non geree n'apparait au chargement.
5. Capturer une reference desktop et une reference mobile du legacy.

### Critere de sortie

Le deplacement sous `/legacy` ne change pas les parcours existants utiles a la suite de la migration.

## Tache 4 - Definir les tokens modernes

### Fichiers

- Creer `src/modern/styles/tokens.css`.
- Creer `src/modern/styles/reset.css`.
- Creer `src/modern/styles/typography.css`.
- Modifier `src/modern/modern.css`.
- Ajouter les fichiers WOFF2 variables de `Literata` dans `public/fonts/` avec leur licence.
- Creer `tests/modern-theme-contract.test.mjs`.

### Etapes

1. Definir les tokens semantiques du theme clair : fond ivoire, surfaces, texte vert profond, texte attenue, bordures et accent dore.
2. Definir les memes tokens pour le theme sombre : charbon chaud, surfaces vert-noir et texte ivoire.
3. Definir espacements, tailles tactiles, rayons inferieurs ou egaux a 8 px, ombres, elevations, durees et courbes de transition.
4. Declarer `Scheherazade New` depuis les fichiers locaux existants.
5. Declarer `Literata` comme police editoriale de l'interface, l'embarquer localement et definir une pile de secours serif fiable.
6. Ajouter les styles de focus visible et `prefers-reduced-motion`.
7. Ecrire un test statique verifiant la presence des tokens obligatoires dans les deux themes.

### Critere de sortie

Tous les choix visuels fondamentaux sont centralises et les deux themes exposent le meme contrat.

## Tache 5 - Construire le controle de theme

### Fichiers

- Creer `src/modern/theme/ModernThemeProvider.jsx`.
- Creer `src/modern/theme/themeStorage.js`.
- Creer `tests/modern-theme-storage.test.mjs`.

### Etapes

1. Caracteriser les valeurs de theme deja stockees par l'application.
2. Normaliser toute ancienne valeur vers `light` ou `dark` pour la nouvelle interface sans modifier la donnee source.
3. Utiliser la preference systeme lorsqu'aucun choix utilisateur n'existe.
4. Appliquer le theme via `data-modern-theme` sur l'element racine moderne.
5. Persister uniquement un changement explicite de l'utilisateur.
6. Ecouter les changements systeme tant que le theme n'a pas ete force manuellement.

### Critere de sortie

Le theme ne clignote pas au chargement, reste compatible avec les preferences existantes et fonctionne sans dependre du CSS legacy.

## Tache 6 - Creer les primitives UI

### Fichiers

- Creer `src/modern/ui/Button.jsx`.
- Creer `src/modern/ui/IconButton.jsx`.
- Creer `src/modern/ui/Tooltip.jsx`.
- Creer `src/modern/ui/Surface.jsx`.
- Creer `src/modern/ui/SkipLink.jsx`.
- Creer `src/modern/styles/primitives.css`.
- Creer les tests de composants avec l'outillage de test deja disponible ou, en son absence, des tests E2E cibles.

### Etapes

1. Implementer les etats normal, hover, focus, active, disabled et chargement.
2. Utiliser `lucide-react` pour les icones.
3. Garantir une zone interactive de 44 x 44 px pour les boutons icones.
4. Associer une infobulle et un nom accessible aux commandes uniquement iconiques.
5. Interdire les valeurs de couleur ou d'espacement hors tokens dans ces primitives.
6. Tester clavier, focus et nom accessible.

### Critere de sortie

Les futurs ecrans disposent d'un petit socle coherent, accessible et reutilisable.

## Tache 7 - Construire la coquille moderne

### Fichiers

- Creer `src/modern/shell/ModernShell.jsx`.
- Creer `src/modern/shell/ModernHeader.jsx`.
- Creer `src/modern/shell/ModernNavigation.jsx`.
- Creer `src/modern/shell/ModernPlaceholder.jsx`.
- Creer `src/modern/shell/ModernErrorBoundary.jsx`.
- Creer `src/modern/styles/shell.css`.
- Modifier `src/modern/ModernRoot.jsx`.

### Etapes

1. Construire une structure semantique `header`, `nav`, `main` et zones persistantes.
2. Ajouter le lien d'evitement vers le contenu principal.
3. Afficher le nom Mon Coran comme signal principal sans transformer l'ecran en page marketing.
4. Proposer une navigation sobre vers les domaines futurs, avec les destinations non migrees clairement indisponibles.
5. Ajouter le controle clair/sombre.
6. Afficher une surface temporaire expliquant uniquement que le parcours est en migration, sans texte promotionnel.
7. Ajouter une limite d'erreur moderne avec reprise et lien vers `/legacy`.
8. Eviter les cartes imbriquees, les rayons excessifs et les decorations sans fonction.

### Critere de sortie

La route principale affiche une coquille utilisable, responsive et visuellement conforme a Serenite editoriale.

## Tache 8 - Ajouter le pont de comparaison legacy

### Fichiers

- Creer `src/modern/routing/legacyLink.js`.
- Modifier `src/modern/shell/ModernShell.jsx`.
- Ajouter `tests/legacy-link.test.mjs`.

### Etapes

1. Construire une fonction pure qui transforme la route moderne courante en route `/legacy` equivalente.
2. Preserver les parametres utiles de lecture lorsque leur format est compatible.
3. Ajouter une action discrete permettant d'ouvrir la reference legacy.
4. Ne jamais rediriger automatiquement l'utilisateur vers le legacy apres une erreur.

### Critere de sortie

Chaque future recette peut comparer rapidement la route moderne a sa reference sans dupliquer l'etat.

## Tache 9 - Automatiser la matrice visuelle de phase 1

### Fichiers

- Creer `tests/e2e/modern-shell.spec.mjs`.
- Creer `tests/e2e/modern-shell-visual.spec.mjs`.
- Creer ou adapter un helper dans `tests/e2e/helpers/visualMatrix.mjs`.
- Ajouter un script cible dans `package.json`.

### Etapes

1. Tester le chargement de la coquille, la navigation clavier, le changement de theme et le lien legacy.
2. Executer la matrice aux largeurs 360, 390, 768 et 1440 px en themes clair et sombre.
3. Verifier pour chaque combinaison l'absence de debordement horizontal et de superposition.
4. Verifier que Scheherazade New est chargee lorsque du texte arabe est affiche.
5. Capturer les huit rendus dans le dossier de resultats Playwright, non versionne.
6. Echouer le test sur `pageerror`, erreur console inattendue ou requete 4xx/5xx non geree.
7. Ajouter `npm run test:e2e:phase1` pour lancer uniquement cette porte.

### Critere de sortie

La validation responsive et les erreurs navigateur sont reproductibles par une seule commande.

## Tache 10 - Recette finale de la phase 1

### Commandes

1. `npm run test:security`
2. `node --test tests/app-surface-routing.test.mjs tests/modern-theme-contract.test.mjs tests/modern-theme-storage.test.mjs tests/legacy-link.test.mjs`
3. `npm run test:e2e:phase1`
4. `npm run test:e2e:a11y`
5. `npm run build`
6. `git diff --check`

### Validation navigateur

1. Lancer l'application sur un port libre.
2. Parcourir `/`, `/legacy`, une route legacy de lecture et le retour vers la coquille moderne.
3. Tester souris, clavier et tactile simule.
4. Examiner les huit captures de la matrice.
5. Lire les erreurs et avertissements console.
6. Verifier les requetes reseau echouees.
7. Corriger toute anomalie puis reprendre la boucle depuis le parcours fonctionnel.

### Livrables

- coquille moderne claire et sombre ;
- legacy accessible et non regresse ;
- tokens et primitives documentes par leur code ;
- huit captures de validation ;
- rapport `docs/validation/phase-1-fondations.md` contenant commandes, resultats et anomalies corrigees ;
- aucun ecran metier partiellement migre.

## Definition de termine de la phase 1

- `/legacy/*` charge l'application actuelle avec ses styles.
- Les routes modernes ne chargent aucun style legacy.
- Les themes clair et sombre respectent le meme contrat de tokens.
- La coquille fonctionne a 360, 390, 768 et 1440 px.
- Le clavier, le focus et les zones tactiles sont utilisables.
- La police arabe locale est chargee et lisible.
- Les tests unitaires, E2E, accessibilite et le build passent.
- La console ne contient aucune erreur ni avertissement pertinent.
- Le reseau ne contient aucun echec non gere.
- Le rapport et les captures sont disponibles.
- La phase a ete presentee seulement apres cette validation technique complete.
