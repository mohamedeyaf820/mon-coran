import io
import json
import re
import sys
import collections


def arrays(text, key):
    """Yield every JSON array that follows "key": in a page full of other JSON."""
    pos = 0
    pat = '"%s":[' % key
    while True:
        i = text.find(pat, pos)
        if i < 0:
            return
        start = text.index("[", i)
        depth = 0
        in_str = False
        esc = False
        for j in range(start, len(text)):
            c = text[j]
            if in_str:
                if esc:
                    esc = False
                elif c == "\\":
                    esc = True
                elif c == '"':
                    in_str = False
                continue
            if c == '"':
                in_str = True
            elif c == "[":
                depth += 1
            elif c == "]":
                depth -= 1
                if depth == 0:
                    try:
                        yield json.loads(text[start : j + 1])
                    except Exception:
                        pass
                    pos = j
                    break
        else:
            return


path = sys.argv[1]
raw = io.open(path, encoding="utf-8", errors="replace").read().replace("\\/", "/")

rows = {}
for arr in arrays(raw, "recitations"):
    for r in arr:
        if isinstance(r, dict) and r.get("id"):
            rows[r["id"]] = r

print("distinct recitations:", len(rows))
print("riwayas:", collections.Counter(str(r.get("formatted_name")) for r in rows.values()).most_common())
print("types:", collections.Counter(str(r.get("recitation_type")) for r in rows.values()).most_common())
print("has_timings:", collections.Counter(r.get("has_timings") for r in rows.values()))
print("server hosts:", collections.Counter(str(r.get("server")).split("/")[2] if r.get("server") else None for r in rows.values()).most_common(6))

want = [int(x) for x in sys.argv[2:]]
if want:
    print("--- reciters requested ---")
    for rid in want:
        mine = [r for r in rows.values() if r.get("reciter_id") == rid]
        for r in sorted(mine, key=lambda r: r["id"]):
            print(
                "  reciter=%s rec=%s rawi_id=%s timings=%s | %s | %s | %s"
                % (
                    rid,
                    r["id"],
                    r.get("rawi_id"),
                    r.get("has_timings"),
                    r.get("formatted_name"),
                    r.get("recitation_type"),
                    r.get("server"),
                )
            )
        if not mine:
            print("  reciter=%s -> no row on this page" % rid)
