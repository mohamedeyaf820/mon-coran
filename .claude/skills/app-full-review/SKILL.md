---
name: app-full-review
description: Revue complète de MushafPlus en boucle Inspect → Test → Detect → Diagnose → Fix → Re-test → Regression → Report. Build, lint, tests unitaires et E2E, console/réseau, responsive 320→2560 px, accessibilité (axe), performance mesurée avant/après, erreurs et résilience, sécurité, dépendances, rapport avec statuts CONFIRMÉ / À CONFIRMER / NON TESTÉ / BLOQUÉ. À utiliser pour « revue complète », « audit », « QA complète », « vérifie qu'il n'y a pas de régression ».
---

# app-full-review — revue complète, mesurée, sans régression

Ce skill orchestre une revue de bout en bout. Il **complète** `qa-verify` (audit + auto-correction par plans) et `run-mushafplus` (lancer l'app) sans les dupliquer : lire `qa-verify` pour la liste exhaustive des plans, ce fichier pour la **méthode**, les **commandes réelles** et les **pièges déjà rencontrés**.

## Règles qui priment

1. **Ne rien affirmer sans preuve.** Chaque constat porte un statut : `CONFIRMÉ` (reproduit ou mesuré), `À CONFIRMER` (hypothèse), `NON TESTÉ`, `BLOQUÉ` (précise pourquoi). Ne jamais écrire « plus rapide » sans mesure avant/après, ni « corrigé » parce que le code semble correct.
2. **Tout changement visible** (texte, parcours, mise en page, accessibilité) : lire d'abord `AGENTS.md` puis `.agents/skills/product-design/SKILL.md`. Le texte coranique, la riwaya (Hafs/Warsh), la position de lecture, le hors-ligne, FR/EN/AR + RTL et les cibles tactiles de 44 px priment sur le visuel.
3. **Un lot cohérent à la fois** : comprendre la cause → modifier le minimum → tests ciblés → lint → build → re-test du parcours → régression → noter le résultat. Jamais 50 modifications d'un coup.
4. **Aucune requête ad hoc vers des services tiers** (api.quran.com, audio, etc.) pour « vérifier qu'ils marchent » sans l'accord de l'utilisateur. Utiliser les audits du dépôt (`npm run audit:reciters`, `npm run audit:warsh`) et les mocks `tests/e2e/helpers/quran-network-fixtures.mjs`.
5. Ne pas masquer un bug en supprimant une fonctionnalité, ne pas remplacer une API en silence, ne pas ajouter de dépendance sans justification mesurée.
6. Ne pas committer sans demande explicite.

## Boucle

### 1. Inspect — cartographie (lecture seule)

- `package.json` (scripts), `ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `vite.config.js`, `scripts/cspPolicy.mjs`, `public/sw.js`, `.github/workflows/`.
- Stack réelle : React 18 + Vite 8, Tailwind 4, Radix, **SPA statique sans backend ni compte**. État : `AppContext` (reducer + sélecteurs). Données : localStorage, IndexedDB `mushafplus` (v4 : stores `cache`, `notes`, `bookmarks`, `playlists`), Cache Storage (audio v2, API, polices QCF). Pas de TypeScript : **pas de typecheck** (l'équivalent est `npm run lint`).
- `git status` et `git log -5` : une autre session peut modifier la branche en parallèle ; ne jamais écraser, relire avant d'éditer.

### 2. Test — état de référence AVANT toute modification

```powershell
npm.cmd install            # CI utilise npm install ; npm ci est recommandé pour reproduire
npm.cmd run lint           # ESLint --quiet (les warnings exhaustive-deps ne bloquent pas)
node --test tests/*.test.mjs        # = npm run test:security (≈ 526 tests, ~12 s)
npm.cmd run build:ci       # build + 6 gates : seo, perf, screen-budget, bundle-budget, css, headers
npx playwright test                 # tous projets (chromium, firefox, webkit, pwa-offline) ≈ 12-15 min
```

- `npm run build` seul n'exécute pas les budgets ; `build:ci` oui. Les budgets sont dans `scripts/check-bundle-budget.mjs` (plafonds commentés et datés) et `scripts/check-screen-budget.mjs` (taille de source par écran : extraire un module plutôt que relever).
- E2E : un build `dist/` à jour est obligatoire (Playwright sert `vite preview` sur 4173). Ne pas reconstruire pendant une exécution E2E.
- Un test qui échoue sous charge mais passe seul : le relancer seul, puis `--repeat-each=8 --workers=3`, **et le comparer à la version de base** (worktree propre + `vite preview` séparé) avant de conclure « flaky préexistant » ou « régression ».
- Enregistrer les compteurs de référence (tests, taille bundle, gates) pour le rapport.

### 3. Detect — chercher les défauts

| Axe | Commande / méthode |
| --- | --- |
| Console + réseau | Playwright : écouter `pageerror`, `console` (type `error`), `requestfailed`, réponses ≥ 400 sur chaque parcours ; en prod `console.*` est supprimé par le build, utiliser `npm run dev` pour voir les `devWarn`. |
| Responsive | `node .claude/skills/app-full-review/scripts/responsive-sweep.mjs base=http://127.0.0.1:4173 [vp=320,390,1440] [theme=light,dark] [lang=fr,ar]` : débordement horizontal, éléments hors écran, cibles < 40 px, texte tronqué. Bruit connu et accepté : lien d'évitement (`.app-skip-link`), `.sr-only`, mots du texte coranique (inline). |
| Accessibilité | `node .claude/skills/app-full-review/scripts/axe-sweep.mjs` (61 pages : 5 combinaisons viewport/thème/langue). Plus les specs `axe-accessibility`, `wcag-audit`, `a11y-smoke`, `modal-a11y`. |
| Performance | Voir §Performance. |
| Résilience | `tests/e2e/shell-resilience.spec.mjs` (chunk d'un accessoire du shell qui échoue) ; bloquer une route avec `page.route(..., r => r.abort())` pour simuler hors-ligne / 4xx / 5xx / timeout et vérifier qu'aucun `role=alert` pleine page n'apparaît pour une panne mineure. |
| Données | `tests/e2e/idb-cache-prune.spec.mjs` (migration IndexedDB, élagage) ; `local-data-deletion`, `privacy-protection`, `qa-storage-services`. |
| Sécurité | `npm run test:security`, `npm run audit:headers`, `npm audit --omit=dev --audit-level=high` (production), `git grep` de motifs de secrets, vérifier `.env*` non suivis. Les 4 avis « high » restants (purgecss → fast-glob → micromatch → braces) sont **dev-only** et sans correctif amont. |
| Hors-ligne / PWA | projet `pwa-offline` ; `public/sw.js` (budgets d'octets par cache). |
| Warsh / tajwid | `npm run audit:warsh` (réseau : sondes audio). |

### 4. Diagnose — la cause avant le correctif

Reproduire, isoler, **prouver** la cause (profil CPU CDP, `UpdateLayoutTree`, tracé réseau, bissection git/worktree). Noter `CONFIRMÉ` seulement si la cause est reproduite. Pièges déjà rencontrés :

- Le temps jusqu'au premier verset est dominé par la charge utile Quran.com (6 pages × ~100 Ko gz, ~780 Ko JSON brut chacune) et par le rendu, pas par le JavaScript initial. Variance de ±5 s entre deux exécutions identiques sur l'API réelle : ne jamais conclure sur des essais bruts.
- Un test E2E qui épingle `indexedDB.open("mushafplus", N)` casse à chaque changement de version : ouvrir sans version.
- L'arbre de travail est en CRLF alors que l'index est en LF : les remplacements de chaînes multi-lignes par script doivent normaliser les fins de ligne.
- Git Bash réécrit `/chemin` en `C:/Program Files/Git/...` : lancer les scripts qui prennent une URL-chemin depuis PowerShell.
- `Remove-Item` sur un dossier de session peut être bloqué : utiliser un autre nom de dossier de sortie.
- Aucun des tests `*-debug.spec.mjs` n'est exécuté (ignorés par la config).

### 5. Fix — petit, justifié, réversible

Respecter les propriétaires canoniques (`docs/DESIGN_SYSTEM.md`, `src/components/ui/`, `src/i18n/`, `ARCHITECTURE.md`). Utiliser les jetons de thème existants (ex. `--primary-fg` pour l'encre sur un fond `--primary`, pas `#fff` : le thème sombre échoue en blanc à 3,3:1). Pas de changement de schéma IndexedDB sans migration testée (`idb-cache-prune.spec.mjs`). Le cache est indexé par URL : changer une URL d'API invalide le hors-ligne des lecteurs.

### 6. Re-test et Regression

1. Le test précis qui prouve la correction (l'écrire d'abord s'il n'existe pas ; vérifier qu'il **échoue** sans le correctif).
2. `npm run lint` → `node --test tests/*.test.mjs` → `npm run build:ci`.
3. Specs ciblées puis suite complète `npx playwright test` (tous projets) sur le **nouveau** build.
4. Pour un changement CSS prétendu neutre : prouver l'absence d'effet par comparaison de styles calculés (voir mémoire projet `css-refactor-proof-tooling` : `scripts/snapshot-computed-styles.mjs`) ; pour un changement de balise (h2 → h1) comparer les propriétés calculées avant/après.
5. Si un test échoue : le relancer seul, puis en répétition, puis sur la base propre avant de statuer.

### 7. Report

Produire (dans la réponse et, si demandé, dans `docs/`) : résumé par criticité ; pour chaque correction `Problème / Cause / Correction / Fichiers / Test / Résultat` ; performance `Avant / Après / Gain` **uniquement mesurés** ; tests réussis, échoués, non exécutables, régressions ; reste à faire séparé en Urgent / Important / Amélioration / Optionnel. Chaque constat porte son statut (CONFIRMÉ, À CONFIRMER, NON TESTÉ, BLOQUÉ).

## Performance (mesurer avant et après)

- Taille : sortie de `npm run build:ci` (`[budget] Initial entry`, agrégats), `dist/.vite/manifest.json`. Pour attribuer des octets à des modules : `vite build --sourcemap --outDir <tmp>` puis `source-map-js` (la carte n'est jamais livrée en production).
- Chargement réseau/CPU throttlé : Playwright + CDP (`Network.emulateNetworkConditions`, `Emulation.setCPUThrottlingRate` ×4), `PerformanceObserver` (`longtask`, `largest-contentful-paint`), `browser.startTracing` (catégorie `devtools.timeline` seulement : ajouter `disabled-by-default-blink.debug` fausse les durées ×4).
- **Avant/après du lecteur** : `node .claude/skills/app-full-review/scripts/reader-ab.mjs <baseAvant> <baseAprès>` (API mockée depuis un enregistrement + lien simulé + CPU ×4, médiane de 3). Construire chaque arbre avec `vite build --outDir`, les servir avec `vite preview` (un serveur statique maison diverge : les specs échouent dessus).
- Coût CSS : un recalcul de style complet ≈ 30 µs/élément (6 000+ `!important`) ; c'est le levier CPU suivant après la charge utile.

## Lancer l'application

```powershell
npm.cmd run build ; npx vite preview --host 127.0.0.1 --port 4173   # cible des E2E et des sweeps
npm.cmd run dev                                                     # port 3002, SW désactivé, devWarn visibles
```

Lancer un serveur en arrière-plan avec `Start-Process -WindowStyle Hidden` et l'arrêter ensuite (`Get-NetTCPConnection -LocalPort <p> | Stop-Process`). Plus de détails : skill `run-mushafplus`.

## Statut connu à la dernière revue (2026-10-06) — à re-vérifier, pas à croire

- axe : 0 constat sur 59 pages après correction (rail audio agrandi en boîte seulement ≥ 1025 px, `h1` réservé aux lecteurs d'écran sur la vue sourate en téléphone, jeton `--primary-ink` pour le texte vert en thème sombre). Toute régression de ce balayage est nouvelle.
- Le test WebKit `cross-browser-smoke:44` était une course du test : la barre du bas se masque 2,8 s après le chargement en lecture et seul un toucher/défilement la ramène ; `openQuickMenuItem` demande maintenant le chrome (`mushafplus-reveal-reading-chrome`). Avant : 4/8 échecs sur la base propre ; après : 0/8.
- Préchargement des polices de l'accueil (`index.html`) : testé sans, lien lent + CPU ×4, médiane de 5 : FCP 2600 → 1824 ms mais LCP 5800 → 6136 ms. Compromis, laissé tel quel (LCP prioritaire).
- Dépendances : 0 vulnérabilité en production ; paquets inutilisés retirés (`@radix-ui/react-tabs`, `@radix-ui/react-tooltip`, `@types/react*`) ; `npm ci` en CI ; Node ≥ 22 (`.nvmrc`). Les sondes réseau du build sont opt-in (`PERF_PROBES=1`).
- **Ordre des mesures** : un A/B où l'ancienne version passe toujours avant la nouvelle ment (la machine dérive : un « −46 % » obtenu ainsi a disparu quand les exécutions ont été entrelacées, 6,93 s contre 7,24 s). Entrelacer (ABABAB…), répéter ≥ 8 fois, comparer les médianes **et** les dispersions ; un micro-benchmark IndexedDB dont le premier format mesuré est « froid » est confondu de la même façon. Le stockage du texte en chaîne a été essayé puis annulé pour cette raison.
- Cache du texte Quran.com : clé = chemin + paramètres hors `fields`/`word_fields` (changer la liste des champs ne coupe plus le hors-ligne), relecture des pages stockées sous l'ancienne URL complète, plafond de 360/120/60 pages selon le quota réel (`cachedPageBudget`). Tests : `quran-cache-legacy-key.spec.mjs`, unitaires `quran-request-dedupe`.
- `tests/e2e/axe-themes.spec.mjs` garde le résultat axe (sombre/sépia, AR/EN/FR) ; le rail du lecteur minimisé est filtré à dessein (3 px peints, zone de 44 px en `::after`).
- Stockage : mesurer avec `navigator.storage.estimate().usageDetails` (caches / indexedDB) **et** la taille décodée des entrées de Cache Storage ; le navigateur compresse IndexedDB (15 Mo de JSON = 3,8 Mo sur disque) mais pas Cache Storage. Le service worker ne copie plus `/api/v4/verses/` (24 → 8,5 Mo après 7 lectures).
- Premier affichage progressif du lecteur : `getSurahText(..., { onFirstPage })` ; seulement Hafs, liste, reprise ≤ verset 45 ; `quran-first-page.spec.mjs`. A/B : `reader-ab.mjs` (entrelacé).
- Windows : les JSON de `public/data` vérifiés par empreinte doivent rester en LF (`.gitattributes`), sinon `tafsir-service` échoue sur un poste en CRLF.
- Ouverts : charge utile par police (−28 % mesuré, mais rechargement du texte à chaque changement de police/mise en page) ; mesures sur appareil réel ; avertissements `react-refresh` (dev seulement) ; marge du budget JS ≈ 10 kB.
