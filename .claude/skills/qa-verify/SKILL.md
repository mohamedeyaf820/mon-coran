---
name: qa-verify
description: Audit complet de MushafPlus — build, performance, CSS, accessibilité, flows fonctionnels, responsive, dark mode, RTL, données, sécurité. Détecte tout, corrige tout, ne laisse rien au hasard.
---

# /qa-verify — Audit total + auto-correction MushafPlus

Exécute **tous** les plans de vérification dans l'ordre. Chaque plan est indépendant — un échec n'arrête pas les suivants, mais tous les problèmes sont corrigés avant le rapport final. Ne rien laisser au hasard.

---

## PLAN 1 — BUILD & CODE QUALITY

### 1.1 Build complet (pipeline CI)
```bash
npm run build:ci 2>&1
```
Pipeline : `vite build` → `purge-css` → `generate-seo-pages` → `check-seo-output` → `audit-performance` → `check-screen-budget` → `check-bundle-budget` → `audit-css-architecture --check` → `check-security-headers`

Si une étape échoue → lire l'erreur complète, localiser le fichier fautif, corriger, relancer.

### 1.2 Linter
```bash
npm run lint 2>&1 | head -60
```
Corriger tous les warnings/errors (sauf règles désactivées intentionnellement avec commentaire explicite).

### 1.3 Tests de sécurité
```bash
npm run test:security 2>&1
```
Si échec → lire `tests/*.test.mjs`, corriger le code source concerné.

### 1.4 Budget bundle
```bash
npm run perf:budget 2>&1
```
Si dépassement → identifier le chunk responsable, chercher une import dynamique manquante ou une dépendance inutile.

### 1.5 Audit CSS architecture
```bash
npm run audit:css 2>&1 | head -80
```
Note les violations de spécificité, règles dupliquées, selecteurs morts signalés.

**Résultats attendus :** build OK, 0 lint error, tests sécurité OK, budget respecté.

---

## PLAN 2 — PERFORMANCE SCROLL & PAINT

Vérification dans le navigateur (dev server port 3002). Recharger d'abord :

### 2.1 Reload & attente splash
```js
// preview_eval
window.location.reload()
// attendre 1.5s puis continuer
```

### 2.2 Détecteurs de jank — home page
```js
// preview_eval
(() => {
  const issues = [];

  // content-visibility avec containIntrinsicSize mal calibré
  document.querySelectorAll('[style*="content-visibility"]').forEach(el => {
    const style = el.getAttribute('style') || '';
    if (style.includes('content-visibility')) issues.push({ type: 'content-visibility-inline', el: el.className.slice(0,40) });
  });

  // Vérifier via computed style sur toutes les hp-card
  const cards = document.querySelectorAll('.hp-card');
  if (cards.length > 0) {
    const cs = window.getComputedStyle(cards[0]);
    if (cs.contentVisibility === 'auto') issues.push({ type: 'hp-card-content-visibility-auto', count: cards.length });
  }

  // transition-all sur éléments scrollables
  document.querySelectorAll('.hp-card, .hp-row, .hp-card--list, .juz-card').forEach(el => {
    const cs = window.getComputedStyle(el);
    if (cs.transition && cs.transition.includes('all')) issues.push({ type: 'transition-all', el: el.className.slice(0,40) });
  });

  // backdrop-filter excessif sur éléments fixes/sticky
  document.querySelectorAll('*').forEach(el => {
    const cs = window.getComputedStyle(el);
    if ((cs.position === 'fixed' || cs.position === 'sticky') && cs.backdropFilter && cs.backdropFilter !== 'none') {
      const blur = parseFloat((cs.backdropFilter.match(/blur\(([\d.]+)px\)/) || [0,0])[1]);
      if (blur > 8) issues.push({ type: 'excessive-backdrop-filter', blur, pos: cs.position, el: el.className.slice(0,40) });
    }
  });

  return { issueCount: issues.length, issues };
})()
```

