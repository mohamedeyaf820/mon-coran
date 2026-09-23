---
name: product-design
description: >-
  Single entry point for MushafPlus product design and user-facing
  implementation. Use whenever work changes what a user sees, understands,
  chooses, or does: shaping or implementing flows; building, fixing, polishing,
  or reviewing React pages and components; changing copy, information
  architecture, interaction, accessibility, responsive behavior, native RTL,
  Hafs/Warsh presentation, audio, reading, memorization, library, sharing,
  loading, empty, error, offline, privacy, or destructive states. Also use when
  backend behavior changes a user-visible outcome. Do not use for backend-only
  work with no shipped UI effect, telemetry-only changes, generated files,
  documentation-only work, or tests with no user-visible impact.
---

# MushafPlus Product Design

Make the interface correct for Quran reading before making it impressive. Working code is insufficient: protect Quran and riwaya integrity, preserve reading continuity, communicate scope and consequences, cover reachable states, and verify the rendered result.

## Operating contract

- Start with the user's job, not the component.
- Define desired behavior, success signal, and non-goals before styling.
- Separate verified facts, decisions, assumptions, and open questions.
- Use repository evidence and canonical owners rather than personal taste.
- Choose the smallest coherent intervention; prefer a better default or reuse over new settings and abstractions.
- Decide information architecture, semantics, interaction, and states before decoration.
- Preserve Quran text as the visual and functional priority on reading surfaces.
- Design only states the product can actually enter, including failure and recovery.
- Verify source behavior and the real rendered surface. Never claim visual verification from code alone.

## Resolve the request mode

| Mode | Trigger | Required behavior |
| --- | --- | --- |
| Shape | Design a flow, settle behavior, compare approaches | Frame the problem, compare material alternatives, define flow, states, acceptance criteria, risks, and open decisions. Do not edit unless asked. |
| Implement | Build, change, fix, improve, redesign | Resolve material decisions, then implement the smallest coherent end-to-end change. |
| Review | Audit, critique, inspect, review | Report prioritized, evidence-backed findings. Do not edit unless asked. |
| Copy | Rewrite labels, errors, help, accessible names | Change user-facing language and directly required markup only. Report structural blockers without silently redesigning. |
| Harden | Polish, production-ready, responsive, accessible, edge cases | Preserve settled direction while fixing resilience, accessibility, responsive, performance, and finish defects. |

Use the narrowest mode supported by the user's verb. A screenshot, URL, or component identifies scope; it does not authorize edits by itself.

## Workflow

1. Name the target surface and request mode.
2. Read the applicable `AGENTS.md` chain and the code that owns mutations, permissions, persistence, data, errors, and side effects.
3. For Shape, Implement, Harden, full Review, or a material product decision, read `references/product-judgment.md` and form its compact decision brief.
4. Read `references/interface-quality.md` for implementation, visual changes, or full reviews.
5. Use `references/surfaces.md` to load only the surface-specific code and guidance needed.
6. Load `references/copy.md`, `references/resilience.md`, `references/patterns.md`, `references/rules.md`, or `references/glossary.md` when their concern is in scope.
7. Resolve structure and state behavior before styling or copy polish.
8. Implement with existing primitives, tokens, i18n, and service boundaries.
9. Verify behavior, rendering, keyboard use, responsive layouts, RTL where relevant, and recovery states.

## Material decisions

A decision is material when it changes the user's task, default, scope, consequence, navigation, interaction surface, privacy expectation, persistence, or reachable states. Established token replacement, direct copy correction, and canonical component substitution are usually mechanical.

For each material decision, answer:

- Which user problem does it solve?
- Which Quran, riwaya, reading-position, privacy, or offline invariant could it affect?
- Why is this surface or component appropriate?
- What scope and consequence must be visible?
- Which verified source supports it?
- What is the smallest coherent change?

## Verification gates

Run the narrowest relevant checks, then expand in proportion to risk:

```powershell
npm.cmd run lint
npm.cmd run audit:screen-budget
npm.cmd run test:security
npm.cmd run test:e2e:smoke
npm.cmd run test:e2e:responsive
npm.cmd run test:e2e:reading
npm.cmd run build:ci
```

For visible changes, inspect at least one compact and one wide viewport. Exercise every materially changed reachable state. Verify keyboard order, focus return, touch targets, long content, slow/offline behavior, French and Arabic/RTL when copy or layout changes, and Hafs/Warsh when Quran text, fonts, tajwid, or audio changes.

## Review output

Lead with findings ordered by impact:

- P0: Quran/riwaya corruption, unrecoverable user harm, primary task blocked, or severe accessibility failure.
- P1: likely task failure, misleading consequence, lost reading state, missing critical recovery, or major responsive/RTL/accessibility defect.
- P2: meaningful friction, weak hierarchy, inconsistent behavior, or recoverability issue.
- P3: minor craft or consistency improvement.

For each finding, include location, verification status, canonical source, user consequence, and the smallest concrete fix.

## Skill integrity

Do not promote observations into rules without verified current evidence and human acceptance. Use `references/review-loop.md` when new evidence may change guidance. Record uncertainty in `references/coverage-gaps.md`. Keep deterministic checks for mechanical failures; keep contextual judgment in this skill. Prefer a narrow source, rule, pattern, or gap over duplicated guidance.
