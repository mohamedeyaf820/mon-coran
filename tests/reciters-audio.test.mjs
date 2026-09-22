import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  RECITER_PHOTOS_MAP,
  RECITER_STYLE_FILTERS,
  countRecitersByStyle,
  getReciter,
  getReciterAvatar,
  getReciterBio,
  getReciterCountryLabel,
  getReciterPhoto,
  getReciterPortraitSource,
  getReciterProfileSource,
  getReciterSourceInfo,
  getReciterVisual,
  getRecitersByRiwaya,
  getSourcePhotoFocus,
  isWarshVerifiedReciter,
  validateReciterAudioConfig,
  validateReciterProfile,
} from "../src/data/reciters.js";

import { RECITER_PORTRAITS } from "../src/data/reciterPortraits.js";
import { foldSearchText } from "../src/utils/searchIntelligence.js";

const RESEARCHED_PROFILES = JSON.parse(
  readFileSync(new URL("../public/data/reciter-profiles.json", import.meta.url), "utf8"),
);

// The only third parties the app is willing to credit for a reciter's face.
const PORTRAIT_PROVIDERS = ["Quran.com", "Assabile", "Way2Quran"];

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
  "adel_al_kalbani",
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
  "warsh_abdelmoujib_benkirane",
  "warsh_rachid_belalya",
  ...RETIRED_WARSH_SURAH_STREAM_IDS,
];

// Reciters whose portrait is curated: everything except the QuranPedia voice
// with no photograph of him anywhere in the sources the app trusts.
const AVATAR_ONLY_IDS = ["warsh_dagous"];

function allReciters() {
  return [...getRecitersByRiwaya("hafs"), ...getRecitersByRiwaya("warsh")];
}

// The third-party file a portrait was fetched from, as opposed to the local WebP
// the app actually serves (getReciterPhoto).
const sourcePhoto = (reciterOrId) =>
  RECITER_PHOTOS_MAP[typeof reciterOrId === "string" ? reciterOrId : reciterOrId.id];

