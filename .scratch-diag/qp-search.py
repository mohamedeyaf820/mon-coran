import io
import re
import sys
import urllib.request


def s(*cps):
    return "".join(chr(c) for c in cps)


# Needles as base codepoints: a literal Arabic string through a tool argument can
# arrive as presentation forms, which turns a real match into a false negative.
NEEDLES = {
    "mohisni/mouhaysini": s(0x0645, 0x062D, 0x064A, 0x0633, 0x0646),
    "minshawi": s(0x0645, 0x0646, 0x0634, 0x0627, 0x0648),
    "bousso": s(0x0628, 0x0648, 0x0633, 0x0648),
    "toure": s(0x062A, 0x0648, 0x0631, 0x064A),
    "dieye": s(0x062F, 0x064A, 0x064A),
    "senegal": s(0x0633, 0x0646, 0x063A, 0x0627, 0x0644),
    "mauritania": s(0x0645, 0x0648, 0x0631, 0x064A, 0x062A, 0x0627, 0x0646),
    "guinea": s(0x063A, 0x064A, 0x0646, 0x064A, 0x0627),
    "mali": s(0x0645, 0x0627, 0x0644, 0x064A),
    "niger": s(0x0646, 0x064A, 0x062C, 0x064A),
    "okash": s(0x0639, 0x0642, 0x0627, 0x0634),
    "warsh": s(0x0648, 0x0631, 0x0634),
    "hafs": s(0x062D, 0x0641, 0x0635),
}

url = sys.argv[1] if len(sys.argv) > 1 else "https://quranpedia.net/reciters.md"
if url.startswith("http"):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    raw = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
else:
    raw = io.open(url, encoding="utf-8").read()

entries = re.findall(r"\[([^\]]+)\]\((https://quranpedia\.net/reciter/(\d+)\.md)\)", raw)
print("reciters listed:", len(entries))
for key, needle in NEEDLES.items():
    hits = [(name, rid) for name, _u, rid in entries if needle in name]
    if hits:
        print("  %-22s -> %s" % (key, hits[:10]))
