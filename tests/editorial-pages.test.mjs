import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("editorial hub exposes the five published destinations and real actions", async () => {
  const [page, footer] = await Promise.all([
    read("src/components/LegalPage.jsx"),
    read("src/components/Footer.jsx"),
  ]);

  for (const route of ["surahs", "about", "privacy", "legal", "sources"]) {
    assert.match(page, new RegExp(`\\b${route}\\b`));
    assert.match(footer, new RegExp(`\\b${route}\\b`));
  }
  assert.match(page, /SURAHS\.filter/);
  assert.match(page, /displayMode: "surah"/);
  assert.match(page, /siteConfig\.repositoryUrl/);
  assert.match(page, /siteConfig\.contactUrl/);
});

test("privacy and source copy match the implemented local-first behavior", async () => {
  const page = await read("src/components/LegalPage.jsx");
  assert.match(page, /localStorage ou IndexedDB/);
  assert.match(page, /horaires de prière sont calculés localement/);
  assert.match(page, /Aucune synchronisation cloud automatique/);
  assert.match(page, /Quran Foundation \/ Quran\.com/);
  assert.match(page, /EveryAyah, MP3Quran, QuranicAudio/);
});

test("English and Arabic editorial copy remains complete and cacheable", async () => {
  const translated = JSON.parse(await read("public/data/editorial-copy.json"));
  for (const lang of ["en", "ar"]) {
    for (const page of ["about", "privacy", "legal", "sources"]) {
      assert.equal(translated[lang][page].sections.length, 4, `${lang}.${page}`);
    }
    assert.equal(Object.keys(translated[lang].tabs).length, 5, `${lang}.tabs`);
  }
  const sw = await read("public/sw.js");
  assert.match(sw, /\/data\/editorial-copy\.json/);
});
