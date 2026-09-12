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

export default function useVoiceSearch({
  interfaceLanguage,
  searchMode,
  onTranscript,
}) {
  const recognitionRef = useRef(null);
  const transcriptReceivedRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const [status, setStatus] = useState("idle");
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

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
    recognition.lang = getVoiceRecognitionLanguage(
      searchMode,
      interfaceLanguage,
    );
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    transcriptReceivedRef.current = false;
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
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (!transcript) return;
      transcriptReceivedRef.current = true;
      onTranscriptRef.current?.(transcript);
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
      if (!transcriptReceivedRef.current) {
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
  }, [interfaceLanguage, searchMode, stop]);

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
