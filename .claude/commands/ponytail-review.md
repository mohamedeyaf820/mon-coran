---
description: Review changes for over-engineering — what can be deleted
---

Review the current code changes (git diff) for over-engineering only, not correctness.

One line per finding: `L<line>: <tag> <what to cut>. <replacement>.`

**Tags:**
- `delete` — dead code or speculative feature
- `stdlib` — reinvented standard library functionality
- `native` — dependency doing what the platform already does
- `yagni` — abstraction with only one implementation
- `shrink` — same logic, expressible in fewer lines

End with the net lines removable.

If nothing to cut: **"Lean already. Ship."**
