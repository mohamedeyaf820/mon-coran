/**
 * Warsh audio numbering, end to end: a playlist item built by
 * src/utils/audioPlaylist.js must produce Hafs-keyed remote file URLs (EveryAyah
 * and the Quran.com CDN) while the reader keeps displaying — and scrolling to —
 * the Warsh verse. QuranPedia is the exception: its mp3s are riwaya-numbered, so
 * those URLs must carry the displayed number instead.
 *
 * Numbering-space evidence (checked against the live sources on 2026-09-19):
 *  - The pinned legacy Warsh dataset behind the Warsh mushaf (warshData_v2-1.json)
 *    numbers its rows 1..6214 in Warsh order: row id 1 is `sura_no 1, aya_no 1`,
 *    "al-hamdu", which is Hafs 1:2. warshService writes that id into
 *    `ayah.number`, and WarshPageRenderer emits it as data-ayah-global, so the
 *    Warsh page's global space is NOT the Hafs (quran.com) 1..6236 space the
 *    playlist carries.
 *  - everyayah's Warsh folders are Hafs-keyed: under
 *    data/warsh/warsh_yassin_al_jazaery_64kbps/ the highest Al-Baqara file is
 *    002286.mp3 (Hafs 286; Warsh counts 285 ayahs) and Al-Ma'ida stops at
 *    005120.mp3 (Hafs 120; Warsh counts 122 ayahs), with 005121/005122 answering
 *    404. A Warsh-numbered request therefore misses every verse after the first
 *    split and 404s at the end of such surahs.
 */
import assert from "node:assert/strict";
import test from "node:test";

import SURAHS from "../src/data/surahs.js";
import RECITERS, { getReciter } from "../src/data/reciters.js";
import { listAyahAudioGaps } from "../src/data/audioAvailability.js";
import { getWarshSurahAyahCount } from "../src/constants/warshSource.js";
import {
  buildSurahAudioPlaylist,
  expandAyahsToAudioFiles,
  getHafsSurahGlobalStart,
} from "../src/utils/audioPlaylist.js";
import {
  findPlayingAyahElement,
  playingAyahSelectors,
} from "../src/components/QuranDisplay/useQuranDisplayScroll.js";

// audioService is instantiated at import time, so the browser globals it binds
// must exist before the module is evaluated (same stubs as the reciter tests).
globalThis.window = { location: { href: "http://localhost/" } };
globalThis.Audio = class MockAudio {
  addAttribute() {}
  addEventListener() {}
  load() {}
  pause() {}
  play() { return Promise.resolve(); }
  removeAttribute() {}
  removeEventListener() {}
};

const { AudioService, default: audioService } = await import(
  "../src/services/audioService.js",
);

const EVERYAYAH_WARSH = getReciter("warsh_yassin", "warsh");
const HAFS_FILE = "Abu_Bakr_Ash-Shaatree_128kbps";

const everyayahFile = (url) => url.match(/\/(\d{3})(\d{3})\.mp3$/)?.slice(1) ?? null;

/** Legacy Warsh row id of a verse: cumulative Warsh totals, 1..6214. */
const warshRowId = (surah, warshAyah) => {
  let start = 1;
  for (let s = 1; s < surah; s += 1) start += getWarshSurahAyahCount(s);
  return start + warshAyah - 1;
};

test("setup: the Warsh everyayah reciter really is a per-ayah CDN", () => {
  assert.equal(EVERYAYAH_WARSH.cdnType, "everyayah");
  assert.equal(
    AudioService.buildUrl(EVERYAYAH_WARSH.cdn, { surah: 112, ayah: 1 }, "everyayah"),
    `https://everyayah.com/data/${EVERYAYAH_WARSH.cdn}/112001.mp3`,
  );
});

/* ── 1. Remote file URLs follow the Hafs verse ──────────────────────────── */

