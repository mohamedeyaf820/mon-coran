# Audit de couverture de tests — MushafPlus

> Généré le 2026-07-30 — branche `perf/load-times-and-bug-fixes`

---

## Résumé exécutif

| Métrique | Valeur |
|---|---|
| Tests unitaires | **68** (tous verts, 0 failure) |
| Specs E2E Playwright | **27 fichiers, ~78 tests** |
| Couverture globale (statements) | **74.78%** |
| Couverture branches | **55.55%** |
| Couverture fonctions | **58.30%** |
| CI active | ✅ GitHub Actions (chromium ×4 shards, firefox, webkit, PWA offline) |
| Domaines sans aucun test | **8** (voir §2) |

---

## 1. Inventaire des tests existants

### 1.1 Tests unitaires (`tests/*.test.mjs`) — 68 tests, Node.js test runner natif

| Fichier | Tests | Ce que couvre |
|---|---|---|
| `audio-player-utils.test.mjs` | 5 | `formatAudioTime`, `getReciterCooldownMs`, `clampCardPosition`, labels i18n (fr/en/ar), `pausableAnimationLoop` start/stop/dédup RAF |
| `crypto-protection.test.mjs` | ~12 | `cryptoUtil` chiffrement/déchiffrement PBKDF2, rotation de clé, intégrité HMAC |
| `navigation-storage.test.mjs` | 8 | Parsing URL (`/surah/x/y`, `/page/n`, `/juz/n`, `/duas`, `/privacy`), clamping invalides, `saveSettings`/`getSettings` round-trip chiffré, gestion polices par riwaya |
| `network-policy.test.mjs` | ~6 | `isAllowedExternalUrl`, CSP production, headers Netlify/Vercel, sanitiseur SVG, injection HTML |
| `performance-metrics.test.mjs` | ~4 | TTFB, DOM interactive, page load enregistrés localement |
| `phase7-features.test.mjs` | ~6 | Index thématique (unicité, refs valides), plan de mémorisation daily queue bornée |
| `pwa-sw.test.mjs` | ~8 | Hachage de manifeste SW, stratégies cache, purge entrées obsolètes |
| `quran-request-dedupe.test.mjs` | ~4 | Déduplications requêtes Quran.com simultanées |
| `recitation-performance.test.mjs` | ~6 | Cooldown CDN adaptatif, préchargement ayahs, budget réseau |
| `reciters-audio.test.mjs` | 6 | IDs uniques, métadonnées compatibles player, portraits Assabile, bio sourcée Warsh, URLs mp3 (Islamic, EveryAyah, mp3quran) |
| `search-intelligence.test.mjs` | 2 | Sanitisation input, fallback sans worker |
| `security-storage.test.mjs` | 8 | Whitelist HTTPS, CSP sans `unsafe-eval`, headers déploiement, sanitiseur SVG/HTML, schéma localStorage, registre téléchargements offline |
| `storage-quota.test.mjs` | 4 | Rapports usage/capacité, blocage download dépassant la réserve, estimation audio |
| `tafsir-service.test.mjs` | 4 | Clés stables, IDs numériques, fallback source défaillante |
| `tajwid-segments.test.mjs` | 3 | Diacritiques arabes attachés au glyph de base, alif superscrit normalisé |
| `ui-i18n.test.mjs` | 5 | Bouton fermeture modal/sheet suit la langue active, player compact safe-area, labels toolbar |

**Total mesuré par `npm run test:coverage` : 68 tests, 0 fail, durée ~2.5 s**

---

### 1.2 Specs E2E Playwright (`tests/e2e/*.spec.mjs`) — 27 fichiers

