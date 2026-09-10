# Revue globale et axes d'amélioration — 10 septembre 2026

Revue statique en lecture seule de l'ensemble du dépôt MushafPlus. Ce document
ne certifie ni le texte coranique ni le comportement sur appareil physique : il
recense la dette technique, les fragilités et les améliorations prioritaires
identifiées à partir du code livré, des tests et des scripts de vérification.

La revue a été conduite en six axes parallèles : architecture et services,
architecture CSS, composants et hooks React, i18n/RTL/accessibilité,
tests/CI/build/sécurité/PWA, et qualité de code générale.

## Périmètre mesuré

| Élément | Mesure |
| --- | --- |
| Lignes de code dans `src/` | ~98 000 |
| Fichiers JSX / JS / CSS | 108 / 107 / 42 |
| Fichiers CSS dans `src/styles` et `src/styles/domains` | ~61 300 lignes cumulées |
| Déclarations `!important` | 6 404 (plafond CI : 7 240) |
| Tests unitaires Node | 38 fichiers |
| Specs E2E | 43 fichiers (41 actifs, 2 specs de debug) |
| Suppressions ESLint inline | 2 (`exhaustive-deps`) |
| `TODO`/`FIXME`/`debugger` | 0 |

## Points forts

- Séparation claire `AppContext` (reducer + sélecteurs) → `services` → `hooks` → `components` ; pas d'import circulaire détecté.
- Code-splitting agressif (panneaux/modales en `React.lazy`), chunks manuels limités à React, CryptoJS et `idb`.
- CI sérieuse : budgets bundle/écran/CSS, en-têtes de sécurité centralisés, PWA offline, cross-browser, audit `axe`.
- Parité i18n fr/en/ar complète ; RTL appliqué au niveau `document` et `.app-root`.
- Hygiène de code élevée : 0 marqueur de dette, 0 `debugger`, très peu de suppressions de lint.

---

## 1. Priorité critique

| # | Problème | Preuve | Impact | Correctif recommandé |
| --- | --- | --- | --- | --- |
| C1 | **Cascade CSS non déterministe.** 42 fichiers, ~6 400 `!important`, aucun `@layer`, pas d'index d'import unique. La typo du Mushaf (`.mushaf-text-block`, `.mushaf-container`, `.verse-text`, `.qc-ayah-text-ar`) est définie dans 7 à 12 fichiers avec des `line-height` divergents (`1.78`, `1.86`, `2.2`, `2.42`, `2.8`). | `responsive-all.css:764`, `device-responsive.css:654`, `experience-polish.css:868`, `mushaf-page-polish.css:343`, `home-audio-ux-refonte.css:1236`, `mushaf-book.css:236` | Cause racine des coupures de texte : le `line-height` gagnant dépend de l'ordre de chargement des chunks, pas de la spécificité. Instabilité par construction. | Introduire un ordre `@layer` unique, désigner **un seul propriétaire** de la typo Qoran qui résout `--cpv-line-height`/`--cpv-font-size`/`--cpv-word-spacing`, et supprimer les déclarations concurrentes. |
| C2 | **Texte Warsh dépendant de deux URL GitHub `raw` non épinglées** (aucune version, aucune empreinte). | `src/constants/warshSource.js:5-6`, `src/services/warshService.js:296,431` | Une panne ou un renommage du dépôt tiers casse toute la riwaya. | Auto-héberger le JSON Warsh versionné, avec vérification d'intégrité. |
| C3 | **Libellés arabes en anglais/français.** Ternaires `lang === "fr" ? ... : "English"` : un utilisateur AR voit `Pause`, `Copied`, `Share`, `View note`… et un mélange `"اكتب حول cette الآية"`. | `src/components/AyahActions.jsx:553,579,592,602,618,701-713,737,784-796,1058` | Qualité perçue et confiance, surtout sur l'interface arabe. | Router ces chaînes par `src/i18n/` (`audio.pause`, `actions.copy`, …) au lieu de ternaires à deux branches. |
| C4 | **`useApp()` abonne au state entier**, annulant le pattern sélecteur : chaque `dispatch` re-rend 12 composants lourds. | `src/context/AppContext.jsx:787,834` ; consommateurs `SettingsModal.jsx:167`, `Sidebar.jsx:12`, `PageMode.jsx:48`, `TafsirSidebar.jsx:120`, `SurahReaderHeader.jsx:50` | Coût de rendu inutile sur les écrans les plus lourds. | Migrer vers `useAppSelector`/`useAppActions`/`useAppLocale`. |

## 2. Priorité élevée

