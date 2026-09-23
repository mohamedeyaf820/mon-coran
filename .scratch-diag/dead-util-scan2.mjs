// Scratch v2: literal escaped-selector lookup (handles /opacity modifiers).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

const cssFiles = [];
const walkDist = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); const st = statSync(p); if (st.isDirectory()) walkDist(p); else if (e.endsWith(".css")) cssFiles.push(p); } };
walkDist("dist/assets");
const css = cssFiles.map((f) => readFileSync(f, "latin1")).join("\n");

const esc = (t) => t.replace(/[^a-zA-Z0-9_-]/g, (c) => "\\" + c);
const ruleOf = (t) => {
  const needle = "." + esc(t);
  let i = -1;
  const out = [];
  while ((i = css.indexOf(needle, i + 1)) !== -1) {
    const after = css[i + needle.length];
    if (after !== "{" && after !== "," && after !== ":" && after !== ">") continue;
    const b = css.indexOf("{", i);
    if (b === -1) continue;
    out.push(css.slice(b + 1, css.indexOf("}", b)));
  }
  return out;
};

const NAMES = ["primary", "gold", "emerald", "bg-secondary", "bg-primary", "bg-card", "bg-tertiary", "text-primary", "text-secondary", "text-muted", "border", "accent", "surface", "white", "black"];
const rows = [];
const seen = new Set();
for (const f of walk("src")) {
  const src = readFileSync(f, "latin1");
  const lines = src.split("\n");
  lines.forEach((line, idx) => {
    if (!/class|cn\(/.test(line)) return;
    for (const m of line.matchAll(/(?:^|[\s"'`\\:])(bg|text|border|ring|from|to|fill)-(?:primary|gold|emerald|bg-[a-z]+|text-[a-z]+|border|white|black)(?:\/\d+)?(?=[\s"'`\\])/g)) {
      const t = m[0].trim().replace(/^\\:/, "").replace(/^:/, "");
      const k = `${t}@${f}:${idx + 1}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const decls = ruleOf(t);
      const tw = decls.find((d) => !d.includes("!important"));
      rows.push({ tok: t, at: `${f.replace(/\\/g, "/").replace("src/components/", "")}:${idx + 1}`, kind: tw ? "tailwind" : decls.length ? "hand" : "DEAD", rule: (tw || decls[0] || "").slice(0, 55) });
    }
  });
}
for (const r of rows.filter((r) => r.kind === "DEAD")) console.log(`${r.tok.padEnd(22)} ${r.at}`);
console.log(`DEAD=${rows.filter((r) => r.kind === "DEAD").length} hand=${rows.filter((r) => r.kind === "hand").length} tailwind=${rows.filter((r) => r.kind === "tailwind").length} total=${rows.length}`);
