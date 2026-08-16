---
name: qa-verify
description: Vérifie, teste et corrige automatiquement tout ce qui vient d'être développé dans MushafPlus. Build, Playwright, browser check, screenshots, rapport, auto-fix.
---

# /qa-verify — Vérification complète + auto-correction

Exécute un cycle complet de QA sur les changements récents. Suit exactement ces étapes dans l'ordre — ne passe pas à l'étape suivante si la précédente bloque.

## Étape 0 — Périmètre (< 30 s)

Identifie ce qui a changé :

```bash
git diff HEAD~1 --stat
git diff HEAD~1 --name-only
```

Classe les fichiers modifiés dans une ou plusieurs zones :
- **home** — `src/components/Home/`, `src/styles/home-*.css`, `src/styles/tailwind.css` (si `.hp-card`, `.hp-grid`, etc.)
- **reader** — `src/components/Quran/`, `src/components/QuranDisplay/`, `src/styles/mushaf-*.css`, `src/styles/reading-*.css`
- **audio** — `src/components/recitation/`, `src/styles/audio-*.css`
- **global** — `src/styles/app-system.css`, `src/styles/header-*.css`, `src/styles/tailwind.css` (tokens/base)
- **css-only** — uniquement des fichiers `.css` sans `.jsx`

Note les zones concernées. Elles guident le choix des tests à l'Étape 3.

---

## Étape 1 — Build (obligatoire, ~45 s)

```bash
npx vite build --mode development 2>&1 | tail -40
```

Si le build échoue :
1. Lis l'erreur complète
2. Localise le fichier fautif (Read)
3. Corrige (Edit)
4. Relance le build
5. Recommence jusqu'à succès avant de continuer

Si le build réussit → ✅ **BUILD OK**

---

## Étape 2 — Vérification browser (< 60 s)

Le dev server tourne sur le port 3002 (via launch.json). Utilise les outils `preview_*` :

### 2a. Recharge la page
```js
// preview_eval
window.location.reload()
```

### 2b. Attends le rendu (splash = 700 ms)
```js
// preview_eval — après 1.2 s
document.querySelector('.app-root') !== null
```

### 2c. Console errors
`preview_console_logs` avec `level: "error"` — note tout ce qui n'est pas :
- `frame-ancestors` CSP warning (connu, inoffensif)
- Warnings réseau (API Quran externe)

### 2d. Vérification spécifique à la zone

**Zone `home`** — Vérifie les cards :
```js
// preview_eval
(() => {
  const cards = document.querySelectorAll('.hp-card--surah');
  const first = cards[0];
  const cs = first ? window.getComputedStyle(first) : null;
  return {
    count: cards.length,
    contentVisibility: cs?.contentVisibility,
    heights: Array.from(cards).slice(0,3).map(c => c.getBoundingClientRect().height),
    layoutShiftRisk: cs?.containIntrinsicSize || 'none',
  };
})()
```
⚠️ Si `contentVisibility === "auto"` → layout shift probable → planifie un fix à l'Étape 4.

**Zone `reader`** — Vérifie le toolbar :
```js
// preview_eval
(() => {
  const toolbar = document.querySelector('.qc-reader-toolbar, .reader-control-deck');
  if (!toolbar) return { found: false };
  const rect = toolbar.getBoundingClientRect();
  const cs = window.getComputedStyle(toolbar);
  return {
    found: true,
    overflow: cs.overflow,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    modesSection: (() => {
      const modes = toolbar.querySelector('.qc-reader-toolbar__modes');
      return modes ? window.getComputedStyle(modes).width : 'not found';
    })(),
  };
})()
```

**Zone `global`** — Vérifie le backdrop-filter sur le header :
```js
// preview_eval
(() => {
  const header = document.querySelector('.mp-header, header');
  const cs = header ? window.getComputedStyle(header) : null;
  return {
    position: cs?.position,
    backdropFilter: cs?.backdropFilter,
    zIndex: cs?.zIndex,
  };
})()
```

### 2e. Screenshot de la zone concernée

`preview_screenshot` — garde la preuve visuelle. Scroll vers la zone si nécessaire.

---

## Étape 3 — Tests Playwright (ciblés par zone)

Build le preview d'abord si pas encore fait :
```bash
npx vite build --mode development 2>&1 | tail -5
```

Lance les tests correspondant aux zones détectées à l'Étape 0 :

