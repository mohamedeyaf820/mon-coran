// Scratch: enumerate token-colour utility tokens used in src and report whether
// the production CSS defines that exact selector. Not for commit.
import { readFileSync, readdirSync, statSync, rmSync } from "node:fs";
import { join } from "node:path";

const TOKEN = /^(?:(?:hover|focus|focus-visible|active|disabled|group-hover|peer-focus|md|sm|lg|xl|dark|rtl|ltr|print|aria-selected|data-\w+)\\?:)*((?:bg|text|border|ring|from|via|to|fill|stroke|outline|decoration|shadow|divide|placeholder|caret|accent)-(?:primary|secondary|gold|emerald|amber|bg-[a-z]+|text-[a-z]+|border|card|surface|accent)(?:\/\d+)?)$/;

const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    if (e === "node_modules") continue;
    const p = join(d, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(jsx|js)$/.test(e)) out.push(p);
  }
  return out;
};

const hits = new Map(); // token -> Set(file)
for (const f of walk("src")) {
  const src = readFileSync(f, "latin1");
  for (const line of src.split("\n")) {
    if (!/className|class=|cn\(/.test(line) && !/["'`]/.test(line)) continue;
    for (const m of line.matchAll(/["'`\s]([\w\\:./-]+)["'`\s]/g)) {
      const t = m[1];
      if (!TOKEN.test(t)) continue;
      if (!hits.has(t)) hits.set(t, new Set());
      hits.get(t).add(f.replace(/\\/g, "/"));
    }
  }
}

const cssFiles = [];
const walkDist = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); const st = statSync(p); if (st.isDirectory()) walkDist(p); else if (e.endsWith(".css")) cssFiles.push(p); } };
walkDist("dist/assets");
const css = cssFiles.map((f) => readFileSync(f, "latin1")).join("\n");

const escapeSel = (t) => t.replace(/[/(){}\[\].,:%]/g, (c) => "\\" + c).replace(/\\/g, "\\");
const rows = [];
for (const [t, files] of [...hits].sort()) {
  const base = t.replace(/^(?:hover|focus|focus-visible|active|disabled|md|sm|lg|xl)\\?:/, "");
  const esc = base.replace(/[.:/\[\]()%]/g, (c) => "\\" + c);
  const re = new RegExp(`\\.${esc}\\s*\\{([^}]*)\\}`, "g");
  const decls = [...css.matchAll(re)].map((m) => m[1]);
  rows.push({ token: t, files: files.size, defined: decls.length ? "yes" : "DEAD", rule: decls[0] ? decls[0].slice(0, 60) : "" });
}
console.log(JSON.stringify(rows.filter((r) => r.defined === "DEAD"), null, 1));
console.log(`dead=${rows.filter((r) => r.defined === "DEAD").length} total=${rows.length}`);
