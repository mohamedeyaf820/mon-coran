---
description: Audit the whole repo for over-engineering — what can be deleted
---

Scan the entire repository (not just the diff) for over-engineering. Rank findings by largest reduction first.

One line per finding: `<tag> <what to cut>. <replacement>. [path]`

**Tags:**
- `delete` — dead code or speculative feature
- `stdlib` — reinvented standard library functionality
- `native` — dependency doing what the platform already does
- `yagni` — abstraction with only one implementation
- `shrink` — same logic, expressible in fewer lines

End with a summary: net lines and dependencies removable.

If nothing to cut: **"Lean already. Ship."**
