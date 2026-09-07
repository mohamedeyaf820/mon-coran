# MushafPlus agent guidance

MushafPlus is a Quran reading PWA. Correct Quran text, riwaya integrity, reading continuity, accessibility, and user trust take precedence over visual novelty.

## Repository guardrails

- Treat `docs/DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `SCREEN_UX_BUDGETS.md`, `src/components/ui/`, and `src/i18n/` as canonical owners for their concerns.
- Treat shipped code as evidence, not automatic precedent. Verify an adjacent pattern against canonical owners before copying it.
- Preserve French, English, Arabic, native RTL, Hafs/Warsh behavior, offline operation, persisted reading state, and 44 px touch targets.
- Use existing tokens and UI primitives before adding custom variants or dependencies.
- Verify visible changes in a rendered surface; source inspection alone is not visual verification.
- Run the narrowest relevant tests first, then the required gates described by the product-design skill.
