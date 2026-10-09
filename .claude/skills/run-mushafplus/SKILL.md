---
name: run-mushafplus
description: run, start, build, preview, screenshot, test, launch mushafplus quran app dev server e2e playwright
---

MushafPlus is a React 18 SPA (Vite + Tailwind CSS v4) for reading, listening, and memorising the Quran. The harness is Playwright — `tests/e2e/` covers home, reader, a11y, audio, responsive, and Warsh riwaya. The preview server (`vite preview` on port 4174) is the test target. The dev server (`vite` on port 3002) is for live editing.

All paths are relative to the repo root (`D:\mon-coran-main\mon-coran-main`).

## Prerequisites

Node 18+, npm. Playwright browsers must be installed:

```
npm install
npx playwright install chromium
```

## Build

```
npm run build
```

Runs: `vite build` → `scripts/purge-css.mjs` → `scripts/audit-performance.mjs`. Output: `dist/`.

CI build (also checks bundle budget):
```
npm run build:ci
```

## Run (agent path — Playwright)

The Playwright config (`playwright.config.mjs`) spins up `vite preview --host 127.0.0.1 --port 4173` automatically. Run any spec:

```
npx playwright test tests/e2e/a11y-smoke.spec.mjs --reporter=list
npx playwright test tests/e2e/reading-scroll.spec.mjs --reporter=list
npx playwright test tests/e2e/audio-fallback.spec.mjs --reporter=list
```

Smoke suite (a11y + audio, ~2 min):
```
npm run test:e2e:smoke
```

Full e2e suite:
```
npm run test:e2e
```

### Take a screenshot via Playwright (no spec file needed)

```js
// screenshot.mjs — run with: node screenshot.mjs
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ baseURL: 'http://127.0.0.1:4174' });
const page = await ctx.newPage();
await page.goto('/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button', { timeout: 8000 });   // splash auto-dismisses at 700ms
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshot.png' });
await browser.close();
```

Verified: home page renders with header, sidebar (114 surahs), hero card, and suggestions panel.

### Bypass the splash screen in tests

`splashDone` is Redux-style in-memory state only — localStorage has no effect. The splash auto-dismisses at 700ms on first load, or use:

```js
// Inside a Playwright test:
await page.addInitScript(() => {
  // Force instant splash dismiss via early click (app dispatches SPLASH_DONE at 700ms)
});
await page.goto('/');
await page.waitForTimeout(900);  // wait for auto-dismiss
```

Or navigate directly to a surah URL — the splash still shows but dismisses itself, and the reader title (`.mp-header__title`) is already set.

## Run (human path)

Dev server (HMR, port 3002):
```
npm run dev
```

Preview build (port 4173):
```
npm run preview
```

## Tests

Unit tests (Node `--test`):
```
npm run test:security
```

E2e quick smoke:
```
npm run qa:smoke
```

## Gotchas

**Reader shows error boundary in preview/offline.** The Quran text (`/api/...`) calls `https://api.quranwbw.com` and `https://verses.quran.foundation` — external APIs. In a static preview with no internet, the reader hits its error boundary (`<main>` shows "Une erreur est survenue"). The home page, sidebar, search modal, and audio player all work offline. E2e tests that need reader content run against a live network (CI has internet access).

**Playwright config uses port 4173, launch.json uses port 4174.** The `playwright.config.mjs` `webServer` command binds to `127.0.0.1:4173`. The `.claude/launch.json` preview config passes `--port 4174 --host 127.0.0.1` explicitly. They are independent — Playwright manages its own server, the Claude Browser preview tool uses launch.json.

**SplashScreen doesn't read localStorage.** Setting `mushaf-plus-settings.splashDone = true` in localStorage before page load does nothing. `splashDone` lives in React state (AppContext) and is dispatched on `SPLASH_DONE` action. The splash auto-dismisses at 700ms via an internal timer.

**CSP `frame-ancestors` meta-element warning.** On every page load, the browser logs: "The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element." Harmless — `frame-ancestors` must be in an HTTP header, not a meta tag (tracked for netlify.toml).

**`networkidle` waits forever on dev server.** Vite HMR keeps a WebSocket open, so `waitUntil: 'networkidle'` never resolves. Use `waitUntil: 'domcontentloaded'` then `waitForSelector('button')` instead.

**`npm run build` also runs network probes.** `scripts/audit-performance.mjs` sends real HTTP requests to CDN URLs. In an air-gapped CI environment, these will print warnings but don't fail the build.

## Troubleshooting

**`npx playwright test` fails — "Cannot find module '@playwright/test'"**
→ `npm install` — Playwright is in devDependencies.

**`npx playwright install` says browsers already installed but tests fail to launch**
→ `npx playwright install chromium --force`

**`vite preview` starts on 4173, not 4174**
→ Vite preview defaults to 4173. The launch.json now passes `--port 4174` explicitly. If you start preview manually without `--port`, tests using Playwright config (which targets 4173) will still work; the Claude Browser pane won't.

**`npm run build:ci` fails with budget exceeded**
→ Run `npm run perf:budget` to see which chunks are over limit. Budget is defined in `scripts/check-bundle-budget.mjs`.
