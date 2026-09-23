import io
import json
from collections import OrderedDict

PATH = "public/data/reciter-profiles.json"
NEW_ID = "ar.minshawi_muallim"

# Built from codepoints for the two Arabic words that must land intact, so a
# mangled literal fails loudly instead of shipping reversed marks.
W_MINSHAWI = "المنشاوي"
W_AL_MANSHA = "المنشأة"

raw = io.open(PATH, encoding="utf-8").read()
data = json.loads(raw, object_pairs_hook=OrderedDict)

fixture_ar = data["ar.minshawi"]["bio"]["ar"]
assert W_MINSHAWI in fixture_ar, "fixture check failed: codepoint word not in source bio"
assert W_AL_MANSHA in fixture_ar, "fixture check failed: birthplace word not in source bio"

bio_ar = (
    "تلاوة تعليمية لمحمد صديق المنشاوي (1920–1969)، القارئ المصري "
    "المولود في المنشأة بمحافظة سوهاج. تنشرها EveryAyah باسم «Teacher» "
    "بإيقاع أبطأ بوضوح من مصحفه المرتل، مما يناسب الاستماع آية بآية."
)
assert W_MINSHAWI in bio_ar
assert W_AL_MANSHA in bio_ar
assert len(bio_ar) > 40

bio_fr = (
    "Récitation pédagogique de Muhammad Siddiq Al-Minshawi (1920–1969), "
    "récitateur égyptien né à Al-Mansha, dans le gouvernorat de Sohag. "
    "EveryAyah la publie sous le nom de « Teacher » : le rythme y est "
    "nettement plus lent que son muṣḥaf murattal, ce qui se prête à "
    "l’écoute verset par verset."
)
assert len(bio_fr) <= 450, len(bio_fr)

bio_en = (
    "Teaching recitation of Muhammad Siddiq Al-Minshawi (1920–1969), the "
    "Egyptian reciter born in Al-Mansha, Sohag Governorate. EveryAyah "
    "publishes it as the “Teacher” mushaf: its pace is markedly slower "
    "than his murattal, which suits verse-by-verse listening."
)

record = OrderedDict(
    [
        ("bio", OrderedDict([("fr", bio_fr), ("en", bio_en), ("ar", bio_ar)])),
        (
            "bioSource",
            OrderedDict(
                [
                    ("provider", "Assabile"),
                    ("url", "https://www.assabile.com/mohamed-siddiq-el-minshawi-3/mohamed-siddiq-el-minshawi.htm"),
                ]
            ),
        ),
        ("reviewedAt", "2026-09-22"),
    ]
)

assert NEW_ID not in data
out = OrderedDict()
for key, value in data.items():
    out[key] = value
    if key == "ar.minshawimujawwad":
        out[NEW_ID] = record
assert len(out) == len(data) + 1

io.open(PATH, "w", encoding="utf-8", newline="\n").write(
    json.dumps(out, ensure_ascii=False, indent=2) + "\n"
)
print("ok: fr", len(bio_fr), "en", len(bio_en), "ar", len(bio_ar), "total", len(out))
