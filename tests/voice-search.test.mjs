import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  VOICE_LANGUAGE_MODES,
  getSpeechRecognitionConstructor,
  getVoiceLanguageTag,
  getVoiceRecognitionLanguage,
} from "../src/hooks/useVoiceSearch.js";

test("voice recognition follows the selected search language", () => {
  assert.equal(getVoiceRecognitionLanguage("arabic", "fr"), "ar-SA");
  assert.equal(getVoiceRecognitionLanguage("fr", "ar"), "fr-FR");
  assert.equal(getVoiceRecognitionLanguage("en", "fr"), "en-US");
  assert.equal(getVoiceRecognitionLanguage("phonetic", "fr"), "fr-FR");
});

// The dialog offers these three; a mode with no tag would silently fall back to
// French and dictate Quran words through the wrong acoustic model.
test("every offered dictation mode resolves to a recogniser tag", () => {
  assert.deepEqual(VOICE_LANGUAGE_MODES, ["arabic", "fr", "en"]);
  assert.equal(getVoiceLanguageTag("arabic"), "ar-SA");
  assert.equal(getVoiceLanguageTag("fr"), "fr-FR");
  assert.equal(getVoiceLanguageTag("en"), "en-US");
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
  assert.doesNotMatch(source, /search-pro__modes/);
  assert.doesNotMatch(source, /Recherche contextuelle/);

  // The dictation language used to be inferred from containsArabic(query), i.e.
  // from text the user had already typed rather than the speech about to arrive.
  assert.doesNotMatch(source, /searchMode:\s*containsArabic\(query\)/);
  assert.match(source, /language:\s*getVoiceLanguageTag\(voiceMode\)/);
  // Interim results are the only feedback while speaking; without them the mic
  // looks dead and the user stops talking.
  assert.match(source, /onInterim:\s*setVoiceInterim/);
  const hook = fs.readFileSync(
    new URL("../src/hooks/useVoiceSearch.js", import.meta.url),
    "utf8",
  );
  assert.match(hook, /interimResults\s*=\s*true/);
});

test("the recogniser follows a language chosen while it is already listening", () => {
  const hook = fs.readFileSync(
    new URL("../src/hooks/useVoiceSearch.js", import.meta.url),
    "utf8",
  );

  // A SpeechRecognition session fixes its language at start(), so the only way
  // to honour a mid-dictation change is to open a new session.
  assert.match(hook, /recognition\.sessionLanguage = language/);
  assert.match(hook, /if \(!recognition \|\| recognition\.sessionLanguage === language\) return/);
  assert.match(hook, /restartRef\.current = true/);
  assert.match(hook, /if \(restart\) toggleRef\.current\?\.\(\)/);
  assert.match(hook, /toggleRef\.current = toggle/);
  // The interim text belongs to the language being left, not the one coming.
  assert.match(hook, /!transcriptReceivedRef\.current &&[\s\S]*?!restart &&[\s\S]*?heardRef\.current &&[\s\S]*?interimTextRef\.current/);
});

test("stopping the microphone by hand is not reported as a failure to hear", () => {
  const hook = fs.readFileSync(
    new URL("../src/hooks/useVoiceSearch.js", import.meta.url),
    "utf8",
  );

  assert.match(hook, /stop\(\{ intentional: true \}\)/);
  assert.match(hook, /intentionalStopRef\.current = options\?\.intentional === true/);
  assert.match(hook, /!intentionalStopRef\.current/);
});
