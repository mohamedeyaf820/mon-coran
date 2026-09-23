import io
import json

# Arabic needles are built from base codepoints on purpose. A literal Arabic
# string sent through a tool argument can arrive as presentation forms
# (U+FE80..) or with reordered marks, which turns a real match into a false
# "no source exists" — the two control needles below exist to prove the file
# really is searchable before any negative result is trusted.
def s(*cps):
    return "".join(chr(c) for c in cps)

TERMS = {
    "mouhaysini": s(0x0645, 0x062D, 0x064A, 0x0633, 0x0646, 0x064A),
    "bousso": s(0x0628, 0x0648, 0x0633, 0x0648),
    "toure-ta": s(0x062A, 0x0648, 0x0631, 0x064A),
    "toure-tah": s(0x0637, 0x0648, 0x0631, 0x064A),
    "hady": s(0x0647, 0x0627, 0x062F, 0x064A),
    "mokhtar": s(0x0645, 0x062E, 0x062A, 0x0627, 0x0631),
    "dieye": s(0x062F, 0x064A, 0x064A),
    "diya": s(0x062F, 0x064A, 0x0629),
    "senegal": s(0x0633, 0x0646, 0x063A, 0x0627, 0x0644),
    "mauritania": s(0x0645, 0x0648, 0x0631, 0x064A, 0x062A, 0x0627, 0x0646, 0x064A, 0x0627),
    "guinea": s(0x063A, 0x064A, 0x0646, 0x064A, 0x0627),
    "okash": s(0x0639, 0x0642, 0x0627, 0x0634),
    "kameny": s(0x0643, 0x0627, 0x0645, 0x064A),
    "CONTROL-minshawi": s(0x0645, 0x0646, 0x0634, 0x0627, 0x0648, 0x064A),
    "CONTROL-husary": s(0x062D, 0x0635, 0x0631, 0x064A),
}

for path in [
    ".scratch-diag/mp3quran-reciters.json",
    ".scratch-diag/mp3quran-reciters-en.json",
    ".scratch-diag/mp3quran-reciters-fr.json",
]:
    reciters = json.load(io.open(path, encoding="utf-8"))["reciters"]
    print("##", path, len(reciters))
    for key, needle in TERMS.items():
        hits = [(r["id"], r.get("name")) for r in reciters if needle in (r.get("name") or "")]
        if hits:
            print("   %-18s -> %s" % (key, hits[:8]))
