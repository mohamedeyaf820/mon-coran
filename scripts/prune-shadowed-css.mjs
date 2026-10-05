// Removes CSS declarations that can never apply: a declaration in an earlier
// rule is dead when, within the same stylesheet group and the same at-rule
// context, every selector of that rule is declared again later with the same
// property (and the later one is !important, or the earlier one is not).
// Identical selector = identical specificity, so the later declaration always
// wins; nothing about the rendered result changes. Groups are the cascades that
// ship together (critical entry, deferred layer, reader, recitation): across
// groups the earlier sheet applies until the later one loads, so those pairs
// are left alone. Usage: node scripts/prune-shadowed-css.mjs [--write]
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const WRITE = process.argv.includes("--write");
const root = path.resolve("src");

const importsOf = (file) => {
  const dir = path.dirname(file);
  return [...fs.readFileSync(file, "utf8").matchAll(/import\s+["'](\.[^"']+\.css)["']/g)]
    .map((m) => path.resolve(dir, m[1]));
};
const GROUPS = {
  critical: importsOf(path.join(root, "main.jsx")),
  deferred: importsOf(path.join(root, "styles/deferredStyles.js")),
  reader: importsOf(path.join(root, "styles/readerStyles.js")),
  recitation: importsOf(path.join(root, "styles/recitationStyles.js")),
};

const contextOf = (node) => {
  const parts = [];
  for (let p = node.parent; p && p.type !== "root"; p = p.parent) {
    if (p.type === "atrule") parts.unshift(`@${p.name} ${p.params}`);
    else if (p.type === "rule") parts.unshift(p.selector);
  }
  return parts.join(" | ");
};
// A later declaration the browser may reject at parse time leaves the earlier
// one as the fallback: keep those pairs.
const PROGRESSIVE = /color-mix|\d*(?:[sld]vh|[sld]vw|dvi|dvb)|env\(|clamp\(|min\(|max\(|round\(|light-dark|oklch|oklab|lab\(|lch\(|anchor|subgrid|@container|cqw|cqh|calc-size|field-sizing/i;
const normalise = (selector) => selector.replace(/\s+/g, " ").replace(/\s*([>+~,])\s*/g, "$1").trim();

let removedTotal = 0;
for (const [group, files] of Object.entries(GROUPS)) {
  const parsed = files.filter((f) => fs.existsSync(f)).map((file) => ({ file, root: postcss.parse(fs.readFileSync(file, "utf8"), { from: file }) }));
  // Later declarations, keyed by context|selector|property -> strongest importance.
  const later = new Map();
  const edits = [];
  for (const { file, root: tree } of [...parsed].reverse()) {
    const rules = [];
    tree.walkRules((rule) => {
      if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name)) return;
      rules.push(rule);
    });
    for (const rule of rules.reverse()) {
      const context = contextOf(rule);
      const selectors = rule.selectors.map(normalise);
      const decls = [];
      rule.each((node) => { if (node.type === "decl") decls.push(node); });
      for (const decl of [...decls].reverse()) {
        const prop = decl.prop.toLowerCase();
        const shadowed = selectors.every((selector) => {
          const winner = later.get(`${context}|${selector}|${prop}`);
          return winner !== undefined && !winner.fallback && (winner.important || !decl.important);
        });
        if (shadowed) edits.push({ file, decl, rule });
      }
      // Register this rule's declarations for the rules above it. The first
      // registration (the last in cascade order) is the one that wins.
      for (const decl of decls) {
        const prop = decl.prop.toLowerCase();
        for (const selector of selectors) {
          const key = `${context}|${selector}|${prop}`;
          const previous = later.get(key);
          // Keep the winner (the last declaration in cascade order); an
          // !important winner keeps beating everything below it.
          if (previous === undefined) later.set(key, { important: decl.important, fallback: PROGRESSIVE.test(decl.value) });
        }
      }
    }
  }
  const byFile = new Map();
  for (const edit of edits) byFile.set(edit.file, (byFile.get(edit.file) || 0) + 1);
  console.log(`[${group}] ${edits.length} dead declarations`);
  if (process.env.SAMPLE) for (const e of edits.filter((x) => process.env.SAMPLE === "1" || x.file.endsWith(process.env.SAMPLE)).slice(0, 8)) console.log("   e.g.", path.relative(root, e.file), e.decl.source?.start?.line, JSON.stringify(e.rule.selector.slice(0, 60)), e.decl.prop + ":" + e.decl.value.slice(0, 40));
  for (const [file, count] of [...byFile].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`   ${count}\t${path.relative(root, file)}`);
  removedTotal += edits.length;
  if (WRITE) {
    for (const edit of edits) edit.decl.remove();
    for (const { file, root: tree } of parsed) {
      tree.walkRules((rule) => { if (!rule.nodes?.length) rule.remove(); });
      const original = fs.readFileSync(file, "utf8");
      const crlf = original.includes("\r\n");
      let out = tree.toString();
      if (crlf && !out.includes("\r\n")) out = out.replace(/\n/g, "\r\n");
      if (out !== original) fs.writeFileSync(file, out);
    }
  }
}
console.log(`${WRITE ? "removed" : "would remove"} ${removedTotal} declarations`);
