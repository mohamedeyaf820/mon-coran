import React, {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "../styles/domains/search-home-polish.css";
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  Layers,
  BookOpen,
  Wand2,
  Compass,
  ExternalLink,
  Mic,
  Square,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { search, searchTranslation } from "../services/quranAPI";
import { getSurah, toAr } from "../data/surahs";
import { getJuzForAyah } from "../data/juz";
import {
  containsArabic,
  sanitizeSearchQuery,
} from "../utils/searchIntelligence";
import { prepareSearchQuery } from "../services/searchWorkerService";
import { startPerformanceTimer } from "../services/performanceMetrics";
import { Icon } from "./ui/icon";
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
  const [searchMode, setSearchMode] = useState("arabic");
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [activeResultIdx, setActiveResultIdx] = useState(-1);

  const handleVoiceTranscript = useCallback((transcript) => {
    const sanitized = sanitizeSearchQuery(transcript);
    if (!sanitized) return;
    setQuery(sanitized);
    setActiveResultIdx(-1);
    if (containsArabic(sanitized)) setSearchMode("arabic");
  }, []);

  const voiceSearch = useVoiceSearch({
    interfaceLanguage: lang,
    searchMode,
    onTranscript: handleVoiceTranscript,
  });

  const close = () => dispatch({ type: "SET", payload: { searchOpen: false } });

  const searchRequestIdRef = useRef(0);
  const searchAbortRef = useRef(null);
  const runSearch = useCallback(
    async (rawQuery = query, preferredMode = searchMode) => {
      const requestId = ++searchRequestIdRef.current;
      const finishMetric = startPerformanceTimer("search_response_ms");
      const { sanitized, effectiveMode, candidates } =
        await prepareSearchQuery(rawQuery, preferredMode);

      if (requestId !== searchRequestIdRef.current) return;

      if (candidates.length === 0) {
        startTransition(() => {
          setResults([]);
          setResolvedQuery("");
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
        let bestQuery = candidates[0];

        for (const candidate of candidates) {
          const data =
            effectiveMode === "fr" || effectiveMode === "en"
              ? await searchTranslation(
                  candidate,
                  effectiveMode,
                  null,
                  ctrl.signal,
                )
              : await search(candidate, riwaya, null, ctrl.signal);

          if (requestId !== searchRequestIdRef.current) return;

          const matches = Array.isArray(data?.matches) ? data.matches : [];
          if (matches.length > 0) {
            bestMatches = matches;
            bestQuery = candidate;
            break;
          }
        }

        if (requestId !== searchRequestIdRef.current) return;

        startTransition(() => {
          setResults(bestMatches);
          setResolvedQuery(bestQuery);
          setSearchMode(effectiveMode);
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
          setResolvedQuery("");
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
    [lang, query, riwaya, searchMode],
  );

  useEffect(() => {
    if (query.trim()) return;
    setResults([]);
    setError(null);
    setResolvedQuery("");
    setActiveResultIdx(-1);
  }, [query]);

  useEffect(() => {
    setActiveResultIdx(-1);
  }, [results]);

  useEffect(() => {
    const sanitized = sanitizeSearchQuery(query);
    if (!sanitized) return;

    const timeoutId = window.setTimeout(() => {
      void runSearch(sanitized, searchMode);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [query, runSearch, searchMode]);

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort?.();
      searchAbortRef.current = null;
    };
  }, []);

  const handleSearch = useCallback(async () => {
    await runSearch();
  }, [runSearch]);

  const goToAyah = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    close();
  };

  const searchModeLabels = {
    arabic: lang === "fr" ? "Arabe" : lang === "ar" ? "العربية" : "Arabic",
    phonetic:
      lang === "fr" ? "Phonétique" : lang === "ar" ? "صوتي" : "Phonetic",
    fr: "Traduction FR",
    en: "Translation EN",
  };

  const suggestionItems = [
    {
      mode: "arabic",
      value: "الرحمن",
      label:
        lang === "fr"
          ? "Texte arabe"
          : lang === "ar"
            ? "نص عربي"
            : "Arabic text",
    },
    {
      mode: "phonetic",
      value: "bismillah",
      label:
        lang === "fr"
          ? "Début de verset"
          : lang === "ar"
            ? "بداية آية"
            : "Verse opening",
    },
    {
      mode: "fr",
      value: "miséricorde",
      label:
        lang === "fr"
          ? "Traduction française"
          : lang === "ar"
            ? "ترجمة فرنسية"
            : "French translation",
    },
  ];

  const applySuggestion = (suggestion) => {
    setSearchMode(suggestion.mode);
    setQuery(suggestion.value);
    void runSearch(suggestion.value, suggestion.mode);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter") {
      if (activeResultIdx >= 0 && activeResultIdx < filteredResults.length) {
        const r = filteredResults[activeResultIdx];
        const surahNumber = r?.surah?.number || r?.surah || 1;
        const ayahNumber = r?.numberInSurah || r?.number || 1;
        goToAyah(surahNumber, ayahNumber);
      } else {
        handleSearch();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIdx((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : 0,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIdx((prev) =>
        prev > 0 ? prev - 1 : filteredResults.length - 1,
      );
    }
  };

  const isTranslationMode = searchMode === "fr" || searchMode === "en";
  const filteredResults = results;

  const searchModeOptions = [
    { id: "arabic", icon: "fa-font", label: searchModeLabels.arabic },
    {
      id: "phonetic",
      icon: "fa-wave-square",
      label: searchModeLabels.phonetic,
    },
    { id: "fr", icon: "fa-language", label: "FR" },
    { id: "en", icon: "fa-language", label: "EN" },
  ];

  const resultCountLabel = query
    ? lang === "fr"
      ? `${filteredResults.length} résultat${filteredResults.length > 1 ? "s" : ""}`
      : lang === "ar"
        ? `${filteredResults.length} نتيجة`
        : `${filteredResults.length} result${filteredResults.length > 1 ? "s" : ""}`
    : lang === "fr"
      ? "Recherche contextuelle"
      : lang === "ar"
        ? "بحث سياقي"
        : "Context search";

  return (
    <Dialog.Root
      open
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <Dialog.Portal>
        <div
          className="modal-overlay search-pro-overlay"
          onClick={close}
        >
          <Dialog.Content
            className="search-pro"
            aria-modal="true"
            lang={lang}
            dir={lang === "ar" ? "rtl" : "ltr"}
            onEscapeKeyDown={(e) => {
              e.preventDefault();
              close();
            }}
            onInteractOutside={(e) => { e.preventDefault(); close(); }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleInputKeyDown}
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
                  <div>
                    <p className="search-pro__eyebrow">
                      {lang === "fr"
                        ? "Recherche"
                        : lang === "ar"
                          ? "البحث"
                          : "Search"}
                    </p>
                    <Dialog.Title asChild>
                      <h2>{t("search.title", lang)}</h2>
                    </Dialog.Title>
                  </div>
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
                        lang={searchMode === "arabic" ? "ar" : searchMode === "en" ? "en" : "fr"}
                        dir={containsArabic(query) || searchMode === "arabic" ? "rtl" : "ltr"}
                        value={query}
                        onChange={(event) => {
                          voiceSearch.clearError();
                          setQuery(sanitizeSearchQuery(event.target.value));
                        }}
                        onKeyDown={handleInputKeyDown}
                        placeholder={
                          searchMode === "phonetic"
                            ? "Ex: bismillah rahmani rahim..."
                            : t("search.placeholder", lang)
                        }
                        autoFocus
                        role="combobox"
                        aria-expanded={filteredResults.length > 0}
                        aria-controls="search-results-list"
                        aria-activedescendant={
                          activeResultIdx >= 0
                            ? `search-result-${activeResultIdx}`
                            : undefined
                        }
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
                    </div>
                    <div className="search-pro__actions">
                      <button
                        className="search-pro__submit"
                        onClick={handleSearch}
                        disabled={loading}
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

                  <div
                    className="search-pro__modes"
                    role="tablist"
                    aria-label={
                      lang === "ar" ? "وضع البحث" : lang === "fr" ? "Mode de recherche" : "Search mode"
                    }
                  >
                    {searchModeOptions.map((modeOption) => (
                      <button
                        key={modeOption.id}
                        role="tab"
                        className={
                          searchMode === modeOption.id ? "is-active" : ""
                        }
                        onClick={() => setSearchMode(modeOption.id)}
                        aria-selected={searchMode === modeOption.id}
                      >
                        <Icon name={modeOption.icon} aria-hidden="true" />
                        <span>{modeOption.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="search-pro__summary">
                    <span>
                      <Layers size={13} />
                      {resultCountLabel}
                    </span>
                    <span>
                      <BookOpen size={13} />
                      {riwaya === "warsh" ? "Warsh" : "Hafs"}
                    </span>
                    {resolvedQuery && (
                      <span className="search-pro__resolved">
                        <Wand2 size={13} />
                        {resolvedQuery}
                      </span>
                    )}
                  </div>

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
                        <span className="search-pro__empty-icon">
                          <Compass size={24} />
                        </span>
                        <div>
                          <h3>
                            {lang === "fr"
                              ? "Retrouver rapidement un verset"
                              : lang === "ar"
                                ? "اعثر على الآية بسرعة"
                                : "Find a verse quickly"}
                          </h3>
                          <p>
                            {lang === "fr"
                              ? "Essaie un mot arabe, une transcription phonétique, une traduction ou le début d'un verset."
                              : lang === "ar"
                                ? "جرّب كلمة عربية أو كتابة صوتية أو ترجمة."
                                : "Try an Arabic word, phonetic spelling, or translation."}
                          </p>
                          <div className="search-pro__suggestions">
                            {suggestionItems.map((suggestion) => (
                              <button
                                key={`${suggestion.mode}-${suggestion.value}`}
                                type="button"
                                onClick={() => applySuggestion(suggestion)}
                              >
                                <small>{suggestion.label}</small>
                                <strong>{suggestion.value}</strong>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {filteredResults.length === 0 && !loading && query && (
                      <div className="search-pro__no-results">
                        <Search size={16} />
                        <strong>{t("search.noResults", lang)}</strong>
                      </div>
                    )}

                    {filteredResults.length > 0 && (
                      <div className="search-pro__results-head">
                        <strong>
                          {lang === "fr"
                            ? "Résultats les plus proches"
                            : lang === "ar"
                              ? "أقرب النتائج"
                              : "Closest matches"}
                        </strong>
                        <span>
                          {lang === "fr"
                            ? "Ouvrir pour continuer la lecture"
                            : lang === "ar"
                              ? "افتح لمتابعة القراءة"
                              : "Open to continue reading"}
                        </span>
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
                            id={`search-result-${index}`}
                            role="option"
                            aria-selected={activeResultIdx === index}
                            data-testid="search-result"
                            data-surah={surahNumber}
                            data-ayah={ayahNumber}
                            className={`search-pro__result ${isTranslationMode ? "is-translation" : ""} ${activeResultIdx === index ? "is-keyboard-active" : ""}`}
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
                                    Juz{" "}
                                    {lang === "ar"
                                      ? toAr(resultJuz)
                                      : resultJuz}
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
