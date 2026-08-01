# Audit Sécurité — MushafPlus Quran SPA

**Date** : 2026-07-30  
**Réviseur** : Claude Code (Sonnet 4.6)  
**Périmètre** : SPA Vite/React déployée sur Netlify — branche `perf/load-times-and-bug-fixes`  
**Méthode** : Revue statique du code source + analyse des configurations + `npm audit`

---

## Résumé exécutif

L'application présente une posture de sécurité **globalement solide** pour une PWA grand public. Les headers HTTP sont presque complets, le crypto est correctement architecturé (PBKDF2 600k iterations + AES-256-CBC+HMAC), et il n'y a **0 CVE** connue dans les dépendances. Les points critiques restants sont : la **clé de chiffrement device stockée en clair dans localStorage** (ce qui annule toute protection en cas de XSS), l'**absence de COEP** (Cross-Origin-Embedder-Policy), des **console.error en production non gardés**, et l'**absence totale de SRI** sur les polices tierces chargées depuis jsdelivr/tarteel.ai.

---

## Tableau de synthèse

| Sévérité | Catégorie | Description | Fichier | Fix |
|----------|-----------|-------------|---------|-----|
| 🔴 HIGH | Cryptographie | Clé device stockée en clair dans localStorage — vole la clé = déchiffre tout | `cryptoUtil.js:33-36` | Migrer vers IndexedDB non-extractable (WebCrypto CryptoKey) |
| 🔴 HIGH | Service Worker | Aucune validation d'origine sur les messages `postMessage` — n'importe quelle page peut déclencher SKIP_WAITING | `sw.js:169` | Valider `event.origin` ou `event.source` |
| 🟠 MEDIUM | CSP | `frame-ancestors 'none'` dans le meta tag est **silencieusement ignoré** par les navigateurs (directive HTTP-only) — le X-Frame-Options DENY dans netlify.toml protège, mais la CSP est trompeuse | `dist/index.html:9`, `vite.config.js:13` | Retirer `frame-ancestors` du meta CSP ou documenter l'ignorance explicitement |
| 🟠 MEDIUM | Headers HTTP | **COEP** (Cross-Origin-Embedder-Policy) absent — empêche COOP d'être pleinement effectif, bloque SharedArrayBuffer | `netlify.toml` | Ajouter `Cross-Origin-Embedder-Policy: require-corp` (si compatible fonts tierces) |
| 🟠 MEDIUM | Headers HTTP | **CORP** (Cross-Origin-Resource-Policy) absent pour les assets `/assets/*` | `netlify.toml` | Ajouter `Cross-Origin-Resource-Policy: same-origin` sur les assets |
| 🟠 MEDIUM | Third-party | Aucun **SRI** sur les polices jsdelivr/tarteel.ai/googleapis chargées via CSS — compromission CDN = injection silencieuse | `tailwind.css:329,339`, `fontLoader.js:31` | Ajouter `integrity=` + `crossorigin=anonymous` sur les `<link>` de polices |
| 🟠 MEDIUM | Données sensibles | `console.error` non gardés en production exposent des messages d'erreur internes (chemins, erreurs API) | Multiples fichiers | Entourer tous les `console.*` avec `if (import.meta.env.DEV)` |
| 🟠 MEDIUM | Cryptographie | `crypto-js` (userland) utilisé pour AES/HMAC au lieu de `SubtleCrypto` natif — moins audité, plus attaquable | `cryptoUtil.js:1` | Migrer vers Web Crypto API (AES-GCM natif) |
| 🟡 LOW | CSP | `'unsafe-inline'` dans style-src, style-src-elem, style-src-attr — nécessaire pour Tailwind CSS-in-JS mais élargit la surface d'injection CSS | `netlify.toml:33` | À terme : hash ou nonce si Tailwind le permet |
| 🟡 LOW | CSP | Wildcard `https://*.quran.com` dans font-src et connect-src — trop permissif | `netlify.toml:33` | Restreindre aux sous-domaines effectivement utilisés |
| 🟡 LOW | CSP | `data:` dans font-src — permet les polices base64 inline arbitraires | `netlify.toml:33` | Supprimer si non indispensable |
| 🟡 LOW | Cryptographie | Clé legacy `mushafplus-2026` hardcodée dans le source (obfusquée en char codes) — toujours utilisée pour migration | `cryptoUtil.js:4-6` | Clé publiquement connue, le risque est limité aux vieux installs — documenter la fenêtre de migration |
| 🟡 LOW | Service Worker | `SKIP_WAITING` déclenché sans confirmation peut causer une mise à jour forcée pendant une lecture active | `sw.js:193` | Conditionner au retour `claimClientsOnActivate` existant (déjà partiellement implémenté) |
| 🟡 LOW | Fetch/API | `err.message` exposé dans l'UI (`useQuranDisplayData.js:245`) et dans les erreurs warsh | `useQuranDisplayData.js:245`, `warshService.js:393` | Ne pas afficher `err.message` directement — utiliser des messages i18n |
| 🟢 INFO | Stockage | Traces d'erreur dans `mp_error_log` (localStorage) — chemins obfusqués, 2 lignes max, non envoyées à un serveur | `errorAnalytics.js:13` | Acceptable — surveiller si télémétrie ajoutée plus tard |
| 🟢 INFO | npm audit | **0 CVE** trouvée (0 info / 0 low / 0 moderate / 0 high / 0 critical) | `package.json` | Rien à faire |
| 🟢 INFO | XSS | Pas de `dangerouslySetInnerHTML` — HTML injecté uniquement via `sanitizeHtml()` (whitelist custom) | `security.js:138` | Surveiller : la whitelist est custom, envisager DOMPurify |
| 🟢 INFO | XSS | SVG sanitisé via `sanitizeSvgMarkup()` — suppression des tags `script/style/use/foreignObject` | `security.js:54` | Bon — vérifier que `<use>` intra-SVG est bien bloqué |