test("surahs whose numbering is identical keep producing the old URLs", () => {
  for (const surah of [110, 112, 114]) {
    const warsh = buildSurahAudioPlaylist(surah, "warsh");
    const hafs = buildSurahAudioPlaylist(surah, "hafs");
    assert.equal(warsh.length, hafs.length, `surah ${surah} length`);
    warsh.forEach((item, index) => {
      assert.equal(item.hafsNumber, item.ayah, `surah ${surah} verse ${index + 1}`);
      assert.equal(
        AudioService.buildUrl(HAFS_FILE, item, "everyayah"),
        AudioService.buildUrl(HAFS_FILE, hafs[index], "everyayah"),
        `surah ${surah} verse ${index + 1} URL`,
      );
      assert.equal(item.number, getHafsSurahGlobalStart(surah) + index, "hafs global");
    });
  }
});

test("past a divergence point the requested file is the Hafs verse, not the displayed one", () => {
  const warsh = buildSurahAudioPlaylist(2, "warsh");
  assert.equal(warsh.length, 285, "Al-Baqara has 285 Warsh ayahs");

  // Al-Baqara opens with a merge, so only the first verse still agrees.
  assert.equal(everyayahFile(AudioService.buildUrl(HAFS_FILE, warsh[0], "everyayah"))[1], "001");
  const second = AudioService.buildUrl(HAFS_FILE, warsh[1], "everyayah");
  assert.equal(second, `https://everyayah.com/data/${HAFS_FILE}/002003.mp3`, "Warsh 2:2 recites Hafs 3");
  assert.notEqual(second, `https://everyayah.com/data/${HAFS_FILE}/002002.mp3`, "not the displayed number");

  // The closing Warsh verse is Hafs 286 — the file everyayah really serves.
  assert.equal(
    AudioService.buildUrl(HAFS_FILE, warsh.at(-1), "everyayah"),
    `https://everyayah.com/data/${HAFS_FILE}/002286.mp3`,
  );

  // Al-Ma'ida counts MORE Warsh ayahs than the CDN has files for: every request
  // must stay inside the Hafs range (005121/005122 answer 404 on everyayah).
  const maidah = buildSurahAudioPlaylist(5, "warsh");
  assert.equal(maidah.length, 122);
  const hafsTotal = Number(SURAHS[4].ayahs);
  for (const item of maidah) {
    const [, file] = everyayahFile(AudioService.buildUrl(HAFS_FILE, item, "everyayah"));
    assert.ok(Number(file) <= hafsTotal, `Warsh 5:${item.ayah} asks for Hafs ${file}`);
  }
  assert.equal(
    AudioService.buildUrl(HAFS_FILE, maidah.at(-1), "everyayah"),
    `https://everyayah.com/data/${HAFS_FILE}/005120.mp3`,
  );
});

test("no Warsh item anywhere in the mushaf asks for a file outside its surah", () => {
  for (let surah = 1; surah <= 114; surah += 1) {
    const hafsTotal = Number(SURAHS[surah - 1].ayahs);
    for (const item of buildSurahAudioPlaylist(surah, "warsh")) {
      const [fileSurah, fileAyah] =
        everyayahFile(AudioService.buildUrl(HAFS_FILE, item, "everyayah")) ?? [];
      assert.equal(Number(fileSurah), surah, `surah segment for ${surah}:${item.ayah}`);
      assert.ok(
        Number.isInteger(Number(fileAyah)) && Number(fileAyah) >= 1 && Number(fileAyah) <= hafsTotal,
        `Warsh ${surah}:${item.ayah} asks for ${fileAyah}, outside 1..${hafsTotal}`,
      );
      assert.ok(item.number >= 1 && item.number <= 6236, `hafs global for ${surah}:${item.ayah}`);
    }
  }
});

