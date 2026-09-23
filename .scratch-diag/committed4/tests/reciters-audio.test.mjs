import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  RECITER_PHOTOS_MAP,
  getReciter,
  getReciterAvatar,
  getReciterBio,
  getReciterCountryLabel,
  getReciterPhoto,
  getReciterPhotoFocus,
  getReciterProfileSource,
  getReciterSourceInfo,
  getReciterVisual,
  getRecitersByRiwaya,
  isWarshVerifiedReciter,
  validateReciterAudioConfig,
  validateReciterProfile,
} from "../src/data/reciters.js";

const RESEARCHED_PROFILES = JSON.parse(
  readFileSync(new URL("../public/data/reciter-profiles.json", import.meta.url), "utf8"),
);

// Hafs is limited to the two sources the app can play per ayah from: the
// Quran.com CDN (their API) and EveryAyah.
const QURAN_CDN_HAFS_IDS = ["ar.alafasy", "ar.minshawi"];

const EXPECTED_HAFS_IDS = [
  "ar.alafasy",
  "ar.abdulbasitmurattal",
  "ar.abdulbasitmujawwad",
  "ar.husary",
  "ar.minshawi",
  "ar.minshawimujawwad",
  "ar.saoodshuraym",
  "abdullaah_matrood",
  "abdullaah_basfar",
  "abdulsamad",
  "ar.abdurrahmaansudais",
  "ahmed_ajmy",
  "maher_almuaiqly",
  "ali_jabir",
  "hudhaify",
  "ar.muhammadjibreel",
  "muhammad_ayyoub",
  "muhammad_tablawi",
  "hani_rifai",
  "fares_abbad",
  "yasser_dossari_hafs",
  "nasser_alqatami",
  "sahl_yassin",
  "abu_bakr_ash_shaatree",
  "ahmed_neana",
  "akram_alalaqimy",
  "ghamadi_40",
  "husary_muallim",
  "husary_mujawwad_hafs",
  "khalid_abdullaah_qahtani_hafs",
  "nabil_rifai",
  "salah_al_budair",
  "mahmoud_ali_al_banna",
  "karim_mansoori",
  "muhsin_al_qasim",
  "salaah_bukhatir",
  "yaser_salamah",
  "aziz_alili",
  "khalefa_al_tunaiji",
  "ahmed_ibn_ali_al_ajamy_64",
  "abdullah_awwad_al_juhaynee",
  "abdulbar_althubaity",
  "saad_almoqren",
  "ali_hajjaj_alsoaesi",
];

const EXPECTED_WARSH_IDS = [
  "warsh_abdulbasit",
  "warsh_hussary",
  "warsh_ibrahim_aldosari",
  "warsh_yassin",
  "warsh_dagous",
  "warsh_aloyoon_al_koshi",
  "warsh_mohamed_abdulkarim",
  "warsh_rachid_belalaya",
];

// Warsh streams whole surahs at MP3Quran and no approved provider serves these
// four ayah by ayah, so they left the Warsh catalogue.
const RETIRED_WARSH_SURAH_STREAM_IDS = [
  "warsh_omar_al_qazabri",
  "warsh_al_qaria_yassen",
  "warsh_mohammad_saayed",
  "warsh_ahmed_diban",
];

const REMOVED_RECITER_IDS = [
  "mustafa_ismail",
  "idris_abkar",
  "bandar_baleela",
  "ahmad_al_hawashi",
  "ibrahim_al_akhdar",
  "mohamed_al_luhaidan",
  "khaled_al_jalil",
  "adel_al_kalbani",
  "warsh_abdelmoujib_benkirane",
  "warsh_rachid_belalya",
  ...RETIRED_WARSH_SURAH_STREAM_IDS,
];

// Reciters whose portrait is curated: everything except the QuranPedia and
// MP3Quran voices with no verifiable portrait.
const AVATAR_ONLY_IDS = [
  "warsh_dagous",
  "warsh_mohamed_abdulkarim",
  "warsh_rachid_belalaya",
  "warsh_yassin",
  "saad_almoqren",
];