| # | Problème | Preuve | Correctif recommandé |
| --- | --- | --- | --- |
| H1 | **Race d'écriture des réglages** : debounce global vs read-modify-write synchrone sur la même clé. | `AppContext.jsx:550-581`, `storageService.js:642-659` | Écrivain unique (tout router par le reducer) ou fusion à l'écriture. |
| H2 | **God-objects** : `audioService.js` (1 170 l.) cumule transport, playlist, réessai, préchargement, latence, A/B repeat. Idem `AudioPlayer.jsx` (1 164), `AyahActions.jsx` (1 115), `SettingsModal.jsx` (1 042), `HomePage.jsx` (1 045). | `src/services/audioService.js:31-1165` | Extraire transport, playlist et préchargement/latence. |
| H3 | **Recherche arabe hors ligne morte** : le chemin local `throw` systématiquement, le repli est inatteignable. | `src/services/quranAPI.js:413-441` | Livrer un petit index embarqué, ou retirer le repli mort et afficher un message explicite. |
| H4 | **Lint CI aveugle aux warnings** : `--quiet` masque `no-unused-vars`, `exhaustive-deps`, etc. Aucun `--max-warnings`, pas de `eslint-plugin-react`. | `package.json:18`, `.github/workflows/tests.yml:25`, `eslint.config.js:52` | Lancer sans `--quiet` ou fixer un budget `--max-warnings`. |
| H5 | **Cache non borné** : `Map` sans plafond + `Promise.all` sur toutes les pages. | `src/services/quranComAudioTimingService.js:22,118-124` | Plafond LRU + limite de concurrence (cf. `quranComAPI.mapWithConcurrency`). |
| H6 | **PurgeCSS réécrit après le hashing** : le hash ne reflète plus le contenu ; le SW `cacheFirst` peut servir du CSS périmé. | `scripts/purge-css.mjs:63`, `vite.config.js:53-55` | Purger en étape PostCSS/Vite avant le hashing, ou inclure le contenu purgé dans le hash. |
| H7 | **CSP incomplète** : `ui-avatars.com` absent de `img-src` alors qu'il sert d'avatar par défaut ; `www.everyayah.com` absent de `media-src` alors que le SW le considère de confiance. | `scripts/cspPolicy.mjs:27` vs `src/components/Home/homeConstants.js:608` ; `public/sw.js:196` | Ajouter les hôtes manquants à la politique centralisée, ou remplacer l'avatar par une ressource locale. |
| H8 | **Code mort** : renderers et services orphelins. | `QuranDisplay/MushafPageRenderer.jsx`, `QuranDisplay/QuranMushafPage.jsx` (426 l.), `Quran/MushafInlineView.jsx` (+2 deps), `services/qcf4PageFontService.js`, `services/readingProgressService.js`, `QuranDisplay/AyahList.jsx`, `QuranDisplay/QCReadingView.jsx` ; exports inutilisés `quranAPI.js:33,150,555,624,735,742`, `warshService.js:520,526,536,709` | Supprimer (après mise à jour de `tests/reader-ui-contract.test.mjs:384`). |
| H9 | **Trois renderers d'ayah redondants** avec regex et branches quasi identiques. | `Quran/AyahTextRenderer.jsx:24-119`, `Quran/SmartAyahRenderer.jsx:96-153`, `QuranDisplay/MushafPageRenderer.jsx:30-82` | Converger vers un renderer intelligent + un renderer de mot. |
| H10 | **Double suivi d'auto-scroll** sur l'ayah en lecture. | `AudioPlayer.jsx:912`, `QuranDisplay/useQuranDisplayScroll.js:150-194` | Consolider dans un seul hook propriétaire du scroll. |
| H11 | **Sélecteur mort** qui ne matche jamais (les renderers émettent `data-surah-number`). | `QuranDisplay/useQuranDisplayScroll.js:38` | Aligner sur `data-surah-number`/`data-ayah-number`. |
| H12 | **Closure obsolète** : `handleScroll` lit l'état de lecture absent des dépendances. | `src/App.jsx:431-447,481` | Ajouter les dépendances ou lire un ref. |

## 3. Priorité moyenne

