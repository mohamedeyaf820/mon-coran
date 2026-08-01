import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(pathname) {
  return fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
}

test("healthy reader sources stay out of the reading interface", () => {
  const status = source(
    "src/components/QuranDisplay/ReaderSourceStatus.jsx",
  );

  assert.match(
    status,
    /if \(!textIsDegraded && !translationHasError\) return null;/,
  );
  assert.doesNotMatch(status, /dataSource\?\.label/);
  assert.doesNotMatch(status, /translationSource/);
});

test("reader typography controls remain explicit and mobile-accessible", () => {
  const header = source("src/components/Quran/SurahReaderHeader.jsx");
  const controls = source("src/components/ArabicFontControls.jsx");
  const styles = source("src/styles/surah-reader-header.css");

  assert.match(header, /aria-expanded=\{typographyOpen\}/);
  assert.match(header, /Texte et taille/);
  assert.match(controls, /step="1"/);
  assert.match(styles, /\.srh-typography-disclosure\.open \.srh-typography-panel/);
});

test("reciter cards keep technical providers in the detail view", () => {
  const cards = source("src/components/Home/ContentSection.jsx");
  const details = source("src/components/recitation/ReciterDetailPage.jsx");

  assert.doesNotMatch(cards, /getReciterSourceInfo/);
  assert.match(details, /getReciterSourceInfo/);
  assert.match(details, /reciter-detail__sources/);
});
