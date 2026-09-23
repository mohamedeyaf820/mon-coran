# 07 — PWA, offline et sécurité
> Surfaces : [WEB] [PWA] [BE] · Statut : ⬜ · Build : develop @ — · Testé : —

## Préconditions
- [WEB] Tester sur un build ou preview compatible service worker (`npm run build && npm run preview`).
- [PWA] Avoir accès aux contrôles réseau/cache du navigateur (DevTools → Application → Service Workers).

## Scénarios

### 07.1 — [PWA] Enregistrement service worker
**Action** : Ouvrir l'app en build/preview et vérifier l'enregistrement dans DevTools → Application → Service Workers.
**Attendu** : Le service worker s'enregistre sans erreur console bloquante. Statut : "activated and is running".
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 07.2 — [PWA] Offline fallback
**Action** : Charger l'app, passer le navigateur offline (DevTools → Network → Offline), puis recharger.
**Attendu** : Une expérience offline propre apparaît (page offline traduite dans la langue courante) ou le contenu déjà mis en cache reste accessible. Aucun écran blanc ni crash.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 07.3 — [PWA] Banner de mise à jour
**Action** : Simuler ou attendre un `updatefound` service worker.
**Attendu** : Le banner de mise à jour apparaît et son texte est traduit dans la langue courante. Les actions update/dismiss fonctionnent.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 07.4 — [BE] En-têtes de sécurité HTTP
**Action** : `curl -sI <prod-url>` et inspecter les en-têtes.
**Attendu** : `Content-Security-Policy` présent. `Strict-Transport-Security` avec `max-age`. `Cross-Origin-Opener-Policy: same-origin`. `X-Frame-Options: DENY` ou `SAMEORIGIN`. Aucune violation CSP dans la console navigateur.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 07.5 — [BE] CSP — domaines stricts
**Action** : Exécuter `npm run csp:prod` et inspecter `netlify.toml`.
**Attendu** : Aucun domaine obsolète (`frontend-cdn.perplexity.ai` absent). Pas de `unsafe-inline` dans `script-src`. Les domaines audio et polices QCF sont autorisés.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 07.6 — [BE] Stockage sensible
**Action** : Exécuter `npm run test:security` et inspecter localStorage après navigation normale.
**Attendu** : Tous les tests passent. Aucun secret, token ou donnée de production n'est stocké en clair dans localStorage.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —

### 07.7 — [WEB] Erreurs réseau contrôlées
**Action** : Bloquer les domaines audio et données externes (DevTools → Request Blocking) puis parcourir lecture/recherche/audio.
**Attendu** : L'app dégrade proprement. Messages d'erreur compréhensibles affichés. Aucun crash ni boucle infinie.
**Observe** : _(à remplir)_
**Verdict** : ⬜
**Issue** : —
