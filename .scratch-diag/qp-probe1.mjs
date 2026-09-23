const B = "https://api.quranpedia.net/v1";
const out = {};
async function get(p) {
  try {
    const r = await fetch(B + p, { headers: { "user-agent": "MushafPlus/1.0 (research)" } });
    const t = await r.text();
    try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, text: t.slice(0, 120) }; }
  } catch (e) { return { error: String(e).slice(0, 100) }; }
}
// 1. translation books FR / EN (retry a few times: 5xx flaky)
async function retry(p, n = 4) {
  for (let i = 0; i < n; i++) {
    const r = await get(p);
    if (r.json) return r;
    await new Promise((s) => setTimeout(s, 1500));
  }
  return { failed: true };
}
const fr = await retry("/translation-books/fr");
const en = await retry("/translation-books/en");
out.fr_books = (fr.json || []).map((b) => ({ id: b.id, name: b.name, short: b.short_name }));
out.en_books = (en.json || []).map((b) => ({ id: b.id, name: b.name, short: b.short_name }));
// 2. reciters: dump one entry fully to learn the shape
const rec = await retry("/reciters");
const arr = rec.json?.reciters || rec.json?.data || rec.json || [];
out.reciters_count = Array.isArray(arr) ? arr.length : typeof arr;
out.reciter_sample = Array.isArray(arr) ? arr[0] : null;
out.reciter_keys = Array.isArray(arr) && arr[0] ? Object.keys(arr[0]) : null;
// 3. surah tafsirs + books categories
out.surah_tafsirs_1 = (await retry("/surah/tafsirs/1")).json;
out.categories = (await retry("/categories/books")).json;
console.log(JSON.stringify(out, null, 1).slice(0, 6000));
