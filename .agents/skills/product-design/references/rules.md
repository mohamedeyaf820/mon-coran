# Stable product-design rules

These rules are accepted because they are already supported by repository guidance or product invariants. Verify their canonical sources before changing them.

## rule/reading-text-priority

- Scope: Quran reading surfaces.
- Rule: Quran text remains the visual priority; controls and decoration must not compete with or obscure it.
- Why: reading is the primary job.
- Exceptions: a blocking integrity, privacy, or unrecoverable-error state.
- Source: `docs/DESIGN_SYSTEM.md > Principles`.
- Bad: a large decorative card or loading veil covering readable ayat.
- Good: compact controls with loaded text remaining stable and visible.

## rule/touch-target-44

- Scope: interactive controls on mobile and tablet.
- Rule: maintain a minimum 44 by 44 CSS-pixel target.
- Why: touch accuracy and accessibility.
- Exceptions: none without documented equivalent hit-area behavior.
- Source: `docs/DESIGN_SYSTEM.md > Principles`.
- Bad: a 24 px icon as the entire clickable area.
- Good: a 24 px icon inside a 44 px button.

## rule/native-rtl

- Scope: Arabic UI and mixed-direction content.
- Rule: use semantic direction and logical layout; never fake RTL with transforms or visual reordering.
- Why: correct reading, keyboard, and assistive-technology order.
- Source: `docs/DESIGN_SYSTEM.md > Principles` and `ARCHITECTURE.md > i18n`.
- Bad: `transform: scaleX(-1)` to reverse a layout.
- Good: `dir="rtl"` with logical properties and verified mixed-direction content.

## rule/riwaya-explicit

- Scope: Quran text, fonts, tajwid, reciters, and audio.
- Rule: keep Hafs/Warsh data and presentation compatible and make any user-visible switch explicit.
- Why: silent mismatch can change what the user reads or hears.
- Source: `ARCHITECTURE.md > Project Overview` and riwaya-aware conventions.
- Bad: silently falling back from Warsh to Hafs audio or font behavior.
- Good: use a verified compatible source or explain unavailability and recovery.

## rule/error-has-recovery

- Scope: recoverable user-visible failures.
- Rule: explain what failed and expose a truthful retry or repair action.
- Why: users should not lose context or face a dead end.
- Source: `docs/DESIGN_SYSTEM.md > States`.
- Bad: `Une erreur est survenue` with no next step.
- Good: identify unavailable audio and provide retry while reading remains available.

## rule/reuse-before-custom

- Scope: components and styling.
- Rule: use existing primitives, tokens, and classes before adding custom variants or dependencies.
- Why: consistency, bundle discipline, and theme/accessibility behavior.
- Source: `docs/DESIGN_SYSTEM.md > Bundle Discipline`, `ARCHITECTURE.md > Styling`.
- Bad: a one-off modal with hardcoded colors and focus behavior.
- Good: the canonical modal/dialog primitive with layout-only customization.
