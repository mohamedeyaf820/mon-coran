const B = "https://quranpedia.net";
async function sample(path) {
  try {
    const r = await fetch(B + path, { headers: { Range: "bytes=0-400" } });
    const t = await r.text();
    console.log(r.status, path, "=>", t.slice(0, 380).replace(/\s+/g, " "));
    console.log("---");
  } catch (e) { console.log("ERR", path, e.message); }
}
for (const p of [
  "/translation-books/13661.json",
  "/translation-books/13604.json",
  "/translation-books/2005.json",
  "/translation-books/27824.json",
  "/translation-books/1949.json",
]) await sample(p);
