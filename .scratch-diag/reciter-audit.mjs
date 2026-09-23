// scratch: audit reciter imagery + biography coverage, and verify every remote
// asset actually resolves. Run: node .scratch-diag/reciter-audit.mjs [--check]
import { readFileSync } from "node:fs";

const m = await import("../src/data/reciters.js");
const profiles = JSON.parse(readFileSync("public/data/reciter-profiles.json", "utf8"));

const all = [
  ...m.default.hafs.map((r) => ({ ...r, riwaya: "hafs" })),
  ...m.default.warsh.map((r) => ({ ...r, riwaya: "warsh" })),
];

const rows = all.map((r) => {
  const photo = m.getReciterPhoto(r) || m.getReciterPhoto(r.id) || null;
  const bio = m.getReciterBio?.(r) ?? profiles[r.id]?.bio ?? null;
  const prof = profiles[r.id];
  return {
    id: r.id,
    riwaya: r.riwaya,
    name: (r.name || r.transliteration || "").slice(0, 28),
    photo: photo ? photo.replace(/^https?:\/\/(www\.)?/, "").slice(0, 58) : "—",
    photoHost: photo ? new URL(photo).host : "—",
    bio: prof?.bio ? ["fr", "en", "ar"].filter((l) => prof.bio[l]).join("/") : "—",
    bioProvider: prof?.bioSource?.provider || "—",
    bioSource: prof?.bioSource?.url || m.getReciterProfileSource?.(r)?.url || "—",
    reviewed: prof?.reviewedAt || "—",
  };
});

const uniq = (k) => [...new Set(rows.map((x) => x[k]).filter((v) => v && v !== "—"))];
console.log(`reciters: ${all.length} (hafs ${m.default.hafs.length}, warsh ${m.default.warsh.length})`);
console.log(`with photo: ${rows.filter((x) => x.photo !== "—").length}  without: ${rows.filter((x) => x.photo === "—").length}`);
console.log(`with bio:   ${rows.filter((x) => x.bio !== "—").length}  without: ${rows.filter((x) => x.bio === "—").length}`);
console.log(`bio providers: ${JSON.stringify(rows.reduce((a, x) => ((a[x.bioProvider] = (a[x.bioProvider] || 0) + 1), a), {}))}`);
console.log(`photo hosts: ${JSON.stringify(rows.reduce((a, x) => ((a[x.photoHost] = (a[x.photoHost] || 0) + 1), a), {}))}`);
console.log(`profile keys with no reciter: ${Object.keys(profiles).filter((k) => !all.some((r) => r.id === k)).join(", ") || "none"}`);
console.log("\n--- sans photo ---");
for (const r of rows.filter((x) => x.photo === "—")) console.log(` ${r.id} [${r.riwaya}] ${r.name}  bio:${r.bio}`);
console.log("\n--- sans bio ---");
for (const r of rows.filter((x) => x.bio === "—")) console.log(` ${r.id} [${r.riwaya}] ${r.name}  photo:${r.photo}`);

if (process.argv.includes("--check")) {
  const urls = [...new Set([...uniq("photo"), ...uniq("bioSource")].filter((u) => u.startsWith("http")))];
  const photoOf = new Map(rows.map((r) => [r.photo.startsWith("http") ? r.photo : (m.getReciterPhoto(r.id) || ""), r.id]).filter(([u]) => u.startsWith("http")));
  const check = async (url) => {
    for (const method of ["HEAD", "GET"]) {
      try {
        const res = await fetch(url, { method, headers: { "user-agent": "Mozilla/5.0 (MushafPlus asset audit)" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
        if (method === "GET") {
          const buf = await res.arrayBuffer();
          return { url, status: res.status, type: res.headers.get("content-type"), bytes: buf.byteLength, finalUrl: res.url };
        }
        if (res.ok) return { url, status: res.status, type: res.headers.get("content-type"), bytes: Number(res.headers.get("content-length") || 0), finalUrl: res.url };
      } catch (e) {
        if (method === "GET") return { url, status: 0, type: "ERR " + e.name, bytes: 0, finalUrl: "" };
      }
    }
    return { url, status: 0, type: "ERR", bytes: 0, finalUrl: "" };
  };
  const out = [];
  for (let i = 0; i < urls.length; i += 8) {
    const batch = await Promise.all(urls.slice(i, i + 8).map(check));
    out.push(...batch);
    process.stdout.write(".");
  }
  console.log("\n");
  console.table(
    out.map((o) => ({
      kind: o.url.includes("/images/reciters/") || /\.(jpe?g|png|webp)/i.test(o.url) ? "photo" : "profile",
      for: photoOf.get(o.url) || "",
      status: o.status,
      type: (o.type || "").slice(0, 20),
      kB: Math.round(o.bytes / 1024),
      url: o.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 62),
    })),
  );
  const bad = out.filter((o) => o.status >= 400 || o.status === 0 || o.bytes < 1500);
  console.log(bad.length ? `\n!!! ${bad.length} assets en échec:\n` + bad.map((b) => ` ${b.status} ${b.type} ${b.url}`).join("\n") : "\nTous les assets répondent.");
}
