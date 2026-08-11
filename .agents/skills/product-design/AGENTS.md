# Product-design skill governance

Load `SKILL.md` first. It owns request mode, workflow, and routing.

For material user-facing changes, read references in this order:

1. `references/product-judgment.md`
2. `references/interface-quality.md`
3. the surface selected through `references/surfaces.md`
4. focused references for copy, resilience, patterns, rules, or vocabulary

Canonical repository owners outrank summaries in this skill:

- visual system: `docs/DESIGN_SYSTEM.md` and `src/styles/`;
- component behavior: `src/components/ui/` and the component implementation;
- product architecture and commands: `ARCHITECTURE.md` and `package.json`;
- translations: `src/i18n/`;
- screen budgets: `SCREEN_UX_BUDGETS.md`;
- reachable behavior: services, context, hooks, and tests.

Do not turn a single screenshot, one component, or an unreviewed audit note into a universal rule. Follow `references/review-loop.md` for new evidence. Add uncertain decisions to `references/coverage-gaps.md`. Give accepted rules stable IDs in `references/rules.md` and include scope, rationale, exceptions, source, and a bad/good example.
