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
  findSurahByName,
  guessLatinQueryKind,
  latinSourceOrder,
  parseSearchReference,
  sanitizeSearchQuery,
} from "../utils/searchIntelligence";
import { prepareSearchQuery } from "../services/searchWorkerService";
import { startPerformanceTimer } from "../services/performanceMetrics";
import useVoiceSearch from "../hooks/useVoiceSearch";

// The recogniser hears one language per session. There is no language to pick:
// it starts in the language of the interface, and when what it heard finds
// nothing it listens once more in Arabic (or in French from an Arabic
// interface), so Arabic recitation and French or English words both come through.
function interfaceVoiceTag(lang) {
  return lang === "ar" ? "ar-SA" : lang === "en" ? "en-US" : "fr-FR";
}

function fallbackVoiceTag(lang) {
  return lang === "ar" ? "fr-FR" : "ar-SA";
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

  // Naming a surah is the other way to ask for a position, and it is not a word
  // search the reader should have to win: the verses that mention "la vache" are
  // rarely the point. The jump sits above the results instead of replacing them.
  const namedSurah = useMemo(
    () => (reference ? null : findSurahByName(query)),
    [query, reference],
  );
  const jumpTarget = useMemo(
    () => reference || (namedSurah ? { kind: "surah", surah: namedSurah.n, ayah: 1 } : null),
    [reference, namedSurah],
  );

  const [voiceTag, setVoiceTag] = useState(() => interfaceVoiceTag(lang));
  const [voiceInterim, setVoiceInterim] = useState("");
  const [voiceNote, setVoiceNote] = useState("");
  const [pendingListen, setPendingListen] = useState(false);
  // What came out of the last dictation, and whether the second listen was used.
  const voiceTurnRef = useRef({ fromVoice: false, retried: false });
  const completedQueryRef = useRef("");
  const completedCountRef = useRef(0);

  const handleVoiceTranscript = useCallback((transcript) => {
    const sanitized = sanitizeSearchQuery(transcript);
    setVoiceInterim("");
    if (!sanitized) return;
    voiceTurnRef.current = { ...voiceTurnRef.current, fromVoice: true };
    setQuery(sanitized);
  }, []);

  const voiceSearch = useVoiceSearch({
    language: voiceTag,
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
          // Both translations are always asked, next to the transliteration: the
          // language of the query is guessed only to decide which answer leads.
          const translationLanguages = ["fr", "en"];
          const translationPlans = await Promise.all(
            translationLanguages.map((translationLanguage) =>
              prepareSearchQuery(sanitized, translationLanguage),
            ),
          );
          // The Arabic index holds Quranic script: a Latin candidate can only
          // come back empty from it, and each empty candidate costs one request
          // per edition. Only the transliterated forms are worth sending.
          const arabicCandidates = primary.candidates.filter(containsArabic);
          const attempts = await Promise.allSettled([
            runCandidates(arabicCandidates, (candidate) =>
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
          const bySource = { phonetic: attempts[0], fr: attempts[1], en: attempts[2] };
          const leading = latinSourceOrder(guessLatinQueryKind(sanitized), lang).find(
            (source) => bySource[source]?.status === "fulfilled" && bySource[source].value.length > 0,
          );
          if (leading) {
            bestMatches = bySource[leading].value;
            bestMode = leading;
          } else if (attempts.every((attempt) => attempt.status === "rejected")) {
            throw attempts[0].reason;
          }
        }

        if (requestId !== searchRequestIdRef.current) return;

        completedQueryRef.current = sanitized;
        completedCountRef.current = bestMatches.length;
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

  // One example of each kind of query the search understands on its own.
  const suggestionItems = [
    { value: "الرحمن" },
    { value: "kulhuallah" },
    { value: lang === "en" ? "the most merciful" : "le tout miséricordieux" },
  ];

  const applySuggestion = (suggestion) => {
    setQuery(suggestion.value);
    void runSearch(suggestion.value);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (jumpTarget) {
        goToReference(jumpTarget);
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

  // A dictation that found nothing is listened to once more in the other
  // language, without asking the user to choose one.
  useEffect(() => {
    const turn = voiceTurnRef.current;
    const sanitized = sanitizeSearchQuery(query);
    if (!turn.fromVoice || turn.retried || !sanitized) return;
    if (loading || error || jumpTarget || voiceSearch.isListening || voiceSearch.isStarting) return;
    if (completedQueryRef.current !== sanitized) return;
    if (completedCountRef.current > 0 || visibleDuaResults.length > 0) return;
    voiceTurnRef.current = { fromVoice: false, retried: true };
    setVoiceNote(t(voiceTag === "ar-SA" ? "search.voiceRetryFr" : "search.voiceRetryAr", lang));
    setVoiceTag(fallbackVoiceTag(lang));
    setPendingListen(true);
  }, [query, loading, error, jumpTarget, visibleDuaResults, voiceSearch.isListening, voiceSearch.isStarting, voiceTag, lang]);

  useEffect(() => {
    if (!pendingListen) return;
    setPendingListen(false);
    voiceSearch.toggle();
  }, [pendingListen, voiceSearch]);

  const handleMicClick = () => {
    if (voiceSearch.isListening) {
      voiceSearch.toggle();
      return;
    }
    voiceTurnRef.current = { fromVoice: false, retried: false };
    setVoiceNote("");
    const own = interfaceVoiceTag(lang);
    if (voiceTag !== own) {
      // The language is applied when the session starts: wait for the new tag.
      setVoiceTag(own);
      setPendingListen(true);
      return;
    }
    voiceSearch.toggle();
  };

  const referenceDisplay = useMemo(() => {
    if (!jumpTarget) return null;
    const digit = (value) => (lang === "ar" ? toAr(value) : String(value));
    const key =
      jumpTarget.kind === "juz"
        ? "goToJuz"
        : jumpTarget.kind === "surah"
          ? "goToSurah"
          : "goToAyah";
    const position =
      jumpTarget.kind === "ayah"
        ? `${digit(jumpTarget.surah)}:${digit(jumpTarget.ayah)}`
        : digit(jumpTarget.kind === "juz" ? jumpTarget.juz : jumpTarget.surah);
    const surahMeta =
      jumpTarget.kind === "juz" ? null : getSurah(jumpTarget.surah);
    return {
      label: t(`search.${key}`, lang).replace("{n}", position),
      translatedName:
        surahMeta && (lang === "fr" ? surahMeta.fr || surahMeta.en : surahMeta.en),
      arabicName: surahMeta?.ar,
    };
  }, [jumpTarget, lang]);

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
                        onClick={handleMicClick}
                        onKeyDown={(event) => event.stopPropagation()}
                        aria-label={t(
                          voiceSearch.isListening
                            ? "search.voiceStop"
                            : "search.voiceStart",
                          lang,
                        )}
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
                          {voiceInterim || voiceNote || t("search.voiceListening", lang)}
                        </p>
                      )}
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
                    {jumpTarget && !loading && referenceDisplay && (
                      <button
                        type="button"
                        data-testid="search-reference"
                        className="search-pro__reference"
                        onClick={() => goToReference(jumpTarget)}
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

                    {activeResultCount === 0 && !loading && query && !error && !jumpTarget && (
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
                        {filteredResults.length > 0 && (
                          <span className="search-pro__detected">
                            {t(`search.detected.${resultMode}`, lang)}
                          </span>
                        )}
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