| # | Problème | Preuve | Correctif recommandé |
| --- | --- | --- | --- |
| M1 | **RTL avec propriétés physiques résiduelles** qui écrasent les propriétés logiques. | `experience-polish.css:1257-1258`, `Home/ContentSection.jsx:369,384,396`, `Home/HomePrimitives.jsx:197,241,298`, `TafsirSidebar.jsx:259`, `QuranDisplay.jsx:587` | Propriétés logiques (`inline-start/end`) ou variantes `rtl:` ; centraliser par règle de lint. |
| M2 | **Accessibilité** : `role="listbox"` sans `role="option"` ni navigation clavier ; onglets custom sans `tablist`/`tabpanel` ; `role="help"` invalide ; `Sheet` sans piège de focus ; IDs de titres codés en dur. | `SearchModal.jsx:513-604`, `LibraryModal.jsx:283-289`, `DuasPage.jsx:145-162`, `audioPlayer/AudioOptionsModal.jsx:101-126`, `Quran/TajweedText.jsx:243`, `ui/sheet.jsx:20-77` | Adopter les primitives `ui/tabs.jsx`/`ui/modal.jsx`, compléter les rôles, IDs `useId`. |
| M3 | **Tests d'accessibilité 100 % en `lang:"fr"`** : aucun passage AR/RTL. Exigence 44 px non auditée globalement (un test tolère ~34 px). | `tests/e2e/axe-accessibility.spec.mjs:27`, `tests/e2e/wcag-audit.spec.mjs:16`, `playwright.config.mjs:38-76`, `tests/e2e/cross-browser-smoke.spec.mjs:169` | Ajouter une passe `dir=rtl` et un audit global des cibles tactiles 44×44. |
| M4 | **Chiffres arabes incohérents** et deux helpers divergents. | `Home/StatsStrip.jsx:13-15`, `data/surahs.js:1050-1055` vs `utils/arabicNumerals.js:3-8` | Un seul formateur ; chiffres latins dans `StatsStrip` en mode AR. |
| M5 | **Cache audio SW jamais purgé** : nom `mushafplus-audio-v2` ≠ préfixe de nettoyage `mushaf-plus`. | `public/sw.js:13,110-113` | Aligner le nom sur le cycle de vie du service de téléchargement ou borner la taille. |
| M6 | **Quatre gestionnaires de cache IndexedDB indépendants** partageant le store `cache` (préfixes/TTL/pruning distincts). | `quranAPI.js:56-77`, `quranComAPI.js:30-39`, `quranComAudioTimingService.js:84-88`, `warshService.js:401,440` | Centraliser dans un service de cache unique. |
| M7 | **Sécurité/observabilité** : clé AES en clair à côté du chiffré, `LEGACY_SECRET_KEY` figé, seule télémétrie = buffer localStorage de 50 entrées, aucun test export/restauration. | `services/cryptoUtil.js:4-6,31-42`, `services/errorAnalytics.js`, `services/exportService.js` | Documenter le modèle de menace, tests aller-retour import/export, sink télémétrie optionnel. |
| M8 | **Déterminisme CI** : le job Warsh télécharge tout le corpus et sonde des CDN en direct. | `.github/workflows/tests.yml:32-33`, `scripts/verify-warsh-tajweed.mjs:28`, `scripts/audit-warsh-audio.mjs:39` | Passer en nightly ou s'appuyer sur des fixtures committées. |
| M9 | **Documentation périmée** : `ARCHITECTURE.md` titré `# CLAUDE.md`, cite des services supprimés et de mauvais budgets ; `README.md` en mojibake, compte 36 suites au lieu de 43. | `ARCHITECTURE.md:1,74,75,85`, `README.md:19,43,78,141,150-175` | Réécrire depuis l'arbre courant. |
| M10 | **Fichiers racine non suivis/non listés** : captures et script orphelin. | `screenshot-desktop.png`, `screenshot-mobile.png`, `screenshot-mushaf.png`, `screenshot-mushaf.mjs`, `PLAYWRIGHT_DEBUG.md` | Déplacer le script dans `scripts/` ou supprimer ; compléter `.gitignore`/`INDEX.md`. |
| M11 | **`tailwind.config.js` mort** (Tailwind v4 n'utilise pas `@config`). | `tailwind.config.js`, `ARCHITECTURE.md:66` | Supprimer ou charger via `@config` et corriger la doc. |
| M12 | **Couverture non plancher** : `test:coverage` rapporte mais rien n'échoue. Backup/restauration sans test. | `package.json:17`, `src/services/exportService.js:13,179` | Seuils de couverture sur les services cœur + tests round-trip. |
| M13 | **Déclencheurs CI incohérents** : `perf-budget.yml` sur toutes les PR, `tests.yml` limité à `main`/`master`. | `.github/workflows/perf-budget.yml:6-7` vs `tests.yml:6-7` | Unifier : tests complets sur toutes les PR, dédupliquer `build:ci`. |
| M14 | **Mutation de ref dans `useMemo`** (index karaoké impur, sensible à StrictMode). | `hooks/useKaraokeWordIndex.js:108-109` | Suivre l'index précédent via state/effect ou calcul pur. |
| M15 | **Virtualisation qui ne démonte jamais** : `visibleIndexes` n'est jamais élagué. | `QuranDisplay/VirtualizedMushafPages.jsx:111-124` | Retirer les index sortis du root margin après un délai de grâce. |

## 4. Priorité faible / hygiène

- `console.log` non gardé : `src/main.jsx:186` (garder via `import.meta.env.DEV`).
- 10 blocs `catch {}` vides silencieux (audio/stockage) : journaliser en dev.
- `--quran-line-height` de base à `1.2` (`riwaya-fonts.css:38`) alors que tous les consommateurs retombent sur 1.76–2.8 : valeur trompeuse.
- Cinq noms différents pour la cible tactile 44 px (`--touch-target`, `--tap-min`, `--mp-device-touch`, `--mp-touch`, `--mp-control-h`).
- `SET_LANG` jamais dispatché (code mort) : `AppContext.jsx:336`.
- Rule coverage ESLint : pas de `eslint-plugin-react` (`jsx-key`), `no-console` absent, `public/boot-recovery.js` entièrement ignoré alors que c'est du code de démarrage critique.
- `scripts/audit-performance.mjs:73-83` fait des sondes réseau non bloquantes dans `build` : sortir du build.
- `scripts/generate-seo-pages.mjs:254-291` : génération par remplacement de chaînes fragile (partiellement couverte).

---

## Plan d'action proposé

### Phase 0 — immédiat (< 1 jour)
1. **Consolider la typo Mushaf** : un propriétaire unique de `--cpv-line-height`/`--cpv-font-size`/`--cpv-word-spacing` ; supprimer les déclarations concurrentes (C1). C'est le correctif réel des coupures de texte.
2. Corriger les libellés arabes (C3), la CSP `ui-avatars.com` (H7), et retirer `--quiet` du lint (H4).
3. Rôter le token Vercel présent dans `.env.local` par précaution (fichier confirmé non suivi par git) et activer le scan de secrets.

### Phase 1 — 1 à 2 semaines
4. Introduire un ordre `@layer` unique et y migrer les 42 fichiers : cascade déterministe, fin de l'ajout de `!important`.
5. Auto-héberger/épingler le texte Warsh (C2) ; supprimer le code mort et les renderers redondants (H8, H9).
6. Migrer les consommateurs `useApp()` vers les sélecteurs (C4).

### Phase 2 — 1 à 2 mois
7. Tests : seuils de couverture, export/restauration, passe axe AR/RTL, audit 44 px global ; éliminer `waitForTimeout`/`networkidle` (p. ex. `tests/e2e/axe-accessibility.spec.mjs:9,51`, `responsive-density.spec.mjs:60,652`, `pwa-offline.spec.mjs:39,78`) au profit d'assertions web-first.
8. Fiabiliser la CI (Warsh en nightly ou fixtures) ; centraliser les caches IndexedDB (M6) ; corriger le cache audio SW (M5).
9. Scinder `audioService` (H2) ; consolider le suivi de scroll (H10, H11).

### Phase 3 — continu
10. TypeScript incrémental (`checkJs` + JSDoc sur les services) ; rattraper la documentation (M9) ; supprimer `tailwind.config.js` (M11) ; unifier les helpers de chiffres arabes (M4) et les tokens de cible tactile.

---

## Réserves et méthode

- Revue statique : les conclusions de performance et d'accessibilité restent à confirmer par mesure en surface rendue.
- Les comptages de `!important`, de lignes CSS et de specs proviennent des scripts et fichiers du dépôt ; les valeurs exactes font foi via `npm run audit:css` et `npm run build:ci`.
- Aucune garantie n'est apportée sur la correspondance éditoriale d'une source de texte à une riwaya : une réponse HTTP ne la prouve pas.
- Le contrôle des chemins hors-ligne, écran éteint, Bluetooth et installation mobile reste du ressort d'essais sur appareil physique (`NOT_TESTED_ON_REAL_DEVICE`).

## Références

- `ARCHITECTURE.md`, `README.md`, `INDEX.md`
- `docs/AUDIT_ET_CORRECTIONS_2026-09.md`, `docs/NETTOYAGE_ET_PRIORITES.md`
- `src/styles/README.md` (contrat et budgets CSS)
- `scripts/audit-css-architecture.mjs`, `scripts/check-bundle-budget.mjs`, `scripts/cspPolicy.mjs`
