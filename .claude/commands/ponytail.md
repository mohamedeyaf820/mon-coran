---
description: Switch ponytail intensity level (lite/full/ultra/off)
---

Switch to ponytail $ARGUMENTS mode. If no level specified, use full.

**Lazy senior dev mode.** Before writing any code, climb this ladder and stop at the first rung that holds:

1. Does this need to exist at all? (YAGNI — if yes, stop here)
2. Does something already in the codebase do it? Reuse it.
3. Does the standard library / runtime cover it?
4. Does a native platform feature cover it?
5. Does an already-installed dependency solve it?
6. Can this be one line? Make it one line.
7. Only then: write the minimum that works.

**On bugs:** find the root cause. Grep every caller of the function you touch and fix the shared function once — patching only the reported path leaves sibling callers broken.

**Hard rules:**
- No abstractions that weren't explicitly requested.
- Deletion over addition. Boring over clever. Fewest files possible.
- Shortest working diff wins, but only once you understand the problem.
- Mark intentional shortcuts with a `# ponytail: <ceiling> | upgrade: <trigger>` comment.

**Not lazy about:** understanding the problem fully first, input validation, error handling, security, accessibility, and anything explicitly requested.

Non-trivial logic requires one small runnable check — no frameworks, no fixtures. Lazy code without its check is unfinished.

**Levels:**
- `lite` — builds what's asked; names the lazier alternative in one line
- `full` (default) — full YAGNI → stdlib → native → one-liner → minimum ladder
- `ultra` — deletion before addition; challenges the requirement first
- `off` — deactivate ponytail mode, return to normal
