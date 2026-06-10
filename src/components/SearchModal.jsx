import React, { startTransition, useCallback, useEffect, useRef, useState } from "react";
import "../styles/domains/search-home-polish.css";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { search, searchTranslation } from "../services/quranAPI";
import { getSurah, toAr } from "../data/surahs";
import { getJuzForAyah } from "../data/juz";
import {
  buildSearchCandidates,
  inferSearchMode,
} from "../utils/searchIntelligence";

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

function sanitizeSearchQuery(input) {
  return String(input || "")
    .trim()
    .slice(0, 200)
    .replace(/[^\p{L}\p{N}\s\u0600-\u06FF'.,;:!?()\-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
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

  const close = () => dispatch({ type: "TOGGLE_SEARCH" });

  const searchRequestIdRef = useRef(0);
  const searchAbortRef = useRef(null);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = "search-modal-title";

  const runSearch = useCallback(
    async (rawQuery = query, preferredMode = searchMode) => {
      const sanitized = sanitizeSearchQuery(rawQuery);
      const effectiveMode = inferSearchMode(sanitized, preferredMode);
      const candidates = buildSearchCandidates(sanitized, effectiveMode);

      if (candidates.length === 0) {
        startTransition(() => {
          setResults([]);
          setResolvedQuery("");
        });
        return;
      }

      const requestId = ++searchRequestIdRef.current;
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
              ? await searchTranslation(candidate, effectiveMode, null, ctrl.signal)
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
      } catch (err) {
        if (err?.name === "AbortError" || requestId !== searchRequestIdRef.current) {
          return;
        }
        setError(formatSearchError(err, lang));
        startTransition(() => {
          setResults([]);
          setResolvedQuery("");
        });
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

  useEffect(() => {
    const previous = document.activeElement;
    const raf = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, []);

  const handleModalKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  const handleSearch = useCallback(async () => {
    await runSearch();
  }, [runSearch]);

  const goToAyah = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    dispatch({ type: "TOGGLE_SEARCH" });
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
        lang === "fr" ? "Texte arabe" : lang === "ar" ? "نص عربي" : "Arabic text",
    },
    {
      mode: "phonetic",
      value: "bismillah",
      label:
        lang === "fr" ? "Début de verset" : lang === "ar" ? "بداية آية" : "Verse opening",
    },
    {
      mode: "fr",
      value: "misericorde",
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
        prev < filteredResults.length - 1 ? prev + 1 : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIdx((prev) =>
        prev > 0 ? prev - 1 : filteredResults.length - 1
      );
    }
  };

  const isTranslationMode = searchMode === "fr" || searchMode === "en";
  const filteredResults = results;

  const searchModeOptions = [
    { id: "arabic", icon: "fa-font", label: searchModeLabels.arabic },
    { id: "phonetic", icon: "fa-wave-square", label: searchModeLabels.phonetic },
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
    <div className="modal-overlay search-pro-overlay search-modal-shell" onClick={close}>
      <section
        className="search-pro"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
        onKeyDown={handleModalKeyDown}
      >
        <header className="search-pro__header">
          <div className="search-pro__title-wrap">
            <span className="search-pro__mark" aria-hidden="true">
              <i className="fas fa-magnifying-glass"></i>
            </span>
            <div>
              <p className="search-pro__eyebrow">
                {lang === "fr" ? "Recherche" : lang === "ar" ? "البحث" : "Search"}
              </p>
              <h2 id={titleId}>{t("search.title", lang)}</h2>
            </div>
          </div>
          <button
            className="search-pro__close"
            onClick={close}
            ref={closeButtonRef}
            aria-label={lang === "fr" ? "Fermer la recherche" : lang === "ar" ? "إغلاق البحث" : "Close search"}
          >
            <i className="fas fa-times"></i>
          </button>
        </header>

        <div className="search-pro__body">
          <main className="search-pro__main">
            <section className="search-pro__command" aria-label={lang === "fr" ? "Commande de recherche" : "Search command"}>
              <label className="search-pro__input-shell">
                <span aria-hidden="true"><i className="fas fa-search"></i></span>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(sanitizeSearchQuery(event.target.value))}
                  onKeyDown={handleInputKeyDown}
                  placeholder={searchMode === "phonetic" ? "Ex: bismillah rahmani rahim..." : t("search.placeholder", lang)}
                  autoFocus
                  role="combobox"
                  aria-expanded={filteredResults.length > 0}
                  aria-controls="search-results-list"
                  aria-activedescendant={activeResultIdx >= 0 ? `search-result-${activeResultIdx}` : undefined}
                />
              </label>
              <div className="search-pro__actions">
                <button className="search-pro__submit" onClick={handleSearch} disabled={loading}>
                  {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-arrow-right"></i>}
                  <span>{lang === "fr" ? "Chercher" : lang === "ar" ? "بحث" : "Search"}</span>
                </button>
              </div>
            </section>

            <div className="search-pro__modes" role="tablist" aria-label={lang === "fr" ? "Mode de recherche" : "Search mode"}>
              {searchModeOptions.map((modeOption) => (
                <button
                  key={modeOption.id}
                  className={searchMode === modeOption.id ? "is-active" : ""}
                  onClick={() => setSearchMode(modeOption.id)}
                  aria-pressed={searchMode === modeOption.id}
                >
                  <i className={`fas ${modeOption.icon}`}></i>
                  <span>{modeOption.label}</span>
                </button>
              ))}
            </div>

            <div className="search-pro__summary">
              <span><i className="fas fa-layer-group"></i>{resultCountLabel}</span>
              <span><i className="fas fa-book-quran"></i>{riwaya === "warsh" ? "Warsh" : "Hafs"}</span>
              {resolvedQuery && (
                <span className="search-pro__resolved">
                  <i className="fas fa-wand-magic-sparkles"></i>{resolvedQuery}
                </span>
              )}
            </div>

            {error && <p className="search-pro__error">{error}</p>}

            <section className="search-pro__results" aria-label={lang === "fr" ? "Résultats" : lang === "ar" ? "نتائج البحث" : "Search results"}>
              {!query && !loading && (
                <div className="search-pro__empty">
                  <span className="search-pro__empty-icon"><i className="fas fa-compass"></i></span>
                  <div>
                    <h3>{lang === "fr" ? "Retrouver rapidement un verset" : lang === "ar" ? "اعثر على الآية بسرعة" : "Find a verse quickly"}</h3>
                    <p>
                      {lang === "fr"
                        ? "Essaie un mot arabe, une transcription phonétique, une traduction ou le début d'un verset."
                        : lang === "ar"
                          ? "جرّب كلمة عربية أو كتابة صوتية أو ترجمة."
                          : "Try an Arabic word, phonetic spelling, or translation."}
                    </p>
                    <div className="search-pro__suggestions">
                      {suggestionItems.map((suggestion) => (
                        <button key={`${suggestion.mode}-${suggestion.value}`} type="button" onClick={() => applySuggestion(suggestion)}>
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
                  <i className="fas fa-search"></i>
                  <strong>{t("search.noResults", lang)}</strong>
                </div>
              )}

              {filteredResults.length > 0 && (
                <div className="search-pro__results-head">
                  <strong>{lang === "fr" ? "Résultats les plus proches" : lang === "ar" ? "أقرب النتائج" : "Closest matches"}</strong>
                  <span>{lang === "fr" ? "Ouvrir pour continuer la lecture" : lang === "ar" ? "افتح لمتابعة القراءة" : "Open to continue reading"}</span>
                </div>
              )}

              <div className="search-pro__list" id="search-results-list" role="listbox" aria-label={lang === "fr" ? "Résultats de recherche" : "Search results"}>
                {filteredResults.map((result, index) => {
                  const surahNumber = result?.surah?.number || result?.surah || 1;
                  const ayahNumber = result?.numberInSurah || result?.number || 1;
                  const surahMeta = getSurah(surahNumber);
                  const resultJuz = getJuzForAyah(Number(surahNumber), Number(ayahNumber));
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
                      className={`search-pro__result ${isTranslationMode ? "is-translation" : ""} ${activeResultIdx === index ? "is-keyboard-active" : ""}`}
                      onClick={() => goToAyah(surahNumber, ayahNumber)}
                    >
                      <span className="search-pro__result-number">{lang === "ar" ? toAr(surahNumber) : surahNumber}</span>
                      <span className="search-pro__result-body">
                        <span className="search-pro__result-top">
                          <span className="search-pro__result-ref">
                            <strong>{surahMeta?.ar}</strong>
                            <span>{translatedName}</span>
                            <b>:{lang === "ar" ? toAr(ayahNumber) : ayahNumber}</b>
                          </span>
                          <span className="search-pro__result-tags">
                            <small>{revelationLabel}</small>
                            <small>Juz {lang === "ar" ? toAr(resultJuz) : resultJuz}</small>
                          </span>
                        </span>
                        {isTranslationMode ? (
                          <span className="search-pro__translation">{result.text}</span>
                        ) : (
                          <span className="search-pro__arabic" dir="rtl">{result.text}</span>
                        )}
                        <span className="search-pro__open">
                          <i className="fas fa-arrow-up-right-from-square"></i>
                          {lang === "fr" ? "Ouvrir dans la lecture" : lang === "ar" ? "فتح في القراءة" : "Open in reading"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </main>
        </div>
      </section>
    </div>
  );
}