### 2.3 Layout shifts (CLS simulé)
```js
// preview_eval
(() => {
  const results = [];
  const cards = Array.from(document.querySelectorAll('.hp-card--surah, .hp-card--list'));
  if (!cards.length) return { message: 'no cards found — check page state' };

  const heights = cards.slice(0, 10).map(c => Math.round(c.getBoundingClientRect().height * 100) / 100);
  const allSame = heights.every(h => h === heights[0]);
  const cs = window.getComputedStyle(cards[0]);

  return {
    cardCount: cards.length,
    heights,
    allSameHeight: allSame,
    contentVisibility: cs.contentVisibility,
    containIntrinsicSize: cs.containIntrinsicSize || 'none (OK)',
    clsRisk: cs.contentVisibility === 'auto' ? 'HIGH' : 'LOW',
  };
})()
```

### 2.4 Performance API — FCP et ressources
```js
// preview_eval
(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  const fcp = paint.find(p => p.name === 'first-contentful-paint');
  const resources = performance.getEntriesByType('resource');
  const slowRes = resources.filter(r => r.duration > 500).map(r => ({ name: r.name.split('/').pop(), ms: Math.round(r.duration) }));
  return {
    domInteractive: Math.round(nav?.domInteractive || 0) + 'ms',
    domComplete: Math.round(nav?.domComplete || 0) + 'ms',
    fcp: fcp ? Math.round(fcp.startTime) + 'ms' : 'not available',
    slowResources: slowRes.slice(0, 5),
  };
})()
```

### 2.5 Mémoire JS
```js
// preview_eval
(() => {
  if (!performance.memory) return { message: 'performance.memory not available (non-Chrome)' };
  return {
    heapUsed: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
    heapTotal: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB',
    heapLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
  };
})()
```

**Si problèmes trouvés → appliquer les corrections du PLAN 8.**

---

## PLAN 3 — CONSOLE ERRORS & RÉSEAU

### 3.1 Erreurs console
```
preview_console_logs  level: "error"
```
Ignorer : `frame-ancestors CSP`, erreurs réseau vers `api.quranwbw.com` / `verses.quran.foundation` / `cdn.jsdelivr.net`.
Tout le reste est un bug réel → localiser et corriger.

### 3.2 Warnings console
```
preview_console_logs  level: "warn"
```
Ignorer les warnings React connus. Signaler les `Warning: Each child in a list should have a unique "key" prop` — ils causent des re-renders inutiles → corriger.

### 3.3 Requêtes réseau échouées
```
preview_network  filter: "failed"
```
Si des ressources locales (fonts, icons, JS chunks) échouent → bug de build ou path incorrect → corriger.

---

## PLAN 4 — VÉRIFICATION VISUELLE MULTI-VIEWPORT

Pour chaque viewport, recharger, attendre 1.5s, screenshot.

