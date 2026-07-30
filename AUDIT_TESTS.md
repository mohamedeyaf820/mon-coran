# Audit de couverture de tests — MushafPlus

_Date : 2026-07-30 | Branche : `perf/load-times-and-bug-fixes`_

---

## 1. Inventaire des tests

### 1.1 Tests E2E Playwright (`tests/e2e/` — 26 specs)

| Fichier spec | ~Tests | Domaine couvert |
|---|---|---|
| `a11y-smoke.spec.mjs` | ~3 | Accessibilité : navigation clavier, rôles ARIA, landmarks |
| `audio-fallback.spec.mjs` | 3 | Lecture audio : clic play, mot-à-mot, Warsh Mushaf |
| `audio-player-options.spec.mjs` | ~4 | Options audio : vitesse, répétition, mode |
| `axe-accessibility.spec.mjs` | ~3 | Audit axe-core automatisé (Chromium) |
| `cross-browser-smoke.spec.mjs` | ~3 | Smoke Firefox + WebKit : home + lecteur |
| `day-theme-consistency.spec.mjs` | ~4 | Variables CSS des 3 thèmes (light/parchment/dark) |
| `memorization.spec.mjs` | ~4 | Parcours mémorisation : création, progression, mode |
| `modal-a11y.spec.mjs` | ~3 | ARIA des modales (role, aria-modal, focus trap) |
| `phase7-features.spec.mjs` | 6 | Espace outils : offline library, mémorisation, index thématique, export, cloud |
| `phase8-performance.spec.mjs` | 3 | Perf : LCP, TTI, taille bundles, route mocking |
| `privacy-geolocation.spec.mjs` | 2 | Pas de collecte géolocalisation / tracking |
| `privacy-protection.spec.mjs` | 1 | Pas de fuite de données utilisateur |
| `pwa-offline.spec.mjs` | 2 | SW : app shell offline, texte sourate mis en cache |
| `reading-fonts.spec.mjs` | 2 | Chargement polices KFGQPC/QPC, rendu glyph |
| `reading-scroll.spec.mjs` | 2 | Scroll vertical lecteur (desktop + mobile), bouton retour haut |
| `reading-stability.spec.mjs` | 2 | Stabilité rendu : pas de layout shift, pas de flash |
| `recitation-reading-polish.spec.mjs` | 5 | Librairie récitateur mobile/desktop, mode Mushaf/Liste, page/juz mode |
| `responsive-density.spec.mjs` | 8 | Densité 320→1920px : header, toolbar, sidebar, audio modal, search, duas |
| `riwaya-loading-stability.spec.mjs` | 2 | Chargement Hafs/Warsh, retry, route mock |
| `startup-loading.spec.mjs` | 1 | Splash screen → home, indicateur chargement |
| `visual-debug.spec.mjs` | 2 | Captures visuelles debug (non-assertions) |
| `visual-home-surah-cards.spec.mjs` | ~3 | Cartes sourates home : layout, overflow |
| `visual-navbar-audio.spec.mjs` | 1 | Navbar + audio player : positionnement |
| `visual-regression.spec.mjs` | ~3 | Screenshots comparatifs (snapshots) |
| `visual-surah-zones.spec.mjs` | ~4 | Zones visuelles lecteur : header, ayah, toolbar |
| `warsh-debug.spec.mjs` | ~5 | Rendu Warsh Mushaf, pages, marqueurs |
| `word-by-word-layout.spec.mjs` | 1 | Mise en page mot-à-mot (mock API quran.com) |

**Total E2E : ~74 tests `test()`**

### 1.2 Tests unitaires Node (`tests/*.test.mjs` — 16 fichiers)

| Fichier | Domaine |
|---|---|
| `audio-player-utils.test.mjs` | Utilitaires lecteur audio |
| `crypto-protection.test.mjs` | Chiffrement stockage local |
| `navigation-storage.test.mjs` | Persistance position/navigation |
| `network-policy.test.mjs` | Politique réseau, domaines autorisés |
| `performance-metrics.test.mjs` | Métriques perf (calculs) |
| `phase7-features.test.mjs` | Logique features phase 7 |
| `pwa-sw.test.mjs` | Stratégies Service Worker |
| `quran-request-dedupe.test.mjs` | Déduplication requêtes Quran |
| `recitation-performance.test.mjs` | Perf service récitation |
| `reciters-audio.test.mjs` | Catalogue récitateurs / URLs |
| `search-intelligence.test.mjs` | Logique recherche intelligente |
| `security-storage.test.mjs` | Sécurité stockage |
| `storage-quota.test.mjs` | Gestion quota stockage |
| `tafsir-service.test.mjs` | Service tafsir |
| `tajwid-segments.test.mjs` | Segmentation tajwid |
| `ui-i18n.test.mjs` | Traductions i18n |

**Total unitaires : ~67 tests**

