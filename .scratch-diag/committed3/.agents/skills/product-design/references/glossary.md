# Product glossary

Use these names consistently; verify localized forms in `src/i18n/`.

- MushafPlus: the product name currently used by the application and package metadata.
- ayah: one Quran verse; keep its surah and verse number when scope could be ambiguous.
- surah: one Quran chapter.
- juz: one of the thirty Quran divisions.
- page: a Mushaf page, currently modeled across 604 pages.
- riwaya: the reading transmission; MushafPlus supports Hafs and Warsh.
- reciter: the selected Quran reciter; compatibility can depend on riwaya and audio source.
- reading position: the current surah, ayah, juz, or page needed to resume.
- reading mode: surah, page, or juz.
- layout: list or Mushaf presentation within supported reading experiences.
- translation: localized meaning displayed alongside Quran text; do not call it Quran text.
- tafsir: commentary or exegesis; distinguish it from translation.
- tajwid: recitation rules and their visual annotations.
- library: private, locally persisted user content such as notes, bookmarks, history, or saved items according to current implementation.
- offline available: verified usable without network, not merely requested or queued for download.
