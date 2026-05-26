# Playwright Debugging Guide

## Installation
Playwright a été installé avec succès !

## Commandes utiles

### Lancer les tests en mode UI (visuel) - RECOMMANDÉ
```bash
npm run test:e2e:ui
```

### Lancer les tests avec le navigateur visible
```bash
npm run test:e2e:headed
```

### Lancer les tests de debug Warsh
```bash
npm run test:e2e:warsh
```

### Lancer les tests visuels de debug
```bash
npm run test:e2e:visual
```

### Lancer en mode debug (pas à pas)
```bash
npm run test:e2e:debug
```

### Voir le rapport HTML
```bash
npx playwright show-report
```

### Lister tous les tests disponibles
```bash
npx playwright test --list
```

## Tests disponibles

### Debug Warsh (nouveaux)
- **`warsh-debug.spec.mjs`** - Tests spécifiques pour le mode Warsh
  - Chargement de la sourate 4
  - Analyse des requêtes réseau
  - Vidage du cache et rechargement

- **`visual-debug.spec.mjs`** - Tests visuels de debug
  - Capture de screenshots
  - Navigation en mode Warsh
  - Détection des erreurs
  - Vérification IndexedDB

### Tests existants
- `a11y-smoke.spec.mjs` - Tests d'accessibilité
- `audio-fallback.spec.mjs` - Tests audio
- `reading-scroll.spec.mjs` - Tests de scroll
- `visual-*.spec.mjs` - Tests visuels

## Fichiers de sortie

Les screenshots et vidéos sont sauvegardés dans :
- `test-results/` - Screenshots et vidéos
- `playwright-report/` - Rapport HTML détaillé

## Déboguer l'erreur Warsh

### Méthode rapide (recommandée)
```bash
npm run test:e2e:warsh
```

### Méthode interactive (meilleure pour explorer)
```bash
npm run test:e2e:ui
```

Puis sélectionnez le test "Warsh Debug Tests" et cliquez sur le triangle de lecture.

### Méthode manuelle
1. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Dans un autre terminal, lancer le test** :
   ```bash
   npx playwright test tests/e2e/warsh-debug.spec.mjs --headed
   ```

3. **Observer les logs** dans la console pour voir :
   - Les erreurs JavaScript
   - Les requêtes réseau
   - L'état du cache IndexedDB

4. **Vérifier les screenshots** dans `test-results/`

## Mode UI (Recommandé)

Pour un débogage interactif :
```bash
npm run test:e2e:ui
```

Cela ouvre une interface où vous pouvez :
- Voir les tests en temps réel
- Explorer le DOM
- Voir les console logs
- Prendre des screenshots
- Rejouer les tests
- Voir les traces détaillées

## Configuration

Le fichier `playwright.config.mjs` contient :
- URL de base : `http://127.0.0.1:4173` (mode preview)
- Navigateur : Chromium
- Screenshots sur échec
- Vidéos sur échec
- Traces sur échec

## Conseils de débogage

1. **Vérifier la console du navigateur** :
   Les logs console sont capturés automatiquement dans les rapports.

2. **Inspecter le réseau** :
   Les requêtes vers `warshData_v2-1.json` sont loguées dans les tests.

3. **Vérifier IndexedDB** :
   Le test "debug IndexedDB state" affiche l'état du cache.

4. **Capturer des screenshots manuellement** :
   ```javascript
   await page.screenshot({ path: 'test-results/my-screenshot.png' })
   ```

5. **Voir les traces détaillées** :
   Ouvrez le rapport HTML après un échec :
   ```bash
   npx playwright show-report
   ```

## Commandes npm disponibles

```bash
# Tests E2E
npm run test:e2e              # Lancer tous les tests
npm run test:e2e:ui           # Mode UI interactif
npm run test:e2e:headed       # Avec navigateur visible
npm run test:e2e:debug        # Mode debug pas à pas
npm run test:e2e:warsh        # Tests Warsh uniquement
npm run test:e2e:visual       # Tests visuels de debug

# Tests spécifiques existants
npm run test:e2e:smoke        # Tests smoke
npm run test:e2e:audio        # Tests audio
npm run test:e2e:a11y         # Tests accessibilité
npm run test:e2e:reading      # Tests de lecture
```
