import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  getSpeechRecognitionConstructor,
  getVoiceRecognitionLanguage,
} from "../src/hooks/useVoiceSearch.js";

test("voice recognition follows the selected search language", () => {
  assert.equal(getVoiceRecognitionLanguage("arabic", "fr"), "ar-SA");
  assert.equal(getVoiceRecognitionLanguage("fr", "ar"), "fr-FR");
  assert.equal(getVoiceRecognitionLanguage("en", "fr"), "en-US");
  assert.equal(getVoiceRecognitionLanguage("phonetic", "fr"), "fr-FR");
});

test("voice recognition supports standard and prefixed browser APIs", () => {
  function StandardRecognition() {}
  function PrefixedRecognition() {}

  assert.equal(
    getSpeechRecognitionConstructor({ SpeechRecognition: StandardRecognition }),
    StandardRecognition,
  );
  assert.equal(
    getSpeechRecognitionConstructor({ webkitSpeechRecognition: PrefixedRecognition }),
    PrefixedRecognition,
  );
  assert.equal(getSpeechRecognitionConstructor({}), null);
});

test("search modal exposes an accessible voice control and live feedback", () => {
  const source = fs.readFileSync(
    new URL("../src/components/SearchModal.jsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /useVoiceSearch/);
  assert.match(source, /aria-pressed=\{voiceSearch\.isListening\}/);
  assert.match(source, /role="status"/);
  assert.match(source, /role="alert"/);
});
