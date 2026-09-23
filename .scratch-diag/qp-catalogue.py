import io
import json
import re
import sys


def s(*cps):
    return "".join(chr(c) for c in cps)


path = sys.argv[1]
raw = io.open(path, encoding="utf-8", errors="replace").read()

# The page embeds a JSON catalogue of recitations; unescape the \/ sequences the
# Blade template writes before parsing.
blob = raw.replace("\\/", "/")
entries = []
for m in re.finditer(r"recitations/(\d{2,4})/", blob):
    rid = int(m.group(1))
    # Fields live in the same object; a window is enough because the records are
    # flat and short, and it survives nested braces elsewhere in the page.
    obj = blob[m.start() : m.start() + 700]

    def field(name):
        mm = re.search(r'"%s":\s*("([^"]*)"|\d+|null)' % name, obj)
        if not mm:
            return None
        v = mm.group(2)
        return v if v is not None else mm.group(1)

    entries.append(
        {
            "recitation": rid,
            "reciter_id": field("reciter_id"),
            "rawi_id": field("rawi_id"),
            "classification": field("recitation_classification_id"),
            "type": field("recitation_type_id"),
            "source": field("source"),
        }
    )

seen = {}
for e in entries:
    seen[e["recitation"]] = e
entries = sorted(seen.values(), key=lambda e: e["recitation"])
print("recitation entries:", len(entries))

import collections
print("rawi_id counts:", collections.Counter(str(e["rawi_id"]) for e in entries))
print("classification counts:", collections.Counter(str(e["classification"]) for e in entries))
print("type counts:", collections.Counter(str(e["type"]) for e in entries))

want = sys.argv[2:] if len(sys.argv) > 2 else []
if want:
    print("--- requested reciter ids ---")
    for w in want:
        rows = [e for e in entries if str(e["reciter_id"]) == w]
        print(" reciter", w, "->", rows)