| Fichier | Tests | Ce que couvre |
|---|---|---|
| `a11y-smoke.spec.mjs` | 6 | Skip-link mobile, toast RTL, landmarks+focus clavier, sidebar inert/aria-modal, trap focus Tab×12, contraste recherche thème sombre |
| `audio-fallback.spec.mjs` | 3 | Clic verset sans play audio, bouton play explicite déclenche, Warsh Mushaf un seul marqueur d'ayah actif |
| `audio-player-options.spec.mjs` | 3 | Minimize/restore desktop, mobile Warsh : modal récitants 9 voix, sélection visuelle distincte, fiche Ibrahim Al-Dosari avec bio+portrait |
| `axe-accessibility.spec.mjs` | 3 | axe-core WCAG 2.1 AA sur home, lecteur+recherche, page privacy |
| `cross-browser-smoke.spec.mjs` | 1 | Firefox + WebKit : home H1, legal page, lecteur surah/1 + `lang="fr"` |
| `day-theme-consistency.spec.mjs` | 6 | Palette CSS tokens (light/sepia/dark) stables home→lecteur→retour, contrastes cartes sombre, reprise lecture page conserve URL, sidebar tabs lisibles, recherche backdrop translucide, dark sidebar+search contrastes |
| `memorization.spec.mjs` | 3 | Mode mémorisation Hafs actif+cache texte, switch Hafs→Warsh sans cassure rendu, désactivation restaure texte |
| `modal-a11y.spec.mjs` | 4 | SearchModal focus+Escape, Tab trap 8 fois, Bookmarks modal Ctrl+B, role=dialog+aria-modal=true |
| `phase7-features.spec.mjs` | 6 | Gestionnaire offline registre, parcours mémorisation séance→lecteur, index thématique filtre+nav, cloud bloqué sans consentement, export MD filename, mobile contenu 390px+kbd tabs |
| `phase8-performance.spec.mjs` | 3 | Rapid double-click play → seul dernier actif <1.5s, virtualisation <40 cards sur 160 ayahs, métriques perf localStorage |
| `privacy-geolocation.spec.mjs` | 2 | Pas de requête géolocalisation au démarrage, pas de tracking externe |
| `privacy-protection.spec.mjs` | 1 | Mode protégé : chiffrement records IDB, reload→écran verrou, mauvaise phrase→erreur, bonne phrase→home, rotation clé, désactivation |
| `pwa-offline.spec.mjs` | 2 | App shell rechargeable hors-ligne, texte Coran surah visitée conservé offline |
| `reading-fonts.spec.mjs` | 2 | Sélection police Hafs appliquée list+Mushaf+reload persistance, Warsh font list+Mushaf |
| `reading-scroll.spec.mjs` | 2 | Scroll desktop fonctionne+retour haut, scroll mobile actif |
| `reading-stability.spec.mjs` | 2 | Refresh Mushaf sans overlay bloquant, riwaya Warsh + back history sans voile |
| `recitation-reading-polish.spec.mjs` | 5 | Mobile recitation cards layout+touch targets, desktop fiche biographie 2 cols, pas de React render loop, mobile page/juz context+typographie |
| `responsive-density.spec.mjs` | 8 | Home mobile/tablet texte+icônes, lecteur mobile header≤56px+toolbar+audio dock, sidebar+settings+audio modal ≤390px, tablet compact, small phone 320px actions+search, typographie progressive 4 viewports, duas page, landscape court |
| `riwaya-loading-stability.spec.mjs` | 2 | Switch riwaya masque texte stale jusqu'à données prêtes (contrôle réseau), juz Warsh utilise fichiers sourate avant legacy full Quran |
| `startup-loading.spec.mjs` | 1 | Premier chargement : 1 CSS, ≤5 modulepreload, ≤45 requêtes, logo <40 Ko, pas de logo.png, pas de QuranDisplay.jsx, pas de requête Quran.com |
| `visual-debug.spec.mjs` | 2 | Debug screenshots home + lecteur (exclu du CI via `-debug.spec.mjs`) |
| `visual-home-surah-cards.spec.mjs` | 1 | Screenshots 9 combos (3 viewports × 3 thèmes) — capture sans assertions sur contenu |
| `visual-navbar-audio.spec.mjs` | 2 | Screenshots navbar + audio player |
| `visual-regression.spec.mjs` | 1 | `toHaveScreenshot` carte sourate × 3 thèmes (snapshot diff ≤2.5%) |
| `visual-surah-zones.spec.mjs` | 1 | Screenshot zones surah |
| `warsh-debug.spec.mjs` | 3 | **Exclut du CI** (`-debug`). Debug Warsh cache IndexedDB, requêtes réseau. Tests fragiles (voir §4) |
| `word-by-word-layout.spec.mjs` | 1 | Mobile mot-à-mot : 4 blocs alignés RTL, typographie, tooltip masqué, lang=fr demandé |

---

## 2. Couverture par domaine

