# Audit PWA — MushafPlus
> Généré le 2026-07-30 · Branche `perf/load-times-and-bug-fixes`

---

## Table des matières
1. [Manifest.json](#1-manifestjson)
2. [Installabilité](#2-installabilité)
3. [Service Worker](#3-service-worker)
4. [Splash Screens](#4-splash-screens)
5. [Navigation offline](#5-navigation-offline)
6. [Spécificités iOS PWA](#6-spécificités-ios-pwa)
7. [Performance PWA](#7-performance-pwa)
8. [Score Lighthouse PWA estimé](#8-score-lighthouse-pwa-estimé)
9. [Améliorations avancées](#9-améliorations-avancées)
10. [Tableau de priorités](#10-tableau-récapitulatif--priorités)

---

## 1. Manifest.json

Fichier : `public/manifest.json`

### Champs présents

| Champ | Valeur | Statut |
|---|---|---|
| `name` | "MushafPlus - Le Saint Coran" | ✅ Correct, descriptif |
| `short_name` | "MushafPlus" | ✅ ≤ 12 caractères |
| `description` | "Une expérience de lecture du Coran premium…" | ✅ Présent |
| `start_url` | `"/"` | ✅ Racine du site |
| `display` | `"standalone"` | ✅ Mode app natif |
| `background_color` | `"#FEFAF3"` | ✅ Clair, cohérent avec le thème |
| `theme_color` | `"#1B5E3A"` | ⚠️ **Mismatch** — index.html a `#0D5C4A` |
| `orientation` | `"any"` | ✅ Portrait + paysage autorisés |
| `dir` | `"auto"` | ✅ Adaptatif RTL/LTR |
| `lang` | `"fr"` | ✅ Langue principale |
| `categories` | `["books","reference","education"]` | ✅ Bien ciblées |
| `prefer_related_applications` | `false` | ✅ Évite le renvoi vers Play/App Store |
| `shortcuts` | 3 raccourcis (Al-Fatiha, Al-Mulk, Al-Kahf) | ✅ Bien pensés |
| `screenshots` | 2 captures (wide 1440×900, mobile 390×844) | ⚠️ Voir §9 |
| `scope` | **ABSENT** | ❌ Manquant |
| `id` | **ABSENT** | ❌ Manquant (Chrome 113+) |
| `display_override` | **ABSENT** | ⚠️ Opportunité Desktop |
| `share_target` | **ABSENT** | ⚠️ Opportunité |
| `file_handlers` | **ABSENT** | ℹ️ N/A |
| `protocol_handlers` | **ABSENT** | ⚠️ Opportunité |

### Icônes

| Fichier | Taille déclarée | Taille réelle | Purpose | Statut |
|---|---|---|---|---|
| `/logo-192.png` | 192×192 | **61 kB** | `any` | ✅ Taille OK |
| `/logo-512.png` | 512×512 | **407 kB** | `any` | ❌ Trop lourde (cible < 50 kB) |
| `/logo-512.png` | 512×512 | 407 kB | `maskable` | ⚠️ Fonctionnel mais pas d'icône 192 maskable |
| `/favicon.png` | 64×64 | 8 kB | (non spécifié) | ⚠️ Utilisée comme icône de raccourcis (trop petite : min 96×96) |

#### Problèmes icons

1. **logo-512.png = 407 kB** : Un PNG 512×512 correctement optimisé devrait peser 30–60 kB. Cette taille ralentit l'installation et augmente inutilement le cache. Re-exporter avec `oxipng --opt 4` ou `pngquant 256`.

2. **Aucune icône maskable 192×192** : La spécification recommande une icône maskable à chaque taille critique. Sur Android, certains lanceurs utilisent la 192 en préférence. Créer `logo-192-maskable.png` avec une zone sûre de 80 % (le motif ne doit pas dépasser 40 % de chaque côté).

3. **Icônes des raccourcis = favicon 64×64** : Chrome recommande 96×96 minimum pour les icônes de shortcuts dans l'interface "Add to Home Screen". À 64×64 elles peuvent apparaître floues ou être ignorées.

### Champs manquants importants

**`scope`** — bien que la valeur par défaut soit `"/"` quand `start_url` est `"/"`, ne pas le déclarer explicitement peut produire des comportements inattendus avec certains outils de validation (Lighthouse, PWABuilder).

**`id`** — Depuis Chrome 113, le champ `id` sert d'identifiant stable pour la PWA. Sans lui, Chrome utilise `start_url` résolu. Si l'URL change un jour (ex : migration domaine), la PWA sera considérée comme une nouvelle installation et les utilisateurs perdront leurs données d'app. Ajouter `"id": "/"`.

**`display_override`** — Pour desktop Windows/macOS, ajouter `"display_override": ["window-controls-overlay", "standalone"]` permet d'utiliser la barre de titre comme zone d'interface (titre/surah actuel visible dans la barre système).

---

## 2. Installabilité

### Critères Lighthouse pour l'installation

| Critère | État | Détail |
|---|---|---|
| Servi en HTTPS | ✅ PASS | Netlify + HSTS (`max-age=31536000; includeSubDomains; preload`) |
| `<link rel="manifest">` présent | ✅ PASS | `dist/index.html` ligne 44 |
| Manifest valide (name, short_name, icons) | ✅ PASS | Tous présents |
| Icône 192×192 présente | ✅ PASS | `/logo-192.png` |
| Icône 512×512 présente | ✅ PASS | `/logo-512.png` |
| Icône maskable présente | ✅ PASS | `/logo-512.png` avec `purpose: maskable` |
| `start_url` accessible offline | ✅ PASS | SW sert `/index.html` en fallback |
| `display` = standalone/fullscreen/minimal-ui | ✅ PASS | `standalone` |
| SW enregistré | ✅ PASS | `main.jsx` ligne 151 |
| SW contrôle la page | ✅ PASS | Après première installation |
| Page répond en offline (200) | ✅ PASS | `networkFirstHtml` avec fallback HTML inline |
| `theme-color` méta présent | ✅ PASS | `index.html` ligne 45 |
| viewport avec `initial-scale` | ✅ PASS | `width=device-width, initial-scale=1.0, viewport-fit=cover` |
| `id` défini dans le manifest | ❌ FAIL | Absent — Chrome utilise `start_url` |
| `theme_color` cohérent manifest / HTML | ❌ FAIL | `#1B5E3A` vs `#0D5C4A` |
| `scope` explicite | ⚠️ WARN | Implicite `"/"` mais non déclaré |

### Verdict installabilité

L'app **est installable** sur Android Chrome et desktop Chrome/Edge. Les deux échecs (`id` et `theme_color` mismatch) n'empêchent pas l'installation mais produisent des incohérences visuelles (couleur de la barre de titre différente entre l'état d'installation et l'état standalone) et des risques d'identité à long terme.

---

## 3. Service Worker

Fichier : `public/sw.js` (16 449 octets bruts / ~5.8 kB gzip estimé)  
Version courante : `CACHE_NAME = "mushaf-plus-v13"` / `API_CACHE_NAME = "mushaf-plus-api-v3"`

### 3.1 Stratégies de cache par type de ressource

| Type de ressource | URL pattern | Stratégie | Cache utilisé | Rationnel |
|---|---|---|---|---|
| Polices locales | `/fonts/*` | **Cache-First** | `mushaf-plus-v13` | Jamais modifiées entre builds |
| Assets hachés | `/assets/*` | **Cache-First** | `mushaf-plus-v13` | Hash = immutabilité garantie |
| Images locales | `*.png/jpg/webp/…` (même origine) | **Stale-While-Revalidate** | `mushaf-plus-v13` | Logo, captures, avatars récitateurs |
| API Coran (textes) | `api.alquran.cloud`, `api.quran.com` | **Stale-While-Revalidate** | `mushaf-plus-api-v3` | Disponible offline + fraîcheur background |
| HTML | `Accept: text/html` | **Network-First** (timeout 6 s) | `mushaf-plus-v13` | Évite les pages blanches SW obsolète |
| Autres same-origin | Reste | **Network-First + fallback** | `mushaf-plus-v13` | JSON de données, sw.js lui-même |
| Cross-origin (audio MP3) | Domaines audio externes | **Pass-through** | — | Trop volumineux, streaming natif |

Le timeout réseau de 8 s (`fetchWithTimeout`) est raisonnable pour les API Coran. Le timeout de 6 s pour HTML évite les blocages sur connexion lente.

### 3.2 Précache de l'app shell — URLs et taille estimée

Le SW précache à l'installation :

| Ressource | Taille estimée |
|---|---|
| `/index.html` | ~7 kB |
| `/boot-recovery.js` | 2.7 kB |
| `/manifest.json` | ~1 kB |
| `/logo-ui.webp` | 26 kB |
| `/favicon.png` | 8 kB |
| `/data/reciter-profiles.json` | 88 kB |
| `/shell-assets.json` (21 chunks JS) | ~531 octets |
| 21 chunks JS (via shell-assets.json) | ~1 226 kB non compressé |
| CSS parsé depuis index.html (`/assets/*.css`) | ~892 kB non compressé |
| **Total précaché** | **~2 250 kB brut** |
| **Total estimé gzip** | **~650–750 kB réseau** |

**Observation** : Le total brut de ~2.25 MB est élevé mais raisonnable pour une SPA Quran avec polices de lecture. En gzip Netlify, l'impact réseau réel est ~700 kB, ce qui correspond à environ 1.4 s sur 4G (4 Mbps) pour la première installation du SW.

**Problème potentiel** : Si `/shell-assets.json` est absent du serveur (build non déployé), le SW throw une erreur et l'installation **échoue complètement** :
```js
throw new Error(`Unable to load app-shell manifest: ${shellManifestResponse.status}`);
```
En prod (Netlify build génère `dist/shell-assets.json`), ce cas ne devrait pas arriver. Mais en preview/branch deploy partiel, c'est un risque. Prévoir un fallback gracieux (`console.warn` + continuer sans shell-assets).

### 3.3 Offline readiness

| Scénario | Comportement observé | Qualité |
|---|---|---|
| **Home page sans réseau** | SW sert `/index.html` depuis cache → React se monte → Home page s'affiche | ✅ Excellent |
| **Sourate récemment visitée** | API Coran en cache SWR → texte arabe disponible | ✅ Bon |
| **Sourate jamais visitée** | API Coran non cachée → affichage de l'état d'erreur de l'app | ⚠️ Dépend de l'UI d'erreur |
| **Assets hachés** | 100 % précachés → zéro requête réseau | ✅ Parfait |
| **Première visite HORS ligne** | SW pas encore installé → erreur réseau native du navigateur | ❌ Impossible (comportement normal) |
| **Polices de lecture** | Cache-First si déjà chargées → disponibles offline | ✅ |
| **Audio MP3** | Pass-through, non caché | ❌ Indisponible offline (acceptable — volumétrie) |
| **Fallback page HTML inline** | Trilingue FR/EN/AR avec bouton "Réessayer" | ✅ Très bon |

### 3.4 Background Sync

**ABSENT.** Aucun `BackgroundSync` ni `SyncEvent` enregistré.  
Impact : si l'utilisateur modifie ses favoris/marque-pages offline, les changements ne se synchronisent que lors de la prochaine session avec réseau, via la logique applicative (localStorage → API au chargement). C'est fonctionnel pour une app orientée lecture mais peut être amélioré pour la synchronisation de progression de lecture.

### 3.5 Push Notifications

**ABSENT.** Aucun `PushManager`, `push` event listener, ni `Notification.requestPermission`.  
Impact : pas de rappels de lecture quotidiens, pas de notifications pour nouveaux contenus. C'est un manque fonctionnel si des features de rappel sont prévues.

### 3.6 Mise à jour du SW — Cycle de vie

Le cycle de mise à jour est **complet et correctement implémenté** :

```
Nouveau SW détecté (updatefound)
    → PWAUpdateBanner.jsx détecte sw.state === 'installed' + controller actif
    → Affiche banner "Mise à jour disponible" (trilingue via i18n)
    → Bouton "Mettre à jour" → postMessage({ type: 'SKIP_WAITING' })
    → SW fait self.skipWaiting() + claimClientsOnActivate = true
    → SW active → self.clients.claim()
    → Banner poste window.location.reload() via 'controllerchange'
```

**Points forts :**
- `claimClientsOnActivate` est conditionnel (seulement si SKIP_WAITING reçu) → évite les rechargements sauvages des clients actifs lors d'une mise à jour silencieuse.
- Le listener `controllerchange` est attaché **avant** le `postMessage` → pas de race condition.
- Le banner gère correctement le cas où `reg.waiting` est déjà présent au mount (mise à jour en attente avant l'ouverture de la page).
- Bouton de dismissal (×) avec `aria-label` i18n ✅.

**Point faible :**
- `claimClientsOnActivate` est une variable module-level. Si le SW est activé normalement (sans SKIP_WAITING) puis reçoit un SKIP_WAITING ultérieur, la variable restera `true` pour la durée de vie du SW. C'est un état résiduel sans impact pratique (claim() n'est appelé qu'à l'activation), mais c'est une dette de lisibilité.

---

## 4. Splash Screens

### 4.1 apple-touch-startup-image

**ABSENT de `dist/index.html`.** C'est le point le plus critique pour iOS.

Sans `apple-touch-startup-image`, sur iOS en mode standalone :
- **iOS < 16.4** : écran blanc (ou noir) pendant le chargement de React (~300-800 ms selon l'appareil).
- **iOS ≥ 16.4** : iOS génère automatiquement une splash basique à partir du manifest si l'app est installée via Chrome (pas Safari natif). Mais ce comportement n'est pas garanti.

Les balises nécessaires pour iOS complet seraient (exemple pour quelques résolutions) :
```html
<link rel="apple-touch-startup-image" media="(device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3)" href="/splash/iphone14-1170x2532.png">
<!-- ... une image par résolution iPhone/iPad -->
```

**Il existe 20+ combinaisons résolution/DPR** pour les appareils Apple actuels. La solution pragmatique est d'utiliser un outil comme `pwa-asset-generator` :
```bash
npx pwa-asset-generator logo-512.png ./public/splash --background "#071A0F" --splash-only --index ./index.html
```

### 4.2 SplashScreen React (comportement actuel)

Le composant `SplashScreen.jsx` est **très bien conçu** mais ne compense pas l'absence de la balise native iOS :

| Aspect | État | Détail |
|---|---|---|
| Flash avant React mount (iOS) | ❌ Présent | ~300-500 ms d'écran vide avant que JS s'exécute |
| Animation JS après mount | ✅ Excellent | Gradient sombre, halo doré, particules, versets |
| Durée max | ✅ 400 ms | `t2 = setTimeout(dismiss, 400)` — rapide |
| Early dismiss (prefetch done) | ✅ Présent | `tryEarlyDismiss()` si prefetch résolu avant 400 ms |
| Mode basse performance | ✅ Présent | `lowPerfMode` supprime animations, timeout 280 ms |
| Bouton "Passer" | ✅ Présent | Apparu après 250 ms |
| Multilingue | ✅ FR/EN/AR | `skipLabels[lang]` |

### 4.3 Comportement au lancement iOS vs Android

**Android (Chrome/standalone) :**
- Background splash généré automatiquement par Chrome à partir de : `background_color` (#FEFAF3 = beige) + icône 512×512 centrée.
- Le fond beige clair diffère visuellement du fond sombre du SplashScreen React (#071A0F). **Discontinuité visuelle.**
- Fix : changer `background_color` en manifest vers `#071A0F` (fond sombre du splash) OU adapter le SplashScreen React vers le beige. La cohérence exige que les deux soient dans la même palette.

**iOS (Safari/standalone) :**
- Fond blanc par défaut si `apple-touch-startup-image` absent.
- `apple-mobile-web-app-status-bar-style: black-translucent` est correct ✅.

### 4.4 Cohérence des icônes aux 3 tailles

| Contexte | Icône utilisée | Cohérence |
|---|---|---|
| Manifest (general) | logo-192.png + logo-512.png | ✅ |
| Manifest (maskable) | logo-512.png | ⚠️ Pas de 192 maskable |
| apple-touch-icon | logo-192.png | ✅ |
| Raccourcis manifest | favicon.png 64×64 | ❌ Trop petite |
| Splash Android | logo-512.png (Chrome génère) | ✅ |
| Splash iOS | (absent) | ❌ |

---

## 5. Navigation offline

### 5.1 Page offline

Il n'existe pas de fichier `public/offline.html` séparé. La page de fallback est **embarquée directement dans sw.js** sous forme de fonction `offlineFallbackHtml()`. Cette approche a des avantages et inconvénients :

| | Avantage | Inconvénient |
|---|---|---|
| Embarquée dans sw.js | Toujours disponible, pas de requête réseau supplémentaire | Modification nécessite un bump de version SW (`v13 → v14`) |
| Fichier séparé | Modifiable indépendamment | Doit être précaché explicitement, peut manquer |

**Contenu de la page offline (inline dans sw.js) :**
- Trilingue : **FR / EN / AR** détecté via `navigator.language` ✅
- Direction RTL pour AR ✅
- Bouton "Réessayer" (href="/") ✅
- Mention que les sourates récentes restent disponibles ✅
- Noscript fallback ✅
- Icône 📖 et Basmala ﷽ ✅

**Qualité : très bonne.** La page est fonctionnelle, lisible, multilingue, et cohérente avec la charte graphique de l'app.

### 5.2 Assets disponibles sans réseau (après première visite)

| Ressource | Cachée | Mécanisme |
|---|---|---|
| `/index.html` | ✅ Oui | Précache à l'install |
| `/assets/*.js` (21 chunks) | ✅ Oui | Précache via shell-assets.json |
| `/assets/*.css` | ✅ Oui | Précache via parsing index.html |
| `/logo-ui.webp` | ✅ Oui | Précache à l'install |
| `/favicon.png` | ✅ Oui | Précache à l'install |
| `/data/reciter-profiles.json` | ✅ Oui | Précache à l'install |
| `/fonts/sura_names.woff2` | ✅ Oui (SWR) | Cache-First au premier accès |
| Polices de lecture (hafs/warsh) | ✅ Oui (SWR) | Cache-First au premier accès |
| API Quran (sourates visitées) | ✅ Oui (SWR) | Stale-While-Revalidate |
| Texte coranique (sourates non visitées) | ❌ Non | Requiert réseau |
| Images récitateurs (CDN) | ⚠️ Partiel | SWR si visitées |
| Audio MP3 | ❌ Non | Pass-through, hors périmètre SW |
| `CACHE_QURAN_URLS` message | ✅ Oui | L'app peut pré-cacher des sourates via postMessage |

### 5.3 Ce qui N'est PAS caché (cross-origin)

- `api.alquran.cloud` / `api.quran.com` : **caché en SWR** si déjà visité, mais **absent si nouvelle sourate**
- CDN audio (`everyayah.com`, `audio.qurancdn.com`, `verses.quran.com`, `*.mp3quran.net`) : **jamais caché**
- Polices Google Fonts / CDN Cloudflare : **jamais cachées** (CSP connect-src les autorise mais le SW ne les intercepte pas — cross-origin, rule 7 = pass-through)
- Images CDN récitateurs (`static.qurancdn.com`, `www.assabile.com`) : **jamais cachées** (cross-origin)

---

## 6. Spécificités iOS PWA

### 6.1 Balises présentes dans dist/index.html

| Balise | Valeur | Statut |
|---|---|---|
| `apple-mobile-web-app-capable` | `yes` | ✅ Mode standalone iOS |
| `apple-mobile-web-app-status-bar-style` | `black-translucent` | ✅ Barre transparente (viewport-fit=cover) |
| `apple-mobile-web-app-title` | `MushafPlus` | ✅ Nom court sur l'écran d'accueil |
| `apple-touch-icon` | `/logo-192.png` | ✅ Icône 192×192 |
| `apple-touch-startup-image` | **ABSENT** | ❌ Flash blanc au lancement |
| `viewport-fit=cover` | Présent | ✅ Gère les encoches/Dynamic Island |

### 6.2 Problèmes connus iOS

**Flash blanc au lancement** (priorité haute)  
Sans `apple-touch-startup-image`, iOS affiche un fond blanc (~300-500 ms) avant que React monte le `SplashScreen`. Sur iPhone avec écran OLED (iPhone X+), le contraste entre fond blanc et fond sombre du SplashScreen est particulièrement visible.

**Swipe navigation (Edge Swipe)**  
Sur iOS en mode standalone, le swipe depuis le bord gauche de l'écran (geste "retour arrière" iOS) entre en conflit avec les gestes de navigation de l'app (ex : swipe pour changer de sourate). Pas de solution au niveau PWA — c'est une limitation iOS connue. Documenter dans les issues.

**Service Worker limité sur iOS < 16**  
- iOS 15.4+ : SW complet ✅  
- iOS 14.x : SW avec limitations (pas de Background Sync, pas de Push) ⚠️  
- iOS < 14 : SW non supporté ❌ (très minoritaire en 2026)

**Status bar style `black-translucent`**  
Correct avec `viewport-fit=cover`. Permet à l'app de s'étendre sous la barre de statut. Le contenu doit utiliser `env(safe-area-inset-top)` pour éviter les chevauchements avec les éléments cliquables.

**Local Storage / IndexedDB sur iOS**  
Limité à 50 MB par défaut sur iOS (hors permission). Pour une app Quran (texte + préférences + cache), ce n'est pas bloquant.

### 6.3 apple-touch-startup-image — Solution recommandée

```bash
# Installer l'outil de génération
npm install -D pwa-asset-generator

# Générer les splash screens depuis le logo 512
npx pwa-asset-generator public/logo-512.png public/splash \
  --background "#071A0F" \
  --splash-only \
  --padding "25%" \
  --index public/index.html \
  --manifest public/manifest.json
```

Cela génèrera ~25 images pour toutes les résolutions iPhone/iPad et injectera automatiquement les balises `<link rel="apple-touch-startup-image">` dans l'index.html.

---

## 7. Performance PWA

### 7.1 Taille du Service Worker

| Métrique | Valeur | Évaluation |
|---|---|---|
| Taille brute | 16 449 octets | ✅ Léger |
| Taille estimée gzip | ~5.5 kB | ✅ Excellent |
| Complexité | 4 stratégies + messaging + cache management | ✅ Bien structuré |
| Utilisation de Workbox | Non (custom) | ℹ️ Plus de contrôle, plus de maintenance |

**16.5 kB brut est tout à fait acceptable.** Les SW Workbox pré-générés font souvent 30-50 kB avec toutes les polyfills. Ici le code est minimal et bien commenté.

### 7.2 Taille de l'app shell précachée

| Composant | Taille non compressée | Taille gzip estimée |
|---|---|---|
| JS chunks (21 fichiers via shell-assets.json) | 1 226 kB | ~370 kB |
| CSS (`/assets/*.css` via index.html) | 892 kB | ~145 kB |
| `reciter-profiles.json` | 88 kB | ~18 kB |
| `logo-ui.webp` | 27 kB | ~26 kB (déjà compressé) |
| `index.html` + petits fichiers | ~20 kB | ~7 kB |
| **Total** | **~2 253 kB** | **~566 kB réseau** |

**Analyse chunking :**

| Chunk | Taille | Rôle probable |
|---|---|---|
| CKkb6Zyx.js | 155 kB | Entry point (vendor-react + app shell) |
| Buz8Mn2l2.js | 144 kB | Composant reader (lazy-loaded) |
| V-fMJQUW.js | 136 kB | Chunk vendor-icons (lucide-react) |
| DM9bEi6p.js | 67 kB | Composant recitation |
| bZZ8sFa5.js | 67 kB | Composant settings/UI |

CSS à 892 kB non compressé (145 kB gzip) est **élevé**. Cela suggère beaucoup de CSS potentiellement inutilisé (animations, thèmes dark/light, tous les domaines CSS chargés). Une analyse PurgeCSS / Tailwind treeshaking pourrait réduire ce chiffre.

### 7.3 Time-to-Interactive : SW cache vs cold

| Scénario | Estimation TTI |
|---|---|
| **Première visite (cold)** | 2.5–4 s (4G), 1.2–2 s (WiFi) |
| **Visite suivante (SW actif, tout en cache)** | 0.3–0.8 s |
| **Visite avec SW en attente (mise à jour)** | Identique au cache — mise à jour en background |
| **Visite offline (cache complet)** | 0.2–0.5 s |

Le SplashScreen est dismissé en **400 ms max** (`t2`), ce qui est cohérent avec le LCP d'une app cached. La stratégie Network-First pour HTML avec timeout 6 s est correcte : sur WiFi le `/index.html` est servi en < 100 ms, sur 4G en ~300-500 ms, bien en deçà du timeout.

### 7.4 Headers HTTP (Netlify)

La configuration `netlify.toml` est bien structurée :

| Route | Cache-Control | Correct ? |
|---|---|---|
| `/assets/*` | `public, max-age=31536000, immutable` | ✅ Cache permanent (hachés) |
| `/data/*` | `public, max-age=86400` | ✅ 24h pour données JSON |
| `/*` (html, sw.js…) | `public, max-age=0, must-revalidate` | ✅ Toujours revérifié |

Le SW (`/sw.js`) hérite de `/*` → `max-age=0, must-revalidate`. Le navigateur vérifie donc le SW à chaque ouverture. **C'est le comportement correct.** Si `max-age > 0` était appliqué à sw.js, les mises à jour seraient bloquées.

**Sécurité headers :** HSTS, X-Frame-Options: DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP tous présents ✅.

**CSP :** Très complète. Potentiellement trop stricte pour `script-src 'self'` sans `'unsafe-eval'` (React en mode prod ne nécessite pas eval, donc OK).

---

## 8. Score Lighthouse PWA estimé

> Note : Lighthouse PWA est un audit pass/fail (pas un score 0-100 comme Performance). Les catégories PWA sont regroupées sous "Installable", "PWA Optimized", et "Fast and Reliable".

### Installable

| Critère | Résultat estimé |
|---|---|
| Utilise HTTPS | ✅ PASS |
| Manifest `start_url` répond (200) | ✅ PASS |
| Manifest `icons` (192 + 512 + maskable) | ✅ PASS |
| Service Worker enregistré | ✅ PASS |
| SW contrôle la page | ✅ PASS (après install) |

### PWA Optimized

| Critère | Résultat estimé | Note |
|---|---|---|
| Page répond 200 offline | ✅ PASS | networkFirstHtml + fallback |
| `apple-touch-icon` ≥ 192×192 | ✅ PASS | /logo-192.png |
| `theme-color` méta présent | ✅ PASS | #0D5C4A |
| Splash screen configurable (iOS) | ❌ FAIL | apple-touch-startup-image absent |
| `viewport` avec `initial-scale` | ✅ PASS | |
| Pas d'usage de `alert()` bloquant | ✅ PASS (probable) | |
| Contenu ne descend pas sous la barre de nav | ✅ PASS | `viewport-fit=cover` + safe-area |

### Fast and Reliable

| Critère | Résultat estimé |
|---|---|
| TTI raisonnable | ✅ PASS (cache) / ⚠️ AVERAGE (cold) |
| Pas de ressources bloquantes | ✅ PASS |
| Images en format moderne (WebP) | ⚠️ PARTIAL (logo-ui.webp OK, logos PNG non convertis) |

### Verdict global Lighthouse PWA

**Score catégorie PWA : ~85-90/100** (si Lighthouse utilisait un score numérique).  
Principaux échecs : `apple-touch-startup-image` absent, `theme_color` mismatch manifest/HTML.

---

## 9. Améliorations avancées

### 9.1 Shortcuts (déjà implémenté — qualité)

Les 3 raccourcis sont bien choisis (Al-Fatiha, Al-Mulk, Al-Kahf). Améliorations possibles :
- Ajouter une icône dédiée 96×96 par raccourci (actuellement favicon 64×64)
- Ajouter un raccourci "Reprendre la lecture" avec `url: "/resume"` si une feature de reprise est implémentée

### 9.2 share_target (absent — opportunité forte)

Permettrait de recevoir des partages depuis d'autres apps (ex : URL d'un verset, texte arabe) :

```json
"share_target": {
  "action": "/share",
  "method": "GET",
  "params": {
    "title": "title",
    "text": "text",
    "url": "url"
  }
}
```

Cas d'usage : un utilisateur lit un verset dans une autre app, sélectionne "Partager → MushafPlus", et l'app s'ouvre sur ce verset. Très pertinent pour une app Quran.

### 9.3 protocol_handlers (absent — opportunité)

Enregistrer un protocole `web+quran://` :

```json
"protocol_handlers": [
  { "protocol": "web+quran", "url": "/surah/%s" }
]
```

Permettrait des liens `web+quran://67` (Al-Mulk) depuis d'autres apps ou messages.

### 9.4 file_handlers (opportunité conditionnelle)

Si l'app supporte la lecture de fichiers XML/JSON Quran (imports personnalisés) :

```json
"file_handlers": [
  { "action": "/import", "accept": { "application/json": [".json"] } }
]
```

À évaluer selon la roadmap.

### 9.5 Screenshots — améliorations qualité

| Problème | Fix |
|---|---|
| Screenshot mobile sans `form_factor: "narrow"` | Ajouter `"form_factor": "narrow"` → active le dialog d'install enrichi Chrome |
| 2 captures seulement | Chrome recommande 3-5 screenshots pour maximiser l'engagement |
| Screenshots en PNG (poids) | Convertir en WebP pour réduire le poids (actuel : 223 kB + 75 kB = 298 kB) |
| Label FR seulement | Ajouter `"platform": "..."` si possible, les labels restent en FR |

### 9.6 display_override pour Desktop

```json
"display_override": ["window-controls-overlay", "standalone"]
```

Sur Windows/macOS en mode PWA, `window-controls-overlay` libère la barre de titre pour y afficher le nom de la sourate courante. Très pertinent pour une app de lecture.

### 9.7 Periodic Background Sync

Pour les notifications de rappel de lecture quotidien (si Push absent) :

```js
// Dans l'app, une fois :
await registration.periodicSync.register('daily-reading-reminder', {
  minInterval: 24 * 60 * 60 * 1000
});
// Dans sw.js :
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reading-reminder') {
    event.waitUntil(showReminderNotification());
  }
});
```

Limité à Chrome Android, mais cohérent avec le public cible.

### 9.8 Optimisation logo-512.png

407 kB pour une icône 512×512 est excessif. Recette :

```bash
# Option 1 : oxipng (lossless)
oxipng --opt 4 --strip all public/logo-512.png
# Résultat attendu : 40-80 kB

# Option 2 : pngquant (lossy 256 couleurs)
pngquant 256 --quality=85-95 --strip --output public/logo-512.png public/logo-512.png
# Résultat attendu : 30-60 kB
```

### 9.9 Icône maskable dédiée 192×192

Créer `public/logo-192-maskable.png` avec la zone sûre de 80 % :

```json
{
  "src": "/logo-192-maskable.png",
  "sizes": "192x192",
  "type": "image/png",
  "purpose": "maskable"
}
```

Sur Android avec lanceurs qui appliquent un masque (cercle, squircle), l'icône maskable évite des coupures de motif.

### 9.10 id et scope dans le manifest

```json
{
  "id": "/",
  "scope": "/",
  ...
}
```

Ces deux lignes renforcent la stabilité de l'identité PWA et la clarté de portée.

---

## 10. Tableau récapitulatif — Priorités

| Priorité | Problème | Impact | Fix recommandé |
|---|---|---|---|
| **P0 — Critique** | `theme_color` mismatch : manifest `#1B5E3A` vs HTML `#0D5C4A` | Barre de titre différente à l'install vs en mode app | Aligner les deux sur `#0D5C4A` (valeur HTML) |
| **P0 — Critique** | `apple-touch-startup-image` absent | Flash blanc 300-500 ms au lancement iOS | `npx pwa-asset-generator logo-512.png public/splash --splash-only` |
| **P1 — Important** | `id` absent du manifest | Risque de doublon PWA si URL change | Ajouter `"id": "/"` |
| **P1 — Important** | `scope` absent du manifest | Validation incomplète Lighthouse/PWABuilder | Ajouter `"scope": "/"` |
| **P1 — Important** | `logo-512.png` = 407 kB | Installation lente, cache gonflé | Re-exporter avec oxipng/pngquant → < 60 kB |
| **P1 — Important** | `background_color` (#FEFAF3 beige) ≠ fond splash React (#071A0F) | Discontinuité visuelle Android à l'ouverture | Changer `background_color` vers `#071A0F` dans manifest |
| **P2 — Modéré** | Icônes shortcuts = favicon 64×64 (trop petites) | Icônes floues/absentes dans l'UI shortcuts | Créer des icônes 96×96 dédiées |
| **P2 — Modéré** | Pas d'icône maskable 192×192 | Masquage incorrect sur certains lanceurs Android | Créer `logo-192-maskable.png` |
| **P2 — Modéré** | Screenshot mobile sans `form_factor: "narrow"` | Dialog d'install enrichi Chrome non déclenché | Ajouter `"form_factor": "narrow"` |
| **P2 — Modéré** | `display_override` absent | Pas de Window Controls Overlay sur desktop | Ajouter `["window-controls-overlay","standalone"]` |
| **P2 — Modéré** | SW install throw sur `shell-assets.json` 404 | Installation SW échoue complètement | Fallback gracieux : `console.warn` + skip |
| **P3 — Amélioration** | `share_target` absent | Pas de réception de partages depuis autres apps | Ajouter `share_target` dans manifest + route `/share` |
| **P3 — Amélioration** | Background Sync absent | Pas de sync favoris offline→online | Implémenter `BackgroundSync` pour les bookmarks |
| **P3 — Amélioration** | Push Notifications absent | Pas de rappels de lecture | Implémenter Push ou Periodic Background Sync |
| **P3 — Amélioration** | Screenshots en PNG (298 kB total) | Téléchargement inutile lors du dialog d'install | Convertir en WebP |
| **P3 — Amélioration** | `protocol_handlers` absent | Pas de deep linking `web+quran://` | Ajouter si la roadmap le prévoit |
| **ℹ️ Info** | SW (16.5 kB) non minifié | Aucun — 5.5 kB gzip, acceptable | Ne pas minifier les SW (débogage en prod) |
| **ℹ️ Info** | Pas de Workbox | Code custom à maintenir | Acceptable — contrôle total, code propre |
| **✅ Bon** | Cycle de vie mise à jour complet | PWAUpdateBanner + skipWaiting + controllerchange | Rien à faire |
| **✅ Bon** | Fallback offline trilingue FR/EN/AR | UX soignée | Rien à faire |
| **✅ Bon** | Headers HTTP Netlify | Cache-Control, HSTS, CSP complets | Rien à faire |
| **✅ Bon** | `CACHE_QURAN_URLS` message API | Pré-cache à la demande des sourates | Rien à faire |

---

*Audit réalisé sur la branche `perf/load-times-and-bug-fixes` — commit `173b83b`*  
*Fichiers lus : `public/manifest.json`, `public/sw.js`, `dist/index.html`, `netlify.toml`, `src/main.jsx`, `src/components/SplashScreen.jsx`, `src/components/PWAUpdateBanner.jsx`, `vite.config.js`, `dist/shell-assets.json`*
