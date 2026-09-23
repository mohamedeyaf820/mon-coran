import io
import json
import re
import sys


def s(*cps):
    return "".join(chr(c) for c in cps)


def arrays(text, key):
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


LIVE = set([248, 249, 251, 253, 254] + list(range(255, 291)))
HAFS = s(0x062D, 0x0641, 0x0635)  # حفص
WARSH = s(0x0648, 0x0631, 0x0634)  # ورش
PREFIX = s(0x0645, 0x0635, 0x062D, 0x0641)  # مصحف
LI = s(0x0644, 0x0642, 0x0627, 0x0631, 0x0626)  # القارئ

raw = io.open(sys.argv[1], encoding="utf-8", errors="replace").read().replace("\\/", "/")
rows = {}
for arr in arrays(raw, "recitations"):
    for r in arr:
        if isinstance(r, dict) and r.get("id"):
            rows[r["id"]] = r


def qari(r):
    """Strip the 'مصحف X برواية ...' / 'المصحف ... للقارئ X' wrappers to get the name."""
    n = str(r.get("name") or "")
    n = re.sub("^" + PREFIX + " ", "", n)
    n = re.sub(" " + s(0x0628, 0x0631, 0x0648, 0x0627, 0x064A, 0x0629) + ".*$", "", n)
    m = re.search("(.+?) " + LI + " (.+)$", n)
    if m:
        n = m.group(2)
    return n.strip()


def kind(label):
    if WARSH in label:
        return "warsh"
    if HAFS in label:
        return "hafs"
    return "autre"


out = {"hafs": [], "warsh": [], "autre": []}
for r in sorted(rows.values(), key=lambda r: r["id"]):
    label = str(r.get("formatted_name") or "") + " " + str(r.get("name") or "")
    k = kind(label)
    out[k].append(
        {
            "rec": r["id"],
            "qari": qari(r),
            "riwaya": str(r.get("formatted_name") or ""),
            "per_ayah": r["id"] in LIVE or "files.quranpedia.net" in str(r.get("server")),
            "host": str(r.get("server")).split("/")[2] if r.get("server") else "",
        }
    )

for k in ("warsh", "hafs"):
    print("=== %s : %d mushafs ===" % (k, len(out[k])))
    for e in out[k]:
        print(
            "%-4s %-46s %-30s %s"
            % (e["rec"], e["qari"][:44], e["riwaya"][:28], "PAR-VERSET" if e["per_ayah"] else "tout-sourate")
        )
print("=== hors hafs/warsh : %d ===" % len(out["autre"]))
json.dump(out, io.open(".scratch-diag/qp-by-riwaya.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
