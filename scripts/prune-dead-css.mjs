// Removes CSS rules that can never match: every selector of the rule needs a
// class that no source, data file, script or built bundle mentions anywhere.
// PurgeCSS already drops those rules from the shipped sheets, so this changes
// nothing the user receives (compare the hashes of dist/assets/*.css before
// and after a build); it keeps the source tree, the editor and the dev server
// from carrying hundreds of kilobytes of styles for markup that is gone.
//
// Deliberately conservative:
//  - the class is looked up as a plain substring, so a name built in a template
//    string is kept as soon as any part of it appears as a literal;
//  - the families the purge safelists (composed class names) are never touched;
//  - selectors with escapes, attribute selectors and nesting are kept.
// Needs a built dist/ (the bundled libraries bring their own class names).
// Usage: node scripts/prune-dead-css.mjs [--write]
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const WRITE = process.argv.includes("--write");
const root = process.cwd();

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".git"].includes(entry.name)) walk(full, out);
    } else out.push(full);
  }
  return out;
};

if (!fs.existsSync(path.join(root, "dist/assets"))) {
  console.error("dist/assets is missing: run `npm run build` first.");
  process.exit(1);
}

const corpusFiles = [
  ...walk(path.join(root, "src")).filter((f) => /\.(jsx?|mjs|html|json)$/.test(f)),
  ...walk(path.join(root, "public")).filter((f) => /\.(json|html|svg)$/.test(f)),
  ...walk(path.join(root, "scripts")).filter((f) => /\.mjs$/.test(f)),
  ...walk(path.join(root, "dist/assets")).filter((f) => /\.js$/.test(f)),
  path.join(root, "index.html"),
  path.join(root, "site.config.json"),
].filter((f) => fs.existsSync(f));
const corpus = corpusFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");

// Class families composed at run time (kept in sync with cssPurgeConfig.mjs).
const COMPOSED = [/^app-mode-/, /^qcm-/, /^quran-display--/, /^qcom-list-study/, /^qc-list-card__study$/, /^tajwid-/];

// Drops :not(...), :is(...), :where(...) and :has(...) with their (possibly
// nested) arguments: a class inside them does not decide whether the rule can match.
function stripFunctional(selector) {
  let out = "";
  for (let i = 0; i < selector.length; i += 1) {
    const rest = selector.slice(i);
    const open = /^:(?:not|is|where|has|matches)\(/.exec(rest);
    if (!open) {
      out += selector[i];
      continue;
    }
    let depth = 1;
    let j = i + open[0].length;
    while (j < selector.length && depth > 0) {
      if (selector[j] === "(") depth += 1;
      else if (selector[j] === ")") depth -= 1;
      j += 1;
    }
    i = j - 1;
  }
  return out;
}

const classesOf = (selector) =>
  [...stripFunctional(selector).matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]);

const isDead = (selector) => {
  if (/[\\[&]/.test(selector)) return false;
  const classes = classesOf(selector);
  if (!classes.length) return false;
  return classes.some((name) => !COMPOSED.some((re) => re.test(name)) && !corpus.includes(name));
};

const sheets = walk(path.join(root, "src/styles")).filter((f) => f.endsWith(".css"));
let removedBytes = 0;
let removedRules = 0;
const perFile = [];

for (const file of sheets) {
  const css = fs.readFileSync(file, "utf8");
  const ast = postcss.parse(css);
  let fileBytes = 0;

  ast.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name)) return;
    if (rule.parent?.type === "rule") return;
    const selectors = rule.selectors || [];
    if (!selectors.length || !selectors.every(isDead)) return;
    fileBytes += rule.toString().length;
    removedRules += 1;
    rule.remove();
  });

  // Leave no empty @media / @supports / @layer shell behind.
  let again = true;
  while (again) {
    again = false;
    ast.walkAtRules((atRule) => {
      if (/^(media|supports|layer|container)$/i.test(atRule.name) && atRule.nodes && atRule.nodes.length === 0) {
        atRule.remove();
        again = true;
      }
    });
  }

  if (fileBytes) {
    perFile.push([path.relative(root, file), fileBytes]);
    removedBytes += fileBytes;
    if (WRITE) fs.writeFileSync(file, ast.toString());
  }
}

perFile.sort((a, b) => b[1] - a[1]);
for (const [name, bytes] of perFile.slice(0, 20)) {
  console.log(`${(bytes / 1024).toFixed(1).padStart(7)} kB  ${name}`);
}
console.log(`${WRITE ? "removed" : "would remove"} ${removedRules} rules, ${(removedBytes / 1024).toFixed(1)} kB of source CSS`);
