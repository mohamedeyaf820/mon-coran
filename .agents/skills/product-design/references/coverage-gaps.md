# Coverage gaps

Keep unresolved guidance visible. Do not convert these items into rules without stable evidence and human acceptance.

- No accepted product-design exemplars are yet documented from reviewed pull requests.
- No single owner is documented for canonical French, English, and Arabic product vocabulary beyond the locale files.
- The exact UX policy for unavailable Warsh audio fallbacks needs a reviewed decision per source and reciter class.
- Offline guarantees by content type (text, font, translation, tafsir, per-ayah audio, full-surah audio) need a canonical support matrix.
- Destructive local-data actions need a verified inventory of reversibility and recovery guarantees.
- Privacy expectations for history, notes, memorization, sharing, and analytics need one surface-by-surface decision record.
- Screen-specific empty/error/loading matrices are not yet documented for every major surface.
- Automated design lint currently covers code quality generally, but product-design rules have not been evaluated for reliable, low-false-positive enforcement.
- User research and accessibility evidence for Arabic-first, RTL, low-connectivity, and assistive-technology workflows is not yet linked from this skill.
- Invocations (`/duas`): the French and English translations of the Hisn al-Muslim library are MushafPlus's own and have not been reviewed by a specialist; the reuse terms of hisnmuslim.com are unstated. Offline: a chapter already visited is verified readable offline; a library never opened on the device is not available. See `docs/DUAS_SOURCES.md`.
- Rabbana and khatm pages (`/duas/rabbana`, `/duas/khatm`): the French and English meaning of each Rabbana supplication is written by MushafPlus, not a published translation, and is labelled as such; it needs specialist review. The khatm page states that no wording is established for the end of a recitation. See `docs/DUAS_SOURCES.md`.
- Whole-surah playback (listening mode Auto / Full surah / Verse by verse): routing, fallback and verse following are unit- and e2e-tested with simulated media; behaviour on a locked iPhone or Android (background, bluetooth, lock-screen controls) is not verified. Downloaded verse files are not preferred over the streamed surah when online. See `docs/AUDIO_RECITERS_SOURCES.md` section 8.
- Share-card studio: the six added palettes, four frames and four motifs are checked for text contrast and rendering, not reviewed by a calligrapher or an Islamic-art specialist; Pinterest could not be browsed, so the references behind them are general (mihrab, zellij, ogee arch, flower-of-life, arabesque scrolls, gold foil) rather than specific boards.
