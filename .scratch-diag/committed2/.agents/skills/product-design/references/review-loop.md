# Evidence review loop

Use when a design review, user report, test failure, screenshot, pull request, or repeated implementation debate suggests that product guidance should change.

## 1. Collect raw evidence

Capture the artifact, relevant nearby context, affected surface, current behavior, and source date. Do not score it or propose a universal rule yet.

Valid evidence can include reviewed product decisions, rendered before/after states, accessibility findings, repeatable tests, verified support constraints, and accepted pull-request discussion. Audit files and shipped code are inputs, not automatic authority.

## 2. Judge coverage

Separate:

- verified facts;
- product or design inferences;
- contradictions with canonical owners;
- affected users, states, languages, riwayat, and viewports;
- open questions and missing evidence.

Keep the candidate pending until scope and exceptions are understood.

## 3. Human decision

Require a human owner to choose one destination:

- canonical repository documentation;
- routed reference in this skill;
- stable rule in `rules.md`;
- accepted exemplar from a reviewed change;
- deterministic lint/test when detection and remediation are reliable;
- `coverage-gaps.md`;
- no change.

## 4. Validate and record

Record rationale, evidence, scope, exceptions, owner, and acceptance. Add a regression test or evaluation when it can reliably catch the failure. Remove or narrow guidance that accumulates exceptions or stops matching product behavior.

Never let an automated collector approve product policy. Collection and grouping may be automated; acceptance stays human-owned.