| Domaine | Statut | Commentaire |
|---|---|---|
| Navigation home → surah → retour | ✅ Couvert | `day-theme-consistency`, `a11y-smoke`, `cross-browser-smoke` |
| Lecture audio (play/pause) | ✅ Partiel | Play via bouton ✅, pause ❌ pas de test direct stop, skip avant/arrière ❌ |
| Failover CDN audio | ✅ Couvert | `audio-fallback` : rejet `NotAllowedError` géré |
| Changement de récitateur | ✅ Partiel | Modal liste Warsh testée, sélection effective + changement URL audio ❌ |
| Changement de thème (clair/sombre/sépia) | ✅ Couvert | `day-theme-consistency` : palette + header + contrastes pour les 3 |
| Changement de riwaya (Hafs/Warsh) | ✅ Couvert | `riwaya-loading-stability` : skeleton, données, juz |
| Recherche (modale, résultats) | ✅ Partiel | Ouverture/fermeture/focus ✅, résultats de recherche et navigation vers ayah ❌ |
| Favoris / Marque-pages | ❌ Non couvert | Ctrl+B ouvre modal ✅, add/remove bookmark ❌, persistance ❌ |
| Paramètres langue (fr/en/ar) | ❌ Non couvert | Langue seedée en localStorage, jamais changée via UI en test |
| Paramètres display (taille police, tajwid) | ✅ Partiel | Taille testée via responsive, tajwid activé en seed WBW uniquement |
| Paramètres audio (volume, vitesse) | ❌ Non couvert | Aucun test des sliders de l'audio modal |
| Mode Mushaf (vue page) | ✅ Partiel | `reading-stability` + `audio-fallback` switch Mushaf/liste ✅, navigation page Mushaf ❌ |
| Sidebar (navigation sourates/juz/page) | ✅ Partiel | Ouverture/fermeture/focus ✅, clic sourate dans sidebar → navigation ❌ |
| Mode hors-ligne (SW cache) | ✅ Couvert | `pwa-offline` : shell + texte Quran cached |
| PWA install flow | ❌ Non couvert | Aucun test du prompt A2HS ou manifest |
| RTL / langue arabe | ✅ Partiel | Toast arabe "اختبار" ✅, UI complète en arabe ❌ |
| Responsive mobile | ✅ Couvert | `responsive-density` : 8 tests sur 320/390/820/844/1280/1440/1920 |
| Accessibilité a11y smoke | ✅ Couvert | `a11y-smoke` + `axe-accessibility` WCAG 2.1 AA |
| Erreurs réseau (API down) | ❌ Non couvert | Requêtes mockées avec succès, jamais simulées en échec (500, timeout, offline) |
| Scroll infini lecteur | ✅ Couvert | `reading-scroll` : scroll + retour haut, `phase8-performance` : virtualisation |
| Mode mémorisation | ✅ Couvert | `memorization` : activation, masque texte, désactivation |
| Mode mot-à-mot | ✅ Couvert | `word-by-word-layout` + `audio-fallback` WBW click |
| Tafsir panel | ❌ Non couvert | Aucune spec |
| Khatma / Wird / Streak | ❌ Non couvert | Aucune spec E2E |
| Export / Données portables | ✅ Partiel | Export MD filename ✅ via `phase7-features`, contenu export ❌ |
| Confidentialité / Chiffrement | ✅ Couvert | `privacy-protection` : cycle complet active/verrou/rotation/désactive |
| Performance chargement initial | ✅ Couvert | `startup-loading` + `phase8-performance` |
| Visuel régression snapshot | ✅ Partiel | 3 screenshots surah-card par thème, pas de lecteur complet |

---

## 3. Chemins critiques sans tests

### 3.1 Scénarios utilisateur importants non couverts

1. **Ajout / suppression d'un favori (bookmark)** : L'utilisateur clique sur l'étoile d'un ayah, vérifie que le compteur passe à 1, recharge → bookmark persiste.
2. **Changement de langue via l'interface** : Basculer fr→en→ar depuis les paramètres, vérifier que les labels UI et l'attribut `<html lang>` changent, que les labels audio sont mis à jour.
3. **Skip suivant / précédent audio pendant lecture** : Clic bouton "suivant", vérifier que le marqueur d'ayah actif se déplace.
4. **Sélection d'un récitateur et démarrage de lecture** : Ouvrir la modal récitants, cliquer sur un récitant différent, vérifier que l'URL audio construite correspond au nouveau récitant.
5. **Navigation dans la sidebar vers une sourate** : Cliquer sur "Sourate 36 (Ya-Sin)" dans la sidebar, vérifier la navigation URL et le chargement des versets.
6. **Requête Quran.com échoue (500 ou timeout)** : Vérifier qu'un message d'erreur lisible s'affiche, que l'app ne crash pas, qu'un bouton "réessayer" est présent.
7. **Volume slider** : Modifier le volume à 0 puis à 50%, vérifier que `audioElement.volume` reflète la valeur.
8. **Tafsir panel** : Activer le tafsir d'un ayah, vérifier que le panel s'ouvre avec le texte du tafsir source sélectionné.
9. **Copier un ayah** : Cliquer sur l'action "Copier", vérifier la notification toast de confirmation.
10. **Navigation Juz** : Depuis `/juz/1`, cliquer "Juz suivant", vérifier `/juz/2` et chargement des versets.