| Zone | Tests à lancer |
|------|----------------|
| home | `tests/e2e/a11y-smoke.spec.mjs` · `tests/e2e/startup-loading.spec.mjs` |
| reader | `tests/e2e/a11y-smoke.spec.mjs` · `tests/e2e/reading-stability.spec.mjs` |
| audio | `tests/e2e/audio-fallback.spec.mjs` · `tests/e2e/background-audio.spec.mjs` |
| global | `tests/e2e/a11y-smoke.spec.mjs` · `tests/e2e/core-user-flows.spec.mjs` |
| css-only | `tests/e2e/a11y-smoke.spec.mjs` |

Si plusieurs zones → union des tests (sans doublon).

Commande type :
```bash
npx playwright test tests/e2e/a11y-smoke.spec.mjs --reporter=list 2>&1 | tail -30
```

Si un test échoue :
1. Lis l'output complet de l'échec
2. Identifie si c'est un vrai bug (code) ou un faux positif (sélecteur expiré, API réseau)
3. Si bug réel → note pour Étape 4

Si tous passent → ✅ **TESTS OK**

---

## Étape 4 — Auto-correction

Pour chaque problème détecté aux étapes 1–3, applique la correction correspondante :

### Problème : `content-visibility: auto` sur des cards
```
Fix : retirer les propriétés contentVisibility/containIntrinsicSize
  - HomePrimitives.jsx → supprimer les objets rowVisibilityStyle / cardVisibilityStyle
  - tailwind.css → supprimer content-visibility + contain-intrinsic-size du bloc .hp-card
```

### Problème : `transition-all` sur un élément scrollable
```
Fix : remplacer transition-all par transition-[background-color,border-color,...] 
      en listant explicitement les propriétés animées
```

### Problème : `backdrop-filter: blur(Xpx)` > 8px sur un élément fixe/sticky
```
Fix : réduire à blur(4–6px) dans le fichier CSS source
      (ne jamais éditer tailwind.css si la règle vient d'un autre fichier)
```

### Problème : toolbar coupée (overflow) dans le reader
```
Fix : vérifier .qc-reader-toolbar__modes — ajouter width: auto !important
      dans src/styles/mushaf-page-polish.css
```

### Problème : erreur de build JSX/CSS
```
Fix : lire le fichier entier, corriger la syntaxe, relancer le build
```

Après chaque fix → retourne à l'étape concernée et re-vérifie.

---

## Étape 5 — Commit (si des corrections ont été faites)

Si l'Étape 4 a produit des modifications :

```bash
git diff --stat
git add <fichiers modifiés>
git commit -m "fix: corrections QA post-développement — <résumé en 1 ligne>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Rapport final

Termine toujours avec ce tableau :

```
╔══════════════════════════════════════════════╗
║           RAPPORT QA — MushafPlus            ║
╠══════════════════════════════════════════════╣
║  Zones vérifiées : home / reader / global    ║
╠═══════════════════╦══════════════════════════╣
║  Build            ║  ✅ OK  /  ❌ FAIL        ║
║  Console errors   ║  ✅ 0   /  ⚠️ N           ║
║  Browser check    ║  ✅ OK  /  ⚠️ (détail)    ║
║  Playwright       ║  ✅ N/N /  ❌ N échoués   ║
╠═══════════════════╩══════════════════════════╣
║  Corrections auto appliquées : N             ║
║  <liste des corrections>                     ║
╠══════════════════════════════════════════════╣
║  RÉSULTAT FINAL : ✅ PRÊT À LIVRER            ║
║               ou ❌ PROBLÈMES EN ATTENTE      ║
╚══════════════════════════════════════════════╝
```

Si des problèmes restent non résolus, liste-les avec fichier + ligne + description précise.

---

## Notes importantes

- **Ne jamais éditer `tailwind.css` pour des règles qui viennent d'un autre fichier CSS** — trouver et éditer la source.
- **Le port Playwright est 4173** (vite preview), le port Browser preview est **3002** (dev server) ou **4174** (preview build via launch.json). Ce sont deux processus distincts.
- **L'API Quran est externe** (api.quranwbw.com, verses.quran.foundation) — les erreurs réseau en preview/offline sont normales et ne comptent pas.
- **Le warning CSP `frame-ancestors`** est connu et inoffensif.
- **SplashScreen** : se ferme automatiquement après 700 ms — attendre 900 ms avant de vérifier le DOM.
