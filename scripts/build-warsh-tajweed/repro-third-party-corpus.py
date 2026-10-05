"""
Minimal reproduction for QUD Technologies.

Question: is there a supported way to run the published Warsh rules over a
corpus other than the one shipped with the package?

What works today
----------------
The drift guard is `ScriptAdapter.read()` hardcoding
`sources_for=self.corpus.sources_for`, which raises
`ValueError: <loc>: aligned source text drifted` for any other text. Bypassing it
by calling `read_verse()` directly with our own `sources_for` is accepted, and
the orthography layer runs correctly on our text:

    reading = read_verse(
        inventory, None, located,
        entries_for=lambda text: next(prepared),
        sources_for=our_own_sources,        # (None,) * len(text)
    )

`reading` then carries `graphemes` and `clusters` for our words, so the text is
read correctly. What it does not carry is `rule_occurrences` — those appear on
the object `Phonemizer.analyse(ref)` returns, i.e. they are produced above
`read_verse`, and we cannot see a documented entry point that reaches them
without replaying the adapter's lexicon/passes pipeline by hand.

Two smaller questions, if you are open to them
-----------------------------------------------
1. Our pinned text (KFGQPC Warsh) writes the ishmam U+06EB where the packaged
   `warsh/uthmani.yaml` inventory declares U+06EC. We fold 0x06EB -> 0x06EC (one
   code point for one) before analysis. Is that the intended equivalence, and are
   there other pairs the two distributions spell differently?
2. Our text carries U+06DE as a standalone token in 435 places (the ayah rosette
   alone as a word). We exclude it from the engine input since it bears no
   letter. Agreed, or should it be handled differently?

Run:  pip install quranic-phonemizer && python repro-third-party-corpus.py
"""

from pathlib import Path

from quranic_phonemizer.api import recitation
from quranic_phonemizer.corpus import Location
from quranic_phonemizer.orthography.cluster import read_verse
from quranic_phonemizer.riwayat import Riwayah
from quranic_phonemizer.riwayat.warsh.resources import entries_for_words

# One word of our own corpus: 1:4, "مَٰلِكِ يَوْمِ ٱلدِّينِ"
OUR_WORDS = ("مَٰلِكِ", "يَوْمِ", "ٱلدِّينِ")

# Our text writes the ishmam U+06EB where the packaged inventory declares
# U+06EC. One code point for one, so no offset moves. U+0671 is folded too: the
# app's own normalization (src/data/fonts.js) already resolves the alef of wasla,
# so it never reaches the engine from the reader's side.
SIGN_FOLD = {0x06EB: 0x06EC, 0x06DF: 0x06EC, 0x0671: 0x0627}


def fold(text: str) -> str:
    return "".join(chr(SIGN_FOLD.get(ord(ch), ord(ch))) for ch in text)


rec = recitation(Riwayah("warsh"))
adapter = rec.adapters[rec.scripts[0]]
inventory = adapter.inventory

engine_words = [fold(word) for word in OUR_WORDS]
located = tuple(
    (Location(1, 4, index + 1), word) for index, word in enumerate(engine_words)
)
prepared = iter(entries_for_words(inventory, engine_words))


def our_own_sources(location, text):
    """Our text IS the source, so every grapheme maps to itself."""
    return (None,) * len(text)


reading = read_verse(
    inventory,
    None,
    located,
    entries_for=lambda text: next(prepared),
    sources_for=our_own_sources,
)

print("graphemes          :", len(reading.graphemes))
print("clusters           :", len(reading.clusters))
print("rule_occurrences   :", getattr(reading, "rule_occurrences", "MISSING"))
print("sounds             :", getattr(reading, "sounds", "MISSING"))

# For contrast: the same word through the public API, on the packaged corpus.
result = rec.adapters[rec.scripts[0]].read.__wrapped__ if False else None
print()
print("Phonemizer.analyse('1:4') returns:")
from quranic_phonemizer import Phonemizer  # noqa: E402

analysed = Phonemizer().analyse("1:4")
result = analysed.analysis
result = getattr(result, "result", result)
print("  rule_occurrences :", len(result.rule_occurrences))
print("  -> the rules exist, one layer above read_verse()")

assert not hasattr(reading, "rule_occurrences") or reading.rule_occurrences is None
print()
print("Confirmed: read_verse() reads our text but stops before the rule layer.")
print("Requesting the documented entry point that goes the whole way.")
_ = Path(__file__).name