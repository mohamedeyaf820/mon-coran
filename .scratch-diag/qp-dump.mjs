const URLS = [
  "https://quranpedia.net/translation-books/1949.json",
  "https://quranpedia.net/translation-books/13661.json",
  "https://quranpedia.net/translation-books/13604.json",
  "https://quranpedia.net/translation-books/13605.json",
  "https://quranpedia.net/book/2005.json",
  "https://quranpedia.net/translation-books/2005.json",
  "https://quranpedia.net/book/27824.json",
  "https://quranpedia.net/translation-books/27824.json",
  "https://quranpedia.net/translation-books/13640.json",
];
for (const u of URLS) {
  try {
    let r = await fetch(u, { method: "HEAD", headers: { "user-agent": "MushafPlus/1.0" } });
    const ct = r.headers.get("content-type");
    const cl = r.headers.get("content-length");
    if (!r.ok) { console.log(r.status, u, "|", ct, "|", cl); continue; }
    console.log(r.status, u, "|", ct, "|", cl);
    if (String(ct).includes("html")) {
      // HEAD may be answered by the SPA shell; confirm the JSON route exists via Range GET
      const g = await fetch(u, { headers: { "user-agent": "MushafPlus/1.0", Range: "bytes=0-200" } });
      const t = await g.text();
      console.log("   sample:", g.status, t.slice(0, 160).replace(/\s+/g, " "));
    }
  } catch (e) { console.log("ERR", u, e.message); }
}
