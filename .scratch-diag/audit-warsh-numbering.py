import io
import json
import re

# Audit: does the offline Warsh translation carry the same Warsh->Hafs mapping
# the reader's numbering table declares? A divergence here is what would show a
# reader a translation of a different verse than the Arabic above it.

seg_src = io.open("src/data/warshHafsNumbering.js", encoding="utf-8").read()
block = seg_src.split("WARSH_HAFS_SEGMENTS = Object.freeze({", 1)[1].split("});", 1)[0]
segments = {}
for m in re.finditer(r"(\d+):\s*(\[[^\n]*\])", block):
    surah = int(m.group(1))
    raw = m.group(2).replace("null", "None")
    segments[surah] = eval(raw)  # local fixture data only, no network input

print("surahs with declared segments:", len(segments))


def warsh_to_hafs(surah, warsh):
    for w1, w2, h1, h2 in segments.get(surah, []):
        if w1 is not None and w1 <= warsh <= (w2 if w2 is not None else w1):
            return list(range(h1, h2 + 1))
    return [warsh]


def hafs_to_warsh(surah, hafs):
    out = []
    for w1, w2, h1, h2 in segments.get(surah, []):
        if w1 is not None and w1 <= hafs + 0 and h1 <= hafs <= h2:
            out.append(w1)
    return out


HAFS_TOTALS = [(int(n), int(a)) for n, a in json.load(io.open(".scratch-diag/surah-totals.json", encoding="utf-8"))]

manifest = json.load(io.open("public/data/warsh-translation-fr/index.json", encoding="utf-8"))
print("numberingAdaptation:", json.dumps(manifest.get("numberingAdaptation"), ensure_ascii=False)[:400])

total_checked = 0
bad = []
for fname in sorted(manifest["files"]):
    n = int(fname.split(".")[0])
    data = json.load(io.open("public/data/warsh-translation-fr/%s" % fname, encoding="utf-8"))
    verses = data["ayahs"]
    covered = []
    for v in verses:
        w = int(v["ayah_number"])
        hn = v["hafs_numbers"]
        expected = warsh_to_hafs(n, w)
        total_checked += 1
        covered += hn
        if hn != expected:
            bad.append((n, w, hn, expected))
    # The mapping must tile the surah exactly: every Hafs verse used once, and
    # the Warsh numbering dense from 1.
    surah_info = next((s for s in HAFS_TOTALS if s[0] == n), None)
    if surah_info:
        hafs_total = surah_info[1]
        gap = sorted(set(range(1, hafs_total + 1)) - set(covered))
        dup = len(covered) - len(set(covered))
        dense = [int(v["ayah_number"]) for v in verses] == list(range(1, len(verses) + 1))
        if gap or dup or not dense:
            print(
                "  SURAH %s: missing hafs %s | duplicated %s | warsh dense=%s"
                % (n, gap[:8], dup, dense)
            )

print("verses checked:", total_checked, "| mismatches:", len(bad))
for row in bad[:15]:
    print("   surah %s warsh %s -> file %s vs table %s" % row)
