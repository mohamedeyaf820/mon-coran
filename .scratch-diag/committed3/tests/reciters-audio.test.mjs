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

const EXPECTED_HAFS_IDS = [
  "abu_bakr_ash_shaatree",
  "ahmed_neana",
  "akram_alalaqimy",
  "ghamadi_40",
  "husary_muallim",
  "husary_mujawwad_hafs",
  "khalid_abdullaah_qahtani_hafs",
  "mustafa_ismail",
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
  "ibrahim_al_akhdar",
  "mohamed_al_luhaidan",
  "khaled_al_jalil",
  "adel_al_kalbani",
];

const EXPECTED_WARSH_IDS = [
  "warsh_abdulbasit",
  "warsh_ibrahim_aldosari",
  "warsh_abdelmoujib_benkirane",
  "warsh_yassin",
  "warsh_hussary",
  "warsh_omar_al_qazabri",
  "warsh_mohammad_saayed",
  "warsh_al_qaria_yassen",
  "warsh_aloyoon_al_koshi",
  "warsh_rachid_belalya",
];

function allReciters() {
  return [...getRecitersByRiwaya("hafs"), ...getRecitersByRiwaya("warsh")];
}

test("reciters: supplemental Hafs and Warsh entries are available", () => {
  for (const id of EXPECTED_HAFS_IDS) {
    assert.ok(getReciter(id, "hafs"), `missing Hafs reciter: ${id}`);
  }
  for (const id of EXPECTED_WARSH_IDS) {
    assert.ok(getReciter(id, "warsh"), `missing Warsh reciter: ${id}`);
  }

  assert.ok(getRecitersByRiwaya("hafs").length >= 34);
  assert.ok(getRecitersByRiwaya("warsh").length >= 10);
});

