import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const VITE_MANIFEST_PATH = path.join(DIST_DIR, ".vite", "manifest.json");
const OUTPUT_PATH = path.join(DIST_DIR, "shell-assets.json");
const SHELL_ENTRIES = [
  "index.html",
  "src/components/Header.jsx",
  "src/components/HomePage.jsx",
];

const manifest = JSON.parse(await readFile(VITE_MANIFEST_PATH, "utf8"));
const visited = new Set();
const files = new Set();

function collectStaticFiles(key) {
  if (visited.has(key)) return;
  const entry = manifest[key];
  if (!entry) {
    throw new Error(`[shell-manifest] Missing Vite manifest entry: ${key}`);
  }

  visited.add(key);
  if (entry.file) files.add(`/${entry.file}`);
  for (const cssFile of entry.css || []) files.add(`/${cssFile}`);
  for (const importedKey of entry.imports || []) collectStaticFiles(importedKey);
}

for (const entryKey of SHELL_ENTRIES) collectStaticFiles(entryKey);

const shellAssets = [...files].sort();
await writeFile(OUTPUT_PATH, `${JSON.stringify(shellAssets, null, 2)}\n`, "utf8");
console.log(`[shell-manifest] Wrote ${shellAssets.length} app-shell assets.`);
