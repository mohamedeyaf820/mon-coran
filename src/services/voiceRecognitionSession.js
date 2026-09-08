/** One bounded, explicitly started microphone session. */
export function startVoiceRecognitionSession({ Recognition, language, onStatus, onError, onTranscript, timeoutMs = 15000 }) {
  let recognition;
  try { recognition = new Recognition(); } catch {
    onError("failed");
    onStatus("idle");
    return { cancel() {}, finished: true };
  }
  let finished = false;
  let received = false;
  let timer;
  const finish = (error, abort = true) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
    if (abort) {
      try { recognition.abort(); } catch { /* Already stopped. */ }
    }
    if (error) onError(error);
    onStatus("idle");
  };
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => { if (!finished) onStatus("listening"); };
  recognition.onresult = (event) => {
    if (finished) return;
    const transcript = Array.from(event.results || []).map(result => result?.[0]?.transcript || "").join(" ").trim();
    if (!transcript) return;
    received = true;
    finish();
    onTranscript(transcript);
  };
  recognition.onerror = (event) => {
    const errors = { "not-allowed": "permissionDenied", "service-not-allowed": "permissionDenied", "no-speech": "noSpeech", "audio-capture": "microphoneUnavailable", network: "network" };
    finish(event?.error === "aborted" ? null : errors[event?.error] || "failed");
  };
  recognition.onend = () => finish(received ? null : "noSpeech", false);
  timer = setTimeout(() => finish("noSpeech"), timeoutMs);
  onStatus("starting");
  try { recognition.start(); } catch { finish("failed"); }
  return { cancel: () => finish(), get finished() { return finished; } };
}
