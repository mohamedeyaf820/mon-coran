---
description: Show ponytail quick reference card
---

Display the ponytail quick reference:

## Levels
| Command | Behavior |
|---|---|
| `/ponytail lite` | Builds what's asked; names the lazier alternative in one line |
| `/ponytail` | Full default: YAGNI → stdlib → native → one line → minimum |
| `/ponytail ultra` | Deletion before addition; challenges the requirement first |

## Commands
| Command | Purpose |
|---|---|
| `/ponytail-review` | Over-engineering review of current changes |
| `/ponytail-audit` | Whole-repo over-engineering audit |
| `/ponytail-debt` | Harvests `ponytail:` comments into a tracked ledger |
| `/ponytail-gain` | Measured-impact scoreboard from the benchmark |
| `/ponytail-help` | This card |

## Deactivating / Resuming
Say `stop ponytail`, `normal mode`, or `/ponytail off` to deactivate. Resume anytime with `/ponytail`.

## Philosophy
The best code is the code never written. Before writing anything:
1. Does it need to exist? (YAGNI)
2. Already in the codebase? Reuse it.
3. Stdlib/platform covers it?
4. Can it be one line?
5. Only then: write the minimum that works.
