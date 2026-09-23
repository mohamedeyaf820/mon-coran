# AUDIT_SECURITY_2 — MushafPlus Re-Audit de Sécurité
**Date :** 2026-07-30  
**Branche :** perf/load-times-and-bug-fixes  
**Score sécurité global : 8.5 / 10**

---

## 1. Statut des fixes précédents

### 1.1 SW SKIP_WAITING — Validation d'origine ✅ CONFIRMÉ

`public/sw.js` lignes 171–187 : la fonction `isTrustedClientMessage(event)` vérifie :
- `sender.origin === self.location.origin`
- `sender.href.startsWith(scope.href)`

Le handler `SKIP_WAITING` (ligne 210) est systématiquement gardé par cette vérification à ligne 187. Un client cross-origin ne peut pas déclencher `skipWaiting()`.

### 1.2 cryptoUtil.js — Migration SubtleCrypto 🟡 PARTIELLE

**Ce qui est migré :** La dérivation de clé (PBKDF2) utilise désormais `crypto.subtle.importKey()` + `crypto.subtle.deriveBits()` (SubtleCrypto natif, lignes 125–142). Itérations à 600 000 (OWASP 2023 recommandation respectée).

**Ce qui reste CryptoJS :** La bibliothèque `crypto-js v4.2.0` est toujours importée et utilisée pour :
- Chiffrement symétrique AES-256-CBC (`CryptoJS.AES.encrypt/decrypt`)
- HMAC-SHA256 authentification du MAC
- Dérivation des clés d'enveloppe (`CryptoJS.SHA512`)
- Encodage Base64

**Risque résiduel :** CryptoJS v4.2.0 utilise `crypto.getRandomValues` pour la génération d'IV aléatoires si disponible, ce qui est correct. Cependant, la migration vers `SubtleCrypto` pour le chiffrement symétrique n'est pas complète. Le bundle inclut ~50 KB de CryptoJS inutilement à terme.

### 1.3 fetchWithTimeout.js — URLs non exposées ✅ CONFIRMÉ

`src/services/fetchWithTimeout.js` : la fonction ne contient aucune URL hardcodée. Elle accepte `url` en paramètre, combine les signaux AbortController, et lève une erreur typée `Request timed out (Xms)` sans exposer l'URL dans le message d'erreur.

### 1.4 sanitizeSvgMarkup — XSS SVG ✅ CONFIRMÉ (rebaptisé `src/lib/security.js`)

Le fichier `src/utils/sanitizeSvgMarkup.js` a été déplacé vers `src/lib/security.js` et enrichi. Le sanitiseur SVG :
- Bloque les tags `script`, `style`, `use`, `foreignobject`, `iframe`, `object`, `embed`, `link`, `meta`
- Supprime tous les attributs `on*` (event handlers)
- Rejette `href`/`xlink:href` non-fragment (seul `#ancre` est autorisé)
- Filtre `javascript:`, `vbscript:`, `data:text/html`, `expression()`, `@import`, `-moz-binding`
- Refuse les `url()` dans les attributs CSS inline

La fonction `sanitizeHtml()` dans le même fichier sanitise le HTML via DOMParser + walkthrough DOM avec allowlist strict (aucun `dangerouslySetInnerHTML` détecté dans les composants React). L'unique occurrence `browserBody.innerHTML` à ligne 168 est **la lecture de la sortie sanitisée**, pas une injection d'entrée utilisateur.

### 1.5 netlify.toml — Headers de sécurité ✅ CONFIRMÉ

Tous les headers critiques présents sur `/*` :

| Header | Valeur | Statut |
|--------|--------|--------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | ✅ |
| `Cross-Origin-Opener-Policy` | `same-origin` | ✅ |
| `X-Frame-Options` | `DENY` | ✅ |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | camera, mic, payment, USB, BT, serial bloqués | ✅ |
| `Content-Security-Policy` | Voir §1.6 | ✅ |

### 1.6 cspPolicy.mjs — download.quranicaudio.com dans la whitelist ✅ CONFIRMÉ

`download.quranicaudio.com` est présent dans `connect-src` ET dans `media-src` (fichier `scripts/cspPolicy.mjs` ligne 12, et `netlify.toml` ligne 34).

