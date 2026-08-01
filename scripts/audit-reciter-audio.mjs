import RECITERS, {
  validateReciterProfile,
} from "../src/data/reciters.js";

const MP3QURAN_API = "https://www.mp3quran.net/api/v3/reciters?language=eng";
const SAMPLE = { surah: 1, ayah: 1, globalAyah: 1 };

function normalizeServer(value) {
  return String(value || "").replace(/\/+$/, "/").toLowerCase();
}

function buildSampleUrl(reciter) {
  if (reciter.cdnType === "mp3quran-surah") {
    return `${reciter.cdn}${String(SAMPLE.surah).padStart(3, "0")}.mp3`;
  }
  if (reciter.cdnType === "everyayah") {
    const surah = String(SAMPLE.surah).padStart(3, "0");
    const ayah = String(SAMPLE.ayah).padStart(3, "0");
    return `https://everyayah.com/data/${reciter.cdn}/${surah}${ayah}.mp3`;
  }
  return `https://cdn.islamic.network/quran/audio/128/${reciter.cdn}/${SAMPLE.globalAyah}.mp3`;
}

async function checkAudioUrl(url) {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (head.ok) return { ok: true, status: head.status };
    if (![403, 405].includes(head.status)) {
      return { ok: false, status: head.status };
    }

    const ranged = await fetch(url, {
      headers: { Range: "bytes=0-63" },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    return { ok: ranged.ok, status: ranged.status };
  } catch (error) {
    return { ok: false, status: error?.name || "network-error" };
  }
}

async function loadOfficialMp3QuranServers() {
  const response = await fetch(MP3QURAN_API, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`MP3Quran API: HTTP ${response.status}`);
  const payload = await response.json();
  return new Set(
    (payload.reciters || []).flatMap((reciter) =>
      (reciter.moshaf || []).map((moshaf) => normalizeServer(moshaf.server)),
    ),
  );
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

const allReciters = [...RECITERS.hafs, ...RECITERS.warsh];
const staticFailures = allReciters.flatMap((reciter) => {
  const validation = validateReciterProfile(reciter);
  return validation.valid
    ? []
    : [{ id: reciter.id, reason: `metadata: ${validation.errors.join(", ")}` }];
});

let officialServers = new Set();
try {
  officialServers = await loadOfficialMp3QuranServers();
} catch (error) {
  console.error(`[reciters] ${error.message}`);
  process.exitCode = 1;
}

const officialFailures = officialServers.size
  ? allReciters.flatMap((reciter) =>
      reciter.cdnType === "mp3quran-surah" &&
      !officialServers.has(normalizeServer(reciter.cdn))
        ? [{ id: reciter.id, reason: "source absente du catalogue officiel MP3Quran" }]
        : [],
    )
  : [];

const liveResults = await mapWithConcurrency(allReciters, 8, async (reciter) => {
  const url = buildSampleUrl(reciter);
  const result = await checkAudioUrl(url);
  return { id: reciter.id, url, ...result };
});
const liveFailures = liveResults
  .filter((result) => !result.ok)
  .map((result) => ({
    id: result.id,
    reason: `audio HTTP ${result.status}`,
    url: result.url,
  }));

const failures = [...staticFailures, ...officialFailures, ...liveFailures];
if (failures.length) {
  console.error(`[reciters] ${failures.length} échec(s) sur ${allReciters.length} profils`);
  for (const failure of failures) {
    console.error(`- ${failure.id}: ${failure.reason}${failure.url ? ` — ${failure.url}` : ""}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `[reciters] OK — ${allReciters.length} profils normalisés, sources MP3Quran référencées et échantillons audio accessibles`,
  );
}
