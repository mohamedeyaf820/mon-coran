# Plan de Correction des Bugs de Rendu du Texte Coranique

## Contexte
Les images fournies montrent un problème de rendu du texte coranique où des caractères comme "م" et "ق" apparaissent avec des diacritiques ou des glyphes incorrects, notamment dans les modes Warsh et Hafs. Ce problème semble lié à la gestion des polices, des diacritiques et des règles de tajwid.

## Problèmes Identifiés
1. **Diacritiques incorrects** : Certains caractères coraniques apparaissent avec des diacritiques ou des glyphes mal alignés.
2. **Glyphes Warsh/Hafs incohérents** : Les polices Warsh et Hafs ne sont pas correctement appliquées.
3. **Problèmes de clipping** : Certains caractères ou diacritiques sont coupés.
4. **Problèmes de segmentation** : Les mots ou lettres peuvent être mal segmentés.

## Analyse Technique
### 1. **Gestion des Polices**
- **Fichiers concernés** : `src/data/fonts.js`, `src/styles/mushaf-book.css`, `src/utils/fontLoader.js`.
- **Problèmes** : 
  - Les polices Warsh et Hafs ne sont pas correctement chargées ou appliquées.
  - Les polices peuvent ne pas être optimisées pour les diacritiques.
  - Les règles de fallback ne sont pas correctement configurées.

### 2. **Rendu des Diacritiques**
- **Fichiers concernés** : `src/components/Quran/TajweedText.jsx`, `src/components/Quran/AyahTextRenderer.jsx`.
- **Problèmes** : 
  - Les diacritiques peuvent être mal alignés ou absents.
  - Les règles de mise en forme Tajwid ne sont pas correctement appliquées.

### 3. **Segmentation des Mots**
- **Fichiers concernés** : `src/utils/quranUtils.js`, `src/components/Quran/SmartAyahRenderer.jsx`.
- **Problèmes** : 
  - Les mots peuvent être incorrectement segmentés, ce qui affecte le rendu.
  - Les règles de segmentation ne respectent pas les contraintes Unicode.

## Plan de Correction
### Étape 1 : Vérification et Correction des Polices
1. **Vérifier le chargement des polices** : 
   - S'assurer que les polices Warsh (`qcf-v4-tajweed`) et Hafs (`qcf-v2`) sont correctement chargées.
   - Vérifier les URLs et les MIME types dans `@font-face`.
   - Ajouter des fallbacks explicites pour les polices.
   
2. **Corriger les règles de fallback** : 
   - Dans `fontLoader.js`, ajouter des vérifications pour les polices et leurs fallbacks.
   - Utiliser `document.fonts.check()` pour valider le chargement des polices avant le rendu.

### Étape 2 : Correction des Diacritiques et Tajwid
1. **Vérifier les règles de mise en forme Tajwid** : 
   - Dans `tajwidRules.js`, s'assurer que les règles de mise en forme sont correctement appliquées.
   - Vérifier que les diacritiques sont correctement alignés.

2. **Corriger les composants de rendu** : 
   - Dans `TajweedText.jsx` et `AyahTextRenderer.jsx`, s'assurer que les diacritiques sont correctement appliqués.
   - Vérifier que les classes CSS pour les diacritiques sont correctement définies.

### Étape 3 : Correction de la Segmentation des Mots
1. **Vérifier les règles de segmentation** : 
   - Dans `quranUtils.js`, s'assurer que les mots sont correctement segmentés.
   - Utiliser des méthodes respectant les contraintes Unicode.

2. **Corriger les composants de segmentation** : 
   - Dans `SmartAyahRenderer.jsx`, vérifier que les mots sont correctement passés aux composants enfants.

### Étape 4 : Vérification et Correction des Problèmes de Clipping
1. **Corriger les styles CSS** : 
   - Dans `mushaf-book.css`, remplacer les `overflow: hidden` par des alternatives comme `overflow-wrap: anywhere`.
   - Vérifier que les tailles de police et les hauteurs de ligne sont adaptées.

### Étape 5 : Validation et Tests
1. **Exécuter les tests Playwright** : 
   - Vérifier que les tests E2E liés à Warsh et Hafs passent.
   - S'assurer que les diacritiques et glyphes sont correctement rendus.

2. **Vérifier visuellement** : 
   - Utiliser des captures d'écran pour valider le rendu final.
   - Comparer les résultats avec les attentes.

## Questions Clés pour le User
1. **Validation des données coraniques** : 
   - Les données coraniques (diacritiques, glyphes) doivent-elles être modifiées ou sont-elles correctes ?
   - Si des données semblent incorrectes, faut-il les valider manuellement ou les corriger automatiquement ?

2. **Priorisation des corrections** : 
   - Les corrections doivent-elles être priorisées pour Warsh ou Hafs ?
   - Les problèmes de clipping doivent-ils être corrigés en premier ?

3. **Tests spécifiques** : 
   - Quels tests Playwright doivent être exécutés en priorité pour valider les corrections ?
   - Faut-il exécuter des tests sur des appareils réels pour vérifier l'affichage sur mobile/tablette ?

## Risques et Considérations
- **Risque de régression** : Les corrections peuvent introduire de nouvelles régressions dans d'autres fonctionnalités.
- **Compatibilité des polices** : Les polices Warsh et Hafs peuvent ne pas être compatibles avec toutes les versions de navigateurs.
- **Impact sur les performances** : Les changements de rendu peuvent affecter les performances.

## Validation Plan
1. **Vérification des polices** : 
   - Confirmer que les polices sont correctement chargées et appliquées.

2. **Validation des diacritiques** : 
   - Vérifier que les diacritiques sont correctement alignés et visibles.

3. **Tests de segmentation** : 
   - Confirmer que les mots sont correctement segmentés et rendus.

4. **Validation des tests Playwright** : 
   - Exécuter les tests E2E pour Warsh et Hafs.

5. **Validation visuelle** : 
   - Comparer les captures d'écran avant/après les corrections.

## Prochaines Étapes
1. **Vérifier les polices** : Confirmer avec le user si les données coraniques doivent être modifiées ou validées.
2. **Corriger les règles de fallback** : Mettre en place les fallbacks pour les polices.
3. **Valider les diacritiques** : Corriger les règles de mise en forme Tajwid.
4. **Exécuter les tests** : Valider les corrections avec les tests Playwright.

---