### 3.2 Chemins de code critiques non couverts

- **`audioService.js` lignes 259-287, 343-348, 416-478** : logique retry + timeout de chargement audio. Couverture actuelle : **52.91% statements**.
- **`AppContext.jsx` reducer actions** : 24 `case` dont `TOGGLE_BOOKMARKS`, `TOGGLE_WIRD`, `TOGGLE_HISTORY`, `TOGGLE_PLAYLIST`, `NAVIGATE_JUZ`, `NAVIGATE_PAGE`, `SET_LANG`, `SET_PLAYING` — jamais testés unitairement.
- **`quranComAPI.js` lignes 150-188, 295-349, 402-433** : pagination, fallback v3, retry avec abort. Couverture : **54.03%**.
- **`storageService.js` lignes 285-311, 648-691** : chiffrement migration et serialisation profonde. Couverture branches : **63.11%**.
- **`RecitationService.js` lignes 41-107** : playlist Surah-mode, gestion erreur. Couverture : **42.06%**.

---

## 4. Qualité des tests existants

### 4.1 Sélecteurs fragiles

| Fichier | Problème | Ligne |
|---|---|---|
| `warsh-debug.spec.mjs` | `page.locator('text=WARSH')` — sélecteur texte, casse-sensible | 33, 138 |
| `warsh-debug.spec.mjs` | `page.locator('[aria-label="Search"], button:has-text("Rechercher"), .search-icon')` — sélecteur CSS de style, non accessible | 40 |
| `memorization.spec.mjs` | `page.locator("button.srh-toggle").filter({ hasText: /morisation/ })` — classe CSS interne + regex partielle | 53 |
| `visual-home-surah-cards.spec.mjs` | `page.waitForSelector(".hp-grid.hp-grid--surah .hp-card")` — classe CSS composite (2 classes) | 60 |
| `responsive-density.spec.mjs` | `page.locator(".srh-root .arabic-font-controls--compact")` — classe CSS interne de composant | 146 |

### 4.2 Tests trop larges (screenshot entier) vs tests ciblés

- `visual-home-surah-cards.spec.mjs` : 9 screenshots fullPage sans **aucune assertion** sur le contenu DOM — uniquement `toBeVisible()`. Si le contenu change de façon incorrecte mais reste visible, le test passe.
- `warsh-debug.spec.mjs` : 3 tests prennent des screenshots de debug (`test-results/warsh-surah4.png`) sans assertions fonctionnelles sur l'état de l'application. C'est un fichier de debug, pas une spec de régression.
- `visual-navbar-audio.spec.mjs`, `visual-surah-zones.spec.mjs` : mêmes problèmes, screenshots sans assertions sur contenu.

### 4.3 Waits hardcodés

```
warsh-debug.spec.mjs:8   await page.waitForTimeout(3000);
warsh-debug.spec.mjs:56  await page.waitForTimeout(500);
warsh-debug.spec.mjs:196 await page.waitForTimeout(3000);
memorization.spec.mjs:108 await page.waitForTimeout(1000);
recitation-reading-polish.spec.mjs:75 await page.waitForTimeout(180);
pwa-offline.spec.mjs:37  await page.waitForTimeout(250);
pwa-offline.spec.mjs:71  await page.waitForTimeout(500);
```

Les `waitForTimeout` dans `warsh-debug` totalisent **~11 secondes de sleep fixe** par test. Les autres sont plus courts mais restent des risques de flakiness sur CI.

### 4.4 Tests dépendant du réseau externe

