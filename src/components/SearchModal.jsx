import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "../styles/domains/search-home-polish.css";
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  ExternalLink,
  Mic,
  Square,
  Heart,
  RotateCcw,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { search, searchTranslation } from "../services/quranAPI";
import { getSurah, toAr } from "../data/surahs";
import QURAN_DUAS from "../data/duas";
import { getJuzForAyah } from "../data/juz";
import {
  containsArabic,
  parseSearchReference,
  sanitizeSearchQuery,
} from "../utils/searchIntelligence";
import { prepareSearchQuery } from "../services/searchWorkerService";
import { startPerformanceTimer } from "../services/performanceMetrics";
import useVoiceSearch, { getVoiceLanguageTag } from "../hooks/useVoiceSearch";

const VOICE_MODE_STORAGE_KEY = "mushaf-voice-language";
const VOICE_MODES = ["arabic", "fr", "en"];

function interfaceVoiceMode(lang) {
  return lang === "ar" ? "arabic" : lang === "en" ? "en" : "fr";
}

function readStoredVoiceMode() {
  try {
    const stored = localStorage.getItem(VOICE_MODE_STORAGE_KEY);
    return VOICE_MODES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

// Never surface a raw error message: it leaks internals and reads as a crash.
function formatSearchError(error, lang) {
  const message = String(error?.message || error || "").trim();

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return t("search.errors.offline", lang);
  }
  if (/failed to fetch|networkerror|network request failed|load failed|err_/i.test(message)) {
    return /offline|network is (?:not )?online/i.test(message)
      ? t("search.errors.offline", lang)
      : t("search.errors.network", lang);
  }
  if (/404|search failed|index unavailable|api error/i.test(message)) {
    return t("search.errors.unavailable", lang);
  }
  if (/timeout|timed out|econn|enotfound|50[0-4]/i.test(message)) {
    return t("search.errors.timeout", lang);
  }
  return t("search.errors.generic", lang);
}

export default function SearchModal() {
  const { state, dispatch, set } = useApp();
  const { lang, riwaya } = state;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultMode, setResultMode] = useState("arabic");

  const duaResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return QURAN_DUAS.filter((dua) =>
      `${dua.arabic} ${dua.transliteration} ${dua.fr} ${dua.en}`.toLowerCase().includes(q),
    );
  }, [query]);

  // "36", "2:10", "sourate 36", "juz 5", "٢:١٠" ask for a position, not a word.
  const reference = useMemo(() => parseSearchReference(query), [query]);

  // The recogniser hears one language per session, so this is a user choice,
  // not a guess from the text already typed: dictating an Arabic Quran word into
  // a French session returns nothing and reads as a broken microphone.
  const [voiceMode, setVoiceMode] = useState(
    () => readStoredVoiceMode() || interfaceVoiceMode(lang),
  );
  const [voiceInterim, setVoiceInterim] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(VOICE_MODE_STORAGE_KEY, voiceMode);
    } catch {
      /* private mode: the choice just does not persist */
    }
  }, [voiceMode]);

  const handleVoiceTranscript = useCallback((transcript) => {
    const sanitized = sanitizeSearchQuery(transcript);
    setVoiceInterim("");
    if (!sanitized) return;
    setQuery(sanitized);
  }, []);

  const voiceSearch = useVoiceSearch({
    language: getVoiceLanguageTag(voiceMode),
    onTranscript: handleVoiceTranscript,
    onInterim: setVoiceInterim,
  });

  const close = () => dispatch({ type: "SET", payload: { searchOpen: false } });

  const searchRequestIdRef = useRef(0);
  const searchAbortRef = useRef(null);
  const runSearch = useCallback(
    async (rawQuery) => {
      const requestId = ++searchRequestIdRef.current;
      const finishMetric = startPerformanceTimer("search_response_ms");
      const sanitized = sanitizeSearchQuery(rawQuery);

      if (requestId !== searchRequestIdRef.current) return;

      if (!sanitized) {
        startTransition(() => {
          setResults([]);
        });
        finishMetric();
        return;
      }

      searchAbortRef.current?.abort?.();
      const ctrl = new AbortController();
      searchAbortRef.current = ctrl;

      setLoading(true);
      setError(null);

      try {
        let bestMatches = [];
        let bestMode = containsArabic(sanitized) ? "arabic" : "phonetic";
        const isArabicQuery = containsArabic(sanitized);
        const primary = await prepareSearchQuery(
          sanitized,
          isArabicQuery ? "arabic" : "phonetic",
        );

        const runCandidates = async (candidates, fetcher) => {
          for (const candidate of candidates) {
            const data = await fetcher(candidate);
            const matches = Array.isArray(data?.matches) ? data.matches : [];
            if (matches.length > 0) return matches;
          }
          return [];
        };

        if (isArabicQuery) {
          bestMatches = await runCandidates(primary.candidates, (candidate) =>
            search(candidate, riwaya, null, ctrl.signal),
          );
        } else {
          const translationLanguages = lang === "en" ? ["en", "fr"] : ["fr", "en"];
          const translationPlans = await Promise.all(
            translationLanguages.map((translationLanguage) =>
              prepareSearchQuery(sanitized, translationLanguage),
            ),
          );
          const attempts = await Promise.allSettled([
            runCandidates(primary.candidates, (candidate) =>
              search(candidate, riwaya, null, ctrl.signal),
            ),
            ...translationPlans.map((plan, index) =>
              runCandidates(plan.candidates, (candidate) =>
                searchTranslation(
                  candidate,
                  translationLanguages[index],
                  null,
                  ctrl.signal,
                ),
              ),
            ),
          ]);
          const successfulAttempt = attempts.find(
            (attempt) => attempt.status === "fulfilled" && attempt.value.length > 0,
          );
          if (successfulAttempt?.status === "fulfilled") {
            bestMatches = successfulAttempt.value;
            const attemptIndex = attempts.indexOf(successfulAttempt);
            bestMode = attemptIndex === 0
              ? "phonetic"
              : translationLanguages[attemptIndex - 1];
          } else if (attempts.every((attempt) => attempt.status === "rejected")) {
            throw attempts[0].reason;
          }
        }

        if (requestId !== searchRequestIdRef.current) return;

        startTransition(() => {
          setResults(bestMatches);
          setResultMode(bestMode);
        });
        finishMetric();
      } catch (err) {
        if (
          err?.name === "AbortError" ||
          requestId !== searchRequestIdRef.current
        ) {
          return;
        }
        setError(formatSearchError(err, lang));
        startTransition(() => {
          setResults([]);
        });
        finishMetric();
      } finally {
        if (searchAbortRef.current === ctrl) {
          searchAbortRef.current = null;
        }
        if (requestId === searchRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [lang, riwaya],
  );

  useEffect(() => {
    if (query.trim()) return;
    setResults([]);
    setError(null);
    setLoading(false);
  }, [query]);

  useEffect(() => {
    if (!reference) return;
    setResults([]);
    setError(null);
    setLoading(false);
  }, [reference]);

  useEffect(() => {
    const sanitized = sanitizeSearchQuery(query);
    if (!sanitized || reference) return;

    // The debounce window has to read as "searching", not as "nothing found":
    // the empty state is keyed on `!loading`, so leaving loading false here let
    // it paint before the first request had even started.
    setLoading(true);
    const timeoutId = window.setTimeout(() => {
      void runSearch(sanitized);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [query, reference, runSearch]);

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort?.();
      searchAbortRef.current = null;
    };
  }, []);

  const handleSearch = useCallback(async () => {
    await runSearch(query);
  }, [query, runSearch]);

  const goToAyah = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    close();
  };

  const goToReference = (target) => {
    set({ showHome: false, showDuas: false });
    if (target.kind === "juz") {
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: target.juz } });
    } else {
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: target.surah, ayah: target.ayah },
      });
    }
    close();
  };

  const suggestionItems = [
    {
      value: "الرحمن",
    },
    {
      value: "bismillah",
    },
    {
      value: "miséricorde",
    },
  ];

  const applySuggestion = (suggestion) => {
    setQuery(suggestion.value);
    void runSearch(suggestion.value);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (reference) {
        goToReference(reference);
        return;
      }
      handleSearch();
    }
  };

  const isTranslationMode = resultMode === "fr" || resultMode === "en";
  const filteredResults = results;
  const visibleDuaResults = useMemo(() => {
    const quranRefs = new Set(
      filteredResults.map((result) =>
        `${result?.surah?.number || result?.surah || 1}:${result?.numberInSurah || result?.number || 1}`,
      ),
    );
    return duaResults.filter((dua) => !quranRefs.has(`${dua.surah}:${dua.ayah}`));
  }, [duaResults, filteredResults]);
  const activeResultCount = filteredResults.length + visibleDuaResults.length;

  const referenceDisplay = useMemo(() => {
    if (!reference) return null;
    const digit = (value) => (lang === "ar" ? toAr(value) : String(value));
    const key =
      reference.kind === "juz"
        ? "goToJuz"
        : reference.kind === "surah"
          ? "goToSurah"
          : "goToAyah";
    const position =
      reference.kind === "ayah"
        ? `${digit(reference.surah)}:${digit(reference.ayah)}`
        : digit(reference.kind === "juz" ? reference.juz : reference.surah);
    const surahMeta = reference.kind === "juz" ? null : getSurah(reference.surah);
    return {
      label: t(`search.${key}`, lang).replace("{n}", position),
      translatedName:
        surahMeta && (lang === "fr" ? surahMeta.fr || surahMeta.en : surahMeta.en),
      arabicName: surahMeta?.ar,
    };
  }, [reference, lang]);

  return (
    <Dialog.Root
      open
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <Dialog.Portal>
        <div
          className="modal-overlay search-pro-overlay search-pro-overlay--simple"
          onClick={close}
        >
          <Dialog.Content
            className="search-pro search-pro--simple"
            aria-modal="true"
            lang={lang}
            dir={lang === "ar" ? "rtl" : "ltr"}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              close();
            }}
            onCloseAutoFocus={(event) => {
              // The panel unmounts on close, so Radix's own restore target is the
              // element the `inert` guard already blurred (the document body).
              // App.jsx restores focus to the real opener instead.
              event.preventDefault();
            }}
            onInteractOutside={(e) => { e.preventDefault(); close(); }}
            onClick={(event) => event.stopPropagation()}
          >
              <Dialog.Description className="sr-only">
                {t("search.dialogDescription", lang)}
              </Dialog.Description>
              <header className="search-pro__header">
                <div className="search-pro__title-wrap">
                  <span className="search-pro__mark" aria-hidden="true">
                    <Search size={16} />
                  </span>
                  <Dialog.Title asChild>
                    <h2>
                      {t("nav.search", lang)}
                    </h2>
                  </Dialog.Title>
                </div>
                <button
                  className="search-pro__close"
                  onClick={close}
                  aria-label={t("search.closeAria", lang)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </header>

              <div className="search-pro__body">
                <div className="search-pro__main">
                  <section
                    className="search-pro__command"
                    aria-label={t("search.commandAria", lang)}
                  >
                    <div className="search-pro__input-shell">
                      <span aria-hidden="true">
                        <Search size={16} />
                      </span>
                      <label className="sr-only" htmlFor="quran-search-input">
                        {t("search.inputLabel", lang)}
                      </label>
                      <input
                        id="quran-search-input"
                        type="text"
                        lang={containsArabic(query) ? "ar" : lang}
                        dir={containsArabic(query) ? "rtl" : lang === "ar" ? "rtl" : "ltr"}
                        value={query}
                        onChange={(event) => {
                          voiceSearch.clearError();
                          setQuery(sanitizeSearchQuery(event.target.value));
                        }}
                        onKeyDown={handleInputKeyDown}
                        placeholder={t("search.queryPlaceholder", lang)}
                        autoFocus
                        aria-controls="search-results-list"
                      />
                      <button
                        type="button"
                        className={`search-pro__voice-btn${voiceSearch.isListening ? " is-listening" : ""}`}
                        onClick={voiceSearch.toggle}
                        onKeyDown={(event) => event.stopPropagation()}
                        aria-label={`${t(
                          voiceSearch.isListening
                            ? "search.voiceStop"
                            : "search.voiceStart",
                          lang,
                        )} — ${t(`search.voiceLangFull.${voiceMode}`, lang)}`}
                        aria-pressed={voiceSearch.isListening}
                        title={t(
                          voiceSearch.isListening
                            ? "search.voiceStop"
                            : "search.voiceStart",
                          lang,
                        )}
                      >
                        {voiceSearch.isListening ? (
                          <Square size={13} fill="currentColor" aria-hidden="true" />
                        ) : (
                          <Mic size={17} aria-hidden="true" />
                        )}
                        <span className="search-pro__voice-label">
                          {t(
                            voiceSearch.isListening
                              ? "search.voiceStopShort"
                              : "search.voiceStartShort",
                            lang,
                          )}
                        </span>
                        <span
                          className="search-pro__voice-lang"
                          aria-hidden="true"
                        >
                          {t(`search.voiceLang.${voiceMode}`, lang)}
                        </span>
                      </button>
                      <button
                        className="search-pro__submit"
                        onClick={handleSearch}
                        disabled={loading}
                        aria-label={t("search.startAria", lang)}
                      >
                        {loading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ArrowRight size={14} />
                        )}
                        <span>
                          {t("search.submit", lang)}
                          </span>
                      </button>
                    </div>
                  </section>

                  {(voiceSearch.isListening ||
                    voiceSearch.isStarting ||
                    voiceSearch.errorCode) && (
                    <div className="search-pro__voice-panel">
                      {voiceSearch.errorCode ? (
                        <p className="search-pro__voice-error" role="alert">
                          {t(
                            `search.voiceErrors.${voiceSearch.errorCode}`,
                            lang,
                          )}
                        </p>
                      ) : (
                        <p
                          className="search-pro__voice-status"
                          role="status"
                          aria-live="polite"
                        >
                          <span aria-hidden="true" />
                          {voiceInterim || t("search.voiceListening", lang)}
                        </p>
                      )}

                      {/* The recogniser hears one language at a time, so the
                          recovery for "nothing detected" is usually the other
                          one - offer it here rather than sending the user away. */}
                      <div
                        className="search-pro__voice-langs"
                        role="group"
                        aria-label={t("search.voiceLangGroup", lang)}
                      >
                        {VOICE_MODES.map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            className={`search-pro__voice-lang-option${mode === voiceMode ? " is-active" : ""}`}
                            onClick={() => {
                              setVoiceMode(mode);
                              voiceSearch.clearError();
                            }}
                            aria-pressed={mode === voiceMode}
                          >
                            {t(`search.voiceLangFull.${mode}`, lang)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div
                      className="search-pro__error"
                      role="alert"
                      aria-live="assertive"
                    >
                      <p>{error}</p>
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading}
                        className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[0.8rem] font-bold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-hover)]"
                      >
                        <RotateCcw size={13} aria-hidden="true" />
                        {t("search.errors.retry", lang)}
                      </button>
                    </div>
                  )}

                  <section
                    className="search-pro__results"
                    aria-live="polite"
                    aria-atomic="false"
                    aria-label={t("search.resultsAria", lang)}
                  >
                    {reference && !loading && referenceDisplay && (
                      <button
                        type="button"
                        data-testid="search-reference"
                        className="search-pro__reference"
                        onClick={() => goToReference(reference)}
                      >
                        <span className="search-pro__reference-mark" aria-hidden="true">
                          <ArrowRight size={16} />
                        </span>
                        <span className="search-pro__reference-body">
                          <strong>{referenceDisplay.label}</strong>
                          {referenceDisplay.arabicName && (
                            <span className="search-pro__reference-names">
                              <span lang="ar" dir="rtl">
                                {referenceDisplay.arabicName}
                              </span>
                              {referenceDisplay.translatedName && (
                                <span>{referenceDisplay.translatedName}</span>
                              )}
                            </span>
                          )}
                        </span>
                      </button>
                    )}

                    {loading && query && !reference && (
                      // Reuses the voice-status row: same affordance already styled
                      // for a transient status line, and the retained-CSS budget has
                      // no room for a one-off class.
                      <p className="search-pro__voice-status" role="status">
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        <strong>{t("search.searching", lang)}</strong>
                      </p>
                    )}

                    {!query && !loading && (
                      <div className="search-pro__empty">
                        <div>
                          <p>
                            {t("search.emptyHint", lang)}
                          </p>
                          <div className="search-pro__suggestions">
                            {suggestionItems.map((suggestion) => (
                              <button
                                key={suggestion.value}
                                type="button"
                                onClick={() => applySuggestion(suggestion)}
                              >
                                <strong>{suggestion.value}</strong>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeResultCount === 0 && !loading && query && !error && !reference && (
                      <div className="search-pro__no-results">
                        <Search size={16} />
                        <strong>{t("search.noResults", lang)}</strong>
                      </div>
                    )}

                    {activeResultCount > 0 && (
                      <div className="search-pro__results-head">
                        <strong>
                          {t("search.resultsCount", lang, activeResultCount)}
                        </strong>
                      </div>
                    )}

                    <div
                      className="search-pro__list"
                      id="search-results-list"
                      role="list"
                      aria-label={t("search.listAria", lang)}
                    >
                      {filteredResults.map((result, index) => {
                        const surahNumber =
                          result?.surah?.number || result?.surah || 1;
                        const ayahNumber =
                          result?.numberInSurah || result?.number || 1;
                        const surahMeta = getSurah(surahNumber);
                        const resultJuz = getJuzForAyah(
                          Number(surahNumber),
                          Number(ayahNumber),
                        );
                        const revelationLabel =
                          surahMeta?.type === "Medinan"
                            ? t("quran.medinan", lang)
                            : t("quran.meccan", lang);
                        const translatedName =
                          lang === "ar"
                            ? surahMeta?.ar
                            : lang === "fr"
                              ? surahMeta?.fr || surahMeta?.en
                              : surahMeta?.en;

                        return (
                          <div
                            key={`${surahNumber}-${ayahNumber}-${index}`}
                            role="listitem"
                          >
                            <button
                              data-testid="search-result"
                              data-surah={surahNumber}
                              data-ayah={ayahNumber}
                              className={`search-pro__result ${isTranslationMode ? "is-translation" : ""}`}
                              onClick={() => goToAyah(surahNumber, ayahNumber)}
                            >
                              <span className="search-pro__result-number">
                                {lang === "ar" ? toAr(surahNumber) : surahNumber}
                              </span>
                              <span className="search-pro__result-body">
                                <span className="search-pro__result-top">
                                  <span className="search-pro__result-ref">
                                    <strong>{surahMeta?.ar}</strong>
                                    <span>{translatedName}</span>
                                    <b>
                                      :
                                      {lang === "ar"
                                        ? toAr(ayahNumber)
                                        : ayahNumber}
                                    </b>
                                  </span>
                                  <span className="search-pro__result-tags">
                                    <small>{revelationLabel}</small>
                                    <small>
                                      Juz {lang === "ar" ? toAr(resultJuz) : resultJuz}
                                    </small>
                                  </span>
                                </span>
                                {isTranslationMode ? (
                                  <span className="search-pro__translation">
                                    {result.text}
                                  </span>
                                ) : (
                                  <span className="search-pro__arabic" dir="rtl">
                                    {result.text}
                                  </span>
                                )}
                                <span className="search-pro__open">
                                  <ExternalLink size={12} />
                                  {t("search.openInReading", lang)}
                                </span>
                              </span>
                            </button>
                          </div>
                        );
                      })}
                      {visibleDuaResults.map((dua) => {
                            const surahMeta = getSurah(dua.surah);
                            const translatedName =
                              lang === "ar"
                                ? surahMeta?.ar
                                : lang === "fr"
                                  ? surahMeta?.fr || surahMeta?.en
                                  : surahMeta?.en;
                            const translation =
                              lang === "ar"
                                ? dua.ar || dua.fr
                                : lang === "en"
                                  ? dua.en
                                  : dua.fr;
                            return (
                              <div key={dua.id} role="listitem">
                                <button
                                  data-testid="search-result"
                                  data-surah={dua.surah}
                                  data-ayah={dua.ayah}
                                  className="search-pro__result search-pro__result--dua"
                                  onClick={() => goToAyah(dua.surah, dua.ayah)}
                                >
                                  <span className="search-pro__result-number">
                                    <Heart size={13} aria-hidden="true" />
                                  </span>
                                  <span className="search-pro__result-body">
                                    <span className="search-pro__result-top">
                                      <span className="search-pro__result-ref">
                                        <strong>{surahMeta?.ar}</strong>
                                        <span>{translatedName}</span>
                                        <b>:{lang === "ar" ? toAr(dua.ayah) : dua.ayah}</b>
                                      </span>
                                    </span>
                                    <span className="search-pro__arabic" dir="rtl">
                                      {dua.arabic}
                                    </span>
                                    {translation && (
                                      <span className="search-pro__translation">
                                        {translation}
                                      </span>
                                    )}
                                    <span className="search-pro__open">
                                      <ExternalLink size={12} />
                                      {t("search.openInReading", lang)}
                                    </span>
                                  </span>
                                </button>
                              </div>
                            );
                          })}
                    </div>
                  </section>
                </div>
              </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
