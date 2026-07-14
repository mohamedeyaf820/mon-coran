# Phase 6 - Espace d'etude

## Perimetre valide

- Wird quotidien: progression, reprise de lecture, validation et reinitialisation.
- Khatma: six cadences, calcul depuis la derniere page et suppression de l'objectif.
- Memorisation: ajout par reference, niveaux 1 a 5, suppression par remise a zero.
- Quiz tajwid: cinq questions, correction immediate et score final.
- Statistiques: activite agregee sur les sept derniers jours.

## Verification

- `npm run test:unit`: 60 tests passes.
- `npm run build`: build de production valide.
- `npx playwright test tests/e2e/modern-study.spec.mjs --workers=1`: 3 parcours passes.
- Controle visuel: desktop 1440 x 1000 et mobile 390 x 844, sans debordement horizontal.

## Preuves

- `.test-shots/phase6-study-desktop.png`
- `.test-shots/phase6-study-mobile.png`
