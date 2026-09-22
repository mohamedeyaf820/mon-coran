import { useCallback, useEffect, useRef, useState } from "react";

export function getVoiceRecognitionLanguage(searchMode, interfaceLanguage) {
  if (searchMode === "arabic") return "ar-SA";
  if (searchMode === "en") return "en-US";
  if (searchMode === "fr") return "fr-FR";
  if (interfaceLanguage === "ar") return "ar-SA";
  if (interfaceLanguage === "en") return "en-US";
  return "fr-FR";
}

export function getSpeechRecognitionConstructor(browserWindow) {
  return (
    browserWindow?.SpeechRecognition ||
    browserWindow?.webkitSpeechRecognition ||
    null
  );
}

// The three dictation languages the search dialog offers. The Web Speech API
// recognises one language per session and cannot mix them, so dictating an
// Arabic Quran word into a French session returns nothing at all - which is why
// the language has to be a visible choice rather than a guess.
export const VOICE_LANGUAGE_MODES = Object.freeze(["arabic", "fr", "en"]);

export function getVoiceLanguageTag(mode) {
  if (mode === "arabic") return "ar-SA";
  if (mode === "en") return "en-US";
  return "fr-FR";
}

export default function useVoiceSearch({ language, onTranscript, onInterim }) {
  const recognitionRef = useRef(null);
  const transcriptReceivedRef = useRef(false);
  const heardRef = useRef(false);
  const interimTextRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterim);
  const [status, setStatus] = useState("idle");
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onInterimRef.current = onInterim;
  }, [onInterim]);

  const clearError = useCallback(() => setErrorCode(null), []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    // Stopping during the permission/start phase can throw on Safari.
    try {
      recognition.stop();
    } catch {
      recognition.onend?.();
    }
  }, []);

  const toggle = useCallback(() => {
    if (recognitionRef.current) {
      stop();
      return;
    }

    const Recognition = getSpeechRecognitionConstructor(
      typeof window === "undefined" ? null : window,
    );

    if (!Recognition) {
      setErrorCode("unsupported");
      return;
    }

    if (window.isSecureContext === false) {
      setErrorCode("secureContext");
      return;
    }
    if (navigator.onLine === false) {
      setErrorCode("network");
      return;
    }

    let recognition;
    try {
      recognition = new Recognition();
    } catch {
      setErrorCode("unsupported");
      return;
    }
    recognition.lang = language;
    recognition.continuous = false;
    // Interim results are what make the mic feel alive: without them the user
    // speaks and sees nothing until the session closes.
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    transcriptReceivedRef.current = false;
    heardRef.current = false;
    interimTextRef.current = "";
    setErrorCode(null);
    setStatus("starting");

    const isCurrent = () => recognitionRef.current === recognition;
    const release = () => {
      if (!isCurrent()) return;
      recognitionRef.current = null;
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      setStatus("idle");
    };
    recognition.onstart = () => {
      if (isCurrent()) setStatus("listening");
    };
    recognition.onresult = (event) => {
      if (!isCurrent()) return;
      let finalText = "";
      let interimText = "";
      for (const result of Array.from(event.results || [])) {
        const text = result?.[0]?.transcript || "";
        if (result.isFinal) finalText += text;
        else interimText += text;
      }
      if (interimText.trim()) {
        heardRef.current = true;
        interimTextRef.current = interimText.trim();
        onInterimRef.current?.(interimText.trim());
      }
      if (!finalText.trim()) return;
      transcriptReceivedRef.current = true;
      heardRef.current = true;
      onTranscriptRef.current?.(finalText.trim());
    };
    recognition.onerror = (event) => {
      if (!isCurrent()) return;
      const code = event?.error;
      if (code === "aborted") {
        release();
        return;
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        setErrorCode("permissionDenied");
      } else if (code === "no-speech") {
        setErrorCode("noSpeech");
      } else if (code === "audio-capture") {
        setErrorCode("microphoneUnavailable");
      } else if (code === "network") {
        setErrorCode("network");
      } else {
        setErrorCode("failed");
      }
      // Some mobile implementations omit end after an error. Allow retry
      // immediately and detach callbacks before aborting the old session.
      release();
      try { recognition.abort?.(); } catch { /* already stopped */ }
    };
    recognition.onend = () => {
      if (!isCurrent()) return;
      // Mobile implementations sometimes close the session without ever
      // marking the last chunk final. Searching the words the user already saw
      // beats reporting a dictation that produced nothing.
      if (!transcriptReceivedRef.current && heardRef.current && interimTextRef.current) {
        onTranscriptRef.current?.(interimTextRef.current);
      } else if (!transcriptReceivedRef.current) {
        setErrorCode((current) => current || "noSpeech");
      }
      release();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      release();
      setErrorCode(error?.name === "NotAllowedError" ? "permissionDenied" : "failed");
    }
  }, [language, stop]);

  useEffect(
    () => () => {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
        try { recognition.abort?.(); } catch { /* already stopped */ }
      }
    },
    [],
  );

  return {
    clearError,
    errorCode,
    isListening: status === "listening",
    isStarting: status === "starting",
    toggle,
  };
}
