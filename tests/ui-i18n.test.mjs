import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

for (const component of ["modal.jsx", "sheet.jsx"]) {
  test(`shared ${component} close control follows the active language`, () => {
    const source = fs.readFileSync(
      new URL(`../src/components/ui/${component}`, import.meta.url),
      "utf8",
    );

    assert.doesNotMatch(source, /aria-label=["']Fermer["']/);
    assert.match(source, /t\(["']audio\.close["'],\s*lang\)/);
  });
}

test("compact mobile player uses the safe-area dock and a visible progress rail", () => {
  const viewSource = fs.readFileSync(
    new URL("../src/components/audioPlayer/SimpleAudioPlayerView.jsx", import.meta.url),
    "utf8",
  );
  const primitivesSource = fs.readFileSync(
    new URL("../src/components/audioPlayer/AudioPlayerPrimitives.jsx", import.meta.url),
    "utf8",
  );

  assert.match(viewSource, /mp-audio-player--mobile mp-audio-player--dock/);
  assert.match(viewSource, /<PlayerProgress[\s\S]*showTimes=\{false\}/);
  assert.match(primitivesSource, /simple-player__progress-track/);
});

test("reader and mobile settings keep a compact, labelled hierarchy", () => {
  const readerStyles = fs.readFileSync(
    new URL("../src/styles/surah-reader-header.css", import.meta.url),
    "utf8",
  );
  const settingsStyles = fs.readFileSync(
    new URL("../src/styles/settings-enhanced.css", import.meta.url),
    "utf8",
  );

  assert.match(readerStyles, /\.srh-root\s*\{[\s\S]*?top:\s*0;/);
  assert.match(
    settingsStyles,
    /@media \(max-width: 720px\)[\s\S]*?\.settings-qurancom \.settings-tab-button__label\s*\{[\s\S]*?display:\s*block !important;/,
  );
});

test("feature-level accessibility labels use the active locale", () => {
  const expectations = [
    ["AudioMakerPanel.jsx", /t\(["']audio\.close["'],\s*lang\)/],
    ["DuasPage.jsx", /t\(["']duas\.categoriesLabel["'],\s*lang\)/],
    ["Footer.jsx", /aria-label=\{t\(["']footer\.verseRef["'],\s*lang\)\}/],
    ["Quran/AyahMarker.jsx", /t\(["']quran\.sajda["'],\s*lang\)/],
  ];

  for (const [component, translationCall] of expectations) {
    const source = fs.readFileSync(
      new URL(`../src/components/${component}`, import.meta.url),
      "utf8",
    );
    assert.match(source, translationCall);
  }
});
