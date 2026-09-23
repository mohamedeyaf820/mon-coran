import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { t } from "../src/i18n/index.js";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "i18n") continue;
      yield* walk(full);
    } else if (/\.jsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

// Matches t("ns.key", ...) / t('ns.key', ...) with a static string literal.
const CALL_PATTERN = /\bt\(\s*["']([a-zA-Z][\w]*(?:\.[\w]+)+)["']/g;

const usedKeys = new Map();
for (const file of walk(SRC)) {
  const source = fs.readFileSync(file, "utf8");
  for (const [, key] of source.matchAll(CALL_PATTERN)) {
    if (!usedKeys.has(key)) usedKeys.set(key, file);
  }
}

test(`every static t() key in src/ resolves in fr, en and ar (${usedKeys.size} keys)`, () => {
  assert.ok(usedKeys.size > 100, "the scan should find the bulk of translated strings");
  const missing = [];
  for (const [key, file] of usedKeys) {
    for (const lang of ["fr", "en", "ar"]) {
      const value = t(key, lang);
      if (value === key || value === undefined || !String(value).trim()) {
        missing.push(`${key} (${lang}) — first used in ${path.relative(process.cwd(), file)}`);
      }
    }
  }
  assert.deepEqual(missing, [], "unresolved translation keys must be added to all dictionaries");
});
