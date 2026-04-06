import React, { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA, JUZ_PAGE_RANGES } from "../data/juz";
import { cn } from "../lib/utils";

export default function Sidebar() {
  const { state, dispatch, set } = useApp();
  const {
    sidebarOpen,
    lang,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    riwaya,
  } = state;

  const availableTabs = riwaya === "warsh" ? ["surah", "juz"] : ["surah", "juz", "page"];
  const [tab, setTab] = useState("surah");

  useEffect(() => {
    if (riwaya === "warsh" && tab === "page") setTab("surah");
  }, [riwaya, tab]);

  const [filter, setFilter] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [selectedJuzForPages, setSelectedJuzForPages] = useState(1);
  const activeItemRef = useRef(null);
  const currentSurahMeta = SURAHS[currentSurah - 1];
  const activeSummary =
    displayMode === "surah"
      ? currentSurahMeta
        ? `${currentSurahMeta.en} · ${currentSurahMeta.ar}`
        : null
      : displayMode === "juz"
        ? `Juz ${currentJuz}`
        : `${lang === "fr" ? "Page" : lang === "ar" ? "الصفحة" : "Page"} ${currentPage}`;

  // Scroll active item into view when sidebar opens
  useEffect(() => {
    if (sidebarOpen && activeItemRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 350);
    }
  }, [sidebarOpen]);

  const filteredSurahs = useMemo(() => {
    if (!filter) return SURAHS;
    const q = filter.toLowerCase();
    return SURAHS.filter(s =>
      s.ar.includes(filter) ||
      s.en.toLowerCase().includes(q) ||
      s.fr.toLowerCase().includes(q) ||
      String(s.n) === q
    );
  }, [filter]);

  const goSurah = (n) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
  };

  const goPage = (p) => {
    set({ displayMode: "page", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_PAGE", payload: { page: p } });
  };

  const submitPageJump = () => {
    const page = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(page)) return;
    goPage(Math.min(604, Math.max(1, page)));
  };

  const goJuz = (juz) => {
    set({ showHome: false, showDuas: false, displayMode: "juz" });
    dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
  };

  const isRtl = lang === "ar";

  return (
    <>
      <aside
        className={cn("sb-wrapper", sidebarOpen && "open")}
        role="navigation"
        data-tab={tab}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="sb-header">
          <div className="sb-header-top">
            <div className="sb-identity">
              <span className="sb-kicker">
                {lang === "fr" ? "Navigation" : lang === "ar" ? "التنقل" : "Navigation"}
              </span>
              <span className="sb-title">
                {lang === "fr" ? "Explorer le Mushaf" : lang === "ar" ? "استكشاف المصحف" : "Explore the Mushaf"}
              </span>
            </div>
            <div className="sidebar-header__actions">
              <span className="sidebar-riwaya-chip">
                {riwaya === "warsh"
                  ? (lang === "fr" ? "Warsh" : lang === "ar" ? "ورش" : "Warsh")
                  : (lang === "fr" ? "Hafs" : lang === "ar" ? "حفص" : "Hafs")}
              </span>
              <button
                className="sb-close-btn"
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                aria-label="Fermer"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {activeSummary && (
            <div className="sb-current-loc">
              <i className="fas fa-location-dot sb-current-loc__icon" />
              <span className="sb-current-loc__val">{activeSummary}</span>
            </div>
          )}

          {/* Tab bar */}
          <div
            className={cn(
              "sb-tabs-list",
              availableTabs.length === 2 ? "grid-cols-2" : "grid-cols-3",
            )}
          >
            {availableTabs.map((t2) => (
              <button
                key={t2}
                className={cn("sb-tab-trigger", tab === t2 && "active")}
                onClick={() => setTab(t2)}
              >
                {t2 === "surah" ? t("sidebar.surahs", lang) : t2 === "juz" ? t("sidebar.juz", lang) : t("quran.page", lang)}
              </button>
            ))}
          </div>

          {/* Search (Surah only) */}
          {tab === "surah" && (
            <div className="sb-search">
              <input
                type="text"
                placeholder={t("search.placeholder", lang)}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="sb-search-input"
              />
              {filter && (
                <button className="sb-search-clear" onClick={() => setFilter("")}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div className="sb-content">

          {/* ── Section sourates ── */}
          {tab === "surah" && filter && filteredSurahs.length === 0 && (
            <div className="sb-empty">
              <i className="fas fa-magnifying-glass" />
              <p>
                {lang === "fr" ? "Aucune sourate trouvée" : lang === "ar" ? "لم يتم العثور على سورة" : "No surah found"}
              </p>
            </div>
          )}

          {tab === "surah" && (
            <div className="sb-section-header">
              <span>{lang === "fr" ? "Toutes les sourates" : lang === "ar" ? "جميع السور" : "All Surahs"}</span>
              <span>{filteredSurahs.length}</span>
            </div>
          )}

          {tab === "surah" && filteredSurahs.map((s) => {
            const isActive = s.n === currentSurah && displayMode === "surah";
            const surahCalligraphyId = String(s.n).padStart(3, "0");
            return (
              <div
                key={s.n}
                ref={isActive ? activeItemRef : null}
                className={cn("sb-item", isActive && "active")}
                onClick={() => goSurah(s.n)}
              >
                <div className="sb-item-num">{s.n}</div>
                <div className="sb-item-body">
                  <span className="sb-item-name">{lang === "fr" ? s.fr : s.en}</span>
                  <span className="sb-item-meta">
                    <span className={cn("sb-pill", s.type === "Meccan" && "sb-pill--meccan")}>
                      {s.type === "Meccan"
                        ? (lang === "ar" ? "مكية" : lang === "fr" ? "Mecquoise" : "Meccan")
                        : (lang === "ar" ? "مدنية" : lang === "fr" ? "Médinoise" : "Medinan")}
                    </span>
                    {s.ayahs} {lang === "ar" ? "آية" : "v."}
                  </span>
                </div>
                <div className="sb-item-ar font-surah-names" aria-label={s.ar}>{surahCalligraphyId}</div>
              </div>
            );
          })}

          {tab === "juz" && JUZ_DATA.map((j) => {
            const isActive = j.juz === currentJuz && displayMode === "juz";
            const startSurah = SURAHS[j.start.s - 1];
            return (
              <div
                key={j.juz}
                ref={isActive ? activeItemRef : null}
                className={cn("sb-item", isActive && "active")}
                onClick={() => goJuz(j.juz)}
              >
                <div className="sb-item-num">{lang === "ar" ? toAr(j.juz) : j.juz}</div>
                <div className="sb-item-body">
                  <span className="sb-item-name">{lang === "ar" ? `الجزء ${toAr(j.juz)}` : `Juz ${j.juz}`}</span>
                  {startSurah && (
                    <span className="sb-item-meta">
                      {lang === "fr" ? startSurah.fr : lang === "ar" ? startSurah.ar : startSurah.en}
                    </span>
                  )}
                </div>
                <div className="sb-item-ar">{j.name}</div>
              </div>
            );
          })}

          {tab === "page" && (
            <div className="sb-page-nav">
              <div className="sb-page-controls">
                <input
                  type="number"
                  min={1} max={604}
                  className="sb-search-input"
                  placeholder={isRtl ? "الصفحة" : "Page"}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPageJump()}
                />
                <button
                  className="sb-page-go-btn"
                  onClick={submitPageJump}
                  aria-label={lang === "fr" ? "Aller a la page" : lang === "ar" ? "الانتقال الى الصفحة" : "Go to page"}
                >
                  <i className={`fas fa-arrow-${isRtl ? "left" : "right"}`} />
                </button>
              </div>
              <div className="sb-section-header sb-section-header--plain">
                 <span>{lang === "fr" ? "Sélection rapide Juz" : lang === "ar" ? "اختيار الجزء السريع" : "Quick Juz Selection"}</span>
              </div>
              <div className="sb-page-grid sb-page-grid--juz">
                {JUZ_PAGE_RANGES.map(range => (
                  <button
                    key={range.juz}
                    className={cn(
                      "sb-page-cell sb-page-cell--juz",
                      selectedJuzForPages === range.juz && "active",
                    )}
                    onClick={() => setSelectedJuzForPages(range.juz)}
                  >
                    {isRtl ? toAr(range.juz) : range.juz}
                  </button>
                ))}
              </div>
              <div className="sb-section-header sb-section-header--plain">
                 <span>{lang === "fr" ? "Pages" : lang === "ar" ? "الصفحات" : "Pages"}</span>
              </div>
              <div className="sb-page-grid sb-page-grid--pages">
                {(() => {
                  const range = JUZ_PAGE_RANGES.find(r => r.juz === selectedJuzForPages) || JUZ_PAGE_RANGES[0];
                  const pages = [];
                  for (let p = range.startPage; p <= range.endPage; p++) pages.push(p);
                  return pages.map(p => (
                    <button
                      key={p}
                      className={cn("sb-page-cell", p === currentPage && "active")}
                      onClick={() => goPage(p)}
                    >
                      {isRtl ? toAr(p) : p}
                    </button>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="sb-footer">
          <span>{tab === "surah" ? `${filteredSurahs.length} Surahs` : tab === "juz" ? "30 Juz" : "604 Pages"}</span>
          <span className="sb-riwaya-badge">{riwaya === "warsh" ? "Riwaya Warsh" : "Riwaya Hafs"}</span>
        </div>

      </aside>
    </>
  );
}