**Total global : ~141 tests**

---

## 2. Couverture par domaine

| Domaine | Statut | Fichiers couvrants |
|---|---|---|
| Navigation home → surah → retour | ⚠️ partiel | `cross-browser-smoke`, `a11y-smoke` (goto direct, pas de clic carte) |
| Lecture audio — play / pause | ✅ couvert | `audio-fallback` (play explicite vs implicite) |
| Lecture audio — skip / prev-next ayah | ❌ non couvert | — |
| Lecture audio — failover CDN automatique | ❌ non couvert | — |
| Changement récitateur (UI) | ⚠️ partiel | `recitation-reading-polish` (ouvre modal, ne change pas en live) |
| Changement riwaya (UI) | ⚠️ partiel | `riwaya-loading-stability` (route mock, pas clic paramètres) |
| Changement thème (clic bouton) | ❌ non couvert | `day-theme-consistency` vérifie CSS vars via seed localStorage uniquement |
| Recherche (saisie → résultats) | ⚠️ partiel | `responsive-density` ouvre overlay, ne tape pas de requête |
| Recherche → navigation ayah | ❌ non couvert | — |
| Favoris — ajout / suppression | ❌ non couvert | — |
| Paramètres — drawer complet | ⚠️ partiel | `responsive-density` ouvre et ferme, ne modifie rien |
| Mode Mushaf (switch Mushaf ↔ Liste) | ✅ couvert | `recitation-reading-polish` (click + verify) |
| Sidebar (open / close / navigate) | ✅ couvert | `responsive-density` (open, close, dimensions) |
| Scroll infini (lecteur) | ✅ couvert | `reading-scroll` (desktop + mobile) |
| Offline / PWA | ✅ couvert | `pwa-offline` (app shell + texte mis en cache) |
| RTL layout | ⚠️ partiel | `word-by-word-layout`, `cross-browser-smoke` (vérification implicite) |
| Responsive mobile | ✅ couvert | `responsive-density` (320 / 390 / 820 / 1440 / 1920) |
| Erreurs réseau audio | ❌ non couvert | — |
| Erreurs réseau Quran JSON | ⚠️ partiel | `riwaya-loading-stability` (retry mock), pas d'état d'erreur affiché |

---

## 3. Chemins critiques sans tests — Top 5

1. **Home → clic carte sourate → lecteur s'ouvre → bouton Retour → home** : le flux de navigation principal utilisateur n'est pas testé bout-en-bout avec une interaction DOM réelle (clic sur `.hp-card`). Seul un `goto("/surah/1")` direct est utilisé.

2. **Changer de récitateur depuis le lecteur** : ouvrir le modal audio → cliquer un bouton récitateur → vérifier que l'URL audio chargée correspond au nouveau récitateur. Couverture : 0.

3. **Failover audio CDN** : si `everyayah.com` renvoie 404 ou réseau coupé, l'app doit basculer sur `cdn.islamic.network`. Ce chemin (`audioService` failover) n'a aucun test E2E avec route interception.

4. **Recherche intelligente bout-en-bout** : taper "miséricorde" dans la recherche → voir des résultats → cliquer → vérifier `page.url()` contient `/surah/N/M`. `search-intelligence.test.mjs` teste la logique unitaire mais pas l'interaction UI.

5. **Favoris persistants** : cliquer le bouton favori sur un ayah → recharger la page → vérifier que l'icône est toujours activée et que l'entrée apparaît dans la bibliothèque. Aucun test couvre ce cycle.

---

## 4. Qualité des tests existants

### Sélecteurs fragiles

- **`.srh-play-btn`, `.mp-player-play-btn`, `.mp-player-minimized-open`** : sélecteurs de classe CSS couplés au nommage interne. Un refactoring CSS casse silencieusement les tests.
- **`.qc-ayah-text-ar`** : dépend du layout, pas d'attribut `data-testid` sur les ayah.
- `getByRole("button", { name: /Commencer la lecture|Reprendre la lecture|.../i })` dans `reading-scroll.spec.mjs` : regex de 10 alternatives — signal de couplage fort à 3 langues simultanément.

### Waits hardcodés

**24 occurrences** de `page.waitForTimeout()` dans les specs E2E. Les plus problématiques :
- `waitForTimeout(500)` dans `reading-scroll` et `pwa-offline`
- `waitForTimeout(250)` dans `recitation-reading-polish`
- `waitForTimeout(180)` dans `recitation-reading-polish`

Ces valeurs sont arbitraires et fragiles sur CI lent. Remplacer par `expect.poll()` ou `waitForSelector()`.

### Dépendances réseau externes