test("Quran.com CDN URLs and their everyayah fallback keep the Hafs keys", () => {
  const [first, second] = buildSurahAudioPlaylist(2, "warsh");
  const QURAN_CDN_FOLDER = "Alafasy/mp3/";
  const primary = AudioService.buildUrl(QURAN_CDN_FOLDER, second, "quran-cdn");
  assert.equal(primary, "https://audio.qurancdn.com/Alafasy/mp3/002003.mp3");
  assert.equal(second.number, getHafsSurahGlobalStart(2) + 2);

  const candidates = AudioService.buildUrlCandidates(QURAN_CDN_FOLDER, second, "quran-cdn");
  assert.deepEqual(candidates, [
    "https://audio.qurancdn.com/Alafasy/mp3/002003.mp3",
    "https://everyayah.com/data/Alafasy_128kbps/002003.mp3",
  ]);
  assert.equal(
    AudioService.buildUrl(QURAN_CDN_FOLDER, first, "quran-cdn"),
    "https://audio.qurancdn.com/Alafasy/mp3/002001.mp3",
  );
});

test("QuranPedia URLs ask for the displayed Warsh verse, not the Hafs one", () => {
  const quranpedia = getReciter("warsh_hussary", "warsh");
  assert.equal(quranpedia.cdnType, "quranpedia");

  const [first, second] = buildSurahAudioPlaylist(2, "warsh");
  assert.equal(first.hafsNumber, 1, "Warsh 2:1 still recites Hafs 1");
  assert.equal(second.hafsNumber, 3, "Warsh 2:2 already recites Hafs 3");

  // files.quranpedia.net names its mp3s with the riwaya number: Al-Baqara stops
  // at 002285.mp3 for this set (verified 2026-09-19), while everyayah serves
  // 002286.mp3 for the same recited verse.
  assert.equal(
    AudioService.buildUrl(quranpedia.cdn, second, "quranpedia"),
    "https://files.quranpedia.net/recitations/261/002002.mp3",
  );
  assert.equal(
    AudioService.buildUrl(quranpedia.cdn, buildSurahAudioPlaylist(2, "warsh").at(-1), "quranpedia"),
    "https://files.quranpedia.net/recitations/261/002285.mp3",
  );
  assert.equal(
    AudioService.buildUrl(HAFS_FILE, buildSurahAudioPlaylist(2, "warsh").at(-1), "everyayah"),
    `https://everyayah.com/data/${HAFS_FILE}/002286.mp3`,
  );
});

test("loadPlaylist builds Warsh tracks on the Hafs file and keeps the Warsh position", () => {
  const service = new AudioService();
  service.loadPlaylist(buildSurahAudioPlaylist(2, "warsh"), EVERYAYAH_WARSH.cdn, "everyayah");

  // Warsh 2:1 is one displayed verse recited over two Hafs files, so the second
  // entry still belongs to verse 1 while the third is the verse the reader sees
  // next.
  const first = service.playlist[0];
  assert.equal(first.ayah, 1, "the reader is shown the Warsh verse");
  assert.equal(first.hafsNumber, 1, "the verse it recites");
  assert.equal(first.url, `https://everyayah.com/data/${EVERYAYAH_WARSH.cdn}/002001.mp3`);

  const second = service.playlist[1];
  assert.equal(second.ayah, 1, "the split files stay inside the same displayed verse");
  assert.equal(second.hafsNumber, 2, "and ask for the next file, which used to go unplayed");
  assert.equal(second.url, `https://everyayah.com/data/${EVERYAYAH_WARSH.cdn}/002002.mp3`);

  const third = service.playlist[2];
  assert.equal(third.ayah, 2, "the next displayed verse");
  assert.equal(third.hafsNumber, 3, "the verse it recites");
  assert.equal(third.globalNumber, getHafsSurahGlobalStart(2) + 2, "hafs-keyed global");
  assert.equal(third.url, `https://everyayah.com/data/${EVERYAYAH_WARSH.cdn}/002003.mp3`);
  assert.deepEqual(
    third.urls,
    [
      `https://everyayah.com/data/${EVERYAYAH_WARSH.cdn}/002003.mp3`,
      `https://www.everyayah.com/data/${EVERYAYAH_WARSH.cdn}/002003.mp3`,
    ],
    "the mirror candidate carries the same Hafs file",
  );
  service.destroy();
});

