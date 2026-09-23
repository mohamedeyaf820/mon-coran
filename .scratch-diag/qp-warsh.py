import io
import json
import re
import sys
import urllib.request


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


raw = io.open(sys.argv[1], encoding="utf-8", errors="replace").read().replace("\\/", "/")
rows = {}
for arr in arrays(raw, "recitations"):
    for r in arr:
        if isinstance(r, dict) and r.get("id"):
            rows[r["id"]] = r

WARSH = s(0x0648, 0x0631, 0x0634)  # ورش
NEEDLES = {
    "bousso": s(0x0628, 0x0648, 0x0633, 0x0648),
    "toure": s(0x062A, 0x0648, 0x0631, 0x064A),
    "dieye": s(0x062F, 0x064A, 0x064A),
    "senegal": s(0x0633, 0x0646, 0x063A, 0x0627, 0x0644),
    "mohisni": s(0x0645, 0x062D, 0x064A, 0x0633, 0x0646),
    "minshawi": s(0x0645, 0x0646, 0x0634, 0x0627, 0x0648),
}

print("=== Warsh-family mushafs on QuranPedia ===")
for r in sorted(rows.values(), key=lambda r: r["id"]):
    label = str(r.get("formatted_name") or "")
    if WARSH not in label:
        continue
    print(
        "rec=%-4s reciter=%-4s timings=%s %-46s %s"
        % (r["id"], r.get("reciter_id"), r.get("has_timings"), label, r.get("server"))
    )

print("=== needle hits across all 314 mushaf names ===")
for key, needle in NEEDLES.items():
    hits = [
        (r["id"], r.get("reciter_id"), str(r.get("name"))[:48])
        for r in rows.values()
        if needle in str(r.get("name"))
    ]
    print("  %-10s -> %s" % (key, hits if hits else "none"))