- **`audio-fallback.spec.mjs`** : ne mocke pas les requêtes Quran.com. Charge `/surah/1` réel → dépend de `api.quran.com` → risque timeout CI.
- **`memorization.spec.mjs`** : `page.goto("/")` + `waitForLoadState("networkidle")` sans mock réseau → dépend de l'état de l'API externe.
- **`cross-browser-smoke.spec.mjs`** : charge `/surah/1` sans mock → même risque.
- **`a11y-smoke.spec.mjs`** : `openReader` charge `/surah/4` et attend `.qc-ayah-text-ar` → réseau réel.

Nota : sur CI, les tests E2E sont lancés sur le build `dist/` servi en preview, donc les assets statiques sont locaux. Mais les **appels API** (`api.quran.com`) restent réels.

---

## 5. Tests de régression manquants

### 5.1 Bugs corrigés récents sans test de régression associé

| Commit | Bug corrigé | Test de régression existant ? |
|---|---|---|
| `3915871` `fix(audit)` | React bugs (render loops, race conditions) | ✅ Partiel — `recitation-reading-polish` teste l'absence de "Maximum update depth exceeded" |
| `3915871` `fix(audit)` | a11y landmarks dupliqués, i18n typos | ✅ `axe-accessibility` + `ui-i18n.test.mjs` |
| `3915871` `fix(audit)` | CSS dark-mode overrides | ✅ `day-theme-consistency` contraste sidebar sombre |
| `76e8571` `fix(header)` | Drag hook inutilisé supprimé | ❌ Aucun test |
| `76f857e` `fix(tafsir)` | Boucle `useEffect` self-aborting fetch dans `AyahActions` | ❌ Aucun test sur le comportement tafsir E2E |
| `d0d7e28` `fix(header)` | Pill nav compact | ❌ Aucun test layout header pill |
| `2ecdd17` `fix(e2e)` | Sélecteur "Voir tout" aligné sur phase7 | ✅ le test existait, le sélecteur a été corrigé |
| `173b83b` `fix(ci)` | Radix manual chunks revertés (bloated initial JS) | ✅ `startup-loading` vérifie ≤30 chunks JS |

### 5.2 Bugs critiques connus — couverture

| Zone | Risque | Couvert ? |
|---|---|---|
| `AppContext` reducer `SET_PLAYING` race condition | Deux clics rapides → état incohérent | ✅ `phase8-performance` teste rapid double-click |
| `AudioService` retry sur timeout 12s | Erreur silencieuse, pas de feedback UI | ❌ Non couvert |
| `AudioPlayer` `onError` → fallback CDN | URL incorrecte → switch CDN | ❌ Non couvert |
| `storageService` corruption JSON → fallback | Données corrompues en prod | ✅ `security-storage` teste `readLocalStorageWithSchema` fallback |
| Warsh juz scoped files | Legacy fallback indésirable | ✅ `riwaya-loading-stability` vérifie `legacyRequestCount === 0` |
| Double marker ayah en Warsh Mushaf | Régression visuelle confirmée | ✅ `audio-fallback` test ligne 115-162 |

---

## 6. Recommandations de tests à ajouter

### 6.1 Specs Playwright à créer (domaines non couverts)

#### 6.1.1 `bookmark-crud.spec.mjs` — Favoris
```js
test("ajout/suppression d'un bookmark persiste après rechargement", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings",
    JSON.stringify({ splashDone: true, showHome: false, displayMode: "surah",
      lang: "fr", riwaya: "hafs", lastPosition: { surah: 1, ayah: 1 } })));
  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });

  // Ajout
  const bookmarkBtn = page.locator("#ayah-1 .ayah-action--bookmark").first();
  await expect(bookmarkBtn).toHaveAttribute("aria-pressed", "false");
  await bookmarkBtn.click();
  await expect(bookmarkBtn).toHaveAttribute("aria-pressed", "true");

  // Persistance après reload
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#ayah-1 .ayah-action--bookmark").first())
    .toHaveAttribute("aria-pressed", "true");

  // Suppression
  await page.locator("#ayah-1 .ayah-action--bookmark").first().click();
  await expect(page.locator("#ayah-1 .ayah-action--bookmark").first())
    .toHaveAttribute("aria-pressed", "false");
});
```

#### 6.1.2 `language-switch.spec.mjs` — Changement de langue
```js
test("basculer la langue fr→en→ar change les labels UI et l'attribut html[lang]", async ({ page }) => {
  await page.goto("/surah/1");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");

  // Ouvrir paramètres → Langue → English
  await page.locator(".mp-header__more").first().click();
  await page.getByRole("button", { name: /Paramètres/i }).click();
  await page.getByRole("radio", { name: "English" }).check();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: /Search/i }).first()).toBeVisible();

  // Arabe
  await page.getByRole("radio", { name: /العربية/ }).check();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
```

