# 00 — Gates techniques
> Surfaces : [BE] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [BE] Être à la racine du projet.
- [BE] Avoir Node 22 et npm disponibles.
- [BE] Ne pas réutiliser un `node_modules` existant pour valider l'installation déterministe.

## Scénarios

### 00.1 — [BE] Installation déterministe
**Action** : Exécuter `npm ci` depuis un workspace propre.
**Attendu** : L'installation se termine sans erreur manifest/lockfile. Toutes les entrées top-level présentes dans `package-lock.json` sont résolues (`@emnapi/core`, `@emnapi/runtime`, etc.).
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 00.2 — [BE] Build production
**Action** : Exécuter `npm run build`.
**Attendu** : Le build Vite, la purge CSS et l'audit performance terminent sans erreur. Le dossier `dist/assets/` est peuplé.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 00.3 — [BE] Budget bundle
**Action** : Exécuter `npm run perf:budget` après un build.
**Attendu** : CSS total < 945 kB, JS total < 1196 kB, total < 2072 kB, chunk CSS < 780 kB, chunk JS < 250 kB.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 00.4 — [BE] Tests sécurité et services
**Action** : Exécuter `npm run test:security`.
**Attendu** : Tous les tests Node passent sans régression de stockage, CSP, réciteurs ou tafsir.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 00.5 — [BE] CI workflow reproductible
**Action** : Lire `.github/workflows/perf-budget.yml` et vérifier que l'installation CI utilise `npm ci` (pas `npm install`).
**Attendu** : La CI valide le lockfile et ne masque pas les dérives. Le check `bundle-budget` est vert sur la PR.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
