import test from "node:test";
import assert from "node:assert/strict";

import {
  getReciter,
  getReciterAvatar,
  getReciterBio,
  getReciterPhoto,
  getReciterVisual,
  getRecitersByRiwaya,
  isWarshVerifiedReciter,
} from "../src/data/reciters.js";

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
];

const EXPECTED_WARSH_IDS = [
  "warsh_mahmoud_shuraym",
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

    const avatar = getReciterAvatar(reciter);
    assert.match(avatar.initials, /^[A-Z0-9]{1,2}$/);
    assert.match(avatar.color, /^#[0-9a-f]{6}$/i);
    assert.match(avatar.colorAlt, /^#[0-9a-f]{6}$/i);
    assert.match(avatar.gradient, /^linear-gradient\(/);
    const visual = getReciterVisual(reciter);
    assert.ok(["photo", "avatar"].includes(visual.type), reciter.id);
    assert.ok(visual.photo || visual.avatar?.initials, reciter.id);
    const bio = getReciterBio(reciter, "fr");
    assert.ok(bio.length > 20, `bio too short for ${reciter.id}`);
  }
});

test("reciters: verified Quran.com photos are wired for known public profiles", () => {
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
  const warsh = getReciter("warsh_muhammad_hifnawi", "warsh");

  // ar.alafasy uses Islamic Network CDN (global ayah number)
  assert.equal(
    AudioService.buildUrl(alafasy.cdn, { number: 1 }, alafasy.cdnType),
    "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3",
  );

  assert.equal(
    AudioService.buildUrl(everyayah.cdn, { surah: 2, ayah: 255 }, everyayah.cdnType),
    "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/002255.mp3",
  );
  assert.equal(warsh, null);
});