---

## 1. CSP — Content Security Policy

### Directive par directive

```
default-src 'self'                    ✅ Bon fallback restrictif
base-uri 'self'                       ✅ Empêche l'injection de base href
object-src 'none'                     ✅ Élimine Flash/plugins
form-action 'self'                    ✅ Empêche la soumission vers des serveurs tiers
script-src 'self'                     ✅ Aucun script inline, aucune eval
script-src-elem 'self'                ✅ Redondant mais correct
style-src 'self' 'unsafe-inline'...   ⚠️ unsafe-inline nécessaire (Tailwind), acceptable
style-src-elem 'self' 'unsafe-inline' ⚠️ Même remarque
style-src-attr 'unsafe-inline'        ⚠️ Permet des styles inline sur attributs — large
font-src ... data: ...                ⚠️ data: permet des fonts base64 arbitraires
connect-src https://*.quran.com ...   ⚠️ Wildcard trop large (tous sous-domaines)
worker-src 'self' blob:               ✅ Nécessaire pour web workers Vite
manifest-src 'self'                   ✅ Correct
frame-ancestors 'none'                🔴 IGNORÉ dans meta tag — navegateurs ignorent cette directive en meta CSP (spec W3C)
```

### Directives manquantes

| Directive | Impact | Recommandation |
|-----------|--------|----------------|
| `upgrade-insecure-requests` | Force HTTPS sur les sous-ressources HTTP | Ajouter |
| `require-trusted-types-for 'script'` | Bloque les injections DOM | Envisager à terme |
| `script-src-attr` | Manquant — hérite de script-src | Ajouter `'none'` explicitement |

### Problème : `frame-ancestors` en meta tag

La directive `frame-ancestors` **ne fonctionne pas dans un `<meta http-equiv="Content-Security-Policy">`** (spécification W3C, niveau CSP3, section 6.8). Le navigateur l'ignore silencieusement. La protection contre le clickjacking repose donc uniquement sur `X-Frame-Options: DENY` dans netlify.toml, ce qui est correct — mais la CSP meta est trompeuse. `vite.config.js` ligne 13-18 filtre déjà la directive pour le dev server, ce qui confirme que le problème est connu mais non résolu en production.

**Fix** : Retirer `frame-ancestors 'none'` du meta CSP ou ajouter un commentaire explicite.

