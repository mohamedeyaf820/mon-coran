# Interface quality

Canonical owner: `docs/DESIGN_SYSTEM.md`, `src/styles/`, `src/components/ui/`, and the rendered interface.

## Hierarchy and composition

- Keep Quran text the strongest element on reading surfaces.
- Make one primary action unmistakable per surface; demote supporting actions or progressively disclose them.
- Use spacing, alignment, typography, and grouping before adding cards or borders.
- Keep mobile reading chrome compact. Prefer horizontally scrollable toolbars to tall wrapping control stacks.
- Maintain the fixed header, scrollable main region, and reserved audio-player height contract.
- Use viewport-aware reading widths and allow Arabic text to breathe.

## Components and styling

- Reuse primitives from `src/components/ui/` and existing CSS variables before custom HTML, one-off colors, radii, or shadows.
- Keep a consistent radius family inside one section.
- Use subtle borders and restrained shadows; decoration must not reduce Quran-text contrast.
- Use icons from the existing Lucide setup. Give icon-only controls localized accessible names.
- Keep state changes visible by more than color alone.
- Preserve clear focus rings across themes.

## Responsive and input

- Keep interactive targets at least 44 by 44 CSS pixels on mobile and tablet unless an established primitive provides an equivalent safe target.
- Test compact and wide layouts, zoom, long labels, Arabic RTL, and dense reading controls.
- Avoid horizontal page overflow. Local horizontal scrolling is acceptable for an intentional toolbar or tab strip with clear affordance.
- Navigation elements navigate; buttons mutate or invoke actions.

## Motion and performance

- Use motion to clarify entry, continuity, or state. Do not animate Quran text in a way that disrupts reading.
- Respect reduced motion and low-performance-device behavior.
- Avoid layout shifts in the audio player, loading states, font swaps, and persisted reading preferences.
- Reuse existing styles and lazy boundaries. Justify every new production dependency and bundle cost.

## Visual verification

Source review proves implementation intent, not visual quality. Render the actual surface and inspect hierarchy, contrast, clipping, overflow, focus, loading, and interaction at relevant viewports. State exactly what was and was not rendered.
