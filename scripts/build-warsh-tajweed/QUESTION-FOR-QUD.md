# Question for QUD Technologies — running the Warsh rules over a third-party corpus

**Where to send:** a GitHub issue on
<https://github.com/QUD-Technologies/quranic-phonemizer>. The detail is technical
enough that an issue is the fastest route; phonemizer.qud.dev works too.

---

Hello,

First: thank you for publishing this. We are building a Quran reader, and your
phonemizer is, as far as we have found, the only published tajweed annotator that
covers **Warsh**. We looked everywhere else first — Quran.com v4, QUL,
Tanzil/KFGQPC, AlQuran Cloud, quran/quran-tajweed, quran-center/quran-meta — and
none of them annotate Warsh at all. Being able to run your published rules over our
own pinned Warsh corpus would be a real result for readers, so we would rather
ask than work around it.

## Our situation

Our reader displays the KFGQPC Warsh mushaf text, pinned by SHA-256
(`warshData_v2-1.json`, commit `31d4c18a…`), under an integrity contract we will
not break: **we do not swap the Quran text we recite.** That is why the hosted
`phonemizer.qud.dev` API could only colour 7.5 % of our ayahs — the annotated text
and our text are two editions of the same mushaf, and they disagree on harakat
(`hamza ↔ shadda`, `fatha`, `damma`). Colouring our text with rules computed for
yours would put a correct-looking rule on the wrong letter.

So the only honest path is to run your engine over **our** text.

## What we have established

**1. The drift guard is the only thing in the way.** `ScriptAdapter.read()`
hardcodes `sources_for=self.corpus.sources_for`, which raises
`ValueError: <loc>: aligned source text drifted`. Calling `read_verse()` directly
with our own `sources_for` is accepted, and the orthography layer reads our text
correctly.

**2. `read_verse()` stops one layer short of the rules.** It returns `graphemes`
and `clusters` for our words, but no `rule_occurrences` and no `sounds` — those
are produced above it, on the object `Phonemizer.analyse(ref)` returns. We could
not find a documented entry point that reaches the rule layer without replaying the
adapter's lexicon/passes pipeline by hand, which we would rather not do: we could
not tell whether a future version changed that pipeline, and we would be
shipping religious rules through unversioned internals.

Reproduction attached, self-contained:
`pip install quranic-phonemizer && python repro-third-party-corpus.py`

```
graphemes          : 23
clusters           : 11
rule_occurrences   : MISSING     <- our text, via read_verse()
sounds             : MISSING

Phonemizer.analyse('1:4') returns:
  rule_occurrences : 8            <- your corpus, via the public API
```

## What we are asking

**Is there a supported way to analyse a third-party corpus?** Any of these would
solve it:

- a `Phonemizer` constructor option, or a documented function, that takes words
  instead of a `surah:ayah` reference;
- a documented hook for `sources_for` on the adapter;
- confirmation that replaying `read_verse` plus the passes is the intended
  extension path — in which case we would follow it with your blessing.

## Two smaller questions

1. **Scalar inventory.** Our distribution writes the ishmam `U+06EB`, while
   `data/riwayat/warsh/scripts/uthmani.yaml` declares `U+06EC`. We fold
   `0x06EB → 0x06EC` (one code point for one, so no offset moves) before
   analysis. Is that the intended equivalence, and are there other pairs the two
   distributions spell differently? If the inventory should cover both, that is
   better fixed upstream than in every consumer.

2. **Ayah rosettes.** Our text carries `U+06DE` as a standalone token in 435
   places — the rosette alone as a word, bearing no letter. We exclude it from the
   engine input on the grounds that no recitation rule can belong to a marker.
   Agreed, or should it be handled differently?

If the answer is that third-party corpora are out of scope, we will say so plainly
to our users and ship Warsh uncoloured. That is a fine outcome too — we would
simply rather stop here than invent rules.

Many thanks either way.
