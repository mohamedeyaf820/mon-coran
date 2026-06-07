# Mushaf Plus Design System Notes

Status: living internal guide.

## Principles

- Keep the reading surface calm before everything else. The Quran text must remain the visual priority.
- Prefer one clear primary action per surface. Secondary actions should move into compact menus on mobile.
- Use dense controls only when they remain touch-safe: 44px minimum target on mobile and tablet.
- Avoid decorative effects that reduce contrast, especially in dark mode and over Arabic text.
- Keep RTL behavior native. Do not fake Arabic alignment with visual-only transforms.

## Layout Tokens

- App shell: fixed header, scrollable main content, audio player reserved with `--player-h`.
- Reading width: use viewport-aware max widths, then allow the Arabic block to breathe inside list and mushaf modes.
- Mobile spacing: outer padding should stay between 12px and 16px; use horizontal scrolling toolbars instead of wrapping controls into tall stacks.
- Tablet spacing: prefer two balanced columns only when each column can keep readable text and 44px controls.

## Surfaces

- Cards: use a subtle border, a restrained shadow, and one radius family per section.
- Modals: portal overlays to `document.body` when the trigger may live inside fixed or transformed containers.
- Audio player: compact mode should not change height during playback. Expanded panels must cleanly reset when closed.
- Reading toolbar: keep primary mode, translation, tajweed, memorization, font and play controls discoverable, but allow horizontal scroll on small screens.

## Typography

- Arabic Quran text uses riwaya-safe font ids only.
- Use `clamp()` for Arabic sizes and keep refresh-stable persisted values.
- Latin UI labels should be short on mobile. Prefer icon-only buttons only when the `aria-label` is explicit and localized.
- French labels must keep accents. If a file is ASCII-only, use Unicode escapes inside JavaScript strings rather than mojibake.

## States

- Active: visible border and color change, not color alone.
- Hover: gentle lift or tint only; avoid large layout shifts.
- Focus: always visible with an outline or ring that survives dark mode.
- Loading: skeletons must not create an opaque veil over loaded reading text.
- Error: explain what failed and expose a retry or repair action.

## Bundle Discipline

- Prefer tests and documentation for roadmap progress when JS budget is tight.
- Reuse existing classes and tokens before adding new CSS.
- Any new production dependency must justify its bundle cost.
