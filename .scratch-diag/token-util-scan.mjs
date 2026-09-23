// Scratch: list token-colour utility classes used in src and whether the
// production CSS actually defines them. Not for commit.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx|js)$/.test(e) && !p.includes("node_modules")) out.push(p);
  }
  return out;
};

const NAMES = ["primary", "gold", "emerald", "bg-secondary", "bg-primary", "bg-card", "bg-tertiary", "text-primary", "text-secondary", "text-muted", "border", "accent", "surface"];
const cls = new Map();
for (const f of walk("src")) {
  const src = readFileSync(f, "latin1");
  for (const m of src.matchAll(/(?:^|[\s"'`])(bg|text|border|ring|from|to)-([a-z-]*[a-z])(?=[\s"'`/]|\\)/gm)) {
    const full = `${m[1]}-${m[2]}`;
    if (!NAMES.includes(m[2])) continue;
    if (!cls.has(full)) cls.set(full, new Set());
    cls.get(full).add(f.replace(/\\/g, "/"));
  }
}

const cssFiles = [];
const walkDist = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) walkDist(p); else if (e.endsWith(".css")) cssFiles.push(p); } };
try { walkDist("dist/assets"); } catch { console.log("no dist"); }
const css = cssFiles.map((f) => readFileSync(f, "latin1")).join("\n");

const rows = [];
for (const [c, files] of [...cls].sort()) {
  const esc = c.replace(/[/[()]/g, (ch) => "\\" + ch);
  const re = new RegExp(`\\.${esc}\\{([^}]*)\\}`, "g");
  const decls = [...css.matchAll(re)].map((m) => m[1].slice(0, 70));
  const tw = decls.find((d) => !d.includes("!important"));
  rows.push({ c, uses: files.size, tailwind: tw ? "YES" : "no", hand: decls.filter((d) => d.includes("!important")).length, sample: tw || decls[0] || "ABSENT" });
}
console.table(rows);
