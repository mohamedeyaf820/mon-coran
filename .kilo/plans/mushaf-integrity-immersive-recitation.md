# MushafPlus: integrity, immersive reading and recitation

## Current evidence

Read-only audits completed against the dirty workspace. Preserve all existing changes. No new application edits were applied: permissions rejected the attempted patch.

- React 18/Vite PWA. Normal PageMode and FullscreenMushafOverlay both use CleanPageView, SmartAyahRenderer and the riwaya-aware text renderers. QuranMushafPage is currently inactive.
- Fullscreen is a body portal, not the Fullscreen API. Ancestor-scoped normal CSS does not reach it. Its separate 760px width/padding and font-size zoom change line wrapping. Existing tests compare text and typography, not word-by-line composition.
- Normal CleanPageView is flowing Unicode text, not authoritative printed line data. Do not substitute the inactive renderer's estimated Warsh lines for verified composition.
- Fonts are selected by riwaya. QPC Warsh and KFGQPC Warsh currently share an asset. KaraokeWarshText hardcodes the marker font instead of receiving the selected font. An actual duplicate marker on the reported page remains NOT_CONFIRMED. Inspect source, parsed tokens, DOM and glyph output before removing anything; preserve waqf and sajda.
- AudioService owns persistent HTMLAudioElement playback; Media Session already subscribes to it. Visibility listeners inspected persist data rather than pause playback. Real OS background and lockscreen behavior is NOT_TESTED_ON_REAL_DEVICE.
- Reciter catalogue/details live in HomePage and a modal. Metadata, portraits and biography fallbacks already exist. Downloaded audio uses Cache Storage, a persisted registry and service worker Range handling.

## Implementation batches

1. Reproduce page 3 normal/fullscreen at the same viewport, font, preference and riwaya. Capture before screenshots and per-word Range rectangles, line grouping, marker placement and page dimensions. Include Fatiha, Baqarah, pages 564-566, Tajwid and playback on/off. Audit fonts and their actual load success; do not infer rendered font from computed font-family alone.
2. Pass selected font to KaraokeWarshText. Test every supported Warsh marker strategy while paused/playing. Inspect HTML-wrapped source marker handling after parsing; remove only positively identified source end markers before appending one canonical marker. Do not remove religious symbols by resemblance or change datasets. Flag uncertain cases NEEDS_QURANIC_VALIDATION.
3. Establish one ancestor-independent page layout contract used in both surfaces. Preserve the normal page's measured composition when entering immersive mode, including width, spacing and all renderer props. Separate page composition from its outer viewport. No inferred printed line mapping.
4. Replace font-size-only immersive zoom with whole-page zoom and correctly sized scroll bounds. Test 75/100/125/150 percent against baseline line grouping. Preserve quranFontSize. Keep browser accessibility zoom enabled; evaluate pinch only without conflicting with scroll/selection.
5. Add two-page presentation using the same renderer and riwaya-specific page data. Verify edition ordering before binding parity to left/right. Persist layout preference, temporarily fall back to single page when actual width/height cannot accommodate two readable pages, retain preference on resize. Cancel stale adjacent-page loads and never fall back Warsh to Hafs.
6. Apply restrained existing design tokens, safe areas and accessible toolbar grouping. Essential exit/audio/pagination controls remain reachable at 280/320px. Secondary zoom/layout/repeat/reciter controls use existing primitives. Any control hiding must respect focus, keyboard and reduced motion.
7. Fix confirmed audio defects: playSingle identity and completion before empty-playlist guard; clear one-shot mode when normal playback replaces it; protect stale async completion. Test one-shot without playlist, one-shot interrupted by queue, pause/stop/new playback races. Emit consistent stop notifications and clear Media Session position on stop. Verify failover explicitly starts replacement playback instead of interpreting a paused reciter switch as success. Keep one global transport.
8. Fix Home playback state claiming success after a rejected play; derive actual playing/track state from engine notifications. Resolve shared reciter links against the full catalogue with explicit canonical riwaya and validated surah rather than silently rejecting Warsh links in Hafs settings.
9. Register full-Quran download ownership and cancellation before startup awaits; encompass all preparation and workers in cleanup. Test cancel during deferred reconciliation/quota and concurrent starts. Classify actual QuotaExceededError as storage-full while preserving valid partial progress. Derive row activity from the service on remount. Verify removal cannot race pending startup.
10. Align profile request and precache URLs, bound network wait, retain deduplication and safe stale-result handling. Provide retry/error handling appropriate to existing profile fallback. Keep one accessible detail dialog shell during loading/error/success with focus trapping and local chunk-load recovery. Audit portraits and fallback loops before changing visual design.
11. Consolidate reciter cards/detail/list loading/empty/error/offline states using canonical primitives and localized FR/EN/AR strings. No fabricated biography, duration, portrait or source metadata. Measure list/image performance before adding virtualization or dependencies.

## Validation

- Narrow unit tests first, then security/unit suite, changed-file lint, global lint and build:ci. Report pre-existing scratch lint errors without deleting user files or weakening budgets.
- Render normal/fullscreen, one/two pages and zoom for both riwayat. Compare word line membership and relative marker positions, not merely textContent and font sizes. Inspect screenshots, glyphs and diacritic clipping.
- Viewports: 280, 320, 360, 375, 390, 412, 430, 480, 600, 768, 820, 1024, 1280, 1440, 1920 with portrait/landscape heights. Themes light/dark/sepia and FR/EN/AR RTL. Validate touch targets, focus, Escape, safe areas and no global accidental horizontal overflow.
- Audio normal -> fullscreen -> pause/resume -> ended/next -> exit on same element; successive page/juz boundaries with suspended animation callbacks; reciter switch and one-shot/failover races. Simulated visibility is not real OS validation.
- Offline: download real playable media, close browser, reopen same profile without network, play and seek using cached Range responses. Test interruption, partial registry, eviction, quota and cancellation. Never label partial or unavailable bytes as downloaded.
- Screenshots include Quran normal/fullscreen/single/double, reciter catalogue/detail mobile/desktop and loading/error/offline surfaces. Keep artifacts ignored; do not add diagnostics to production.

## Completion report

Report each implemented batch, file -> defect -> change -> reason -> actual test. Clearly separate remaining scope, NOT_CONFIRMED, NOT_TESTED_ON_REAL_DEVICE and NEEDS_QURANIC_VALIDATION. No claims of visual/device success based solely on source inspection or mocked media. Deployment is deferred until correctness and verification are complete; no commits, paid changes or publication in this plan.
