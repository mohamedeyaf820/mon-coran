# 07 - PWA, offline et securite
> Surfaces : [WEB] [PWA] [BE] Â· Statut : â¬œ Â· Build : develop @ â€” Â· Teste : â€”

## Preconditions
- [WEB] Tester sur un build ou preview compatible service worker.
- [PWA] Avoir acces aux controles reseau/cache du navigateur.

## Scenarios

### 07.1 â€” [PWA] Enregistrement service worker
**Action** : Ouvrir l'app en build/preview et verifier l'enregistrement du service worker.
**Attendu** : Le service worker s'enregistre sans erreur console bloquante.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 07.2 â€” [PWA] Offline fallback
**Action** : Charger l'app, passer le navigateur offline, puis recharger.
**Attendu** : Une experience offline propre apparait ou le contenu deja cache reste accessible, sans page blanche.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 07.3 â€” [PWA] Banner update
**Action** : Simuler ou attendre un `updatefound` service worker.
**Attendu** : Le banner de mise a jour apparait, update/dismiss fonctionnent, aucun listener ne rate le message.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 07.4 â€” [BE] CSP headers
**Action** : Executer les scripts CSP ou lire `netlify.toml`, `vercel.json`, `scripts/cspPolicy.mjs`.
**Attendu** : Les domaines autorises sont stricts, pas de wildcard dangereux ni domaine obsolete non justifie.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 07.5 â€” [BE] Stockage sensible
**Action** : Executer les tests securite et inspecter localStorage apres navigation normale.
**Attendu** : Aucun secret, token sensible ou donnee de production n'est stocke en clair.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”

### 07.6 â€” [WEB] Erreurs reseau controlees
**Action** : Bloquer temporairement les domaines audio ou donnees externes puis parcourir lecture/recherche/audio.
**Attendu** : L'app degrade proprement, affiche des messages utiles et ne crashe pas.
**Observe** : _(a remplir)_
**Verdict** : â¬œ
**Issue** : â€”