---

## 2. Headers HTTP (netlify.toml)

### Inventaire

| Header | Valeur | Évaluation |
|--------|--------|------------|
| `X-Frame-Options` | `DENY` | ✅ Correct |
| `X-Content-Type-Options` | `nosniff` | ✅ Correct |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | ✅ Excellent |
| `Cross-Origin-Opener-Policy` | `same-origin` | ✅ Présent |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ Correct |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` | ✅ Bon début |
| `Content-Security-Policy` | Voir section 1 | ⚠️ Voir détails |
| `Cross-Origin-Resource-Policy` | **ABSENT** | ⚠️ Manquant |
| `Cross-Origin-Embedder-Policy` | **ABSENT** | ⚠️ Manquant |

### CORP manquant

`Cross-Origin-Resource-Policy: same-origin` devrait être appliqué aux assets hachés (`/assets/*`). Sans CORP, des pages cross-origin peuvent charger les assets en `no-cors` mode, permettant des attaques de type Spectre sur les processus partagés.

### COEP manquant

`Cross-Origin-Embedder-Policy: require-corp` est nécessaire pour que COOP (`same-origin`) soit pleinement effectif et pour activer `SharedArrayBuffer`. Son absence n'est pas critique pour cette app, mais empêche des optimisations futures. Attention : COEP est incompatible avec les fonts chargées depuis jsdelivr/tarteel.ai sans les headers CORP correspondants côté CDN.

### Permissions-Policy partielle

La politique actuelle ne couvre pas : `payment`, `usb`, `bluetooth`, `serial`, `hid`, `screen-wake-lock`. Pour une application Coran, ces permissions devraient toutes être explicitement interdites.

**Recommandation** :
```
Permissions-Policy = "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), bluetooth=(), serial=(), hid=(), screen-wake-lock=(self)"
```

---

## 3. Service Worker — Sécurité

### Problème critique : absence de validation d'origine sur postMessage

```javascript
// sw.js:169-199
self.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;

  switch (event.data.type) {
    case "SKIP_WAITING":
      claimClientsOnActivate = true;
      event.waitUntil(self.skipWaiting());  // ← déclenchable par n'importe quelle origin
```

**Problème** : N'importe quelle page ayant accès au service worker peut envoyer `{ type: "SKIP_WAITING" }` et forcer l'activation immédiate d'une nouvelle version du SW, potentiellement pendant qu'un utilisateur est en train de lire. Plus grave : si une extension malveillante ou une iframe cross-origin peut communiquer avec le SW, elle peut déclencher une mise à jour forcée.

**Fix recommandé** :
```javascript
self.addEventListener("message", (event) => {
  // Valider que le message vient d'un client de même origine
  if (!event.source) return;
  // Pour les clients fenêtre, vérifier l'URL
  const clientUrl = event.source.url;
  if (clientUrl && !clientUrl.startsWith(self.registration.scope)) return;
  // ... reste du handler
```

### Réponses opaques

Les API Coran (api.alquran.cloud, api.quran.com) sont récupérées en mode CORS normal (pas `no-cors`), donc les réponses ne sont pas opaques — c'est correct. Les APIs ont des headers CORS qui permettent cela. Pas de risque de cache flooding par réponses opaques status=0.

### CACHE_QURAN_URLS — filtrage d'URLs

La fonction `cacheQuranUrls` filtre les URLs pour n'accepter que `api.alquran.cloud` et `api.quran.com`. C'est une bonne pratique d'allowlist.

### Limites du cache

`CACHE_LIMITS` (300 entrées shell + 200 API) empêche le remplissage du quota de stockage. La stratégie `trimCache` FIFO est correcte mais pourrait supprimer des entrées souvent utilisées en faveur de nouvelles.

---

## 4. Dépendances vulnérables (npm audit)

```json
{
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": { "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 },
    "dependencies": { "prod": 62, "dev": 245, "optional": 76, "peer": 14, "total": 310 }
  }
}
```

**Résultat : 0 CVE connue.** Le projet est à jour. Points de vigilance :

| Package | Version | Remarque |
|---------|---------|---------|
| `crypto-js` | `^4.2.0` | Bibliothèque userland — pas de CVE active, mais moins auditée que SubtleCrypto |
| `vite` | `^8.0.16` | Version récente — surveiller les releases |
| `@playwright/test` | `^1.59.1` | Dev only — pas de risque production |

---

## 5. Stockage client (localStorage / sessionStorage)

### Inventaire des clés localStorage

| Clé | Contenu | Sensible | Chiffré |
|-----|---------|----------|---------|
| `mushafplus_settings_v1` | Préférences utilisateur complètes (langue, thème, récitateur, police, position Coran…) | Moyen | ✅ AES-256-CBC |
| `mushafplus_device_key_v1` | **Clé AES 256 bits en hexadécimal** (64 chars) | **CRITIQUE** | ❌ **En clair** |
| `mushafplus_crypto_config_v2` | Config PBKDF2 : version, iterations, sel, vérificateur | Sensible | ❌ En clair (données de vérification) |
| `mushafplus_crypto_salt_v1` | Sel PBKDF2 legacy | Sensible | ❌ En clair |
| `mushafplus_crypto_verifier_v1` | Vérificateur de passphrase legacy | Sensible | ❌ En clair |
| `mp_error_log` | Log d'erreurs (50 entrées max, stack tronquée) | Faible | ❌ En clair |
| `audio_maker_sessions` | Sessions de création audio | Faible | ❌ En clair |
| `flashcards-score` | Score mémorisation | Faible | ❌ En clair |
| `mushaf_khatma_v1` | Progression khatma | Faible | ❌ En clair |
| `mp_memorization_plan` | Plan de mémorisation | Faible | ❌ En clair |
| `mp_perf_metrics` | Métriques de performance | Très faible | ❌ En clair |

### Problème critique : clé de chiffrement en clair

```javascript
// cryptoUtil.js:31-42
function getOrCreateDeviceKey() {
  try {
    const stored = localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
    if (/^[a-f0-9]{64,}$/i.test(stored || "")) return stored;  // ← clé hex lue depuis localStorage
    const fresh = generateSecretKey();
    localStorage.setItem(DEVICE_KEY_STORAGE_KEY, fresh);         // ← clé stockée en clair
    return fresh;
  }
```

La clé utilisée pour chiffrer `mushafplus_settings_v1` est elle-même stockée en **clair** dans `mushafplus_device_key_v1`. Toute XSS ou extension malveillante lisant `localStorage.getItem('mushafplus_device_key_v1')` peut déchiffrer immédiatement toutes les données. La protection n'est donc effective que contre une **lecture hors-ligne** du localStorage (ex: vol du fichier sur disque) et non contre une XSS.

**Fix recommandé** : Stocker la clé comme `CryptoKey` non-extractable dans IndexedDB via Web Crypto API :
```javascript
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  false,           // ← non-extractable
  ["encrypt", "decrypt"]
);
// Stocker dans IndexedDB via idb (déjà en dépendance)
```

---

## 6. Cryptographie

### Architecture générale

```
Passphrase utilisateur
    → PBKDF2-HMAC-SHA256 (600 000 iterations, sel 256 bits)
    → secret 256 bits
    → SHA512(secret) → encryptionKey (256 bits) + authenticationKey (256 bits)
    → AES-256-CBC (IV aléatoire 128 bits) + HMAC-SHA256 (Encrypt-then-MAC)
    → Enveloppe JSON encodée base64 préfixée "mpenc:v2:"
```

### Points positifs

- **PBKDF2 600 000 iterations** : conforme aux recommandations OWASP 2024 pour SHA-256 (minimum 600k)
- **Encrypt-then-MAC** : la vérification du MAC avant déchiffrement empêche les attaques par oracle de déchiffrement
- **Comparaison à temps constant** (`constantTimeEqual`) : implémentation correcte en JS (XOR accumulé)
- **IV aléatoire** via `CryptoJS.lib.WordArray.random(16)` à chaque chiffrement
- **Validation de la passphrase** : longueur min 12, max 256, normalisation NFKC

### Points préoccupants

#### crypto-js vs Web Crypto API

```javascript
// cryptoUtil.js:362-365
const encrypted = CryptoJS.AES.encrypt(plaintext, encryptionKey, {
  iv,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7,
});
```

`crypto-js` est une bibliothèque JavaScript userland (non accélérée hardware, non auditée par les navigateurs). `SubtleCrypto.encrypt("AES-GCM", ...)` serait préférable : AES-GCM est authentifié nativement (pas besoin de HMAC séparé), accéléré hardware, et audité par les éditeurs de navigateurs.

#### Dérivation des clés d'enveloppe via SHA512

```javascript
// cryptoUtil.js:286-289
function deriveEnvelopeKeys(secret) {
  const material = CryptoJS.SHA512(`mushafplus-envelope-v2|${secret}`);
  return {
    encryptionKey: CryptoJS.lib.WordArray.create(material.words.slice(0, 8), 32),
    authenticationKey: CryptoJS.lib.WordArray.create(material.words.slice(8, 16), 32),
  };
}
```

La dérivation des deux sous-clés via SHA512 est fonctionnellement correcte mais n'est pas HKDF (RFC 5869). HKDF est le standard pour dériver plusieurs clés depuis un matériel d'entrée — il offre une meilleure séparation des domaines d'utilisation.

#### Clé legacy hardcodée (obfusquée)

```javascript
// cryptoUtil.js:4-6
const LEGACY_SECRET_KEY = String.fromCharCode(
  109, 117, 115, 104, 97, 102, 112, 108, 117, 115, 45, 50, 48, 50, 54,
);  // → "mushafplus-2026"
```

Cette clé est publiquement visible dans le source bundle. Elle est utilisée uniquement pour migrer d'anciens chiffrements. Le risque est limité aux données chiffrées avec l'ancienne version, mais la clé devrait être retirée une fois la période de migration terminée (et un flag mis à jour dans les settings pour éviter la fallback path).

---

## 7. Fetch & API

### fetchWithTimeout.js

```javascript
// fetchWithTimeout.js:7-19
export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal ? combineSignals(options.signal, controller.signal) : controller.signal;
  try {
    const res = await fetch(url, { ...options, signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error(`Request timed out (${timeoutMs}ms)`);
    throw err;
  }
}
```

Implémentation correcte. `combineSignals` propagation d'annulation robuste.

### Leakage dans les erreurs

```javascript
// warshService.js:393
throw new Error(`Failed to load warsh surah ${n}: ${fallbackErr.message || err.message}`);
```

Le message d'erreur interne est propagé et potentiellement affiché dans l'UI ou dans les logs localStorage. Préférer des codes d'erreur génériques.

```javascript
// useQuranDisplayData.js:245-246
setError(err.message);
dispatch({ type: "SET_ERROR", payload: err.message });
```

`err.message` d'une erreur réseau peut contenir des informations d'URL ou de serveur. Ces messages sont affichés à l'utilisateur.

### Construction d'URL

Les URLs API sont construites de manière statique (templates string avec numéros de sourates/ayats validés via `clamp*`). Pas de construction d'URL à partir d'entrées utilisateur non validées identifiée.

### CORS

L'application dépend des headers CORS des APIs tierces (api.alquran.cloud, api.quran.com). Ces APIs supportent CORS. Pas de proxy backend — risque si une API change sa politique CORS.

---

## 8. XSS

### dangerouslySetInnerHTML

**Aucune occurrence trouvée.** Excellent.

### innerHTML

Une seule occurrence dans `security.js:168` :
```javascript
return browserBody.innerHTML;  // ← retour du sanitizer HTML
```
C'est le **résultat** du sanitiseur, pas une injection directe. La valeur retournée est ensuite utilisée via le `__html` pattern ou directement. Acceptable dans ce contexte.

### Sanitiseur HTML custom (security.js)

Le sanitiseur `sanitizeHtml` utilise une **whitelist de tags** :
```
span, b, i, mark, em, strong, br, small, sup, sub,
u, s, del, ins, abbr, code, kbd, samp, var
```
Et une **whitelist d'attributs** : `class`, `title`, `lang`, `dir`.

**Point fort** : l'approche whitelist est correcte.  
**Risque** : c'est une implémentation custom. DOMPurify (bibliothèque dédiée, battle-tested, >5000 fuzzed tests) serait plus sûre. La whitelist actuelle exclut `<a>` et `href`, ce qui est une bonne décision.

### Sanitiseur SVG (security.js)

Tags bloqués : `script, style, use, foreignobject, iframe, object, embed, link, meta`.  
Note : `<use>` est bloqué mais les références d'ancre internes (`href="#..."`) sont autorisées via :
```javascript
const isFragmentRef = valueRaw.trim().startsWith("#");
if (!isFragmentRef || value.startsWith("javascript:") || value.startsWith("data:")) {
  element.removeAttribute(attribute.name);
}
```
Un edge case : une URL comme `#​javascript:...` (avec un caractère zéro-width) passerait le check `startsWith("#")` mais pas le `startsWith("javascript:")`. La normalisation Unicode (`valueRaw.toLowerCase()`) ne traite pas tous les encodages. **Risque faible** ici car `<use>` lui-même est bloqué.

---

## 9. Données sensibles en production

### console.* en production (non gardés)

Les appels suivants ne sont **pas** protégés par `if (import.meta.env.DEV)` et s'exécutent en production :

```javascript
// AudioPlayer.jsx:234
console.warn("Auto reciter failover failed:", error);

// AudioPlayer.jsx:489
console.warn("onError handler threw:", e);

// ErrorBoundary.jsx:17
console.error("[ErrorBoundary]", error, errorInfo);  // ← stack trace complète !

// quranAPI.js:489
console.warn('Primary text API fallback to AlQuran.cloud:', err);

// wordByWordService.js:150
console.error('Failed to fetch word-by-word data:', error);

// readingStreakService.js:28, 47, 154, 182
console.error("[Streak] Failed to ...", error);

// main.jsx:107
console.error("[Main] Root element not found ...");
```

**Problème principal** : `ErrorBoundary.jsx:17` envoie la **stack trace React complète** à la console en production :
```javascript
console.error("[ErrorBoundary]", error, errorInfo);
```
Cela expose l'arborescence des composants, les noms de variables, et potentiellement des chemins de fichiers (si les source maps sont accessibles).

**Fix** :
```javascript
if (import.meta.env.DEV) {
  console.error("[ErrorBoundary]", error, errorInfo);
}
```

### Stack traces dans errorAnalytics.js

```javascript
// errorAnalytics.js:13
stack: error?.stack?.split('\n').slice(0, 2).map(l => l.replace(/\(.*?\)/g, '(…)')).join(' | '),
```

Les parenthèses (chemins de fichiers dans les stack traces) sont remplacées par `(…)`. C'est une bonne obfuscation. Les données restent locales (localStorage, jamais envoyées). Acceptable.

---

## 10. Third-party (CDNs)

### Inventaire des domaines tiers chargés

| Domaine | Usage | SRI | Confiance |
|---------|-------|-----|-----------|
| `https://fonts.googleapis.com` | CSS de Google Fonts | ❌ Non | Haute (Google) |
| `https://fonts.gstatic.com` | Fichiers de polices Google | ❌ Non | Haute |
| `https://cdn.jsdelivr.net` | Polices Warsh QCF (GitHub-hosted) | ❌ Non | Moyenne |
| `https://static-cdn.tarteel.ai` | Police Nastaleeq (Tarteel AI) | ❌ Non | Moyenne |
| `https://cdnjs.cloudflare.com` | (Autorisé en style-src) | ❌ Non | Haute |
| `https://verses.quran.foundation` | Polices Coran | ❌ Non | Haute |
| `https://fonts.quranwbw.com` | Polices | ❌ Non | Moyenne |
| `https://static.qurancdn.com` | Images | ❌ Non | Haute |
| `https://cdn.islamic.network` | Audio + Images | ❌ Non | Haute |

### Absence totale de SRI

Aucune ressource tierce ne porte d'attribut `integrity`. La compromission de `cdn.jsdelivr.net` ou `static-cdn.tarteel.ai` permettrait d'injecter une police malveillante contenant des glyphes `src()` ou des descripteurs Unicode détournés.

Les polices CSS (`@font-face`) ne permettent pas d'exécuter du JavaScript directement, mais :
1. Une police CSS modifiée peut contenir des `src: url("data:text/html...")` malveillants selon les navigateurs anciens
2. La compromission d'un CDN qui sert du CSS (pas seulement des fontes) comme `cdnjs.cloudflare.com` (autorisé en `style-src`) permettrait d'injecter du CSS arbitraire

**Fix pour les polices critiques** :
```html
<link rel="preload" as="font" 
  href="https://cdn.jsdelivr.net/.../warsh.10.woff2"
  crossorigin="anonymous"
  integrity="sha384-[HASH]">
```

Les hashes SRI peuvent être générés lors du build avec :
```bash
curl -s https://cdn.jsdelivr.net/.../warsh.10.woff2 | openssl dgst -sha384 -binary | base64
```

### Chargement via CSS @font-face

Les polices dans `tailwind.css:329,339` sont chargées via des déclarations `@font-face` sans SRI. La CSP `font-src` liste les domaines autorisés, ce qui atténue le risque (seules les polices de ces domaines sont chargées), mais ne garantit pas l'intégrité du contenu.

---

## Recommandations prioritaires

### Priorité 1 — Critique

1. **Migrer la clé device vers IndexedDB non-extractable** (`crypto-js` → `SubtleCrypto`).  
   Fichier : `src/services/cryptoUtil.js`

2. **Ajouter une validation d'origine sur le handler `message` du SW**.  
   Fichier : `public/sw.js:169`

### Priorité 2 — Moyen terme

3. **Supprimer `frame-ancestors` du meta CSP** (ignoré par les navigateurs).  
   Fichier : `dist/index.html`, `scripts/cspPolicy.mjs`

4. **Ajouter `Cross-Origin-Embedder-Policy` et `Cross-Origin-Resource-Policy`** dans netlify.toml.  
   Note : vérifier la compatibilité avec les CDN de polices.

5. **Entourer tous les `console.*` non-gardés avec `if (import.meta.env.DEV)`**, en particulier `ErrorBoundary.jsx:17`.

6. **Générer des hashes SRI** pour les polices `jsdelivr` et `tarteel.ai` lors du build Vite.

### Priorité 3 — Long terme

7. **Migrer AES-CBC + HMAC (crypto-js) vers AES-GCM (SubtleCrypto)**.  
   AES-GCM est authentifié nativement, accéléré hardware, moins de code.

8. **Retirer la clé legacy** `mushafplus-2026` une fois la migration d'anciens installs terminée.  
   Ajouter un flag de version dans les settings pour empêcher la fallback path.

9. **Étendre `Permissions-Policy`** pour couvrir `payment`, `usb`, `bluetooth`, `serial`.

10. **Remplacer le sanitiseur HTML custom par DOMPurify**.  
    `src/lib/security.js` — DOMPurify est fuzztesté et maintenu par la communauté sécurité.

---

## Analyse du modèle de menace

| Vecteur | Risque actuel | Atténuation en place |
|---------|--------------|---------------------|
| XSS via injection HTML/JS | Faible | CSP script-src 'self', pas de dangerouslySetInnerHTML |
| Vol de clé de chiffrement via XSS | **Élevé** | Aucune (clé en clair dans localStorage) |
| Clickjacking | Faible | X-Frame-Options: DENY + frame-ancestors (HTTP header) |
| Attaque par timing sur vérificateur crypto | Faible | Comparaison à temps constant implémentée |
| Compromission CDN | Moyen | CSP whitelist des domaines, pas de SRI |
| CVE dans dépendances | Nul | 0 CVE au 2026-07-30 |
| CSRF | Non applicable | SPA sans backend — form-action: 'self' |
| Injection via paramètres URL | Faible | `parseInitialRoute()` with clamp functions |
| Cache poisoning SW | Faible | Filtrage d'origine dans cacheQuranUrls |
| Écoute réseau | Nul | HSTS + preload, HTTPS obligatoire |

---

*Audit généré le 2026-07-30 par revue statique du code source. Aucun test de pénétration actif n'a été effectué.*
