import RECITERS from '../src/data/reciters.js';

const MP3QURAN_RECITERS_URL = 'https://www.mp3quran.net/api/v3/reciters?language=eng';
const OFFICIAL_WARSH_REWAYA_IDS = new Set([2, 10, 18]);

const SAMPLES = [
  { surah: 1, ayah: 1 },
  { surah: 2, ayah: 255 },
  { surah: 18, ayah: 1 },
  { surah: 36, ayah: 58 },
  { surah: 55, ayah: 13 },
  { surah: 67, ayah: 1 },
  { surah: 78, ayah: 1 },
  { surah: 93, ayah: 1 },
  { surah: 112, ayah: 1 },
  { surah: 114, ayah: 1 },
];

function buildEveryayahUrl(cdn, surah, ayah) {
  const s = String(surah).padStart(3, '0');
  const a = String(ayah).padStart(3, '0');
  return `https://everyayah.com/data/${cdn}/${s}${a}.mp3`;
}

function buildMp3QuranSurahUrl(server, surah) {
  const s = String(surah).padStart(3, '0');
  return `${server}${s}.mp3`;
}

function buildWarshUrl(reciter, surah, ayah) {
  if (reciter.cdnType === 'mp3quran-surah') {
    return buildMp3QuranSurahUrl(reciter.cdn, surah);
  }
  return buildEveryayahUrl(reciter.cdn, surah, ayah);
}

async function check(url) {
  try {
    const head = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(12_000),
    });
    if (head.ok || ![403, 405].includes(head.status)) {
      return { ok: head.ok, status: head.status };
    }

    // A few audio CDNs reject HEAD even though ranged playback works.
    const ranged = await fetch(url, {
      headers: { Range: 'bytes=0-31' },
      signal: AbortSignal.timeout(12_000),
    });
    await ranged.body?.cancel();
    return { ok: ranged.ok, status: ranged.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

function normalizeServerUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

async function fetchOfficialWarshServers() {
  const response = await fetch(MP3QURAN_RECITERS_URL, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`MP3Quran reciters API HTTP ${response.status}`);
  }

  const payload = await response.json();
  const servers = new Map();
  for (const reciter of payload?.reciters || []) {
    for (const moshaf of reciter?.moshaf || []) {
      if (
        OFFICIAL_WARSH_REWAYA_IDS.has(Number(moshaf?.rewaya_id)) &&
        Number(moshaf?.surah_total) === 114
      ) {
        servers.set(normalizeServerUrl(moshaf.server), {
          reciter: reciter.name,
          reading: moshaf.name,
        });
      }
    }
  }
  return servers;
}

(async () => {
  const officialWarshServers = await fetchOfficialWarshServers();
  const metadataFailures = RECITERS.warsh.flatMap((reciter) => {
    if (reciter.verifiedWarsh !== true) {
      return [{ reciter: reciter.id, cdn: reciter.cdn, reason: 'Missing verifiedWarsh flag' }];
    }
    if (
      reciter.cdnType === 'mp3quran-surah' &&
      !officialWarshServers.has(normalizeServerUrl(reciter.cdn))
    ) {
      return [{
        reciter: reciter.id,
        cdn: reciter.cdn,
        reason: 'Not listed as a complete Warsh reading by MP3Quran',
      }];
    }
    if (reciter.cdnType === 'everyayah' && !/^warsh\//i.test(reciter.cdn)) {
      return [{
        reciter: reciter.id,
        cdn: reciter.cdn,
        reason: 'EveryAyah source is outside the Warsh collection',
      }];
    }
    return [];
  });

  const rows = [];
  for (const rec of RECITERS.warsh) {
    for (const s of SAMPLES) {
      const url = buildWarshUrl(rec, s.surah, s.ayah);
      const status = await check(url);
      rows.push({ reciter: rec.id, surah: s.surah, ayah: s.ayah, status: status.status, ok: status.ok, url });
    }
  }

  const failed = rows.filter(r => !r.ok);
  console.log(
    `Warsh audio checks: total=${rows.length}, unavailable=${failed.length}, metadata=${metadataFailures.length}`,
  );
  if (metadataFailures.length > 0) {
    console.table(metadataFailures);
  }
  if (failed.length > 0) {
    console.table(failed.slice(0, 20));
  }
  if (metadataFailures.length > 0 || failed.length > 0) {
    process.exit(1);
  }
  console.log('OK: all sampled URLs are reachable and official MP3Quran metadata confirms Warsh.');
})();