#### 6.1.3 `audio-controls.spec.mjs` — Play/pause/skip
```js
test("play démarre, pause arrête, skip-next avance l'ayah actif", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function() {
      this.dispatchEvent(new Event("play")); return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function() {
      this.dispatchEvent(new Event("pause"));
    };
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      splashDone: true, showHome: false, displayMode: "surah",
      lang: "fr", riwaya: "hafs", lastPosition: { surah: 1, ayah: 1 } }));
  });
  await page.goto("/surah/1");
  const playBtn = page.locator(".mp-player-play-btn").first();
  await playBtn.click();
  await expect(playBtn).toHaveAttribute("aria-label", "Pause");
  await playBtn.click();
  await expect(playBtn).toHaveAttribute("aria-label", "Lecture");

  const skipBtn = page.locator(".mp-player-next-btn").first();
  await skipBtn.click();
  await expect(page.locator(".cpv-verse--playing, .qc-list-card--playing").first())
    .toContainText("2"); // ayah 2 actif
});
```

#### 6.1.4 `api-error-recovery.spec.mjs` — Erreurs réseau
```js
test("API Quran.com renvoie 500 : message d'erreur visible, app stable", async ({ page }) => {
  await page.route(url => url.hostname === "api.quran.com",
    route => route.fulfill({ status: 500, body: "Server Error" }));
  await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings",
    JSON.stringify({ splashDone: true, showHome: false, displayMode: "surah",
      lang: "fr", riwaya: "hafs" })));
  await page.goto("/surah/2");
  // L'app ne doit pas crasher
  await expect(page.locator(".mp-header")).toBeVisible({ timeout: 15_000 });
  // Un indicateur d'erreur doit être visible
  const errorEl = page.locator('[role="alert"], .error-banner, .qc-error').first();
  await expect(errorEl).toBeVisible({ timeout: 10_000 });
  // Pas de JS uncaught
  const errors = [];
  page.on("pageerror", e => errors.push(e));
  await page.waitForTimeout(2000);
  expect(errors).toHaveLength(0);
});
```

#### 6.1.5 `sidebar-navigation.spec.mjs` — Navigation sidebar
```js
test("cliquer sur Sourate 36 dans la sidebar navigue vers /surah/36", async ({ page }) => {
  await page.goto("/surah/1");
  await page.getByRole("button", { name: /Menu/i }).first().click();
  const sidebar = page.locator("#sidebar");
  await expect(sidebar).toHaveClass(/\bopen\b/);

  await sidebar.getByRole("textbox", { name: /Rechercher une sourate/i }).fill("Ya-Sin");
  await sidebar.getByRole("button", { name: /Ya.*Sin|36/i }).first().click();

  await expect(page).toHaveURL(/\/surah\/36/);
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 30_000 });
});
```

#### 6.1.6 `reciter-change.spec.mjs` — Changement récitant effectif
```js
test("sélectionner un nouveau récitant met à jour l'URL audio construite", async ({ page }) => {
  const audioRequests = [];
  page.on("request", req => {
    if (req.url().includes(".mp3")) audioRequests.push(req.url());
  });
  // Patch play pour intercepter sans réseau réel
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      splashDone: true, showHome: false, displayMode: "surah",
      riwaya: "hafs", lastPosition: { surah: 1, ayah: 1 } }));
  });
  await page.goto("/surah/1");

  // Ouvrir modal options audio
  await page.locator(".mp-player-play-btn").first().click();
  await page.locator(".mp-player-options-trigger").first().click();
  const modal = page.locator(".audio-player-modal");
  await expect(modal).toBeVisible();

  // Sélectionner Abu Bakr Ash-Shaatree
  await modal.getByRole("button", { name: /Abu Bakr.*Shaatree/i }).click();
  await expect(modal.locator('[data-state="selected"]'))
    .toContainText(/Shaatree/i);

  // Vérifier que les URLs MP3 construites correspondent à EveryAyah
  await expect.poll(() => audioRequests.some(url => url.includes("everyayah.com")))
    .toBe(true);
});
```

### 6.2 Tests unitaires à ajouter