### 4.1 Mobile 375×812
```
preview_resize  preset: "mobile"
```
```js
// preview_eval
window.location.reload()
```
`preview_screenshot` — vérifier :
- Header visible et non tronqué
- Hero card lisible
- Surah list cards bien formatées (pas d'overflow horizontal)
- Toolbar tabs non coupés
- Texte arabe bien rendu

### 4.2 Tablet 768×1024
```
preview_resize  preset: "tablet"
```
`preview_screenshot` — vérifier :
- Layout 2 colonnes si applicable
- Navigation correcte
- Cards bien proportionnées

### 4.3 Desktop 1280×800
```
preview_resize  preset: "desktop"
```
`preview_screenshot`

### 4.4 Dark mode
```
preview_resize  colorScheme: "dark"  preset: "desktop"
```
```js
// preview_eval — activer le dark mode via localStorage puis recharger
localStorage.setItem('mushaf-plus-settings', JSON.stringify({
  ...JSON.parse(localStorage.getItem('mushaf-plus-settings') || '{}'),
  theme: 'dark'
}));
window.location.reload();
```
`preview_screenshot` — vérifier :
- Pas de texte blanc sur fond blanc
- Pas de fond blanc sur dark mode
- Contraste lisible sur header, cards, toolbar

### 4.5 RTL / Arabic
```js
// preview_eval
localStorage.setItem('mushaf-plus-settings', JSON.stringify({
  ...JSON.parse(localStorage.getItem('mushaf-plus-settings') || '{}'),
  lang: 'ar', theme: 'light'
}));
window.location.reload();
```
`preview_screenshot` — vérifier :
- Layout RTL cohérent
- Numéros de sourate à droite
- Boutons play à gauche
- Pas d'éléments qui se chevauchent

Remettre en mode français après :
```js
// preview_eval
localStorage.setItem('mushaf-plus-settings', JSON.stringify({
  ...JSON.parse(localStorage.getItem('mushaf-plus-settings') || '{}'),
  lang: 'fr', theme: 'light'
}));
window.location.reload();
```

---

## PLAN 5 — ACCESSIBILITÉ (A11Y)

### 5.1 Smoke A11y
```bash
npx playwright test tests/e2e/a11y-smoke.spec.mjs --reporter=list 2>&1
```

### 5.2 Axe-core (scan WCAG automatique)
```bash
npx playwright test tests/e2e/axe-accessibility.spec.mjs --project=chromium --reporter=list 2>&1
```

### 5.3 Vérification landmarks dans le navigateur
```js
// preview_eval
(() => {
  const landmarks = {
    header: !!document.querySelector('header, [role="banner"]'),
    main: !!document.querySelector('main, [role="main"]'),
    nav: document.querySelectorAll('nav, [role="navigation"]').length,
    skipLink: !!document.querySelector('a[href="#main-content"]'),
    h1: document.querySelectorAll('h1').length,
    focusableElements: document.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])').length,
  };
  const issues = [];
  if (!landmarks.header) issues.push('❌ Pas de <header>');
  if (!landmarks.main) issues.push('❌ Pas de <main>');
  if (!landmarks.skipLink) issues.push('❌ Pas de lien skip-to-content');
  if (landmarks.h1 === 0) issues.push('❌ Pas de <h1>');
  if (landmarks.h1 > 1) issues.push(`⚠️ ${landmarks.h1} balises <h1> (devrait être 1)`);
  return { landmarks, issues };
})()
```

### 5.4 Focus piège + ARIA
```js
// preview_eval
(() => {
  const modals = document.querySelectorAll('[role="dialog"], [aria-modal="true"]');
  const sidebars = document.querySelectorAll('[aria-hidden="true"]');
  const images = document.querySelectorAll('img:not([alt])');
  const buttons = Array.from(document.querySelectorAll('button')).filter(b => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby'));
  return {
    openModals: modals.length,
    ariaHiddenElements: sidebars.length,
    imagesWithoutAlt: images.length,
    buttonsWithoutLabel: buttons.slice(0,5).map(b => b.className.slice(0,40)),
  };
})()
```

Si `buttonsWithoutLabel > 0` → chercher ces boutons dans le JSX et ajouter `aria-label`.

---

## PLAN 6 — FLOWS FONCTIONNELS (PLAYWRIGHT)

Exécuter chaque suite et noter les échecs. Toujours relancer jusqu'à 2× si timeout réseau.

### 6.1 Core user flows (navigation principale)
```bash
npx playwright test tests/e2e/core-user-flows.spec.mjs --reporter=list 2>&1 | tail -40
```

### 6.2 Scroll et stabilité de lecture
```bash
npx playwright test tests/e2e/reading-stability.spec.mjs tests/e2e/reading-scroll.spec.mjs --reporter=list 2>&1 | tail -40
```

### 6.3 Audio player
```bash
npx playwright test tests/e2e/audio-fallback.spec.mjs tests/e2e/background-audio.spec.mjs --reporter=list 2>&1 | tail -40
```

### 6.4 Démarrage et chargement
```bash
npx playwright test tests/e2e/startup-loading.spec.mjs --reporter=list 2>&1 | tail -30
```

### 6.5 Responsive density
```bash
npx playwright test tests/e2e/responsive-density.spec.mjs --reporter=list 2>&1 | tail -30
```

### 6.6 Home — cards sourates
```bash
npx playwright test tests/e2e/visual-home-surah-cards.spec.mjs --reporter=list 2>&1 | tail -30
```

### 6.7 Récitation
```bash
npx playwright test tests/e2e/recitation-reading-polish.spec.mjs --reporter=list 2>&1 | tail -30
```

### 6.8 PWA / Offline
```bash
npx playwright test tests/e2e/pwa-offline.spec.mjs --reporter=list 2>&1 | tail -30
```

Pour chaque test échoué :
1. Relancer avec `--reporter=line` pour voir le détail
2. Lire le spec et le composant concerné
3. Identifier : vrai bug (composant) vs faux positif (sélecteur périmé, API réseau)
4. Si vrai bug → corriger dans le composant, PAS dans le test (sauf si le test est lui-même incorrect)

---

## PLAN 7 — COHÉRENCE CSS & DÉTECTION D'INCOHÉRENCES

### 7.1 Scan des `!important` en conflit
```bash
grep -rn "!important" src/styles/ --include="*.css" | wc -l
grep -rn "!important" src/styles/ --include="*.css" | grep "backdrop-filter" | head -20
```
Plus de 500 `!important` = dette CSS critique. Signaler dans le rapport.

### 7.2 Vérification spécificité — toolbar reader
```js
// preview_eval — naviguer vers le reader d'abord
(() => {
  // Doit être appelé depuis la page du reader
  const toolbar = document.querySelector('.reader-control-deck, .qc-reader-toolbar');
  if (!toolbar) return { found: false, note: 'Naviguer vers /surah/1 d\'abord' };
  const modesSection = toolbar.querySelector('.qc-reader-toolbar__modes');
  const utilitiesSection = toolbar.querySelector('.qc-reader-toolbar__utilities');
  return {
    toolbarVisible: toolbar.getBoundingClientRect().width > 0,
    modesWidth: modesSection ? window.getComputedStyle(modesSection).width : 'not found',
    utilitiesVisible: utilitiesSection ? utilitiesSection.getBoundingClientRect().width > 0 : false,
    toolbarOverflow: window.getComputedStyle(toolbar).overflow,
  };
})()
```
Si `utilitiesVisible === false` → bouton "Écouter" caché → appliquer le fix `width: auto !important` sur `.qc-reader-toolbar__modes`.

### 7.3 Cohérence des hauteurs de cards
```js
// preview_eval — depuis la home page
(() => {
  const listCards = document.querySelectorAll('.hp-card--list');
  const gridCards = document.querySelectorAll('.hp-card--surah:not(.hp-card--list)');
  const measureVariance = cards => {
    if (!cards.length) return null;
    const heights = Array.from(cards).map(c => c.getBoundingClientRect().height);
    const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
    const max = Math.max(...heights);
    const min = Math.min(...heights);
    return { count: cards.length, avg: Math.round(avg * 10) / 10, variance: Math.round((max - min) * 10) / 10 };
  };
  return {
    listCards: measureVariance(listCards),
    gridCards: measureVariance(gridCards),
    note: 'variance > 5px = layout shift probable',
  };
})()
```

### 7.4 Vérification des fonts chargées
```js
// preview_eval
(() => {
  const fonts = Array.from(document.fonts).map(f => ({ family: f.family, status: f.status }));
  const failed = fonts.filter(f => f.status === 'error');
  const loaded = fonts.filter(f => f.status === 'loaded');
  return { total: fonts.length, loaded: loaded.length, failed };
})()
```
Si font `surahnames` manquante → les ligatures arabes affichent des chiffres → bug critique.

### 7.5 Variables CSS manquantes
```js
// preview_eval
(() => {
  const root = getComputedStyle(document.documentElement);
  const required = ['--primary', '--bg-primary', '--bg-secondary', '--bg-card', '--text-primary', '--text-secondary', '--border', '--gold'];
  return required.map(v => ({ var: v, value: root.getPropertyValue(v).trim() || '❌ MANQUANT' }));
})()
```

---

## PLAN 8 — CATALOGUE DE CORRECTIONS AUTO

Pour chaque problème trouvé dans les Plans 1–7, appliquer la correction correspondante. **Toujours lire le fichier avant d'éditer. Toujours relancer la vérification après correction.**

---

### FIX-01 — `content-visibility: auto` sur les cards home

**Détection :** `cs.contentVisibility === 'auto'` sur `.hp-card` ou `.hp-row`

**Localiser la source :**
```bash
grep -n "content-visibility" src/styles/tailwind.css src/components/Home/HomePrimitives.jsx
```

**Correction :**
- Dans `src/styles/tailwind.css` → supprimer `content-visibility: auto;` et `contain-intrinsic-size: ...;` du bloc `.hp-card` et `.hp-row`
- Dans `HomePrimitives.jsx` → supprimer tous les objets `*VisibilityStyle` et leurs `style={...}` sur les cards SurahCard et JuzCard

---

### FIX-02 — `transition-all` sur éléments scrollables

**Détection :** grep ou computed style `transition: all ...`

**Localiser :**
```bash
grep -rn "transition-all\|transition: all" src/components/ src/styles/ --include="*.jsx" --include="*.css" | grep -v ".claude" | head -20
```

**Correction :** remplacer par les propriétés explicites :
- Boutons interactifs → `transition-[background-color,color,box-shadow]`
- Cards → `transition-[background-color,border-color,transform]`
- Éléments avec scale → garder `transform` dans la liste

---

### FIX-03 — `backdrop-filter: blur()` excessif sur fixed/sticky

**Détection :** blur > 8px sur `position: fixed` ou `position: sticky`

**Localiser :**
```bash
grep -rn "backdrop-filter" src/styles/ --include="*.css" | grep "blur" | head -20
```

**Règle de correction :**
- Header fixe global → max `blur(6px)`
- Toolbar sticky → max `blur(4px)`
- Modal/overlay → max `blur(8px)` acceptable
- Ne JAMAIS éditer `tailwind.css` pour des règles issues d'un autre fichier — trouver la source

---

### FIX-04 — Toolbar reader coupée (utilitaires invisibles)

**Détection :** `.qc-reader-toolbar__utilities` non visible

**Correction dans `src/styles/mushaf-page-polish.css` :**
```css
.app-root[data-view="reading"] .quran-display--platform .reader-control-deck .qc-reader-toolbar__modes {
  width: auto !important;
}
```

---

### FIX-05 — Bouton sans `aria-label`

**Détection :** `button` sans `textContent`, `aria-label`, ni `aria-labelledby`

**Localiser dans le JSX :**
```bash
grep -rn "<button" src/components/ --include="*.jsx" | grep -v "aria-label" | head -20
```
Puis lire le composant et ajouter l'`aria-label` approprié selon le contexte.

---

### FIX-06 — `transition: height/padding/margin` (reflow)

**Détection :** transition sur des propriétés qui triggent le layout

**Localiser :**
```bash
grep -rn "transition.*height\|transition.*padding\|transition.*margin\|transition.*top\|transition.*bottom" src/styles/ --include="*.css" | head -20
```

**Correction :** commenter la propriété de transition layout et utiliser `transform: scaleY()` ou `max-height` si animation vraiment nécessaire.

---

### FIX-07 — Console error réel (non réseau externe)

**Correction :**
1. Lire le stack trace complet dans `preview_console_logs`
2. Identifier le composant et la ligne via le message
3. `Read` le fichier source
4. Corriger le bug (null check manquant, prop incorrecte, etc.)

---

### FIX-08 — Font surahnames manquante / ligatures arabes absentes

**Détection :** font status `error` ou chiffres à la place des ligatures

**Vérifier :**
```bash
ls -la public/fonts/ | grep sura
```
Si fichier absent → vérifier `public/fonts/sura_names.woff2` et le `@font-face` dans `tailwind.css`.

---

### FIX-09 — Variable CSS manquante

**Détection :** `var: "❌ MANQUANT"` dans le Plan 7.5

**Localiser la déclaration :**
```bash
grep -rn "^\s*--primary\|^\s*--bg-primary" src/styles/ --include="*.css" | head -10
```
Ajouter la variable manquante dans le bloc `:root` de `tailwind.css`.

---

### FIX-10 — Test Playwright échoué (bug réel)

Pour chaque test échoué, relancer avec détail :
```bash
npx playwright test <spec> --reporter=line 2>&1 | tail -60
```
Identifier : quel composant, quel comportement attendu vs réel. Corriger le composant source. Ne pas modifier le test sauf s'il est lui-même obsolète (sélecteur périmé, comportement intentionnellement changé).

---

## PLAN 9 — VÉRIFICATION DONNÉES & INTÉGRITÉ

### 9.1 Nombre de sourates
```js
// preview_eval
(() => {
  // depuis la sidebar ou la home
  const sidebar = document.querySelector('#sidebar');
  const sidebarItems = sidebar ? sidebar.querySelectorAll('[data-surah]').length : 0;
  const homeCards = document.querySelectorAll('[data-surah]').length;
  return { sidebarSurahCount: sidebarItems, homeVisibleCards: homeCards, expected: 114 };
})()
```

### 9.2 SEO output
```bash
npm run audit:seo 2>&1 | tail -20
```

### 9.3 Warsh audio
```bash
npm run audit:warsh:audio 2>&1 | tail -20
```

---

## PLAN 10 — CYCLE DE CORRECTION FINAL

Après avoir collecté TOUS les problèmes des Plans 1–9 :

1. **Prioriser** : crash/data loss > invisible > inaccessible > lent > visuel > mineur
2. **Corriger** : appliquer le fix du catalogue PLAN 8, ou raisonner si problème nouveau
3. **Re-vérifier** : relancer uniquement la vérification concernée (pas tout le cycle)
4. **Itérer** jusqu'à zéro problème bloquant

---

## PLAN 11 — COMMIT DES CORRECTIONS

Si des fichiers ont été modifiés :

```bash
git diff --stat
git status
```

Committer par groupe logique (un commit par domaine : perf / a11y / css / flows) :

```bash
git add <fichiers>
git commit -m "fix(<domaine>): <description courte>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Puis pousser :
```bash
git push okay main
```

---

## RAPPORT FINAL

Obligatoire à la fin de chaque exécution du skill :

```
╔══════════════════════════════════════════════════════════════╗
║              RAPPORT QA COMPLET — MushafPlus                 ║
╠══════════════════════════════════════════════════════════════╣
║  DATE : <date>                                               ║
╠═══════════════════════════╦══════════════════════════════════╣
║  PLAN 1 — Build & Code    ║  ✅ OK  /  ❌ N erreurs          ║
║  PLAN 2 — Performance     ║  ✅ OK  /  ⚠️ N problèmes        ║
║  PLAN 3 — Console/Réseau  ║  ✅ 0   /  ❌ N erreurs          ║
║  PLAN 4 — Visual/Viewport ║  ✅ OK  /  ⚠️ N incohérences     ║
║  PLAN 5 — Accessibilité   ║  ✅ OK  /  ❌ N violations       ║
║  PLAN 6 — Flows E2E       ║  ✅ N/N /  ❌ N échoués          ║
║  PLAN 7 — CSS Cohérence   ║  ✅ OK  /  ⚠️ N incohérences     ║
║  PLAN 8 — Auto-fixes      ║  N corrections appliquées        ║
║  PLAN 9 — Données         ║  ✅ OK  /  ⚠️ problème           ║
╠═══════════════════════════╩══════════════════════════════════╣
║  CORRECTIONS APPLIQUÉES                                      ║
║  · FIX-01: ...                                              ║
║  · FIX-03: ...                                              ║
╠══════════════════════════════════════════════════════════════╣
║  PROBLÈMES RESTANTS (si applicable)                          ║
║  · <fichier:ligne> — description précise                     ║
╠══════════════════════════════════════════════════════════════╣
║  RÉSULTAT FINAL :  ✅ APP SAINE — PRÊT À LIVRER              ║
║              ou :  ⚠️ N PROBLÈMES MINEURS OUVERTS            ║
║              ou :  ❌ N BLOCKERS NON RÉSOLUS                  ║
╚══════════════════════════════════════════════════════════════╝
```

---

## RÈGLES ABSOLUES

- **Ne jamais éditer `tailwind.css` pour une règle dont la source est un autre fichier CSS** — chercher et éditer la source.
- **Ne jamais modifier un test Playwright pour masquer un bug** — corriger le composant.
- **Le warning CSP `frame-ancestors`** est connu et inoffensif — ne pas signaler.
- **Les erreurs réseau vers api.quranwbw.com / verses.quran.foundation** en environnement dev/preview sont normales.
- **La SplashScreen** se ferme automatiquement à 700 ms — toujours attendre 1.2–1.5 s avant d'inspecter le DOM.
- **Port 3002** = dev server (Browser preview). **Port 4173** = Playwright preview. **Port 4174** = launch.json preview. Ce sont trois processus distincts.
- **Après chaque groupe de corrections** : re-vérifier le plan concerné, pas tout le cycle.
- **Tout problème signalé doit avoir** : fichier + ligne ou composant + description du comportement observé vs attendu.
