/**
 * Voices that exist both verse by verse and as one recording per surah with the
 * position of every verse (Quran.com "chapter reciters").
 *
 * Keyed on the files the verse-by-verse mode plays, so the player can find the
 * whole-surah twin from the reciter it already has. Every id below was checked
 * against the audio_url the API returns for it (the slug names the voice) and
 * against the verse count of a long surah; a voice is only listed when both
 * agree. Hafs only: these recordings follow the Hafs verse numbering.
 */

const TWINS = Object.freeze({
  "quran-cdn:Alafasy/mp3/": 7,
  "everyayah:Abdul_Basit_Murattal_192kbps": 2,
  "everyayah:Abdul_Basit_Mujawwad_128kbps": 1,
  "everyayah:Husary_128kbps": 6,
  "everyayah:Husary_Muallim_128kbps": 12,
  "quran-cdn:Minshawi/Murattal/mp3/": 9,
  "everyayah:Saood_ash-Shuraym_128kbps": 10,
  "everyayah:Abdurrahmaan_As-Sudais_192kbps": 3,
  "everyayah:Hani_Rifai_192kbps": 5,
  "everyayah:Abu_Bakr_Ash-Shaatree_128kbps": 4,
  "everyayah:khalefa_al_tunaiji_64kbps": 161,
});

/** The Quran.com chapter-reciter id of the whole-surah twin, or null. */
export function getSurahTwinRecitationId(reciterCdn, cdnType = "everyayah") {
  return TWINS[`${cdnType}:${reciterCdn}`] ?? null;
}

/** True when this verse-by-verse voice also has a whole-surah recording. */
export function hasSurahTwin(reciterCdn, cdnType = "everyayah") {
  return getSurahTwinRecitationId(reciterCdn, cdnType) !== null;
}
