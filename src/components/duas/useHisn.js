import { useCallback, useEffect, useMemo, useState } from "react";
import { loadHisn, loadHisnTranslation } from "../../services/hisnService";
import { buildHisnSearchIndex } from "../../utils/hisnSearch";

const EMPTY_TRANSLATION = { lang: "", chapters: {}, items: {} };

/**
 * Loads the Arabic library and the translation for the reading language.
 * They fail separately: the Arabic text stays readable when only the
 * translation is missing (offline on a first visit to the other language).
 */
export function useHisn(lang, enabled = true) {
  const [library, setLibrary] = useState({ status: "loading", data: null });
  const [translation, setTranslation] = useState({ status: "loading", data: EMPTY_TRANSLATION });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setLibrary((current) => (current.data ? current : { status: "loading", data: null }));
    loadHisn().then(
      (data) => !cancelled && setLibrary({ status: "ready", data }),
      () => !cancelled && setLibrary((current) => ({ status: current.data ? "ready" : "error", data: current.data })),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    setTranslation((current) => ({ status: "loading", data: current.data }));
    loadHisnTranslation(lang).then(
      (data) => !cancelled && setTranslation({ status: "ready", data }),
      () => !cancelled && setTranslation({ status: "error", data: EMPTY_TRANSLATION }),
    );
    return () => {
      cancelled = true;
    };
  }, [lang, attempt, enabled]);

  const index = useMemo(
    () => (library.data ? buildHisnSearchIndex(library.data.chapters, translation.data) : null),
    [library.data, translation.data],
  );

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return {
    status: library.status,
    data: library.data,
    translation: translation.data,
    translationStatus: translation.status,
    index,
    retry,
  };
}
