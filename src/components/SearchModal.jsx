import React, { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { search, searchTranslation } from "../services/quranAPI";
import { getSurah, toAr } from "../data/surahs";
import {
  buildSearchCandidates,
  inferSearchMode,
  sanitizeVoiceTranscript,
} from "../utils/searchIntelligence";
import "../styles/search-modal.css";

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

export default function SearchModal() {
  const { state, dispatch, set } = useApp();
  const { lang, riwaya } = state;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const [searchMode, setSearchMode] = useState("arabic");
  const [resolvedQuery, setResolvedQuery] = useState("");
  const [voiceSummary, setVoiceSummary] = useState(null);

  const recognitionRef = useRef(null);
  const searchRequestIdRef = useRef(0);
  const searchAbortRef = useRef(null);

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

  const close = () => dispatch({ type: "TOGGLE_SEARCH" });

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
    setQuery(suggestion.value);
    setVoiceSummary(null);
    void runSearch(suggestion.value, suggestion.mode);
  };

  const isTranslationMode = searchMode === "fr" || searchMode === "en";
  const resultCountLabel = query
    ? lang === "fr"
      ? `${results.length} résultat${results.length > 1 ? "s" : ""}`
      : lang === "ar"
        ? `${results.length} نتيجة`
        : `${results.length} result${results.length > 1 ? "s" : ""}`
    : lang === "fr"
      ? "Recherche contextuelle"
      : lang === "ar"
        ? "بحث سياقي"
        : "Context search";

  return (
    <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
      <div
        className="modal modal-panel--wide modal-search-panel search-modal-shell search-modal-shell--premium-plus !w-full !max-w-5xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === "fr" ? "Recherche intelligente" : lang === "ar" ? "بحث ذكي" : "Smart search"}
            </div>
            <h2 className="modal-title">{t("search.title", lang)}</h2>
            <div className="modal-subtitle">
              {lang === "fr"
                ? "Texte arabe, phonétique, traduction et recherche vocale sur début de verset."
                : lang === "ar"
                  ? "بحث بالنص العربي أو الصوتي أو الترجمة مع فهم لبداية الآية."
                  : "Arabic, phonetic, translation, and verse-opening voice search."}
            </div>
          </div>
          <button
            className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]"
            onClick={close}
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
                aria-label={listening ? "Stop" : "Voice"}
              >
                <i className={`fas ${listening ? "fa-stop" : "fa-microphone"}`}></i>
              </button>
            )}
            <button className="modal-action-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-sky-200/30 !bg-sky-500/20 hover:!bg-sky-500/30" onClick={handleSearch} disabled={loading}>
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
            {[
              { id: "arabic", icon: "fa-font", label: searchModeLabels.arabic },
              { id: "phonetic", icon: "fa-wave-square", label: searchModeLabels.phonetic },
              { id: "fr", icon: "fa-language", label: "FR" },
              { id: "en", icon: "fa-language", label: "EN" },
            ].map((modeOption) => (
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
              </div>
            </div>
          )}

          {results.length === 0 && !loading && query && (
            <div className="modal-empty !rounded-2xl !border !border-dashed !border-white/15 !bg-white/[0.03] !p-6 !text-center">
              <i className="fas fa-search"></i>
              <div>{t("search.noResults", lang)}</div>
            </div>
          )}

          {results.length > 0 && (
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

          {results.map((result, index) => {
            const surahNumber = result?.surah?.number || result?.surah || 1;
            const ayahNumber = result?.numberInSurah || result?.number || 1;
            const surahMeta = getSurah(surahNumber);
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
