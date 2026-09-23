import { execFileSync } from "node:child_process";
import fs from "node:fs";

const path = "tests/reader-ui-contract.test.mjs";
const head = execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8" });
const addition = `
test("the printed Mushaf page carries no translation band and its controls say so", () => {
  const cleanPage = source("src/components/Quran/CleanPageView.jsx");
  assert.doesNotMatch(cleanPage, /TranslationPanel/);

  const toolbar = source("src/components/Quran/ReadingToolbar.jsx");
  assert.match(toolbar, /disabled=\\{mushafIsOn\\}/);
  assert.match(toolbar, /translationMushafHint/);

  const header = source("src/components/Quran/SurahReaderHeader.jsx");
  assert.match(header, /disabled: mushafIsOn/);

  const keys = source("src/hooks/useKeyboardNavigation.js");
  assert.match(keys, /if \\(s\\.mushafLayout === "mushaf"\\) return;/);
});
`;
fs.writeFileSync(".scratch-diag/curated3/test.mjs", head.trimEnd() + "\n" + addition);
console.log("written", head.length, "->", fs.statSync(".scratch-diag/curated3/test.mjs").size);