En production : `script-src 'self'` (aucun `unsafe-eval`, aucun `unsafe-inline` pour les scripts). Les `unsafe-inline` dans `style-src`/`style-src-attr` sont confinés aux styles uniquement — inévitable sans refactoring majeur des composants Tailwind/React.

### 1.7 errorAnalytics.js — Stack traces tronquées ✅ CONFIRMÉ

`src/services/errorAnalytics.js` ligne 13 :
```js
stack: error?.stack?.split('\n').slice(0, 2).map(l => l.replace(/\(.*?\)/g, '(…)')).join(' | ')
```
Maximum 2 lignes de stack, chemins de fichiers masqués par `(…)`. Les erreurs sont stockées **uniquement dans `localStorage`** (clé `mp_error_log`, max 50 entrées), jamais transmises à un serveur externe.

---

## 2. NPM Audit — CVE à jour

```
found 0 vulnerabilities
```

Aucune CVE connue dans les dépendances directes ou transitives au 2026-07-30.

Dépendances notables auditées :
- `crypto-js 4.2.0` — aucune CVE active connue, utilise `crypto.getRandomValues` en environnement browser
- `vite 8.2.0` — version récente, CVE Vite antérieures (GHSA-vg6x-rcgg, etc.) non applicables
- `react 18.3.1` — stable, aucune CVE active

---

## 3. Nouvelles vulnérabilités détectées

### 3.1 🟡 MEDIUM — Migration SubtleCrypto incomplète (CryptoJS pour AES/HMAC)

**Fichier :** `src/services/cryptoUtil.js`  
**Détail :** AES-256-CBC + HMAC-SHA256 utilisent CryptoJS (JS userland) et non l'API SubtleCrypto native. CryptoJS implémente le chiffrement en JavaScript pur, exposant potentiellement les opérations à des timing attacks dans des contextes non-browser (Workers sans isolation).  
**Impact :** Faible en contexte browser (exécution dans le moteur V8 avec JIT), mais la dette technique reste.  
**Recommandation :** Migrer `encryptData`/`decryptEnvelope` vers `crypto.subtle.encrypt(AES-GCM)` + `crypto.subtle.sign(HMAC)` pour éliminer CryptoJS entièrement.

### 3.2 🟡 LOW — Pas de Cross-Origin-Embedder-Policy (COEP)

**Fichier :** `netlify.toml`, `scripts/securityHeaders.mjs`  
**Détail :** Aucun header `Cross-Origin-Embedder-Policy: require-corp` n'est configuré. Sans COEP + COOP, `SharedArrayBuffer` et `performance.measureUserAgentSpecificMemory()` restent inaccessibles, mais aucune utilisation de ces APIs n'a été détectée dans le code source.  
**Impact :** Négligeable tant que SharedArrayBuffer n'est pas utilisé.  
**Recommandation :** Aucune action urgente. À anticiper si un Web Worker partagé ou WASM haute performance est ajouté.

### 3.3 🟡 LOW — LEGACY_SECRET_KEY obfusqué par charCodes (sécurité illusoire)

**Fichier :** `src/services/cryptoUtil.js` lignes 4–6  
**Détail :** La clé de migration legacy `mushafplus-2026` est encodée en `String.fromCharCode(...)` — trivial à décoder. Bien que ce soit une clé publique de migration (pas un secret applicatif), elle est incluse dans le bundle JavaScript.  
**Impact :** Si un utilisateur a des données chiffrées avec l'ancienne clé partagée, un attaquant avec accès au localStorage peut les déchiffrer en lisant le bundle.  
**Recommandation :** Documenter que la clé legacy est intentionnellement publique (données utilisateur non critiques uniquement). Ajouter un commentaire explicatif. La migration v2 avec clé device-specific est déjà en place.

### 3.4 ✅ NON-ISSUE — `innerHTML` dans `sanitizeHtml()` (faux positif grep)

**Fichier :** `src/lib/security.js:168`  
La seule occurrence `innerHTML` détectée est `browserBody.innerHTML` qui **lit** le résultat de la sanitisation DOMParser après walkthrough. Ce n'est pas une injection d'input utilisateur — c'est la sortie sécurisée. Aucune `dangerouslySetInnerHTML` n'a été trouvée dans les composants React.

### 3.5 ✅ NON-ISSUE — `blob:` dans CSP img-src / media-src

