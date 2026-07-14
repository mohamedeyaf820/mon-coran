# Phase 8 - Durcissement

## PWA et hors-ligne

- Entree `/` et `/index.html` prechargees par le service worker `mon-coran-v7`.
- Navigation moderne verifiee apres coupure reseau reelle dans Chromium.
- Manifeste installable, icone maskable et mode standalone controles.

## Qualite

- Gate de securite CSP, stockage et SVG.
- Build CI minifie sans source maps.
- Budgets recalibres depuis la base actuelle: 1180 kB JS, 2110 kB CSS + JS.
- Plafonds individuels conserves: 780 kB CSS et 250 kB JS par chunk.
- Recette E2E transversale: accueil, lecture, audio, bibliotheque, etude, preferences, accessibilite, PWA et legacy.
- Execution sequentielle pour isoler IndexedDB et le service worker entre les parcours.