function allReciters() {
  return [...getRecitersByRiwaya("hafs"), ...getRecitersByRiwaya("warsh")];
}

test("reciters: Hafs and Warsh catalogues are complete", () => {
  for (const id of EXPECTED_HAFS_IDS) {
    assert.ok(getReciter(id, "hafs"), `missing Hafs reciter: ${id}`);
  }
  for (const id of EXPECTED_WARSH_IDS) {
    assert.ok(getReciter(id, "warsh"), `missing Warsh reciter: ${id}`);
  }

  assert.equal(getRecitersByRiwaya("hafs").length, 44);
  assert.equal(getRecitersByRiwaya("warsh").length, 8);
  assert.equal(allReciters().length, 52);
});

test("reciters: removed voices no longer resolve", () => {
  for (const id of REMOVED_RECITER_IDS) {
    assert.equal(getReciter(id), null, `still present: ${id}`);
    assert.equal(getReciter(id, "warsh"), null, `still present: ${id}`);
  }
});

test("reciters: Hafs streams only from the Quran.com CDN, EveryAyah or approved MP3Quran surah feeds", () => {
  const hafs = getRecitersByRiwaya("hafs");
  const quranCdn = hafs.filter((reciter) => reciter.cdnType === "quran-cdn").map((r) => r.id);

  assert.deepEqual(quranCdn.sort(), [...QURAN_CDN_HAFS_IDS].sort());

  for (const reciter of hafs) {
    const allowed = ["quran-cdn", "everyayah"];
    if (SURAH_STREAM_IDS.includes(reciter.id)) allowed.push("mp3quran-surah");
    assert.ok(allowed.includes(reciter.cdnType || "everyayah"), reciter.id);
  }
});

const SURAH_STREAM_IDS = ["abdulbar_althubaity", "saad_almoqren"];

test("reciters: only the approved voices stream whole surahs", () => {
  for (const reciter of allReciters()) {
    if (SURAH_STREAM_IDS.includes(reciter.id)) {
      assert.equal(reciter.audioMode, "surah", reciter.id);
      assert.equal(reciter.cdnType, "mp3quran-surah", reciter.id);
      continue;
    }
    assert.equal(reciter.audioMode, "ayah", reciter.id);
    assert.notEqual(reciter.cdnType, "mp3quran-surah", reciter.id);
    assert.equal(getReciterSourceInfo(reciter).audioMode, "ayah", reciter.id);
  }
});

