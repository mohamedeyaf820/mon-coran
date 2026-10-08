/**
 * The invocations hub keeps its copy in src/i18n/duasHub.js (loaded with the Duas page,
 * not with the app entry), so the generic locale-parity test does not see it.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import duasHub from "../src/i18n/duasHub.js";
import { hubText } from "../src/utils/duasHubText.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flatten = (locale) => Object.keys(locale).sort();
const placeholders = (value) => [...String(typeof value === "object" ? value.other : value).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("French, English and Arabic expose exactly the same hub keys", () => {
  assert.deepEqual(flatten(duasHub.en), flatten(duasHub.fr));
  assert.deepEqual(flatten(duasHub.ar), flatten(duasHub.fr));
});

test("every hub string is filled, and a translation keeps the placeholders of the French text", () => {
  for (const lang of ["fr", "en", "ar"]) {
    for (const [key, value] of Object.entries(duasHub[lang])) {
      const texts = typeof value === "object" ? Object.values(value) : [value];
      for (const text of texts) assert.ok(String(text).trim(), `${lang}.${key} is empty`);
      if (typeof value === "object") assert.ok(value.other, `${lang}.${key} has an "other" plural form`);
      assert.deepEqual(placeholders(value), placeholders(duasHub.fr[key]), `${lang}.${key} placeholders`);
    }
  }
});

test("Arabic plural forms follow the Arabic count rules", () => {
  assert.equal(hubText("itemsCount", "ar", 1), "دعاء واحد");
  assert.equal(hubText("itemsCount", "ar", 2), "دعاءان");
  assert.equal(hubText("itemsCount", "ar", 5), "5 أدعية");
  assert.equal(hubText("itemsCount", "ar", 24), "24 دعاءً");
  assert.equal(hubText("itemsCount", "ar", 100), "100 دعاء");
  assert.equal(hubText("itemsCount", "fr", 1), "1 invocation");
  assert.equal(hubText("itemsCount", "fr", 24), "24 invocations");
  assert.equal(hubText("itemsCount", "en", 1), "1 supplication");
});

test("placeholders are filled, unknown ones are left visible, unknown keys fall back to the key", () => {
  assert.equal(
    hubText("hisnMeta", "fr", undefined, { chapters: 132, items: 267 }),
    "132 chapitres · 267 invocations",
  );
  assert.equal(hubText("repeat", "en", 3), "Repeat 3 times");
  assert.equal(hubText("openHadith", "fr", undefined, { name: "Sahih Muslim" }), "Ouvrir Sahih Muslim, hadith {number}, sur sunnah.com");
  assert.equal(hubText("doesNotExist", "fr"), "doesNotExist");
  assert.equal(hubText("title", "xx"), duasHub.fr.title, "an unknown language falls back to French");
});

test("the Duas page code only asks for hub keys that exist", () => {
  const dir = path.join(ROOT, "src/components");
  const files = [path.join(dir, "DuasPage.jsx")];
  for (const entry of fs.readdirSync(path.join(dir, "duas"))) {
    if (/\.jsx?$/.test(entry)) files.push(path.join(dir, "duas", entry));
  }
  const used = new Set();
  for (const file of files) {
    for (const match of fs.readFileSync(file, "utf8").matchAll(/hubText\(\s*"(\w+)"/g)) used.add(match[1]);
    // Keys held in data (the quick-access list) are named by `label: "quickSleep"`.
    for (const match of fs.readFileSync(file, "utf8").matchAll(/label:\s*"(\w+)"/g)) used.add(match[1]);
  }
  assert.ok(used.size > 20, "the scan found the keys used by the page");
  const unknown = [...used].filter((key) => !(key in duasHub.fr));
  assert.deepEqual(unknown, [], "hub keys used in the code but missing from duasHub.js");
});

test("copy that was removed from the page is removed from the dictionary too", () => {
  const dir = path.join(ROOT, "src/components");
  const source = [path.join(dir, "DuasPage.jsx"), ...fs.readdirSync(path.join(dir, "duas")).map((f) => path.join(dir, "duas", f))]
    .filter((file) => /\.jsx?$/.test(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  const orphans = Object.keys(duasHub.fr).filter((key) => !source.includes(`"${key}"`));
  assert.deepEqual(orphans, [], "dictionary keys the page never reads");
});
