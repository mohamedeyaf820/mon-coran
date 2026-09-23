# MushafPlus agent guidance

MushafPlus is a Quran reading PWA. Correct Quran text, riwaya integrity, reading continuity, accessibility, and user trust take precedence over visual novelty.

## Product-design trigger

For any work that changes what a user sees, understands, chooses, or does, read `.agents/skills/product-design/SKILL.md` before proposing or editing the interface.

This includes pages, components, copy, navigation, settings, user flows, reading, audio, search, memorization, library, sharing, offline states, accessibility, responsive behavior, RTL, loading, errors, permissions, destructive actions, and user-visible backend outcomes.

Skip the skill for backend-only work with no user-visible effect, telemetry-only changes, generated files, and tests that do not affect shipped UI behavior.

## Repository guardrails

- Treat `docs/DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `SCREEN_UX_BUDGETS.md`, `src/components/ui/`, and `src/i18n/` as canonical owners for their concerns.
- Treat shipped code as evidence, not automatic precedent. Verify an adjacent pattern against canonical owners before copying it.
- Preserve French, English, Arabic, native RTL, Hafs/Warsh behavior, offline operation, persisted reading state, and 44 px touch targets.
- Use existing tokens and UI primitives before adding custom variants or dependencies.
- Verify visible changes in a rendered surface; source inspection alone is not visual verification.
- Run the narrowest relevant tests first, then the required gates described by the product-design skill.