#### `AppContext.reducer.test.mjs`
Tester chaque `case` du reducer directement, sans React :
```js
import { reducer } from "../src/context/AppContext.jsx";
// SET_RIWAYA : vérifie que le récitant est remplacé si incompatible
// TOGGLE_MEM_MODE : vérifie isMemorizing toggle
// NAVIGATE_JUZ : vérifie clampage 1-30
// SET_LANG : vérifie que "xx" invalide tombe sur "fr"
// SET_THEME : vérifie normalisation "jour"→"light"
```

#### `audioService.onError.test.mjs`
```js
// Tester isTrustedAudioUrl() sur une batterie d'URLs
// Tester buildUrl() pour tous les cdnType (islamic, everyayah, mp3quran-surah)
// Tester le retry après erreur (inject mock Audio avec onerror)
```

#### `i18n.t.test.mjs`
```js
// Tester la fonction t() sur les clés manquantes → fallback anglais
// Tester les pluriels arabes (règle spécifique)
// Tester que toutes les clés fr/en/ar sont présentes (diff des 3 objets)
```

### 6.3 Tests d'intégration

- **`AppContext` + `storageService`** : monter un `AppProvider` en test, dispatcher des actions, vérifier que `getSettings()` reflète l'état après `saveSettings`.
- **`AudioService` + `audioPlaylist`** : tester la séquence normalizePlaylistAyahs → buildUrl → gestion erreur.

---

## 7. Infrastructure de tests

### 7.1 Playwright config (`playwright.config.mjs`)

| Paramètre | Valeur |
|---|---|
| Timeout par test | 60 000 ms |
| Timeout assertion | 10 000 ms |
| Retries CI | 2 |
| Workers CI | 1 (séquentiel) |
| Workers local | 2 |
| Navigateurs testés | Chromium (tous tests), Firefox + WebKit (cross-browser-smoke uniquement), PWA offline (projet dédié) |
| Tests ignorés | `**/*-debug.spec.mjs` (chromium), `**/pwa-offline.spec.mjs` (chromium standard) |
| Serveur web | `vite preview` sur port 4173, réutilisé si existant |
| Snapshots visuels | diff ≤ 2.5%, animations désactivées |

**Anomalie** : Firefox et WebKit ne testent que 1 spec (`cross-browser-smoke`). Les 26 autres specs ne tournent jamais sur Firefox/WebKit en CI.

### 7.2 CI (`.github/workflows/tests.yml`)

```
push: main, master, perf/load-times-and-bug-fixes
pull_request: main, master
```

Pipeline :
1. `quality` : lint → `test:coverage` → `build:ci` (budgets CSS/bundle/security) → `npm audit` → `audit:warsh`
2. `chromium` (needs quality) : 4 shards parallèles avec le `dist/` buildé en artefact
3. `compatibility` (needs quality) : Firefox + WebKit (cross-browser-smoke uniquement)
4. `pwa` (needs quality) : `pwa-offline.spec.mjs`

**Points forts** :
- Sharding 4×1 chromium : temps moyen CI ~3 min par shard
- Artefact `dist/` partagé : les E2E testent exactement le build de prod
- `test:coverage` : couverture mesurée à chaque push

**Points faibles** :
- Les specs E2E qui font des requêtes API réelles (`audio-fallback`, `memorization`, `a11y-smoke`) peuvent être flaky selon la disponibilité de `api.quran.com`
- Pas de cache playwright browsers entre runs → installation lente (~2 min)
- Pas de job E2E sur Firefox/WebKit pour les specs non-smoke

### 7.3 Données de test : mocks vs réseau réel

| Spec | Stratégie réseau | Risque flakiness |
|---|---|---|
| `riwaya-loading-stability` | `page.route()` mock total | Stable ✅ |
| `word-by-word-layout` | `page.route("https://api.quran.com/**")` mock total | Stable ✅ |
| `phase8-performance` | `page.route()` mock Quran.com | Stable ✅ |
| `startup-loading` | `page.route()` mock API | Stable ✅ |
| `pwa-offline` | SW réel + `context.setOffline(true)` | Moyen ⚠️ (timing SW) |
| `audio-fallback` | Réseau réel API | Risque ⚠️ |
| `memorization` | `waitForLoadState("networkidle")` réseau réel | Risque ⚠️ |
| `a11y-smoke` | Réseau réel | Risque ⚠️ |
| `cross-browser-smoke` | Réseau réel | Risque ⚠️ |

