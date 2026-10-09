/**
 * Warsh audio audit: every catalogue voice must be a per-ayah set that really
 * serves the files the app asks for.
 *
 * Numbering spaces differ by host, and the audit has to follow them:
 *  - EveryAyah `warsh/…` folders are Hafs-keyed (Al-Baqara stops at 002286).
 *  - QuranPedia sets are riwaya-keyed (Al-Baqara stops at 002285).
 * The Warsh→Hafs mapping in src/utils/audioPlaylist.js decides which number is
 * requested, so the audit reuses it instead of trusting a hand-written table.
 * A missing file fails the audit unless src/data/audioAvailability.js declares
 * that exact verse as a hole the provider does not serve.
 */
import RECITERS from "../src/data/reciters.js";
import SURAHS from "../src/data/surahs.js";
import { buildSurahAudioPlaylist } from "../src/utils/audioPlaylist.js";
import { isAyahAudioUnavailable } from "../src/data/audioAvailability.js";
import { getWarshSurahAyahCount } from "../src/constants/warshSource.js";

// Baselines plus every surah whose Warsh total is larger than the Hafs total:
// those tails are exactly where a provider set can end one verse too early.
const SAMPLE_SURAHS = [
  1,
  2,
  18,
  36,
  78,
  112,
  114,
  ...SURAHS.filter(
    (surah) => getWarshSurahAyahCount(surah.n) > surah.ayahs,
  ).map((surah) => surah.n),
];

const pad3 = (value) => String(value).padStart(3, "0");

function buildWarshUrl(reciter, item) {
  const file = `${pad3(item.surah)}${pad3(
    reciter.cdnType === "quranpedia" ? item.ayah : item.hafsNumber,
  )}.mp3`;
  if (reciter.cdnType === "quranpedia") {
    return `https://files.quranpedia.net/recitations/${reciter.cdn}/${file}`;
  }
  return `https://everyayah.com/data/${reciter.cdn}/${file}`;
}

function sampleItems() {
  return SAMPLE_SURAHS.flatMap((surah) => {
    const playlist = buildSurahAudioPlaylist(surah, "warsh");
    if (playlist.length === 0) return [];
    return [playlist[0], playlist.at(-1)];
  });
}

async function check(url) {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(12_000),
    });
    if (head.ok || ![403, 405].includes(head.status)) {
      return { ok: head.ok, status: head.status };
    }

    // A few audio CDNs reject HEAD even though ranged playback works.
    const ranged = await fetch(url, {
      headers: { Range: "bytes=0-31" },
      signal: AbortSignal.timeout(12_000),
    });
    await ranged.body?.cancel();
    return { ok: ranged.ok, status: ranged.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
  return results;
}

const metadataFailures = RECITERS.warsh.flatMap((reciter) => {
  const errors = [];
  if (reciter.verifiedWarsh !== true) errors.push("Missing verifiedWarsh flag");
  if (reciter.audioMode !== "ayah") errors.push("Whole-surah stream in the Warsh catalogue");
  if (reciter.cdnType === "everyayah" && !/^warsh\//i.test(reciter.cdn)) {
    errors.push("EveryAyah source is outside the Warsh collection");
  }
  if (reciter.cdnType === "quranpedia" && !/^\d+$/.test(reciter.cdn)) {
    errors.push("QuranPedia cdn is not a recitation id");
  }
  return errors.map((reason) => ({ reciter: reciter.id, cdn: reciter.cdn, reason }));
});

const items = sampleItems();
const rows = await mapWithConcurrency(
  RECITERS.warsh.flatMap((reciter) => items.map((item) => ({ reciter, item }))),
  8,
  async ({ reciter, item }) => {
    if (!item.hafsNumber) {
      return {
        reciter: reciter.id,
        url: "(unmapped)",
        ok: false,
        status: "no Hafs mapping",
      };
    }
    const url = buildWarshUrl(reciter, item);
    const result = await check(url);
    const declaredGap = isAyahAudioUnavailable(
      reciter.cdnType,
      reciter.cdn,
      item.surah,
      item.ayah,
    );
    return {
      ...result,
      reciter: reciter.id,
      surah: item.surah,
      ayah: item.ayah,
      url,
      declaredGap,
      ok: result.ok || declaredGap,
    };
  },
);

const failed = rows.filter((row) => !row.ok);
const healed = rows.filter((row) => row.declaredGap && row.ok && row.status === 200);
console.log(
  `Warsh audio checks: total=${rows.length}, unavailable=${failed.length}, declaredGaps=${rows.filter((r) => r.declaredGap).length}, healed=${healed.length}, metadata=${metadataFailures.length}`,
);
if (metadataFailures.length > 0) console.table(metadataFailures);
if (failed.length > 0) console.table(failed.slice(0, 20));
if (healed.length > 0) {
  console.table(healed.map(({ reciter, surah, ayah, url }) => ({ reciter, surah, ayah, url })));
  console.error(
    "Declared audio gaps are now served by the provider: remove them from src/data/audioAvailability.js.",
  );
}
if (metadataFailures.length > 0 || failed.length > 0 || healed.length > 0) process.exit(1);

console.log("OK: every Warsh voice is a complete per-ayah set and the sampled files are reachable.");
