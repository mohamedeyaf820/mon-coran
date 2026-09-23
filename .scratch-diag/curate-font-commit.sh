#!/usr/bin/env bash
# Curated font-lot commit: HEAD + only my lines for entangled files.
set -euo pipefail
cd "/c/Users/amirou/Documents/Quran App"
mkdir -p .scratch-diag/commit

mk() { # $1=path $2=old $3=new
  git show "HEAD:$1" > ".scratch-diag/commit/$(basename "$1")"
  python - "$1" ".scratch-diag/commit/$(basename "$1")" "$2" "$3" <<'PY'
import sys
path, tmp, old, new = sys.argv[1:5]
s = open(tmp, encoding='utf-8').read()
n = s.count(old)
assert n >= 1, f"pattern not found in HEAD {path}: {old!r}"
s = s.replace(old, new)
open(tmp, 'w', encoding='utf-8', newline='').write(s)
print(f"{path}: replaced {n} occurrence(s)")
PY
  blob=$(git hash-object -w ".scratch-diag/commit/$(basename "$1")")
  git update-index --cacheinfo 100644,"$blob","$1"
}

mk src/services/fontLoader.js '"/fonts/kfgqpc-warsh-10.woff2"' '"/fonts/kfgqpc-warsh-21.woff2"'
mk index.html '/fonts/kfgqpc-warsh-10.woff2' '/fonts/kfgqpc-warsh-21.woff2'
mk public/sw.js '/fonts/kfgqpc-warsh-10.woff2' '/fonts/kfgqpc-warsh-21.woff2'
mk tests/security-storage.test.mjs 'kfgqpc-warsh-10.woff2' 'kfgqpc-warsh-21.woff2'
mk tests/security-storage.test.mjs 'kfgqpc-warsh-10\.woff2' 'kfgqpc-warsh-21\.woff2'

git add src/styles/tailwind.css public/fonts/kfgqpc-warsh-21.woff2
git rm --cached public/fonts/kfgqpc-warsh-10.woff2 -q
rm -f public/fonts/kfgqpc-warsh-10.woff2

git status --porcelain --cached | head -20
echo "---- staged diff stat ----"
git diff --cached --stat