---

## 8. Score de couverture estimé par domaine (0-100%)

| Domaine | Score E2E | Score Unit | Score Global estimé |
|---|---|---|---|
| Navigation routes URL | 85% | 95% | **90%** |
| Thèmes (tokens CSS + contrastes) | 90% | 0% | **70%** |
| Audio play/pause | 40% | 60% | **45%** |
| Récitants (données, URLs) | 50% | 95% | **65%** |
| Riwaya switch | 85% | 70% | **80%** |
| Recherche | 60% | 75% | **65%** |
| Favoris/Bookmarks | 10% | 0% | **5%** |
| Paramètres langue | 5% | 20% | **10%** |
| Mode mémorisation | 75% | 80% | **78%** |
| Mot-à-mot | 70% | 30% | **55%** |
| Responsive/layout mobile | 90% | 20% | **70%** |
| Accessibilité a11y | 85% | 10% | **65%** |
| Confidentialité/crypto | 80% | 75% | **78%** |
| PWA/offline | 75% | 60% | **70%** |
| Performance chargement | 80% | 50% | **70%** |
| Erreurs réseau | 5% | 0% | **3%** |
| Tafsir | 0% | 50% | **15%** |
| Sidebar navigation | 40% | 0% | **25%** |
| Khatma/Wird/Streak | 0% | 0% | **0%** |
| **GLOBAL** | — | **74.78%** | **~58%** |

---

## 9. Plan de test recommandé — 10 specs prioritaires

| # | Spec à créer | Priorité | Effort | Impact |
|---|---|---|---|---|
| 1 | **`api-error-recovery.spec.mjs`** | 🔴 Critique | 3h | Couvre le chemin non testé le plus risqué en prod (API down) |
| 2 | **`audio-controls.spec.mjs`** (play/pause/skip) | 🔴 Critique | 4h | Fonctionnalité centrale, 0 test du flux complet |
| 3 | **`bookmark-crud.spec.mjs`** | 🔴 Critique | 2h | Données utilisateur persistantes, 0 test |
| 4 | **`language-switch.spec.mjs`** | 🟠 Haute | 3h | RTL arabe non testé, régression silencieuse possible |
| 5 | **`reciter-change.spec.mjs`** (effectif) | 🟠 Haute | 3h | Changement récitant → bonne URL audio : jamais vérifié end-to-end |
| 6 | **`sidebar-navigation.spec.mjs`** | 🟠 Haute | 2h | Navigation surah/juz via sidebar : 0 test de flux complet |
| 7 | **`AppContext.reducer.test.mjs`** (unit) | 🟠 Haute | 4h | 24 actions, 0 test direct, source de regressions |
| 8 | **`tafsir-panel.spec.mjs`** | 🟡 Moyenne | 3h | Fonctionnalité visible, 0 couverture E2E |
| 9 | **`audio-error-fallback.spec.mjs`** (`onError` CDN) | 🟡 Moyenne | 3h | Retry/failover CDN non couvert, ligne 416-478 audioService |
| 10 | **`i18n-completeness.test.mjs`** (unit) | 🟡 Moyenne | 1h | Vérification que fr/en/ar ont exactement les mêmes clés (diff automatique) |

### Notes sur la mise en œuvre

- **Specs 1-6** : utiliser systématiquement `page.route()` pour mocker les API externes — éviter les `waitForTimeout` au profit de `waitForResponse` ou `expect.poll`.
- **Spec 7** : extraire le `reducer` de `AppContext.jsx` dans un fichier séparé ou l'exporter nommément pour le tester sans React.
- **Specs 8-9** : patcher `HTMLMediaElement.prototype` en `addInitScript` comme le fait déjà `audio-fallback.spec.mjs`, injecter des erreurs (`onerror`) pour tester le retry.
- **Remplacement** : `warsh-debug.spec.mjs` devrait être supplanté par `riwaya-loading-stability.spec.mjs` (déjà existant et solide) — le fichier debug peut être supprimé.
- **Mocks API dans les specs existantes** : `audio-fallback.spec.mjs`, `memorization.spec.mjs` et `a11y-smoke.spec.mjs` gagneraient à mocker `api.quran.com` pour éliminer leur flakiness réseau.

---

*Fin du rapport — 9 sections, basé sur 68 tests unitaires + 27 specs E2E, couverture mesurée par `node --experimental-test-coverage`.*
