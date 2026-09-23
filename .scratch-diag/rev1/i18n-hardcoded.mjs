import fs from "node:fs";
import path from "node:path";

const roots = ["src/components", "src/pages"];
const files = [];
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.jsx?$/.test(entry.name)) files.push(p);
  }
};
roots.forEach(walk);

const frWords =
  /\b(le|la|les|un|une|des|du|et|ou|à|de|pour|avec|sur|dans|fermer|ouvrir|choisir|voir|masquer|ajouter|retirer|supprimer|enregistrer|réglages|verset|sourate|page|note|marque-page|chargement|erreur|aucun|aucune|traduction|tafsir|récitation|lecture|hors-ligne|texte|source|copier|partager|taille|police|couleur|sens|précédent|suivant)\b/iu;

const hits = [];
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.includes("t(") && !/["'].*[àéèêîôûç][^"']*["']/iu.test(line)) return;
    const props = [...line.matchAll(/\b(?:title|aria-label|placeholder|alt|label|tooltip)="([^"{}]+)"/g)];
    for (const m of props) if (frWords.test(m[1])) hits.push([file, i + 1, `attr: ${m[1]}`]);
    const text = [...line.matchAll(/>\s*([A-Za-zÀ-ÿ'’ -]{4,})\s*</g)];
    for (const m of text) if (frWords.test(m[1])) hits.push([file, i + 1, `text: ${m[1].trim()}`]);
    const tern = [...line.matchAll(/\?\s*"([^"]{4,})"\s*:\s*"([^"]{4,})"/g)];
    for (const m of tern) {
      if (frWords.test(m[1]) || frWords.test(m[2])) hits.push([file, i + 1, `tern: "${m[1]}" / "${m[2]}"`]);
    }
  });
}
const byFile = new Map();
for (const [f, l, w] of hits) {
  if (!byFile.has(f)) byFile.set(f, []);
  byFile.get(f).push(`${l}: ${w}`);
}
for (const [f, list] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n### ${f} (${list.length})`);
  list.slice(0, 12).forEach((x) => console.log("   ", x));
}
console.log(`\ntotal ${hits.length} candidate strings in ${byFile.size} files`);