Les URLs `blob:` dans `img-src` et `media-src` sont nécessaires pour les téléchargements PNG/SVG (`URL.createObjectURL`) et la lecture audio. Les blob URLs sont créées par le browser lui-même, non par entrée utilisateur. Risque nul.

---

## 4. Analyse CSP Production détaillée

```
script-src 'self'                          ✅ Aucun unsafe-eval/unsafe-inline
script-src-elem 'self'                     ✅
script-src-attr 'none'                     ✅ Bloque onclick= inline
style-src 'unsafe-inline'                  ⚠️ Accepté (Tailwind/React inline styles)
object-src 'none'                          ✅ Bloque Flash/plugins
frame-ancestors 'none'                     ✅ Double protection clickjacking
base-uri 'self'                            ✅ Bloque base tag injection
form-action 'self'                         ✅ Bloque form hijacking
upgrade-insecure-requests                  ✅ Force HTTPS
connect-src: whitelist explicite           ✅ Pas de wildcard *
media-src: whitelist explicite             ✅
```

**Wildcard dangereux détecté :** `https://*.mp3quran.net` dans `connect-src` et `media-src`. Un sous-domaine compromis de mp3quran.net pourrait servir du contenu malveillant. Risque acceptable pour un CDN audio tiers, mais à surveiller.

---

## 5. Actions restantes (par priorité)

### Priorité HAUTE

| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 1 | Migrer AES-256-CBC + HMAC vers `crypto.subtle.encrypt(AES-GCM)` + `crypto.subtle.sign(HMAC)` pour éliminer CryptoJS | `src/services/cryptoUtil.js` | ~2j |

### Priorité MOYENNE

| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 2 | Remplacer `unsafe-inline` styles par un nonce Vite CSP plugin ou `style-src 'sha256-...'` | `scripts/cspPolicy.mjs`, `vite.config.js` | ~1j |
| 3 | Ajouter `Cross-Origin-Resource-Policy: same-site` sur `/*` (actuellement seulement sur `/assets/*`) | `netlify.toml` | 15min |
| 4 | Documenter explicitement que LEGACY_SECRET_KEY est une clé publique de migration, pas un secret | `src/services/cryptoUtil.js` | 5min |

### Priorité BASSE / Anticipation

| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 5 | Ajouter `Cross-Origin-Embedder-Policy: credentialless` si un Worker partagé ou WASM est introduit | `netlify.toml` | 15min |
| 6 | Évaluer remplacement du wildcard `*.mp3quran.net` par des sous-domaines explicites | `scripts/cspPolicy.mjs` | 30min |

---

## 6. Résumé

| Domaine | Statut | Note |
|---------|--------|------|
| Service Worker SKIP_WAITING | ✅ Sécurisé | Validation origin + scope |
| Crypto PBKDF2 (SubtleCrypto) | ✅ Migré | 600k itérations |
| Crypto AES/HMAC (SubtleCrypto) | 🟡 Partiel | CryptoJS encore utilisé |
| fetchWithTimeout (URLs) | ✅ Propre | Aucune URL exposée |
| Sanitisation SVG/HTML | ✅ Robuste | DOMParser + allowlist strict |
| Headers HTTP (HSTS, COOP, CSP) | ✅ Complets | Tous présents en production |
| CSP script-src production | ✅ Strict | 'self' uniquement, no unsafe-eval |
| CSP style-src | 🟡 unsafe-inline | Accepté, confiné aux styles |
| download.quranicaudio.com CSP | ✅ Présent | connect-src + media-src |
| Stack traces errorAnalytics | ✅ Tronquées | 2 lignes max, chemins masqués |
| NPM CVE | ✅ 0 vulnérabilité | npm audit clean |
| eval() dans le source | ✅ Absent | Aucune occurrence |
| dangerouslySetInnerHTML | ✅ Absent | Aucune occurrence |
| Open redirect (window.open) | ✅ Protégé | isAllowedExternalUrl() systématique |
| COEP header | 🟡 Absent | Non critique (pas de SAB) |

**Score final : 8.5 / 10**  
La posture de sécurité est solide. Le principal point d'amélioration est la migration complète vers SubtleCrypto pour éliminer CryptoJS du bundle et utiliser des primitives cryptographiques natives côté browser.
