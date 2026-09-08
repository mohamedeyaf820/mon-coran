import { useCallback, useEffect, useRef, useState } from "react";
import { startVoiceRecognitionSession } from "../services/voiceRecognitionSession.js";

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

  const onTranscriptRef = useRef(onTranscript);
  const [status, setStatus] = useState("idle");
  const [errorCode, setErrorCode] = useState(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const clearError = useCallback(() => setErrorCode(null), []);

  const stop = useCallback(() => {
    const session = recognitionRef.current;
    recognitionRef.current = null;
    session?.cancel();
  }, []);

  const toggle = useCallback(() => {
    if (recognitionRef.current && !recognitionRef.current.finished) {
      stop();
      return;
    }
    const Recognition = getSpeechRecognitionConstructor(typeof window === "undefined" ? null : window);
    if (!Recognition || window.isSecureContext === false) {
      setErrorCode("unsupported");
      return;
    }
    setErrorCode(null);
    recognitionRef.current = startVoiceRecognitionSession({
      Recognition,
      language: getVoiceRecognitionLanguage(searchMode, interfaceLanguage),
      onStatus: setStatus,
      onError: setErrorCode,
      onTranscript: transcript => onTranscriptRef.current?.(transcript),
    });
  }, [interfaceLanguage, searchMode, stop]);

  useEffect(() => () => {
    recognitionRef.current?.cancel();
    recognitionRef.current = null;
  }, []);

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(getSpeechRecognitionConstructor(window));

  return {
    clearError,
    errorCode,
    isListening: status === "listening",
    isStarting: status === "starting",
    isSupported,
    toggle,
  };
}
