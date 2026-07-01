# 00 - Gates techniques
> Surfaces : [BE] Â· Statut : â¬œ Â· Build : develop @ â€” Â· Teste : â€”

## Preconditions
- [BE] Etre a la racine du projet.
- [BE] Avoir Node/npm disponibles.
- [BE] Ne pas reutiliser un `node_modules` pour valider l'installation deterministe.

## Scenarios

### 00.1 â€” [BE] Installation deterministe
**Action** : Executer `npm ci` depuis un workspace propre.
**Attendu** : L'installation se termine sans erreur manifest/lockfile.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 00.2 â€” [BE] Build production
**Action** : Executer `npm run build`.
**Attendu** : Le build Vite, purge CSS et audit performance terminent sans erreur.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 00.3 â€” [BE] Budget bundle
**Action** : Executer `npm run perf:budget` apres un build.
**Attendu** : Les budgets CSS, JS, total et single chunk sont respectes.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 00.4 â€” [BE] Tests securite et services
**Action** : Executer `npm run test:security`.
**Attendu** : Tous les tests Node passent sans regression de stockage, CSP, reciteurs ou tafsir.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 00.5 â€” [BE] CI workflow reproductible
**Action** : Lire `.github/workflows/*.yml` et verifier que l'installation CI utilise `npm ci`.
**Attendu** : La CI valide le lockfile et ne masque pas les derives avec `npm install`.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”