- `word-by-word-layout.spec.mjs` mock `https://api.quran.com/api/v4/**` via `page.route` — bien fait.
- `recitation-reading-polish.spec.mjs` ouvre le modal récitateur qui charge depuis le **vrai réseau** (assertions sur "EveryAyah", "Quran.com"). Flakiness potentielle en CI sans réseau.
- `visual-debug.spec.mjs` et `visual-regression.spec.mjs` font des captures d'écran mais avec **peu ou pas de comparaisons** contre des snapshots attendus (la spec regression fait 30 lignes).

### Autres observations

- Les tests de thème (`day-theme-consistency`) seed le thème via `localStorage` puis vérifient des CSS vars — ils n'exercent pas le code de switch de thème lui-même (`AppContext.setTheme`).
- `visual-surah-zones.spec.mjs` et `warsh-debug.spec.mjs` sont principalement des specs de débogage (captures, logs) sans assertions fortes sur la logique fonctionnelle.

---

## 5. Top 5 specs à ajouter en priorité

### 1. `navigation-flow.spec.mjs` — Navigation home → surah → retour

```js
test("clic carte sourate depuis home ouvre le lecteur puis retour revient à home", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ splashDone: true, showHome: true, lang: "fr", riwaya: "hafs" }));
  });
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 20_000 });
  await page.locator('[data-testid="surah-card"]').first().click();
  await expect(page.locator(".quran-display--platform")).toBeVisible({ timeout: 20_000 });
  await page.goBack();
  await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 10_000 });
});
```

### 2. `reciter-switch.spec.mjs` — Changement de récitateur en direct

```js
test("sélectionner un récitateur différent met à jour l'URL audio", async ({ page }) => {
  // seed avec ar.alafasy
  await page.goto("/surah/1");
  await page.locator('[data-testid="audio-player-compact"]').click();
  await page.locator(".mp-player-options-trigger").click();
  const requests = [];
  page.on("request", (r) => { if (r.url().includes(".mp3")) requests.push(r.url()); });
  await page.getByRole("radio", { name: /Husary|Minshawi/i }).first().click();
  await page.locator(".srh-play-btn").first().click();
  await expect.poll(() => requests.some((u) => /husary|minshawi/i.test(u))).toBeTruthy();
});
```

### 3. `audio-cdn-failover.spec.mjs` — Failover CDN audio

```js
test("si everyayah échoue l'app bascule sur le CDN alternatif", async ({ page }) => {
  await page.route(/everyayah\.com.*\.mp3/, (route) => route.abort("failed"));
  await page.goto("/surah/1");
  const fallbackRequest = page.waitForRequest(/cdn\.islamic\.network.*\.mp3/, { timeout: 15_000 });
  await page.locator(".srh-play-btn").first().click();
  await fallbackRequest;
});
```

### 4. `search-navigate.spec.mjs` — Recherche → navigation ayah

```js
test("rechercher 'miséricorde' puis cliquer un résultat ouvre le bon ayah", async ({ page }) => {
  await page.goto("/");
  await page.locator(".mp-header__more").click();
  await page.locator('.mp-header-menu__item[data-key="search"]').click();
  await page.getByRole("searchbox").fill("miséricorde");
  const firstResult = page.locator(".search-result-item").first();
  await expect(firstResult).toBeVisible({ timeout: 10_000 });
  await firstResult.click();
  await expect(page).toHaveURL(/\/surah\/\d+(\/\d+)?/);
});
```

### 5. `favorites-persistence.spec.mjs` — Favoris persistants

```js
test("un favori ajouté persiste après rechargement", async ({ page }) => {
  await page.goto("/surah/1");
  await expect(page.locator(".qc-ayah-text-ar").first()).toBeVisible({ timeout: 20_000 });
  const favoriteBtn = page.locator('[data-testid="ayah-favorite-btn"]').first();
  await favoriteBtn.click();
  await expect(favoriteBtn).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator('[data-testid="ayah-favorite-btn"][aria-pressed="true"]')).toBeVisible({ timeout: 10_000 });
});
```

---

## 6. Score de couverture estimé par domaine

| Domaine | Score |
|---|---|
| Responsive / densité visuelle | 90 % |
| Accessibilité (ARIA, axe-core) | 80 % |
| PWA / Offline | 75 % |
| Lecture audio — contrôles de base | 65 % |
| Lecture Warsh / mode Mushaf | 65 % |
| Mémorisation / phase 7 features | 60 % |
| Stabilité rendu / scroll | 60 % |
| Riwaya switching | 40 % |
| Navigation inter-pages (user flow) | 30 % |
| Recherche bout-en-bout | 20 % |
| Changement récitateur (UI) | 20 % |
| Changement thème (UI) | 10 % |
| Favoris / persistance | 5 % |
| Failover réseau audio | 5 % |
| **Couverture globale estimée** | **~45 %** |

> La couverture est forte sur les aspects visuels/a11y/responsive mais faible sur les flux utilisateur principaux (navigation, préférences, favoris) et les cas d'erreur réseau.
