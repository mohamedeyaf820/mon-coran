---
description: Harvest ponytail: comments into a tracked debt ledger
---

Search the entire repository for comment markers matching the pattern `ponytail:` (grep across `#` and `//` style comments, excluding `node_modules`, `.git`, and `build` directories).

Format results as a structured ledger:

| File:Line | What was simplified | Ceiling | Upgrade trigger |
|-----------|---------------------|---------|-----------------|

Flag entries lacking an upgrade trigger with **`no-trigger`** (these are silently rotting debt).

End with: total marker count and how many lack triggers.

If nothing found: **"No ponytail: debt. Clean ledger."**

**Report only — make no changes.**