test("reciters: Hafs and Warsh catalogues are complete", () => {
  for (const id of EXPECTED_HAFS_IDS) {
    assert.ok(getReciter(id, "hafs"), `missing Hafs reciter: ${id}`);
  }
  for (const id of EXPECTED_WARSH_IDS) {
    assert.ok(getReciter(id, "warsh"), `missing Warsh reciter: ${id}`);
  }

  assert.equal(getRecitersByRiwaya("hafs").length, 45);
  assert.equal(getRecitersByRiwaya("warsh").length, 8);
  assert.equal(allReciters().length, 53);
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

// The three Hafs voices MP3Quran publishes only as a surah-long stream.
const SURAH_STREAM_IDS = ["abdulbar_althubaity", "saad_almoqren", "adel_al_kalbani"];

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
  const allowedStyles = new Set(["murattal", "mujawwad", "tartil", "muallim"]);
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
    // The build already squared a local file around the face, so the UI centres it.
    if (RECITER_PORTRAITS[reciter.id]) assert.equal(visual.focalPoint, "50% 50%", reciter.id);
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

// The hub offers one chip per RECITER_STYLE_FILTERS entry and filters the
// active riwaya by reciter.style, so the two lists have to agree in both
// directions or a voice becomes unreachable (a style with no chip) or the
// chip becomes a dead end (a chip with no voice).
test("reciters: hub style chips and catalogue styles agree in both directions", () => {
  const chipIds = RECITER_STYLE_FILTERS.map((f) => f.id);
  assert.deepEqual(chipIds, [...new Set(chipIds)]);
  assert.equal(chipIds[0], "all");
  assert.ok(chipIds.includes("favorites"));

  const styleChips = chipIds.filter((id) => id !== "all" && id !== "favorites");
  const catalogueStyles = new Set(allReciters().map((r) => r.style));

  // The hub's hint line is built from the chips that carry a gloss, so a style
  // without one silently loses its explanation.
  for (const filter of RECITER_STYLE_FILTERS) {
    if (filter.id === "all" || filter.id === "favorites") {
      assert.equal(filter.hint, undefined, filter.id);
      continue;
    }
    for (const lang of ["fr", "en", "ar"]) {
      assert.ok(filter.label?.[lang]?.trim(), `${filter.id} label ${lang}`);
      assert.ok(filter.hint?.[lang]?.trim(), `${filter.id} hint ${lang}`);
    }
  }

  for (const style of catalogueStyles) {
    assert.ok(styleChips.includes(style), `no hub chip can reach style "${style}"`);
  }
  for (const chip of styleChips) {
    assert.ok(catalogueStyles.has(chip), `hub chip "${chip}" matches no reciter`);
    assert.ok(
      getRecitersByRiwaya("hafs").some((r) => r.style === chip),
      `hub chip "${chip}" is empty for Hafs`,
    );
  }
});

test("reciters: style counts stay within the riwaya the hub lists", () => {
  for (const riwaya of ["hafs", "warsh"]) {
    const list = getRecitersByRiwaya(riwaya);
    const counts = countRecitersByStyle(list);
    assert.equal(counts.all, list.length, riwaya);
    const styleTotal = Object.entries(counts)
      .filter(([id]) => id !== "all")
      .reduce((sum, [, n]) => sum + n, 0);
    assert.equal(styleTotal, list.length, `${riwaya}: every voice is in exactly one chip`);
    for (const [style, n] of Object.entries(counts)) {
      if (style === "all") continue;
      assert.equal(
        n,
        list.filter((r) => r.style === style).length,
        `${riwaya}/${style}`,
      );
    }
  }
  // Al-Husary's teaching recitation is the one Muallim voice; tagging it back
  // as murattal silently kills the chip.
  assert.deepEqual(
    getRecitersByRiwaya("hafs")
      .filter((r) => r.style === "muallim")
      .map((r) => r.id),
    ["husary_muallim"],
  );
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

test("reciters: curated portraits cover the catalogue and ship as local files", () => {
  const withPhotos = allReciters().filter(
    (reciter) => !AVATAR_ONLY_IDS.includes(reciter.id),
  );
  assert.equal(withPhotos.length, 52);
  assert.equal(Object.keys(RECITER_PHOTOS_MAP).length, 52);

  for (const reciter of withPhotos) {
    assert.equal(getReciterVisual(reciter).type, "photo", reciter.id);
    assert.equal(getReciterPhoto(reciter), `/images/reciters/${reciter.id}.webp`, reciter.id);
  }

  for (const id of AVATAR_ONLY_IDS) {
    assert.equal(getReciterVisual(getReciter(id, "warsh")).type, "avatar", id);
  }

  const portraits = Object.values(RECITER_PHOTOS_MAP).join("\n");
  assert.doesNotMatch(
    portraits,
    /\/200x256\/(?:ibrahim-al-dossari|rachid-belalia)\.(?:png|jpe?g)/,
  );
  // Assabile's name cards and Pinterest are not sources for a face the app shows.
  assert.doesNotMatch(portraits, /assabile\.com\/media\/person\/default\.png|i\.pinimg\.com/);
});

test("reciters: the generated local portrait set is complete, dated and attributed", () => {
  assert.deepEqual(Object.keys(RECITER_PORTRAITS).sort(), Object.keys(RECITER_PHOTOS_MAP).sort());

  for (const [id, entry] of Object.entries(RECITER_PORTRAITS)) {
    assert.equal(entry.src, `/images/reciters/${id}.webp`, id);
    const provenance = getReciterPortraitSource(id);
    assert.ok(PORTRAIT_PROVIDERS.includes(entry.provider), `${id}: ${entry.provider}`);
    assert.equal(entry.provider, provenance.provider, id);
    assert.equal(entry.sourcePage, provenance.url, `${id}: stale attribution, rerun npm run images:reciters`);
    assert.match(entry.sourcePage, /^https:\/\//, id);
    assert.equal(entry.sourceUrl, RECITER_PHOTOS_MAP[id], id);

    const bytes = readFileSync(new URL(`../public${entry.src}`, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString("latin1"), "RIFF", id);
    assert.equal(bytes.subarray(8, 12).toString("latin1"), "WEBP", id);
    assert.equal(bytes.byteLength, entry.bytes, `${id}: manifest size drift, rerun npm run images:reciters`);
    // The avatars render at 45-96px; a 256px WebP never needs more than a few tens of kB.
    assert.ok(entry.bytes < 40_000, `${id}: ${entry.bytes} bytes`);
  }

  // The build squares each remote file around this anchor, so the hand-checked
  // off-centre framings must survive a rebuild.
  for (const id of ["ar.husary", "husary_muallim", "warsh_hussary", "abdullaah_matrood"]) {
    assert.match(getSourcePhotoFocus(id), /^50% 2\d%$|^50% 3\d%$/, id);
  }
  assert.equal(getSourcePhotoFocus("ar.alafasy"), "50% 32%");
});

test("reciters: portrait attribution names the provider that hosts the source file", () => {
  const expectedHostsByProvider = {
    Assabile: ["www.assabile.com"],
    "Quran.com": ["static.qurancdn.com"],
    // Approved for the two Maghribi Warsh voices whose only verifiable portrait is
    // on the reciter page that names them; Assabile serves a name card instead.
    Way2Quran: ["storage.googleapis.com", "media.way2quran.com"],
  };

  for (const reciter of allReciters()) {
    const visual = getReciterVisual(reciter);
    if (visual.type !== "photo") continue;
    const sourceUrl = RECITER_PHOTOS_MAP[reciter.id];
    assert.ok(
      expectedHostsByProvider[visual.attribution.provider].includes(new URL(sourceUrl).hostname),
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

// The hub searches the folded names and aliases as substrings, so a hyphen in
// the catalogue spelling ("Al-Banna") hides the voice from the form readers
// actually type. These are the queries that used to return nothing.
test("reciters: the hub finds each voice under the spellings readers type", () => {
  const haystacks = new Map(
    getRecitersByRiwaya("hafs").map((reciter) => [
      reciter.id,
      [reciter.nameFr, reciter.nameEn, reciter.name, (reciter.searchAliases || []).join(" ")]
        .map(foldSearchText)
        .join(" "),
    ]),
  );

  const queries = {
    albanna: "mahmoud_ali_al_banna",
    banna: "mahmoud_ali_al_banna",
    "mahmoud banna": "mahmoud_ali_al_banna",
    minshawwi: "ar.minshawi",
    minshawy: "ar.minshawi",
    kalbanni: "adel_al_kalbani",
    kalbani: "adel_al_kalbani",
    "adel kalbani": "adel_al_kalbani",
  };

  for (const [query, expectedId] of Object.entries(queries)) {
    const folded = foldSearchText(query);
    const hits = [...haystacks].filter(([, h]) => h.includes(folded)).map(([id]) => id);
    assert.ok(hits.includes(expectedId), `"${query}" found ${JSON.stringify(hits)}`);
  }
});

test("reciters: every biography exposes a reviewed HTTPS source", () => {
  assert.equal(Object.keys(RESEARCHED_PROFILES).length, 53);

  for (const [id, profile] of Object.entries(RESEARCHED_PROFILES)) {
    assert.match(profile.bioSource?.url || "", /^https:\/\//, id);
    assert.ok(profile.bioSource?.provider, id);
    assert.match(profile.reviewedAt, /^2026-(?:08-01|08-13|09-19|09-20|09-22)$/, id);
    assert.ok(profile.bio.fr.length <= 450, `${id}: concise French notice`);
  }

  assert.match(RESEARCHED_PROFILES.fares_abbad.bio.fr, /yéménite/);
  assert.match(RESEARCHED_PROFILES.sahl_yassin.bio.fr, /saoudien/);
  assert.match(RESEARCHED_PROFILES.akram_alalaqimy.bio.fr, /égyptien/);
  // QuranPedia publishes no per-mushaf page, so the visible link goes to the
  // site and the machine-checkable record stays on the API that documents it.
  for (const [id, record] of [
    ["warsh_dagous", 264],
    ["warsh_mohamed_abdulkarim", 267],
  ]) {
    const src = RESEARCHED_PROFILES[id].bioSource;
    assert.equal(src.url, "https://quranpedia.net", id);
    assert.match(src.apiUrl, /^https:\/\/api\.quranpedia\.net/, id);
    assert.equal(src.record, record, id);
  }
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
    assert.match(sourcePhoto(id), /^https:\/\/static\.qurancdn\.com\/images\/reciters\//);
    assert.equal(getReciterPhoto(id), `/images/reciters/${id}.webp`);
  }

  for (const id of EXPECTED_WARSH_IDS) {
    const reciter = getReciter(id, "warsh");
    const researchedProfile = RESEARCHED_PROFILES[id];
    assert.ok(researchedProfile.bio.fr.length > 150, id);
    assert.equal(researchedProfile.bioSource.url.startsWith("https://"), true, id);
    if (AVATAR_ONLY_IDS.includes(id)) continue;
    assert.match(sourcePhoto(id), /^https:\/\//, id);
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
    assert.match(sourcePhoto(id), /^https:\/\/www\.assabile\.com\/media\/person\//, id);
    assert.equal(getReciterVisual(reciter).attribution.provider, "Assabile", id);
    assert.match(getReciterProfileSource(id).url, /^https:\/\/www\.assabile\.com\//, id);
  }

  const matrood = getReciter("abdullaah_matrood", "hafs");
  assert.match(
    sourcePhoto(matrood),
    /^https:\/\/www\.assabile\.com\/media\/photo\/full_size\/abdallah-matroud-582\.jpg$/,
  );
  assert.equal(getReciterVisual(matrood).attribution.provider, "Assabile");
  assert.equal(RESEARCHED_PROFILES.abdullaah_matrood.portraitStatus, "verified");

  const ibrahim = getReciter("warsh_ibrahim_aldosari", "warsh");
  assert.match(sourcePhoto(ibrahim), /^https:\/\/storage\.googleapis\.com\//);
  assert.equal(getReciterVisual(ibrahim).attribution.provider, "Way2Quran");
  assert.equal(RESEARCHED_PROFILES.warsh_ibrahim_aldosari.portraitStatus, "verified");

  // The two Maghribi voices whose only photograph lives on Way2Quran, accepted over
  // Assabile's name card. They are the whole exception to the Way2Quran hot-link ban.
  const way2quranIds = ["saad_almoqren", "warsh_rachid_belalaya"];
  for (const id of way2quranIds) {
    assert.match(sourcePhoto(id), /^https:\/\/media\.way2quran\.com\/imgs\//, id);
    assert.equal(getReciterVisual(getReciter(id)).attribution.provider, "Way2Quran", id);
    assert.equal(RESEARCHED_PROFILES[id].portraitStatus, "verified", id);
  }
  const otherPhotos = Object.keys(RECITER_PHOTOS_MAP).filter((id) => !way2quranIds.includes(id));
  // media.way2quran.com is the narrow exception: those two files and no others.
  for (const id of otherPhotos) {
    assert.doesNotMatch(RECITER_PHOTOS_MAP[id], /^https:\/\/media\.way2quran\.com\//, id);
  }

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
    "server8.mp3quran.net",
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
