// Counts, per Arabic tafsir served by Quran.com, the verses that cite a reading
// of Nafi' (the reader Warsh and Qalun transmit), Warsh/Qalun by name, the readers
// of Madinah, or any reading at all. "نافع" also means "useful", so a bare word
// count is wrong (it gave Al-Saadi 241 verses); only a reading verb next to the
// name, or a reader list, counts.
// Usage: node scripts/audit-tafsir-qiraat.mjs [resourceId ...]   (default: 90 15 94 14 93 16 91)
// Result: docs/TAFSIR_WARSH_QIRAAT.md. Takes ~4 minutes per tafsir (114 chapters).
const TAFSIRS = { 90: "Al-Qurtubi", 15: "Al-Tabari", 94: "Al-Baghawi", 14: "Ibn Kathir (ar)", 93: "Al-Wasit", 16: "Al-Muyassar", 91: "Al-Saadi" };
const READ = "(?:قرأ|قرأه|قرأها|قراءة|وقرأ|قرئ|وقرئ|قرءوا|وقرءوا|قرأت)";
const NAFI = new RegExp(`${READ}[^.\\n]{0,80}?نافع|نافع[^.\\n]{0,40}?(?:وابن|وأبو|وعاصم|وحمزة|والكسائي|ويعقوب|وخلف|وقالون|وورش|وأهل)|(?:ورش|قالون)\\s+عن\\s+نافع|رواية\\s+(?:ورش|قالون)`);
const WARSH_QALUN = new RegExp(`${READ}[^.\\n]{0,60}?(?:ورش|قالون)|(?:ورش|قالون)\\s+عن\\s+نافع|رواية\\s+(?:ورش|قالون)`);
const MADINAH = new RegExp(`${READ}[^.\\n]{0,60}?(?:أهل المدينة|المدنيان|الحجاز)|(?:أهل المدينة|المدنيان)[^.\\n]{0,40}?${READ}`);
const ANY = new RegExp(READ);

async function chapter(id, number) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(`https://api.quran.com/api/v4/tafsirs/${id}/by_chapter/${number}?per_page=300`);
      if (response.ok) return (await response.json()).tafsirs;
    } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
  }
  return null;
}

const ids = process.argv.slice(2).map(Number).filter(Boolean);
for (const id of ids.length ? ids : Object.keys(TAFSIRS).map(Number)) {
  const stats = { verses: 0, nafi: 0, warshQalun: 0, madinah: 0, anyReading: 0, failed: [] };
  for (let number = 1; number <= 114; number += 1) {
    const rows = await chapter(id, number);
    if (!rows) { stats.failed.push(number); continue; }
    for (const row of rows) {
      const text = row.text.replace(/<[^>]+>/g, " ");
      stats.verses += 1;
      if (NAFI.test(text)) stats.nafi += 1;
      if (WARSH_QALUN.test(text)) stats.warshQalun += 1;
      if (MADINAH.test(text)) stats.madinah += 1;
      if (ANY.test(text)) stats.anyReading += 1;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  console.log(TAFSIRS[id] || id, JSON.stringify(stats));
}