test("a Hafs-keyed Warsh playlist plays every file of the surah exactly once", () => {
  let entries = 0;
  let files = 0;
  for (let surah = 1; surah <= 114; surah += 1) {
    const hafsTotal = Number(SURAHS[surah - 1].ayahs);
    const playlist = expandAyahsToAudioFiles(buildSurahAudioPlaylist(surah, "warsh"), "everyayah");
    const numbers = playlist.map(
      (item) => Number(AudioService.buildUrl(HAFS_FILE, item, "everyayah").slice(-7, -4)),
    );
    assert.deepEqual(
      [...numbers].sort((a, b) => a - b),
      Array.from({ length: surah === 1 ? hafsTotal - 1 : hafsTotal }, (_, i) =>
        i + (surah === 1 ? 2 : 1),
      ),
      `surah ${surah} must cover its Hafs files once each`,
    );
    entries += playlist.length;
    files += numbers.length;
  }
  // 6214 displayed verses, 6236 audio files: the two spaces are reconciled
  // without losing or repeating a file, and Al-Fatiha's unnumbered basmala is
  // the one file no Warsh verse asks for.
  assert.equal(entries, files);
  assert.equal(files, 6235);
});

test("re-loading an expanded playlist never re-expands it", () => {
  const once = expandAyahsToAudioFiles(buildSurahAudioPlaylist(2, "warsh"), "everyayah");
  const twice = expandAyahsToAudioFiles(once, "everyayah");
  assert.deepEqual(
    twice.map((item) => item.hafsNumber),
    once.map((item) => item.hafsNumber),
    "a reciter switch rebuilds from items that already carry one file",
  );
});

test("QuranPedia keeps one entry per displayed Warsh verse", () => {
  const service = new AudioService();
  const warsh = getReciter("warsh_hussary", "warsh");
  const raw = buildSurahAudioPlaylist(2, "warsh");
  service.loadPlaylist(raw, warsh.cdn, warsh.cdnType);
  assert.equal(service.playlist.length, raw.length, "its mp3s follow the riwaya");
  assert.equal(service.playlist[1].ayah, 2);
  assert.equal(service.playlist[1].url, "https://files.quranpedia.net/recitations/261/002002.mp3");
  service.destroy();
});

/* ── 2. Playback-follow anchoring ──────────────────────────────────────── */

const attrSelector = /\[([a-z-]+)="([^"]*)"\]/g;

function matches(element, selector) {
  if (selector.startsWith("#")) return element.id === selector.slice(1);
  return [...selector.matchAll(attrSelector)].every(([, name, value]) => element.attrs[name] === value);
}

const makeRoot = (elements) => ({
  querySelector: (selector) => elements.find((element) => matches(element, selector)) || null,
});

// One Warsh page, as WarshPageRenderer emits it: the pair attributes carry the
// displayed Warsh numbers, data-ayah-global carries the legacy 1..6214 row id.
const warshPage = () =>
  makeRoot(
    [1, 2, 3, 4].map((ayah) => ({
      id: null,
      label: `warsh-2-${ayah}`,
      attrs: {
        "data-surah-number": "2",
        "data-ayah-number": String(ayah),
        "data-ayah-global": String(warshRowId(2, ayah)),
      },
    })),
  );

// The same page in Hafs, where data-ayah-global is the hafs global number.
const hafsPage = () =>
  makeRoot(
    [1, 2, 3].map((ayah) => ({
      id: null,
      label: `hafs-2-${ayah}`,
      attrs: {
        "data-surah-number": "2",
        "data-ayah-number": String(ayah),
        "data-ayah-global": String(getHafsSurahGlobalStart(2) + ayah - 1),
      },
    })),
  );

test("the two global numbering spaces really differ for Warsh", () => {
  const second = buildSurahAudioPlaylist(2, "warsh")[1];
  assert.equal(second.number, getHafsSurahGlobalStart(2) + 2, "hafs global");
  assert.notEqual(second.number, warshRowId(2, 2), "Warsh row id is a different space");
  // The drift grows to the whole 6236 - 6214 difference by the end of the mushaf.
  const nas = buildSurahAudioPlaylist(114, "warsh").at(-1);
  assert.equal(nas.number - warshRowId(114, nas.ayah), 22, "cumulative drift");
});

