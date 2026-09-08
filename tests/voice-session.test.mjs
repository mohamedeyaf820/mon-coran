import test from "node:test";
import assert from "node:assert/strict";
import { startVoiceRecognitionSession } from "../src/services/voiceRecognitionSession.js";
function setup(options = {}) {
  let instance;
  class Recognition {
    constructor() { instance = this; this.aborts = 0; }
    start() {}
    abort() { this.aborts++; }
  }
  const statuses = [], errors = [], transcripts = [];
  const session = startVoiceRecognitionSession({ Recognition, language: "ar-SA", onStatus: v => statuses.push(v), onError: v => errors.push(v), onTranscript: v => transcripts.push(v), ...options });
  return { session, instance, statuses, errors, transcripts };
}
test("voice result stops capture and detaches every handler", () => {
  const s = setup();
  s.instance.onresult({ results: [[{ transcript: "الفاتحة" }]] });
  assert.deepEqual(s.transcripts, ["الفاتحة"]);
  assert.equal(s.instance.aborts, 1);
  for (const event of ["onstart", "onresult", "onerror", "onend"]) assert.equal(s.instance[event], null);
});
test("voice timeout releases capture even if browser never emits end", async () => {
  const s = setup({ timeoutMs: 5 });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(s.session.finished, true);
  assert.deepEqual(s.errors, ["noSpeech"]);
  assert.equal(s.instance.aborts, 1);
});
test("voice cancellation is idempotent and does not report silence as an error", () => {
  const s = setup(); s.session.cancel(); s.session.cancel();
  assert.equal(s.instance.aborts, 1);
  assert.deepEqual(s.errors, []);
});
test("voice permission error returns to idle without waiting for end", () => {
  const s = setup(); s.instance.onerror({ error: "not-allowed" });
  assert.deepEqual(s.errors, ["permissionDenied"]);
  assert.equal(s.statuses.at(-1), "idle");
});
