import io
import json
import re
import sys


def extract_array(text, key):
    """Return the JSON array that follows `"key":` in a page full of other JSON."""
    i = text.find('"%s":[' % key)
    if i < 0:
        return None
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
                return json.loads(text[start : j + 1])
    return None


path = sys.argv[1]
raw = io.open(path, encoding="utf-8", errors="replace").read().replace("\\/", "/")
arr = extract_array(raw, "recitations")
if arr is None:
    print("no recitations array; keys present:", re.findall(r'"([a-z_0-9]+)":\[', raw)[:20])
    raise SystemExit

print("recitations:", len(arr))
print("fields:", sorted(arr[0].keys()))
import collections

print("rawi_id:", collections.Counter(r.get("rawi_id") for r in arr))
print("type_id:", collections.Counter(r.get("recitation_type_id") for r in arr))
print("classification:", collections.Counter(r.get("recitation_classification_id") for r in arr))
print("has_timings:", collections.Counter(r.get("has_timings") for r in arr))
print("servers:", collections.Counter(str(r.get("server"))[:34] for r in arr).most_common(3))

want = sys.argv[2:]
if want:
    ids = set(int(w) for w in want)
    for r in arr:
        if r.get("reciter_id") in ids:
            print(
                "  rec=%s reciter=%s rawi=%s type=%s cls=%s timings=%s | %s | %s"
                % (
                    r["id"],
                    r.get("reciter_id"),
                    r.get("rawi_id"),
                    r.get("recitation_type_id"),
                    r.get("recitation_classification_id"),
                    r.get("has_timings"),
                    r.get("formatted_name"),
                    r.get("name"),
                )
            )
