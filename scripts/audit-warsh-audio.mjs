import RECITERS from '../src/data/reciters.js';

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
    const r = await fetch(url, { method: 'HEAD' });
    return { ok: r.ok, status: r.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

(async () => {
  const rows = [];
  for (const rec of RECITERS.warsh) {
    for (const s of SAMPLES) {
      const url = buildWarshUrl(rec, s.surah, s.ayah);
      const status = await check(url);
      rows.push({ reciter: rec.id, surah: s.surah, ayah: s.ayah, status: status.status, ok: status.ok, url });
    }
  }

  const failed = rows.filter(r => !r.ok);
  const warned = rows.filter(r => {
    const reciter = RECITERS.warsh.find(rec => rec.id === r.reciter);
    return !reciter?.verifiedWarsh;
  });

  console.log(`Warsh audio URL checks: total=${rows.length}, failed=${failed.length}`);
  if (warned.length > 0) {
    console.log(`Warning: ${warned.length} URLs do not include 'warsh' in path.`);
  }
  if (failed.length > 0) {
    console.table(failed.slice(0, 20));
    process.exit(1);
  }
  console.log('OK: all sampled Warsh URLs are reachable.');
})();
