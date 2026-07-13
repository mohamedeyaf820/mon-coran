import test from "node:test";
import assert from "node:assert/strict";
import { buildPreferencePatch, getReaderCssVariables } from "../src/modern/preferences/preferencesModel.js";

test("builds a bounded preference patch", () => {
  assert.deepEqual(buildPreferencePatch({ quranFontSize: 140, quranTranslationFontSize: 5, wirdGoalAmount: 80 }), {
    quranFontSize: 72,
    fontSize: 72,
    quranTranslationFontSize: 12,
    wirdGoalAmount: 30,
  });
});

test("maps reading preferences to stable CSS variables", () => {
  assert.deepEqual(getReaderCssVariables({ quranFontSize: 38, quranTranslationFontSize: 19 }), {
    "--modern-quran-size": "38px",
    "--modern-translation-size": "19px",
  });
});