test("Warsh playback anchors on the Warsh verse, not on the Hafs global", () => {
  const root = warshPage();
  const playing = { surah: 2, ayah: 2, globalNumber: getHafsSurahGlobalStart(2) + 2 };

  // data-ayah-global="10" exists on this page and belongs to Warsh 2:3.
  assert.equal(root.querySelector(`[data-ayah-global="${playing.globalNumber}"]`).label, "warsh-2-3");
  assert.equal(
    findPlayingAyahElement(root, playing, "page").label,
    "warsh-2-2",
    "the displayed pair wins",
  );
  assert.equal(
    findPlayingAyahElement(root, playing, "juz").label,
    "warsh-2-2",
    "and in juz mode too",
  );
  assert.deepEqual(playingAyahSelectors(playing, "page").slice(0, 2), [
    '[data-surah-number="2"][data-ayah-number="2"]',
    '[data-ayah-global="10"]',
  ]);
});

test("Hafs playback is unchanged and still falls back to the global number", () => {
  const root = hafsPage();
  const playing = { surah: 2, ayah: 2, globalNumber: getHafsSurahGlobalStart(2) + 1 };
  const found = findPlayingAyahElement(root, playing, "page");
  assert.equal(found.label, "hafs-2-2");
  // The pre-existing global anchor resolves to the very same element.
  assert.equal(root.querySelector(`[data-ayah-global="${playing.globalNumber}"]`), found);

  // A surface that only exposes data-ayah-global still resolves.
  const globalOnly = makeRoot([{ id: null, label: "global-only", attrs: { "data-ayah-global": "9" } }]);
  assert.equal(findPlayingAyahElement(globalOnly, playing, "page").label, "global-only");

  // Full-surah streams have no per-ayah number: only the global is queried.
  assert.deepEqual(playingAyahSelectors({ surah: 2, ayah: null, globalNumber: 9 }, "page"), [
    '[data-ayah-global="9"]',
  ]);
  assert.deepEqual(playingAyahSelectors(null, "page"), []);
});

test("a verse the provider does not serve never enters the playlist", () => {
  const gapped = getReciter("warsh_abdulbasit", "warsh");
  assert.equal(gapped.cdnType, "quranpedia");
  const surah67 = buildSurahAudioPlaylist(67, "warsh");
  assert.equal(surah67.at(-1).ayah, 31, "Al-Mulk ends at Warsh verse 31");

  audioService.loadPlaylist(surah67, gapped.cdn, gapped.cdnType);
  const numbers = audioService.playlist.map((item) => item.ayah);
  assert.equal(numbers.length, surah67.length - 1);
  assert.ok(!numbers.includes(31), "the missing file must not stay in the playlist");
  assert.equal(numbers.at(-1), 30);

  // The same mushaf whose set really serves the verse keeps all of them.
  const hussary = getReciter("warsh_hussary", "warsh");
  audioService.loadPlaylist(surah67, hussary.cdn, hussary.cdnType);
  assert.equal(audioService.playlist.length, surah67.length);

  // Hafs-keyed EveryAyah sets are unaffected by the QuranPedia table, and their
  // 31 displayed verses collapse onto the 30 files the surah really has.
  audioService.loadPlaylist(surah67, EVERYAYAH_WARSH.cdn, EVERYAYAH_WARSH.cdnType);
  assert.equal(audioService.playlist.length, Number(SURAHS[66].ayahs));
});

test("declared audio gaps are catalogue verses, not invented numbers", () => {
  let declared = 0;
  for (const reciter of RECITERS.warsh) {
    for (const [surah, ayah] of listAyahAudioGaps(reciter.cdn)) {
      declared += 1;
      assert.equal(reciter.cdnType, "quranpedia", reciter.id);
      const verses = buildSurahAudioPlaylist(surah, "warsh").map((item) => item.ayah);
      assert.ok(verses.includes(ayah), `${reciter.id}: ${surah}:${ayah} is not a Warsh verse`);
    }
  }
  assert.ok(declared > 0, "the gap table must be exercised by at least one voice");
});