test("reciters: ids are unique and metadata is compatible with the player", () => {
  const ids = new Set();
  const allowedStyles = new Set(["murattal", "mujawwad", "tartil"]);
  const allowedCdnTypes = new Set(["everyayah", "quran-cdn", "quranpedia", "mp3quran-surah"]);
  const allowedSources = new Set(["everyayah", "quran", "quranpedia", "mp3quran"]);

  for (const reciter of allReciters()) {
    assert.equal(ids.has(reciter.id), false, `duplicate id: ${reciter.id}`);
    ids.add(reciter.id);
    assert.equal(typeof reciter.nameEn, "string", reciter.id);
    assert.equal(typeof reciter.nameFr, "string", reciter.id);
    assert.ok(allowedStyles.has(reciter.style), reciter.id);
    assert.ok(allowedCdnTypes.has(reciter.cdnType || "everyayah"), reciter.id);
    assert.equal(typeof reciter.cdn, "string", reciter.id);
    assert.notEqual(reciter.cdn.trim(), "", reciter.id);
    assert.ok(["hafs", "warsh"].includes(reciter.riwaya), reciter.id);
    assert.ok(allowedSources.has(reciter.source), reciter.id);
    assert.ok(reciter.country === null || typeof reciter.country === "string", reciter.id);
    assert.equal(typeof reciter.verifiedWarsh, "boolean", reciter.id);
    assert.deepEqual(validateReciterAudioConfig(reciter), { valid: true, errors: [] }, reciter.id);
    assert.deepEqual(validateReciterProfile(reciter), { valid: true, errors: [] }, reciter.id);

    const sourceInfo = getReciterSourceInfo(reciter);
    assert.ok(sourceInfo?.label, reciter.id);
    assert.equal(sourceInfo?.audioMode, reciter.audioMode, reciter.id);

    const avatar = getReciterAvatar(reciter);
    assert.match(avatar.initials, /^[A-Z0-9]{1,2}$/);
    assert.match(avatar.color, /^#[0-9a-f]{6}$/i);
    assert.match(avatar.colorAlt, /^#[0-9a-f]{6}$/i);
    assert.match(avatar.gradient, /^linear-gradient\(/);
    const visual = getReciterVisual(reciter);
    assert.ok(["photo", "avatar"].includes(visual.type), reciter.id);
    assert.ok(visual.photo || visual.avatar?.initials, reciter.id);
    assert.equal(Boolean(visual.attribution), Boolean(visual.photo), reciter.id);
    assert.match(visual.focalPoint, /^\d+% \d+%$/, reciter.id);
    assert.equal(visual.focalPoint, getReciterPhotoFocus(reciter, visual.photo), reciter.id);
    const bio = getReciterBio(reciter, "fr");
    assert.ok(bio.length > 20, `bio too short for ${reciter.id}`);
  }
});

test("reciters: QuranPedia cdn values are numeric recitation ids", () => {
  for (const reciter of allReciters()) {
    if (reciter.cdnType !== "quranpedia") continue;
    assert.match(reciter.cdn, /^\d+$/, reciter.id);
    assert.equal(getReciterSourceInfo(reciter).label, "QuranPedia", reciter.id);
  }
});

test("reciters: every catalogue entry has a visual and localized biography", () => {
  for (const reciter of allReciters()) {
    const profile = RESEARCHED_PROFILES[reciter.id];
    const visual = getReciterVisual(reciter);
    assert.ok(["photo", "avatar"].includes(visual.type), reciter.id);
    assert.ok(visual.photo || visual.avatar?.initials, reciter.id);
    assert.ok(profile, `missing researched profile: ${reciter.id}`);
    assert.ok(profile.bio.fr.length > 40, `missing French biography: ${reciter.id}`);
    assert.ok(profile.bio.en.length > 40, `missing English biography: ${reciter.id}`);
    assert.ok(profile.bio.ar.length > 40, `missing Arabic biography: ${reciter.id}`);
  }
});

test("reciters: curated portrait URLs replace every known text thumbnail", () => {
  const withPhotos = allReciters().filter(
    (reciter) => !AVATAR_ONLY_IDS.includes(reciter.id),
  );
  assert.equal(withPhotos.length, 47);
  assert.equal(Object.keys(RECITER_PHOTOS_MAP).length, 47);

  for (const reciter of withPhotos) {
    assert.equal(getReciterVisual(reciter).type, "photo", reciter.id);
    assert.match(getReciterPhoto(reciter), /^https:\/\//, reciter.id);
  }

  for (const id of AVATAR_ONLY_IDS) {
    assert.equal(getReciterVisual(getReciter(id, "warsh")).type, "avatar", id);
  }

  const portraits = Object.values(RECITER_PHOTOS_MAP).join("\n");
  assert.doesNotMatch(
    portraits,
    /\/200x256\/(?:ibrahim-al-dossari|rachid-belalia)\.(?:png|jpe?g)/,
  );
  assert.doesNotMatch(portraits, /media\.way2quran\.com|i\.pinimg\.com/);
});

test("reciters: portrait attribution matches the actual image host", () => {
  const expectedHostByProvider = {
    Assabile: "www.assabile.com",
    "Quran.com": "static.qurancdn.com",
    Way2Quran: "storage.googleapis.com",
  };

  for (const reciter of allReciters()) {
    const visual = getReciterVisual(reciter);
    if (visual.type !== "photo") continue;
    assert.equal(
      new URL(visual.photo).hostname,
      expectedHostByProvider[visual.attribution.provider],
      `${reciter.id}: portrait source mismatch`,
    );
    assert.match(visual.attribution.url, /^https:\/\//, reciter.id);
  }
});

test("reciters: Al-Matrood and Al-Sudais have verified biography sources", () => {
  assert.equal(
    RESEARCHED_PROFILES.abdullaah_matrood.bioSource.url,
    "https://www.assabile.com/abdullah-matrood-5/abdullah-matrood.htm",
  );
  assert.equal(
    RESEARCHED_PROFILES["ar.abdurrahmaansudais"].bioSource.url,
    "https://saudipedia.com/en/abdulrahman-al-sudais",
  );
});

test("reciters: requested voices are discoverable through common spellings", () => {
  const requested = Object.fromEntries(
    allReciters()
      .filter((reciter) =>
        [
          "ar.minshawi",
          "ar.minshawimujawwad",
          "hudhaify",
          "muhammad_ayyoub",
        ].includes(reciter.id),
      )
      .map((reciter) => [reciter.id, reciter]),
  );

  assert.deepEqual(Object.keys(requested).sort(), [
    "ar.minshawi",
    "ar.minshawimujawwad",
    "hudhaify",
    "muhammad_ayyoub",
  ]);
  assert.ok(requested.hudhaify.searchAliases.includes("Houzaifi"));
  assert.ok(requested.muhammad_ayyoub.searchAliases.includes("Mohamed Ayoub"));
  assert.ok(requested["ar.minshawi"].searchAliases.includes("Menchaoui"));
});

test("reciters: every biography exposes a reviewed HTTPS source", () => {
  assert.equal(Object.keys(RESEARCHED_PROFILES).length, 52);

  for (const [id, profile] of Object.entries(RESEARCHED_PROFILES)) {
    assert.match(profile.bioSource?.url || "", /^https:\/\//, id);
    assert.ok(profile.bioSource?.provider, id);
    assert.match(profile.reviewedAt, /^2026-(?:08-01|08-13|09-19|09-20)$/, id);
    assert.ok(profile.bio.fr.length <= 450, `${id}: concise French notice`);
  }

  assert.match(RESEARCHED_PROFILES.fares_abbad.bio.fr, /yéménite/);
  assert.match(RESEARCHED_PROFILES.sahl_yassin.bio.fr, /saoudien/);
  assert.match(RESEARCHED_PROFILES.akram_alalaqimy.bio.fr, /égyptien/);
  assert.match(RESEARCHED_PROFILES.warsh_dagous.bioSource.url, /^https:\/\/api\.quranpedia\.net/);
  assert.match(RESEARCHED_PROFILES.warsh_mohamed_abdulkarim.bioSource.url, /^https:\/\/api\.quranpedia\.net/);
});

test("reciters: reciter profiles match the catalogue exactly", () => {
  const catalogueIds = allReciters().map((reciter) => reciter.id).sort();
  assert.deepEqual(Object.keys(RESEARCHED_PROFILES).sort(), catalogueIds);
});

test("reciters: attributed portraits and biography sources are wired", () => {
  const knownPhotoIds = [
    "ar.alafasy",
    "ar.husary",
    "abu_bakr_ash_shaatree",
    "ahmed_ajmy",
    "ghamadi_40",
    "ar.muhammadjibreel",
    "hani_rifai",
    "khalefa_al_tunaiji",
    "warsh_hussary",
  ];

  for (const id of knownPhotoIds) {
    assert.match(getReciterPhoto(id), /^https:\/\/static\.qurancdn\.com\/images\/reciters\//);
  }

  for (const id of EXPECTED_WARSH_IDS) {
    const reciter = getReciter(id, "warsh");
    const researchedProfile = RESEARCHED_PROFILES[id];
    assert.ok(researchedProfile.bio.fr.length > 150, id);
    assert.equal(researchedProfile.bioSource.url.startsWith("https://"), true, id);
    if (AVATAR_ONLY_IDS.includes(id)) continue;
    assert.match(getReciterPhoto(id), /^https:\/\//, id);
    assert.match(getReciterVisual(reciter).attribution.url, /^https:\/\//, id);
  }

  const researchedHafsPortraitIds = [
    "abdullaah_basfar",
    "hudhaify",
    "muhammad_ayyoub",
    "muhammad_tablawi",
    "fares_abbad",
    "nasser_alqatami",
    "sahl_yassin",
    "ahmed_neana",
    "akram_alalaqimy",
    "khalid_abdullaah_qahtani_hafs",
    "nabil_rifai",
    "salah_al_budair",
    "mahmoud_ali_al_banna",
    "karim_mansoori",
    "muhsin_al_qasim",
    "salaah_bukhatir",
    "yaser_salamah",
    "aziz_alili",
    "abdullah_awwad_al_juhaynee",
  ];

  for (const id of researchedHafsPortraitIds) {
    const reciter = getReciter(id, "hafs");
    assert.match(getReciterPhoto(id), /^https:\/\/www\.assabile\.com\/media\/person\//, id);
    assert.equal(getReciterVisual(reciter).attribution.provider, "Assabile", id);
    assert.match(getReciterProfileSource(id).url, /^https:\/\/www\.assabile\.com\//, id);
  }

  const matrood = getReciter("abdullaah_matrood", "hafs");
  assert.match(
    getReciterPhoto(matrood),
    /^https:\/\/www\.assabile\.com\/media\/photo\/full_size\/abdallah-matroud-582\.jpg$/,
  );
  assert.equal(getReciterVisual(matrood).attribution.provider, "Assabile");
  assert.equal(RESEARCHED_PROFILES.abdullaah_matrood.portraitStatus, "verified");

  const ibrahim = getReciter("warsh_ibrahim_aldosari", "warsh");
  assert.match(getReciterPhoto(ibrahim), /^https:\/\/storage\.googleapis\.com\//);
  assert.equal(getReciterVisual(ibrahim).attribution.provider, "Way2Quran");
  assert.equal(RESEARCHED_PROFILES.warsh_ibrahim_aldosari.portraitStatus, "verified");

  assert.equal(getReciterVisual(getReciter("ar.husary")).attribution.provider, "Quran.com");
  assert.equal(getReciterCountryLabel("KSA", "fr"), "Arabie saoudite");
  assert.equal(getReciterCountryLabel("Egypt", "ar"), "مصر");
  assert.equal(getReciterCountryLabel("Algeria", "fr"), "Algérie");
  assert.equal(getReciterCountryLabel("Morocco", "ar"), "المغرب");
  assert.equal(getReciterCountryLabel(null, "fr"), "");
});

test("reciters: Warsh additions are marked as verified Warsh", () => {
  for (const id of EXPECTED_WARSH_IDS) {
    assert.equal(isWarshVerifiedReciter(id, "warsh"), true, id);
  }
});

test("audio: per-ayah URLs are built for every CDN type", async () => {
  globalThis.window = { location: { href: "http://localhost/" } };
  globalThis.Audio = class MockAudio {
    addEventListener() {}
    removeEventListener() {}
    removeAttribute() {}
  };

  const { AudioService } = await import("../src/services/audioService.js");
  const alafasy = getReciter("ar.alafasy", "hafs");
  const minshawi = getReciter("ar.minshawi", "hafs");
  const everyayah = getReciter("abu_bakr_ash_shaatree", "hafs");
  const husary = getReciter("ar.husary", "hafs");
  const warsh = getReciter("warsh_hussary", "warsh");
  const warshAbdulBasit = getReciter("warsh_abdulbasit", "warsh");
  const warshDagous = getReciter("warsh_dagous", "warsh");
  const warshIbrahimAldosari = getReciter("warsh_ibrahim_aldosari", "warsh");

  assert.equal(
    AudioService.buildUrl(alafasy.cdn, { surah: 1, ayah: 1, hafsNumber: 1 }, alafasy.cdnType),
    "https://audio.qurancdn.com/Alafasy/mp3/001001.mp3",
  );
  assert.equal(
    AudioService.buildUrl(
      minshawi.cdn,
      { surah: 2, ayah: 255, hafsNumber: 255 },
      minshawi.cdnType,
    ),
    "https://audio.qurancdn.com/Minshawi/Murattal/mp3/002255.mp3",
  );
  assert.equal(
    AudioService.buildUrl(everyayah.cdn, { surah: 2, ayah: 255 }, everyayah.cdnType),
    "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/002255.mp3",
  );
  assert.equal(
    AudioService.buildUrl(husary.cdn, { surah: 1, ayah: 1 }, husary.cdnType),
    "https://everyayah.com/data/Husary_128kbps/001001.mp3",
  );

  // QuranPedia keys files on the displayed Warsh number (Baqara ends at 285).
  assert.equal(
    AudioService.buildUrl(
      warsh.cdn,
      { surah: 2, ayah: 285, hafsNumber: 286 },
      warsh.cdnType,
    ),
    "https://files.quranpedia.net/recitations/261/002285.mp3",
  );
  assert.equal(
    AudioService.buildUrl(
      warshAbdulBasit.cdn,
      { surah: 3, ayah: 7, hafsNumber: 7 },
      warshAbdulBasit.cdnType,
    ),
    "https://files.quranpedia.net/recitations/262/003007.mp3",
  );
  assert.equal(
    AudioService.buildUrl(
      warshDagous.cdn,
      { surah: 2, ayah: 285, hafsNumber: 286 },
      warshDagous.cdnType,
    ),
    "https://files.quranpedia.net/recitations/264/002285.mp3",
  );

  // EveryAyah Warsh folders keep Hafs numbering.
  assert.equal(
    AudioService.buildUrl(
      warshIbrahimAldosari.cdn,
      { surah: 2, ayah: 285, hafsNumber: 286 },
      warshIbrahimAldosari.cdnType,
    ),
    "https://everyayah.com/data/warsh/warsh_ibrahim_aldosary_128kbps/002286.mp3",
  );
});

test("audio: fallback candidates stay within the approved sources", async () => {
  globalThis.window = { location: { href: "http://localhost/" } };
  globalThis.Audio = class MockAudio {
    addEventListener() {}
    removeEventListener() {}
    removeAttribute() {}
  };

  const { AudioService } = await import("../src/services/audioService.js");

  assert.deepEqual(
    AudioService.buildUrlCandidates("Alafasy/mp3/", { surah: 1, ayah: 1, hafsNumber: 1 }, "quran-cdn"),
    [
      "https://audio.qurancdn.com/Alafasy/mp3/001001.mp3",
      "https://everyayah.com/data/Alafasy_128kbps/001001.mp3",
    ],
  );
  assert.deepEqual(
    AudioService.buildUrlCandidates(
      "warsh/warsh_yassin_al_jazaery_64kbps",
      { surah: 1, ayah: 1, hafsNumber: 1 },
      "everyayah",
    ),
    [
      "https://everyayah.com/data/warsh/warsh_yassin_al_jazaery_64kbps/001001.mp3",
      "https://www.everyayah.com/data/warsh/warsh_yassin_al_jazaery_64kbps/001001.mp3",
    ],
  );
  assert.deepEqual(
    AudioService.buildUrlCandidates("261", { surah: 2, ayah: 285, hafsNumber: 286 }, "quranpedia"),
    ["https://files.quranpedia.net/recitations/261/002285.mp3"],
  );

  const approvedHosts = new Set([
    "everyayah.com",
    "www.everyayah.com",
    "audio.qurancdn.com",
    "files.quranpedia.net",
    "server6.mp3quran.net",
    "server9.mp3quran.net",
    "server11.mp3quran.net",
    "server16.mp3quran.net",
  ]);

  for (const reciter of allReciters()) {
    const candidates = AudioService.buildUrlCandidates(
      reciter.cdn,
      { surah: 1, ayah: 1, hafsNumber: 1 },
      reciter.cdnType || "everyayah",
    );
    assert.ok(candidates.length >= 1, reciter.id);
    for (const url of candidates) {
      assert.match(url, /^https:\/\//, reciter.id);
      assert.ok(approvedHosts.has(new URL(url).hostname), `${reciter.id}: ${url}`);
    }
  }
});
