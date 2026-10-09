import assert from "node:assert/strict";
import test from "node:test";

import SURAHS from "../src/data/surahs.js";
import { COPY, surahSeo } from "../src/data/seoCopy.js";

test("surah titles and descriptions are unique and displayable in every language", () => {
  for (const lang of Object.keys(COPY)) {
    const titles = new Set();
    const descriptions = new Set();
    for (const surah of SURAHS) {
      const { title, description } = surahSeo(surah, lang);
      assert.ok(title.length > 0 && title.length <= 60, `${lang} ${surah.n} title: ${title.length}`);
      assert.ok(
        description.length >= 80 && description.length <= 165,
        `${lang} ${surah.n} description: ${description.length}`,
      );
      titles.add(title);
      descriptions.add(description);
    }
    assert.equal(titles.size, SURAHS.length, `${lang} titles repeat`);
    assert.equal(descriptions.size, SURAHS.length, `${lang} descriptions repeat`);
  }
});

test("surah copy states the Hafs verse count, not a riwaya-neutral one", () => {
  for (const surah of SURAHS) {
    for (const lang of ["fr", "en"]) {
      const { description } = surahSeo(surah, lang);
      assert.ok(description.includes(String(surah.ayahs)), `${lang} ${surah.n} verse count`);
      assert.ok(description.includes("Hafs"), `${lang} ${surah.n} names the riwaya`);
    }
  }
});

test("every locale ships the same copy keys", () => {
  const keys = (value) => Object.keys(value).sort();
  for (const lang of ["en", "ar"]) {
    assert.deepEqual(keys(COPY[lang]), keys(COPY.fr), `${lang} top-level keys`);
    assert.deepEqual(keys(COPY[lang].legal), keys(COPY.fr.legal), `${lang} legal labels`);
    assert.deepEqual(
      keys(COPY[lang].legalDescriptions),
      keys(COPY.fr.legalDescriptions),
      `${lang} legal descriptions`,
    );
  }
});
