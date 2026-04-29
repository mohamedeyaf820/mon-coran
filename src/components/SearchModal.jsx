import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { search, searchTranslation } from "../services/quranAPI";
import SURAHS, { getSurah, toAr } from "../data/surahs";
import { getJuzForAyah } from "../data/juz";
import {
  buildSearchCandidates,
  inferSearchMode,
  sanitizeVoiceTranscript,
} from "../utils/searchIntelligence";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function getVoiceLocale(mode, lang) {
  if (mode === "arabic" || mode === "phonetic") return "ar-SA";
  if (mode === "fr") return "fr-FR";
  if (mode === "en") return "en-US";
  return lang === "fr" ? "fr-FR" : "en-US";
}

function formatSearchError(error, lang) {
  const message = String(error?.message || error || "").trim();
  if (/404|search failed|index unavailable|api error/i.test(message)) {
    return lang === "fr"
      ? "La recherche distante a echoue. L'application a tente un fallback local, mais aucun resultat fiable n'a ete trouve."
      : lang === "ar"
        ? "تعذر البحث البعيد. حاول التطبيق التراجع محلياً لكن لم يتم العثور على نتيجة موثوقة."
        : "Remote search failed. The app attempted a local fallback, but no reliable result was found.";
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

function normalizeFilterText(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s\u0600-\u06FF]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SearchModal() {
  const { state, dispatch, set } = useApp();
  const { lang, riwaya, currentSurah, currentJuz } = state;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const [searchMode, setSearchMode] = useState("arabic");
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [voiceSummary, setVoiceSummary] = useState(null);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [sortMode, setSortMode] = useState("relevance");
  const [openingOnly, setOpeningOnly] = useState(false);

  const close = () => dispatch({ type: "TOGGLE_SEARCH" });

  const recognitionRef = useRef(null);
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
    setVoiceSummary(null);
  }, [query]);

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
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
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

  const startVoiceSearch = useCallback(() => {
    if (!SpeechRecognition) {
      setError(
        lang === "fr"
          ? "Recherche vocale non supportée sur ce navigateur."
          : lang === "ar"
            ? "البحث الصوتي غير متاح على هذا المتصفح."
            : "Voice search is not supported on this browser.",
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop?.();
      return;
    }

    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = getVoiceLocale(searchMode, lang);
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const cleaned = sanitizeVoiceTranscript(transcript);
      const inferredMode = inferSearchMode(cleaned, searchMode);

      setQuery(cleaned);
      setVoiceSummary({
        transcript,
        cleaned,
      });
      setListening(false);
      void runSearch(cleaned, inferredMode);
    };

    rec.start();
  }, [lang, listening, runSearch, searchMode]);

  const handleSearch = useCallback(async () => {
    setVoiceSummary(null);
    await runSearch();
  }, [runSearch]);

  const goToAyah = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    dispatch({ type: "TOGGLE_SEARCH" });
  };

  const searchModeLabels = {
    arabic: lang === "fr" ? "Arabe" : lang === "ar" ? "عربي" : "Arabic",
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
    setScopeFilter("all");
    setSortMode("relevance");
    setOpeningOnly(suggestion.mode === "arabic");
    setQuery(suggestion.value);
    setVoiceSummary(null);
    void runSearch(suggestion.value, suggestion.mode);
  };

  const isTranslationMode = searchMode === "fr" || searchMode === "en";
  const filteredResults = useMemo(() => {
    const needle = normalizeFilterText(resolvedQuery || query);
    const hasArabicNeedle = /[\u0600-\u06FF]/.test(needle);
    const scoped = results.filter((result) => {
      const surahNumber = Number(result?.surah?.number || result?.surah || 1);
      const ayahNumber = Number(result?.numberInSurah || result?.number || 1);
      const surahMeta = SURAHS.find((surahItem) => surahItem.n === surahNumber);

      if (scopeFilter === "currentSurah" && surahNumber !== currentSurah) return false;
      if (
        scopeFilter === "currentJuz" &&
        getJuzForAyah(surahNumber, ayahNumber) !== currentJuz
      ) {
        return false;
      }
      if (scopeFilter === "meccan" && surahMeta?.type !== "Meccan") return false;
      if (scopeFilter === "medinan" && surahMeta?.type !== "Medinan") return false;

      if (openingOnly && needle && (isTranslationMode || hasArabicNeedle)) {
        return normalizeFilterText(result?.text).startsWith(needle);
      }

      return true;
    });

    if (sortMode !== "mushaf") return scoped;
    return [...scoped].sort((a, b) => {
      const surahA = Number(a?.surah?.number || a?.surah || 1);
      const surahB = Number(b?.surah?.number || b?.surah || 1);
      const ayahA = Number(a?.numberInSurah || a?.number || 1);
      const ayahB = Number(b?.numberInSurah || b?.number || 1);
      return surahA === surahB ? ayahA - ayahB : surahA - surahB;
    });
  }, [
    currentJuz,
    currentSurah,
    isTranslationMode,
    openingOnly,
    query,
    resolvedQuery,
    results,
    scopeFilter,
    sortMode,
  ]);

  const scopeOptions = [
    { id: "all", icon: "fa-layer-group", label: lang === "fr" ? "Tout" : lang === "ar" ? "الكل" : "All" },
    {
      id: "currentSurah",
      icon: "fa-book-open",
      label:
        lang === "fr"
          ? "Sourate actuelle"
          : lang === "ar"
            ? "السورة الحالية"
            : "Current surah",
    },
    {
      id: "currentJuz",
      icon: "fa-book-bookmark",
      label: lang === "fr" ? "Juz actuel" : lang === "ar" ? "الجزء الحالي" : "Current juz",
    },
    {
      id: "meccan",
      icon: "fa-kaaba",
      label: lang === "fr" ? "Mecquoises" : lang === "ar" ? "مكية" : "Meccan",
    },
    {
      id: "medinan",
      icon: "fa-mosque",
      label: lang === "fr" ? "Medinoises" : lang === "ar" ? "مدنية" : "Medinan",
    },
  ];
  const filterTip =
    lang === "fr"
      ? "Possibilites: limiter a la sourate en cours, au juz, au type de revelation, ou chercher uniquement un debut de verset."
      : lang === "ar"
        ? "خيارات: حصر البحث في السورة الحالية أو الجزء أو نوع النزول أو بداية الآية فقط."
        : "Options: limit to the current surah, juz, revelation type, or verse openings only.";
  const activeFilterCount =
    (scopeFilter !== "all" ? 1 : 0) +
    (sortMode !== "relevance" ? 1 : 0) +
    (openingOnly ? 1 : 0);
  const currentSurahMeta = getSurah(currentSurah);
  const currentSurahLabel =
    lang === "ar"
      ? currentSurahMeta?.ar
      : lang === "fr"
        ? currentSurahMeta?.fr || currentSurahMeta?.en
        : currentSurahMeta?.en;
  const searchModeOptions = [
    { id: "arabic", icon: "fa-font", label: searchModeLabels.arabic },
    { id: "phonetic", icon: "fa-wave-square", label: searchModeLabels.phonetic },
    { id: "fr", icon: "fa-language", label: "FR" },
    { id: "en", icon: "fa-language", label: "EN" },
  ];
  const filterPresets = [
    {
      icon: "fa-location-crosshairs",
      label:
        lang === "fr"
          ? "Dans la sourate actuelle"
          : lang === "ar"
            ? "ÙÙŠ Ø§Ù„Ø³ÙˆØ±Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©"
            : "Current surah only",
      action: () => setScopeFilter("currentSurah"),
    },
    {
      icon: "fa-book-bookmark",
      label:
        lang === "fr"
          ? "Dans le juz actuel"
          : lang === "ar"
            ? "ÙÙŠ Ø§Ù„Ø¬Ø²Ø¡ Ø§Ù„Ø­Ø§Ù„ÙŠ"
            : "Current juz only",
      action: () => setScopeFilter("currentJuz"),
    },
    {
      icon: "fa-quote-left",
      label:
        lang === "fr"
          ? "Debut exact"
          : lang === "ar"
            ? "Ø¨Ø¯Ø§ÙŠØ© Ø¯Ù‚ÙŠÙ‚Ø©"
            : "Exact opening",
      action: () => setOpeningOnly(true),
    },
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
    <div className="modal-overlay search-pro-overlay" onClick={close}>
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
                {lang === "fr" ? "Recherche intelligente" : lang === "ar" ? "بحث ذكي" : "Smart search"}
              </p>
              <h2 id={titleId}>{t("search.title", lang)}</h2>
              <p className="search-pro__subtitle">
                {lang === "fr"
                  ? "Arabe, phonetique, traduction, voix et debut de verset dans une seule recherche."
                  : lang === "ar"
                    ? "بحث بالعربية والصوت والترجمة وبداية الآية في مكان واحد."
                    : "Arabic, phonetic, translation, voice, and verse-opening search in one place."}
              </p>
            </div>
          </div>
          <div className="search-pro__context" aria-label={lang === "fr" ? "Contexte de lecture" : "Reading context"}>
            <span><i className="fas fa-book-open"></i>{currentSurahLabel}</span>
            <span><i className="fas fa-book-bookmark"></i>Juz {lang === "ar" ? toAr(currentJuz) : currentJuz}</span>
            <span><i className="fas fa-sliders"></i>{activeFilterCount}</span>
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
                  onKeyDown={(event) => event.key === "Enter" && handleSearch()}
                  placeholder={searchMode === "phonetic" ? "Ex: bismillah rahmani rahim..." : t("search.placeholder", lang)}
                  autoFocus
                />
              </label>
              <div className="search-pro__actions">
                {SpeechRecognition && (
                  <button
                    className={`search-pro__icon-btn ${listening ? "is-listening" : ""}`}
                    onClick={startVoiceSearch}
                    aria-label={listening ? "Stop voice search" : "Start voice search"}
                  >
                    <i className={`fas ${listening ? "fa-stop" : "fa-microphone"}`}></i>
                  </button>
                )}
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

            {voiceSummary && (
              <div className="search-pro__voice">
                <i className="fas fa-microphone-lines"></i>
                <div>
                  <strong>{lang === "fr" ? "Interpretation vocale" : lang === "ar" ? "تحليل الصوت" : "Voice interpretation"}</strong>
                  <span>{voiceSummary.cleaned || voiceSummary.transcript}</span>
                </div>
              </div>
            )}

            {error && <p className="search-pro__error">{error}</p>}

            <section className="search-pro__results" aria-label={lang === "fr" ? "Resultats" : "Search results"}>
              {!query && !loading && (
                <div className="search-pro__empty">
                  <span className="search-pro__empty-icon"><i className="fas fa-compass"></i></span>
                  <div>
                    <h3>{lang === "fr" ? "Retrouver rapidement un verset" : lang === "ar" ? "اعثر على الآية بسرعة" : "Find a verse quickly"}</h3>
                    <p>
                      {lang === "fr"
                        ? "Essaie un mot arabe, une transcription phonetique, une traduction ou le debut d'une ayah."
                        : lang === "ar"
                          ? "جرّب كلمة عربية أو كتابة صوتية أو ترجمة أو بداية آية."
                          : "Try an Arabic word, phonetic spelling, translation, or verse opening."}
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
                  <span>
                    {lang === "fr"
                      ? "Essaie un autre mode, retire un filtre ou cherche seulement le debut du verset."
                      : lang === "ar"
                        ? "جرّب وضعا آخر أو أزل بعض الفلاتر."
                        : "Try another mode, remove a filter, or search only the verse opening."}
                  </span>
                </div>
              )}

              {filteredResults.length > 0 && (
                <div className="search-pro__results-head">
                  <strong>{lang === "fr" ? "Resultats les plus proches" : lang === "ar" ? "أقرب النتائج" : "Closest matches"}</strong>
                  <span>{lang === "fr" ? "Ouvrir pour continuer la lecture" : lang === "ar" ? "افتح لمتابعة القراءة" : "Open to continue reading"}</span>
                </div>
              )}

              <div className="search-pro__list">
                {filteredResults.map((result, index) => {
                  const surahNumber = result?.surah?.number || result?.surah || 1;
                  const ayahNumber = result?.numberInSurah || result?.number || 1;
                  const surahMeta = getSurah(surahNumber);
                  const resultJuz = getJuzForAyah(Number(surahNumber), Number(ayahNumber));
                  const revelationLabel =
                    surahMeta?.type === "Medinan"
                      ? lang === "fr"
                        ? "Medinoise"
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
                      className={`search-pro__result ${isTranslationMode ? "is-translation" : ""}`}
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

          <aside className="search-pro__rail" aria-label={lang === "fr" ? "Filtres" : "Filters"}>
            <section className="search-pro__panel">
              <div className="search-pro__panel-head">
                <div>
                  <strong>{lang === "fr" ? "Filtres" : lang === "ar" ? "الفلاتر" : "Filters"}</strong>
                  <span>{activeFilterCount} {lang === "fr" ? "actif(s)" : "active"}</span>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setScopeFilter("all");
                      setSortMode("relevance");
                      setOpeningOnly(false);
                    }}
                  >
                    {lang === "fr" ? "Reset" : lang === "ar" ? "إعادة" : "Reset"}
                  </button>
                )}
              </div>

              <div className="search-pro__preset-grid">
                {filterPresets.map((preset) => (
                  <button key={preset.label} type="button" onClick={preset.action}>
                    <i className={`fas ${preset.icon}`}></i>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>

              <div className="search-pro__scope">
                {scopeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={scopeFilter === option.id ? "is-active" : ""}
                    onClick={() => setScopeFilter(option.id)}
                    aria-pressed={scopeFilter === option.id}
                  >
                    <i className={`fas ${option.icon}`}></i>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>

              <label className="search-pro__select">
                <span>{lang === "fr" ? "Tri" : lang === "ar" ? "الترتيب" : "Sort"}</span>
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                  <option value="relevance">{lang === "fr" ? "Pertinence" : lang === "ar" ? "الأقرب" : "Relevance"}</option>
                  <option value="mushaf">{lang === "fr" ? "Ordre du mushaf" : lang === "ar" ? "ترتيب المصحف" : "Mushaf order"}</option>
                </select>
              </label>

              <button
                type="button"
                className={`search-pro__toggle ${openingOnly ? "is-active" : ""}`}
                onClick={() => setOpeningOnly((value) => !value)}
                aria-pressed={openingOnly}
              >
                <i className="fas fa-quote-left"></i>
                <span>{lang === "fr" ? "Debut de verset uniquement" : lang === "ar" ? "بداية الآية فقط" : "Verse opening only"}</span>
              </button>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );

  return (
    <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
      <div
        className="modal modal-panel--wide modal-search-panel search-modal-shell search-modal-shell--premium-plus search-modal-shell--refonte !w-full !max-w-5xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
        onKeyDown={handleModalKeyDown}
      >
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === "fr" ? "Recherche intelligente" : lang === "ar" ? "بحث ذكي" : "Smart search"}
            </div>
            <h2 className="modal-title" id={titleId}>{t("search.title", lang)}</h2>
            <div className="modal-subtitle">
              {lang === "fr"
                ? "Texte arabe, phonétique, traduction et recherche vocale sur début de verset."
                : lang === "ar"
                  ? "بحث بالنص العربي أو الصوتي أو الترجمة مع فهم لبداية الآية."
                  : "Arabic, phonetic, translation, and verse-opening voice search."}
            </div>
          </div>
          <div className="search-header-metrics" aria-hidden="true">
            <span>
              <i className="fas fa-book-open"></i>
              {currentSurahLabel}
            </span>
            <span>
              <i className="fas fa-book-bookmark"></i>
              Juz {lang === "ar" ? toAr(currentJuz) : currentJuz}
            </span>
            <span>
              <i className="fas fa-sliders"></i>
              {activeFilterCount || (lang === "ar" ? toAr(0) : 0)}
            </span>
          </div>
          <button
            className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]"
            onClick={close}
            ref={closeButtonRef}
            aria-label={
              lang === "fr"
                ? "Fermer la recherche"
                : lang === "ar"
                  ? "إغلاق البحث"
                  : "Close search"
            }
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="search-command-deck !space-y-2 !p-3 sm:!p-4">
          <div className="search-command-title">
            <span className="search-command-title__icon">
              <i className="fas fa-magnifying-glass"></i>
            </span>
            <div>
              <strong>
                {lang === "fr" ? "Que veux-tu retrouver ?" : lang === "ar" ? "Ù…Ø§ Ø§Ù„Ø°ÙŠ ØªØ±ÙŠØ¯ Ø§Ù„Ø¨Ø­Ø« Ø¹Ù†Ù‡ØŸ" : "What are you looking for?"}
              </strong>
              <span>
                {lang === "fr"
                  ? "Tape un mot, une traduction ou le debut d'une ayah."
                  : lang === "ar"
                    ? "Ø§ÙƒØªØ¨ ÙƒÙ„Ù…Ø© Ø£Ùˆ ØªØ±Ø¬Ù…Ø© Ø£Ùˆ Ø¨Ø¯Ø§ÙŠØ© Ø¢ÙŠØ©."
                    : "Type a word, translation, or opening of an ayah."}
              </span>
            </div>
          </div>
          <div className="modal-toolbar search-toolbar-surface !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-2">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(sanitizeSearchQuery(event.target.value))}
              onKeyDown={(event) => event.key === "Enter" && handleSearch()}
              placeholder={
                searchMode === "phonetic"
                  ? lang === "fr"
                    ? "Ex: bismillah rahmani rahim..."
                    : lang === "ar"
                      ? "مثال: بسم الله الرحمن الرحيم"
                      : "Ex: bismillah rahmani rahim..."
                  : t("search.placeholder", lang)
              }
              className="modal-search-input !min-h-11 !flex-1 !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-3"
              autoFocus
            />
            {SpeechRecognition && (
              <button
                className={`modal-action-btn modal-voice-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]${listening ? " listening !bg-red-500/20 !border-red-300/30" : ""}`}
                onClick={startVoiceSearch}
                title={
                  listening
                    ? lang === "fr"
                      ? "Arrêter l'écoute"
                      : lang === "ar"
                        ? "إيقاف الاستماع"
                        : "Stop listening"
                    : lang === "fr"
                      ? "Recherche vocale"
                      : lang === "ar"
                        ? "بحث صوتي"
                        : "Voice search"
                }
                  aria-label={
                    listening
                      ? lang === "fr"
                        ? "Arrêter la recherche vocale"
                        : lang === "ar"
                          ? "إيقاف البحث الصوتي"
                          : "Stop voice search"
                      : lang === "fr"
                        ? "Démarrer la recherche vocale"
                        : lang === "ar"
                          ? "بدء البحث الصوتي"
                          : "Start voice search"
                  }
              >
                <i className={`fas ${listening ? "fa-stop" : "fa-microphone"}`}></i>
              </button>
            )}
              <button className="modal-action-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-sky-200/30 !bg-sky-500/20 hover:!bg-sky-500/30" onClick={handleSearch} disabled={loading} aria-label={lang === "fr" ? "Lancer la recherche" : lang === "ar" ? "تنفيذ البحث" : "Run search"}>
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
            </button>
          </div>

          <div
            className="modal-segmented !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-1"
            role="tablist"
            aria-label={
              lang === "fr" ? "Mode de recherche" : lang === "ar" ? "وضع البحث" : "Search mode"
            }
          >
            {searchModeOptions.map((modeOption) => (
              <button
                key={modeOption.id}
                className={`modal-segmented-btn !rounded-xl !px-3 !py-2 !text-sm !transition-all hover:!bg-white/[0.08] ${searchMode === modeOption.id ? "active !bg-sky-500/25 !text-white" : ""}`}
                onClick={() => setSearchMode(modeOption.id)}
              >
                <i className={`fas ${modeOption.icon}`}></i> {modeOption.label}
              </button>
            ))}
          </div>

          <div className="search-summary-bar !flex !flex-wrap !gap-2">
            <span className="search-summary-pill !inline-flex !items-center !gap-1.5 !rounded-full !border !border-white/14 !bg-white/[0.05] !px-2.5 !py-1 !text-xs">
              <i className="fas fa-layer-group"></i>
              {resultCountLabel}
            </span>
            <span className="search-summary-pill !inline-flex !items-center !gap-1.5 !rounded-full !border !border-white/14 !bg-white/[0.05] !px-2.5 !py-1 !text-xs">
              <i className="fas fa-wave-square"></i>
              {searchModeLabels[searchMode]}
            </span>
            <span className="search-summary-pill search-summary-pill--riwaya !inline-flex !items-center !gap-1.5 !rounded-full !border !border-white/14 !bg-white/[0.05] !px-2.5 !py-1 !text-xs">
              <i className="fas fa-book-quran"></i>
              {riwaya === "warsh" ? "Warsh" : "Hafs"}
            </span>
            {resolvedQuery && (
              <span className="search-summary-pill search-summary-pill--query !inline-flex !items-center !gap-1.5 !rounded-full !border !border-sky-200/30 !bg-sky-500/18 !px-2.5 !py-1 !text-xs">
                <i className="fas fa-sparkles"></i>
                {resolvedQuery}
              </span>
            )}
          </div>

          <div className="search-filter-panel">
            <div className="search-filter-panel__head">
              <div>
                <strong>
                  {lang === "fr" ? "Filtres de recherche" : lang === "ar" ? "فلاتر البحث" : "Search filters"}
                </strong>
                <span>{filterTip}</span>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="search-filter-reset"
                  onClick={() => {
                    setScopeFilter("all");
                    setSortMode("relevance");
                    setOpeningOnly(false);
                  }}
                >
                  {lang === "fr" ? "Reinitialiser" : lang === "ar" ? "إعادة ضبط" : "Reset"}
                </button>
              )}
            </div>
            <div className="search-filter-presets">
              {filterPresets.map((preset) => (
                <button key={preset.label} type="button" onClick={preset.action}>
                  <i className={`fas ${preset.icon}`}></i>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
            <div className="search-filter-panel__grid">
              <div className="search-filter-chipset" role="group" aria-label="Portee de recherche">
                {scopeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`search-filter-chip ${scopeFilter === option.id ? "is-active" : ""}`}
                    onClick={() => setScopeFilter(option.id)}
                    aria-pressed={scopeFilter === option.id}
                  >
                    <i className={`fas ${option.icon}`}></i>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              <div className="search-filter-controls">
                <label className="search-filter-select">
                  <span>{lang === "fr" ? "Tri" : lang === "ar" ? "الترتيب" : "Sort"}</span>
                  <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                    <option value="relevance">
                      {lang === "fr" ? "Pertinence" : lang === "ar" ? "الأقرب" : "Relevance"}
                    </option>
                    <option value="mushaf">
                      {lang === "fr" ? "Ordre du mushaf" : lang === "ar" ? "ترتيب المصحف" : "Mushaf order"}
                    </option>
                  </select>
                </label>
                <button
                  type="button"
                  className={`search-filter-toggle ${openingOnly ? "is-active" : ""}`}
                  onClick={() => setOpeningOnly((value) => !value)}
                  aria-pressed={openingOnly}
                >
                  <i className="fas fa-quote-left"></i>
                  <span>
                    {lang === "fr" ? "Debut de verset" : lang === "ar" ? "بداية الآية" : "Verse opening"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {voiceSummary && (
            <div className="search-voice-note !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-3">
              <div className="search-voice-note__title">
                <i className="fas fa-microphone-lines"></i>
                {lang === "fr"
                  ? "Interprétation vocale"
                  : lang === "ar"
                    ? "تحليل الإدخال الصوتي"
                    : "Voice interpretation"}
              </div>
              <div className="search-voice-note__body">
                <span>{voiceSummary.transcript}</span>
                {voiceSummary.cleaned && voiceSummary.cleaned !== voiceSummary.transcript && (
                  <span className="search-voice-note__cleaned">{voiceSummary.cleaned}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-results modal-search-results !max-h-[58vh] !overflow-auto !px-3 !pb-3 sm:!px-4 sm:!pb-4">
          {!query && !loading && (
            <div className="search-spotlight !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-4">
              <div className="search-spotlight-icon !inline-flex !h-12 !w-12 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05]">
                <i className="fas fa-compass"></i>
              </div>
              <div className="search-spotlight-body">
                <h3>
                  {lang === "fr"
                    ? "Retrouver un verset à partir de son début"
                    : lang === "ar"
                      ? "اعثر على الآية من بدايتها"
                      : "Find a verse from its opening words"}
                </h3>
                <p>
                  {lang === "fr"
                    ? "Dicte le début d'une ayah, écris en arabe ou en phonétique, et l'application retrouve le verset complet."
                    : lang === "ar"
                      ? "قل بداية الآية أو اكتبها عربيًا أو صوتيًا، وسيتم عرض الآية كاملة."
                      : "Say the opening of an ayah, type it in Arabic or phonetics, and the full verse will appear."}
                </p>
                <div className="search-spotlight-chips !mt-3 !grid !grid-cols-1 !gap-2 sm:!grid-cols-3">
                  {suggestionItems.map((suggestion) => (
                    <button
                      key={`${suggestion.mode}-${suggestion.value}`}
                      type="button"
                      className="search-spotlight-chip !rounded-xl !border !border-white/14 !bg-white/[0.05] !p-2.5 !text-left !transition-all hover:!border-sky-200/40 hover:!bg-white/[0.1]"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <span className="search-spotlight-chip__label">{suggestion.label}</span>
                      <span className="search-spotlight-chip__value">{suggestion.value}</span>
                    </button>
                  ))}
                </div>
                <div className="search-empty-hints">
                  <span>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    {lang === "fr"
                      ? "Recherche intelligente arabe/phonetique"
                      : lang === "ar"
                        ? "Ø¨Ø­Ø« Ø°ÙƒÙŠ Ø¹Ø±Ø¨ÙŠ ÙˆØµÙˆØªÙŠ"
                        : "Smart Arabic and phonetic search"}
                  </span>
                  <span>
                    <i className="fas fa-filter"></i>
                    {lang === "fr"
                      ? "Filtres par sourate, juz et revelation"
                      : lang === "ar"
                        ? "ÙÙ„Ø§ØªØ± Ø¨Ø§Ù„Ø³ÙˆØ±Ø© ÙˆØ§Ù„Ø¬Ø²Ø¡ ÙˆØ§Ù„Ù†Ø²ÙˆÙ„"
                        : "Filters by surah, juz, and revelation"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {filteredResults.length === 0 && !loading && query && (
            <div className="modal-empty !rounded-2xl !border !border-dashed !border-white/15 !bg-white/[0.03] !p-6 !text-center">
              <i className="fas fa-search"></i>
              <div>{t("search.noResults", lang)}</div>
            </div>
          )}

          {filteredResults.length > 0 && (
            <div className="search-results-meta">
              <span>
                {lang === "fr"
                  ? "Résultats les plus proches"
                  : lang === "ar"
                    ? "أقرب النتائج"
                    : "Closest matches"}
              </span>
              <span>
                {lang === "fr"
                  ? "Ouvrir pour lire le verset complet"
                  : lang === "ar"
                    ? "افتح لقراءة الآية كاملة"
                    : "Open to read the full verse"}
              </span>
            </div>
          )}

          {filteredResults.map((result, index) => {
            const surahNumber = result?.surah?.number || result?.surah || 1;
            const ayahNumber = result?.numberInSurah || result?.number || 1;
            const surahMeta = getSurah(surahNumber);
            const resultJuz = getJuzForAyah(Number(surahNumber), Number(ayahNumber));
            const revelationLabel =
              surahMeta?.type === "Medinan"
                ? lang === "fr"
                  ? "Medinoise"
                  : lang === "ar"
                    ? "Ù…Ø¯Ù†ÙŠØ©"
                    : "Medinan"
                : lang === "fr"
                  ? "Mecquoise"
                  : lang === "ar"
                    ? "Ù…ÙƒÙŠØ©"
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
                className={`modal-item-card search-result-card !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-2.5 !transition-all hover:!border-sky-200/35 hover:!bg-white/[0.07]${isTranslationMode ? " search-result-card--translation" : ""}`}
                onClick={() => goToAyah(surahNumber, ayahNumber)}
              >
                <div className="src-badge">
                  <span className="src-badge__num">
                    {lang === "ar" ? toAr(surahNumber) : surahNumber}
                  </span>
                </div>
                <div className="modal-item-main">
                  <div className="search-result-head">
                    <div className="search-result-ref">
                      <span className="search-result-ref__ar">{surahMeta?.ar}</span>
                      <span className="search-result-ref__dot">·</span>
                      <span className="search-result-ref__name">{translatedName}</span>
                      <span className="search-result-ref__ayah">
                        :{lang === "ar" ? toAr(ayahNumber) : ayahNumber}
                      </span>
                    </div>
                    <div className="search-result-tags">
                      <span>{revelationLabel}</span>
                      <span>Juz {lang === "ar" ? toAr(resultJuz) : resultJuz}</span>
                    </div>
                  </div>
                  {isTranslationMode ? (
                    <div className="search-result-translation">{result.text}</div>
                  ) : (
                    <div className="modal-item-ar search-result-arabic" dir="rtl">
                      {result.text}
                    </div>
                  )}
                  <div className="search-result-action">
                    <i className="fas fa-arrow-up-right-from-square"></i>
                    <span>
                      {lang === "fr"
                        ? "Ouvrir dans la lecture"
                        : lang === "ar"
                          ? "فتح في القراءة"
                          : "Open in reading"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
