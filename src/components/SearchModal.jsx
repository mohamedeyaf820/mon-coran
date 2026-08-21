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
  sanitizeSearchQuery,
} from "../utils/searchIntelligence";
import { prepareSearchQuery } from "../services/searchWorkerService";
import { startPerformanceTimer } from "../services/performanceMetrics";
import useVoiceSearch from "../hooks/useVoiceSearch";

function formatSearchError(error, lang) {
  const message = String(error?.message || error || "").trim();
  if (/404|search failed|index unavailable|api error/i.test(message)) {
    return lang === "fr"
      ? "La recherche distante a échoué. Veuillez vérifier votre connexion internet."
      : lang === "ar"
        ? "تعذر البحث. يرجى التحقق من اتصالك بالإنترنت."
        : "Remote search failed. Please check your internet connection.";
  }
  return message;
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

  const handleVoiceTranscript = useCallback((transcript) => {
    const sanitized = sanitizeSearchQuery(transcript);
    if (!sanitized) return;
    setQuery(sanitized);
  }, []);

  const voiceSearch = useVoiceSearch({
    interfaceLanguage: lang,
    searchMode: containsArabic(query)
      ? "arabic"
      : lang === "en"
        ? "en"
        : lang === "fr"
          ? "fr"
          : "arabic",
    onTranscript: handleVoiceTranscript,
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
  }, [query]);

  useEffect(() => {
    const sanitized = sanitizeSearchQuery(query);
    if (!sanitized) return;

    const timeoutId = window.setTimeout(() => {
      void runSearch(sanitized);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [query, runSearch]);

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
            onInteractOutside={(e) => { e.preventDefault(); close(); }}
            onClick={(event) => event.stopPropagation()}
          >
              <Dialog.Description className="sr-only">
                {lang === "fr"
                  ? "Rechercher un verset par texte arabe, phonétique ou traduction."
                  : lang === "ar"
                    ? "ابحث عن آية بالنص العربي أو الكتابة الصوتية أو الترجمة."
                    : "Search for a verse by Arabic text, phonetics, or translation."}
              </Dialog.Description>
              <header className="search-pro__header">
                <div className="search-pro__title-wrap">
                  <span className="search-pro__mark" aria-hidden="true">
                    <Search size={16} />
                  </span>
                  <Dialog.Title asChild>
                    <h2>
                      {lang === "fr"
                        ? "Rechercher"
                        : lang === "ar"
                          ? "البحث"
                          : "Search"}
                    </h2>
                  </Dialog.Title>
                </div>
                <button
                  className="search-pro__close"
                  onClick={close}
                  aria-label={
                    lang === "fr"
                      ? "Fermer la recherche"
                      : lang === "ar"
                        ? "إغلاق البحث"
                        : "Close search"
                  }
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </header>

              <div className="search-pro__body">
                <div className="search-pro__main">
                  <section
                    className="search-pro__command"
                    aria-label={
                      lang === "fr" ? "Commande de recherche" : "Search command"
                    }
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
                        placeholder={
                          lang === "fr"
                            ? "Mot, verset ou traduction…"
                            : lang === "ar"
                              ? "كلمة أو آية أو ترجمة…"
                              : "Word, verse or translation…"
                        }
                        autoFocus
                        aria-controls="search-results-list"
                      />
                      <button
                        type="button"
                        className={`search-pro__voice-btn${voiceSearch.isListening ? " is-listening" : ""}`}
                        onClick={voiceSearch.toggle}
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
                        aria-label={
                          lang === "fr"
                            ? "Lancer la recherche"
                            : lang === "ar"
                              ? "بدء البحث"
                              : "Start search"
                        }
                      >
                        {loading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ArrowRight size={14} />
                        )}
                        <span>
                          {lang === "fr"
                            ? "Chercher"
                            : lang === "ar"
                              ? "بحث"
                              : "Search"}
                          </span>
                      </button>
                    </div>
                  </section>

                  {(voiceSearch.isListening || voiceSearch.isStarting) && (
                    <p
                      className="search-pro__voice-status"
                      role="status"
                      aria-live="polite"
                    >
                      <span aria-hidden="true" />
                      {t("search.voiceListening", lang)}
                    </p>
                  )}

                  {voiceSearch.errorCode && (
                    <p className="search-pro__voice-error" role="alert">
                      {t(`search.voiceErrors.${voiceSearch.errorCode}`, lang)}
                    </p>
                  )}

                  {error && <p className="search-pro__error">{error}</p>}

                  <section
                    className="search-pro__results"
                    aria-live="polite"
                    aria-atomic="false"
                    aria-label={
                      lang === "fr"
                        ? "Résultats"
                        : lang === "ar"
                          ? "نتائج البحث"
                          : "Search results"
                    }
                  >
                    {!query && !loading && (
                      <div className="search-pro__empty">
                        <div>
                          <p>
                            {lang === "fr"
                              ? "Écrivez un mot, un verset ou utilisez le micro."
                              : lang === "ar"
                                ? "اكتب كلمة أو آية أو استخدم الميكروفون."
                                : "Type a word, a verse, or use the microphone."}
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

                    {activeResultCount === 0 && !loading && query && (
                      <div className="search-pro__no-results">
                        <Search size={16} />
                        <strong>{t("search.noResults", lang)}</strong>
                      </div>
                    )}

                    {activeResultCount > 0 && (
                      <div className="search-pro__results-head">
                        <strong>
                          {lang === "fr"
                            ? `${activeResultCount} résultat${activeResultCount > 1 ? "s" : ""}`
                            : lang === "ar"
                              ? `${activeResultCount} نتيجة`
                              : `${activeResultCount} result${activeResultCount > 1 ? "s" : ""}`}
                        </strong>
                      </div>
                    )}

                    <div
                      className="search-pro__list"
                      id="search-results-list"
                      role="listbox"
                      aria-label={
                        lang === "ar"
                          ? "نتائج البحث"
                          : lang === "fr"
                            ? "Résultats de recherche"
                            : "Search results"
                      }
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
                            ? lang === "fr"
                              ? "Médinoise"
                              : lang === "ar"
                                ? "مدنية"
                                : "Medinan"
                            : lang === "fr"
                              ? "Mecquoise"
                              : lang === "ar"
                                ? "مكية"
                                : "Meccan";
                        const translatedName =
                          lang === "ar"
                            ? surahMeta?.ar
                            : lang === "fr"
                              ? surahMeta?.fr || surahMeta?.en
                              : surahMeta?.en;

                        return (
                          <button
                            key={`${surahNumber}-${ayahNumber}-${index}`}
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
                                {lang === "fr"
                                  ? "Ouvrir dans la lecture"
                                  : lang === "ar"
                                    ? "فتح في القراءة"
                                    : "Open in reading"}
                              </span>
                            </span>
                          </button>
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
                              <button
                                key={dua.id}
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
                                    {lang === "fr"
                                      ? "Ouvrir dans la lecture"
                                      : lang === "ar"
                                        ? "فتح في القراءة"
                                        : "Open in reading"}
                                  </span>
                                </span>
                              </button>
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