test("reciters: ids are unique and metadata is compatible with the player", () => {
  const ids = new Set();
  const allowedStyles = new Set(["murattal", "mujawwad", "tartil"]);
  const allowedCdnTypes = new Set(["islamic", "everyayah", "mp3quran-surah"]);

  for (const reciter of allReciters()) {
    assert.equal(ids.has(reciter.id), false, `duplicate id: ${reciter.id}`);
    ids.add(reciter.id);
    assert.equal(typeof reciter.nameEn, "string", reciter.id);
    assert.equal(typeof reciter.nameFr, "string", reciter.id);
    assert.ok(allowedStyles.has(reciter.style), reciter.id);
    assert.ok(allowedCdnTypes.has(reciter.cdnType || "islamic"), reciter.id);
    assert.equal(typeof reciter.cdn, "string", reciter.id);
    assert.notEqual(reciter.cdn.trim(), "", reciter.id);
    assert.ok(["hafs", "warsh"].includes(reciter.riwaya), reciter.id);
    assert.ok(["ayah", "surah"].includes(reciter.audioMode), reciter.id);
    assert.ok(["islamic", "everyayah", "mp3quran"].includes(reciter.source), reciter.id);
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

test("reciters: all 59 catalogue entries use curated portrait URLs, not known text thumbnails", () => {
  const reciters = allReciters();
  assert.equal(reciters.length, 59);
  assert.equal(Object.keys(RECITER_PHOTOS_MAP).length, 59);

  for (const reciter of reciters) {
    assert.match(getReciterPhoto(reciter), /^https:\/\//, reciter.id);
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
    SuratMP3: "static.suratmp3.com",
    SurahQuran: "surahquran.com",
    "Wikimedia Commons": "upload.wikimedia.org",
  };

  for (const reciter of allReciters()) {
    const visual = getReciterVisual(reciter);
    assert.equal(
      new URL(visual.photo).hostname,
      expectedHostByProvider[visual.attribution.provider],
      `${reciter.id}: portrait source mismatch`,
    );
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
          "adel_al_kalbani",
        ].includes(reciter.id),
      )
      .map((reciter) => [reciter.id, reciter]),
  );

  assert.deepEqual(Object.keys(requested).sort(), [
    "adel_al_kalbani",
    "ar.minshawi",
    "ar.minshawimujawwad",
    "hudhaify",
    "muhammad_ayyoub",
  ]);
  assert.ok(requested.hudhaify.searchAliases.includes("Houzaifi"));
  assert.ok(requested.muhammad_ayyoub.searchAliases.includes("Mohamed Ayoub"));
  assert.ok(requested.adel_al_kalbani.searchAliases.includes("Kalbani"));
  assert.ok(requested["ar.minshawi"].searchAliases.includes("Menchaoui"));
});

test("reciters: every biography exposes a reviewed HTTPS source", () => {
  assert.equal(Object.keys(RESEARCHED_PROFILES).length, 59);

  for (const [id, profile] of Object.entries(RESEARCHED_PROFILES)) {
    assert.match(profile.bioSource?.url || "", /^https:\/\//, id);
    assert.ok(profile.bioSource?.provider, id);
    assert.match(profile.reviewedAt, /^2026-08-(?:01|13)$/, id);
    assert.ok(profile.bio.fr.length <= 450, `${id}: concise French notice`);
  }

  assert.match(RESEARCHED_PROFILES.fares_abbad.bio.fr, /yéménite/);
  assert.match(RESEARCHED_PROFILES.sahl_yassin.bio.fr, /saoudien/);
  assert.match(RESEARCHED_PROFILES.akram_alalaqimy.bio.fr, /égyptien/);
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
    assert.match(getReciterPhoto(id), /^https:\/\//, id);
    assert.match(getReciterVisual(reciter).attribution.url, /^https:\/\//, id);
    assert.match(researchedProfile.bioSource.url, /^https:\/\//, id);
    assert.ok(researchedProfile.bio.fr.length > 180, id);
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
    "mustafa_ismail",
    "nabil_rifai",
    "salah_al_budair",
    "mahmoud_ali_al_banna",
    "karim_mansoori",
    "muhsin_al_qasim",
    "salaah_bukhatir",
    "yaser_salamah",
    "aziz_alili",
    "abdullah_awwad_al_juhaynee",
    "idris_abkar",
    "ahmad_al_hawashi",
    "ibrahim_al_akhdar",
    "mohamed_al_luhaidan",
    "khaled_al_jalil",
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
  assert.equal(
    RESEARCHED_PROFILES.abdullaah_matrood.portraitStatus,
    "verified",
  );

  const benkirane = getReciter("warsh_abdelmoujib_benkirane", "warsh");
  assert.match(
    getReciterPhoto(benkirane),
    /^https:\/\/static\.suratmp3\.com\/pics\/reciters\/80\.jpg$/,
  );
  assert.equal(getReciterVisual(benkirane).type, "photo");
  assert.equal(getReciterVisual(benkirane).attribution.provider, "SuratMP3");
  assert.equal(
    getReciterVisual(benkirane).attribution.url,
    "https://suratmp3.com/fr/quran/reciters/80",
  );
  assert.match(
    getReciterProfileSource(benkirane).url,
    /^https:\/\/www\.assabile\.com\//,
  );
  assert.equal(
    RESEARCHED_PROFILES.warsh_abdelmoujib_benkirane.portraitStatus,
    "verified",
  );
  assert.equal(
    RESEARCHED_PROFILES.warsh_abdelmoujib_benkirane.portraitSource.provider,
    "SuratMP3",
  );
  assert.equal(
    RESEARCHED_PROFILES.warsh_abdelmoujib_benkirane.verificationSources.length,
    4,
  );

  const ibrahim = getReciter("warsh_ibrahim_aldosari", "warsh");
  assert.match(getReciterPhoto(ibrahim), /^https:\/\/storage\.googleapis\.com\//);
  assert.equal(getReciterVisual(ibrahim).attribution.provider, "Way2Quran");
  assert.equal(
    RESEARCHED_PROFILES.warsh_ibrahim_aldosari.portraitStatus,
    "verified",
  );

  const belachia = getReciter("warsh_rachid_belalya", "warsh");
  assert.equal(getReciterPhoto(belachia), "https://surahquran.com/img/quraa/50.png");
  assert.equal(getReciterVisual(belachia).attribution.provider, "SurahQuran");
  assert.equal(
    RESEARCHED_PROFILES.warsh_rachid_belalya.portraitStatus,
    "verified",
  );

  assert.equal(getReciterVisual(getReciter("ar.husary")).attribution.provider, "Quran.com");
  assert.equal(getReciterCountryLabel("KSA", "fr"), "Arabie saoudite");
  assert.equal(getReciterCountryLabel("Egypt", "ar"), "مصر");
  assert.equal(getReciterCountryLabel("Algeria", "fr"), "Algérie");
  assert.equal(getReciterCountryLabel("Morocco", "ar"), "المغرب");
});

test("reciters: Warsh additions are marked as verified Warsh", () => {
  for (const id of EXPECTED_WARSH_IDS) {
    assert.equal(isWarshVerifiedReciter(id, "warsh"), true, id);
  }
});

test("audio: everyayah and mp3quran reciter URLs are built as mp3 URLs", async () => {
  globalThis.window = { location: { href: "http://localhost/" } };
  globalThis.Audio = class MockAudio {
    addEventListener() {}
    removeEventListener() {}
    removeAttribute() {}
  };

  const { AudioService } = await import("../src/services/audioService.js");
  const everyayah = getReciter("abu_bakr_ash_shaatree", "hafs");
  const alafasy = getReciter("ar.alafasy", "hafs");
  const warsh = getReciter("warsh_hussary", "warsh");
  const warshAbdulBasit = getReciter("warsh_abdulbasit", "warsh");
  const warshIbrahimAldosari = getReciter(
    "warsh_ibrahim_aldosari",
    "warsh",
  );
  const warshBenkirane = getReciter(
    "warsh_abdelmoujib_benkirane",
    "warsh",
  );
  const idris = getReciter("idris_abkar", "hafs");

  // ar.alafasy uses Islamic Network CDN (global ayah number)
  assert.equal(
    AudioService.buildUrl(alafasy.cdn, { number: 1 }, alafasy.cdnType),
    "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3",
  );

  assert.equal(
    AudioService.buildUrl(everyayah.cdn, { surah: 2, ayah: 255 }, everyayah.cdnType),
    "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/002255.mp3",
  );
  assert.equal(
    AudioService.buildUrl(warsh.cdn, { surah: 1, ayah: 1 }, warsh.cdnType),
    "https://server13.mp3quran.net/husr/Rewayat-Warsh-A-n-Nafi/001.mp3",
  );
  assert.equal(
    AudioService.buildUrl(
      warshAbdulBasit.cdn,
      { surah: 3, ayah: 7 },
      warshAbdulBasit.cdnType,
    ),
    "https://server7.mp3quran.net/basit/Rewayat-Warsh-A-n-Nafi/003.mp3",
  );
  assert.equal(
    AudioService.buildUrl(
      warshIbrahimAldosari.cdn,
      { surah: 3, ayah: 7 },
      warshIbrahimAldosari.cdnType,
    ),
    "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Warsh-A-n-Nafi/003.mp3",
  );
  assert.equal(
    AudioService.buildUrl(
      warshBenkirane.cdn,
      { surah: 3, ayah: 7 },
      warshBenkirane.cdnType,
    ),
    "https://server16.mp3quran.net/A-Benkirane/Rewayat-Warsh-A-n-Nafi/003.mp3",
  );
  assert.equal(
    AudioService.buildUrl(idris.cdn, { surah: 1 }, idris.cdnType),
    "https://server6.mp3quran.net/abkr/001.mp3",
  );
});
