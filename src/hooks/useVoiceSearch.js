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
    recognitionRef.current?.stop?.();
  }, []);

  const toggle = useCallback(() => {
    if (status === "listening" || status === "starting") {
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

    const recognition = new Recognition();
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

    recognition.onstart = () => setStatus("listening");
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();

      if (!transcript) return;
      transcriptReceivedRef.current = true;
      onTranscriptRef.current?.(transcript);
    };
    recognition.onerror = (event) => {
      const code = event?.error;
      if (code === "aborted") return;
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
    };
    recognition.onend = () => {
      if (!transcriptReceivedRef.current) {
        setErrorCode((current) => current || "noSpeech");
      }
      recognitionRef.current = null;
      setStatus("idle");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus("idle");
      setErrorCode("failed");
    }
  }, [interfaceLanguage, searchMode, status, stop]);

  useEffect(
    () => () => {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onend = null;
        recognition.abort?.();
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
