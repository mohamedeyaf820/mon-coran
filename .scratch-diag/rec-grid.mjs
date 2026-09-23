// scratch: download every reciter portrait and lay them out in one labelled grid so
// a human (or the agent, visually) can check that each image is a real portrait of a
// man and that shared portraits are intentional (same reciter, two riwaya).
import { execFile } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const pexec = promisify(execFile);
const m = await import("../src/data/reciters.js");
const OUT = ".scratch-diag/rec/img";
mkdirSync(OUT, { recursive: true });

const all = [...m.default.hafs.map((r) => ({ ...r, riwaya: "hafs" })), ...m.default.warsh.map((r) => ({ ...r, riwaya: "warsh" }))];
const entries = all
  .map((r) => ({ id: r.id, riwaya: r.riwaya, name: r.name || "", url: m.getReciterPhoto(r) || m.getReciterPhoto(r.id) }))
  .filter((e) => e.url);

const byUrl = new Map();
for (const e of entries) {
  if (!byUrl.has(e.url)) byUrl.set(e.url, []);
  byUrl.get(e.url).push(e);
}
console.log(`${entries.length} entrées, ${byUrl.size} images distinctes`);

let i = 0;
const cells = [];
for (const [url, group] of byUrl) {
  i += 1;
  const file = `${OUT}/${String(i).padStart(2, "0")}-${(url.split("/").pop() || "img").replace(/[^a-z0-9.-]/gi, "_")}`;
  const extOk = /\.(jpe?g|png|webp|gif)$/i.test(file);
  const target = extOk ? file : `${file}.img`;
  let code = "?";
  try {
    const r = await pexec("curl", ["-sS", "-L", "--max-time", "30", "-A", "Mozilla/5.0", "-o", target, "-w", "%{http_code}", url], { maxBuffer: 1e6 });
    code = String(r.stdout);
  } catch (e) {
    code = "ERR";
  }
  let bytes = 0;
  try {
    bytes = readFileSync(target).byteLength;
  } catch {}
  cells.push({
    n: i,
    ids: group.map((g) => g.id).join(" + "),
    riwaya: [...new Set(group.map((g) => g.riwaya))].join("/"),
    url,
    target,
    code,
    kB: Math.round(bytes / 1024),
  });
}

const html = `<!doctype html><meta charset="utf-8"><style>
body{background:#111;color:#eee;font:12px/1.3 system-ui;margin:12px}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
.cell{background:#1c1c1c;padding:5px;border:1px solid #333}
img{width:100%;height:88px;object-fit:cover;background:#000;display:block}
.id{font-weight:700;word-break:break-all}
.meta{opacity:.7}
.big{color:#ff8;padding:8px 0;font-size:16px;font-weight:700}
</style><body><div class="grid">${cells
  .map(
    (c) => `<div class="cell"><img src="file:///${process.cwd().replace(/\\/g, "/")}/${c.target}" alt=""><div class="id">#${c.n} ${c.kB}kB ${c.code}</div><div class="meta">${c.ids}<br>${c.riwaya}<br>${c.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 44)}</div></div>`,
  )
  .join("")}</div></body>`;
writeFileSync(".scratch-diag/rec/grid.html", html, "utf8");
const dupes = cells.filter((c) => c.ids.includes(" + "));
console.log("portraits partagés:", dupes.map((d) => `#${d.n} ${d.ids}`).join(" | ") || "aucun");
console.log("fichiers lourds (>60kB):", cells.filter((c) => c.kB > 60).map((c) => `#${c.n} ${c.kB}kB`).join(" ") || "aucun");

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1180, height: 900 } });
await p.goto("file:///" + process.cwd().replace(/\\/g, "/") + "/.scratch-diag/rec/grid.html");
await p.waitForTimeout(1200);
await p.screenshot({ path: ".scratch-diag/rec/grid.png", fullPage: true });
await b.close();
console.log("grid.png écrit");
