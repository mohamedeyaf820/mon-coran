// scratch: verify remote reciter assets with curl (Node fetch is blocked in this env).
// Reports status, content-type and bytes for every URL passed on argv (one per line on
// stdin) or, with no args, every photo URL in RECITER_PHOTOS_MAP + every bioSource URL.
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";

const pexec = promisify(execFile);
const m = await import("../src/data/reciters.js");

const check = async (url) => {
  try {
    const { stdout } = await pexec(
      "curl",
      ["-sS", "-L", "--max-time", "25", "-A", "Mozilla/5.0 (MushafPlus asset audit)", "-o", process.platform === "win32" ? "NUL" : "/dev/null",
       "-w", "%{http_code}\t%{content_type}\t%{size_download}\t%{url_effective}", url],
      { maxBuffer: 1e6 },
    );
    const [status, type, bytes, finalUrl] = stdout.split("\t");
    return { url, status: Number(status), type, bytes: Number(bytes), finalUrl };
  } catch (e) {
    return { url, status: 0, type: "curl-error", bytes: 0, finalUrl: "" };
  }
};

let targets = [];
if (process.argv[2]) {
  const list = readFileSync(process.argv[2], "utf8").split(/\r?\n/).filter(Boolean);
  targets = list.map((l) => {
    const [url, label] = l.split(/\s+/);
    return { url, label: label || "" };
  });
} else {
  const profiles = JSON.parse(readFileSync("public/data/reciter-profiles.json", "utf8"));
  targets = Object.entries(m.RECITER_PHOTOS_MAP).map(([id, url]) => ({ url, label: id }));
  for (const [id, p] of Object.entries(profiles)) {
    if (p?.bioSource?.url) targets.push({ url: p.bioSource.url, label: `${id} (bio)` });
  }
}

const out = [];
for (let i = 0; i < targets.length; i += 8) {
  const batch = await Promise.all(targets.slice(i, i + 8).map((t) => check(t.url)));
  batch.forEach((r, j) => out.push({ ...r, label: targets[i + j].label }));
}

const rows = out.map((r) => ({
  label: r.label,
  code: r.status,
  kind: /^image\//.test(r.type) ? "img" : /^application\/json/.test(r.type) ? "json" : /^text\/html/.test(r.type) ? "html" : r.type.slice(0, 12),
  kB: Math.round(r.bytes / 1024),
  host: r.url.split("/")[2],
  url: r.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60),
}));
console.table(rows);
const failing = out.filter((r) => r.status >= 400 || r.status === 0 || (r.bytes && r.bytes < 2000));
console.log(`\n${out.length} URL · ${failing.length} en échec ou trop petite :`);
for (const f of failing) console.log(` ${f.status} ${f.type} ${Math.round(f.bytes / 1024)}kB  ${f.label}  ${f.url}`);
