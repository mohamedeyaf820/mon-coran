import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA, JUZ_PAGE_RANGES } from "../data/juz";
import { cn } from "../lib/utils";
import { getReadStats } from "../services/readingProgressService";
import "../styles/sidebar.css";

/* ── Recent surahs helpers ── */
const RECENT_KEY = 'mushafplus_recent_surahs';
function saveRecent(n) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const updated = [n, ...list.filter(x => x !== n)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    return updated;
  } catch { return []; }
}
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}

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
  const progressFillRef = useRef(null);
  const [recentSurahs, setRecentSurahs] = useState(loadRecent);
  const [readStats, setReadStats] = useState(() => getReadStats());
  const currentSurahMeta = SURAHS[currentSurah - 1];
  const activeSummary =
    displayMode === "surah"
      ? currentSurahMeta
        ? `${currentSurahMeta.en} · ${currentSurahMeta.ar}`
        : null
      : displayMode === "juz"
        ? `Juz ${currentJuz}`
        : `${lang === "fr" ? "Page" : lang === "ar" ? "الصفحة" : "Page"} ${currentPage}`;

  // Refresh stats when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      setReadStats(getReadStats());
      setRecentSurahs(loadRecent());
    }
  }, [sidebarOpen]);

  // Scroll active item into view when sidebar opens
  useEffect(() => {
    if (sidebarOpen && activeItemRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 350);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (!progressFillRef.current) return;
    progressFillRef.current.style.width = `${readStats.percentage}%`;
  }, [readStats.percentage]);

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
    setRecentSurahs(saveRecent(n));
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
        className={cn(
          "sidebar sidebar--platform sidebar--themes4 w-[min(92vw,380px)] md:w-[23rem]",
          sidebarOpen && "open",
        )}
        role="navigation"
      >

        {/* ── HEADER FIXE compact ── */}
        <div className="sidebar-header">
          <div className="sidebar-header__top">
            <div className="sidebar-header__identity">
              <span className="sidebar-header__kicker">
                {lang === "fr" ? "Navigation" : lang === "ar" ? "التنقل" : "Navigation"}
              </span>
              <span className="sidebar-header__title">
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
                className="sidebar-close-btn"
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                aria-label="Fermer"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {activeSummary && (
            <div className="sidebar-current-loc">
              <i className="fas fa-location-dot sidebar-current-loc__icon" />
              <span className="sidebar-current-loc__val">{activeSummary}</span>
            </div>
          )}

          {/* Tab bar */}
          <div className="sidebar-tabs-list">
            {availableTabs.map((t2) => (
              <button
                key={t2}
                className={cn("sidebar-tab-trigger", tab === t2 && "active")}
                onClick={() => setTab(t2)}
              >
                {t2 === "surah" ? t("sidebar.surahs", lang) : t2 === "juz" ? t("sidebar.juz", lang) : t("quran.page", lang)}
              </button>
            ))}
          </div>

          {/* Search (Surah only) */}
          {tab === "surah" && (
            <div className="sidebar-search-wrap">
              <input
                type="text"
                placeholder={t("search.placeholder", lang)}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="sidebar-search-input"
              />
              {filter && (
                <button className="sidebar-search-clear" onClick={() => setFilter("")}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div className="sidebar-content">

          {/* Récemment ouvertes — dans la zone scrollable */}
          {recentSurahs.length > 0 && tab === "surah" && !filter && (
            <div className="sb-recent">
              <div className="sb-recent__title">
                <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                <span>{lang === "fr" ? "Récemment ouvertes" : lang === "ar" ? "السور الأخيرة" : "Recently opened"}</span>
              </div>
              <div className="sb-recent__list">
                {recentSurahs.map((surahNum) => {
                  const s = SURAHS[surahNum - 1];
                  if (!s) return null;
                  const isActive = s.n === currentSurah && displayMode === "surah";
                  return (
                    <button
                      key={`recent-${s.n}`}
                      className={cn("sb-recent__item", isActive && "active")}
                      onClick={() => goSurah(s.n)}
                    >
                      <span className="sb-recent__num">{s.n}</span>
                      <div className="sb-recent__body">
                        <span className="sb-recent__name">{lang === "fr" ? s.fr : s.en}</span>
                        <span className="sb-recent__meta">{s.ayahs} {lang === "ar" ? "آية" : "v."}</span>
                      </div>
                      <span className="sb-recent__ar">{s.ar}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Section sourates ── */}
          {tab === "surah" && filter && filteredSurahs.length === 0 && (
            <div className="sidebar-empty-state">
              <i className="fas fa-magnifying-glass sidebar-empty-state__icon" />
              <div className="sidebar-empty-state__title">
                {lang === "fr" ? "Aucune sourate trouvée" : lang === "ar" ? "لم يتم العثور على سورة" : "No surah found"}
              </div>
            </div>
          )}

          {tab === "surah" && (
            <div className="sb-section-title">
              <span>{lang === "fr" ? "Toutes les sourates" : lang === "ar" ? "جميع السور" : "All Surahs"}</span>
              <span className="sb-section-count">{filteredSurahs.length}</span>
            </div>
          )}

          {tab === "surah" && filteredSurahs.map((s) => {
            const isActive = s.n === currentSurah && displayMode === "surah";
            return (
              <div
                key={s.n}
                ref={isActive ? activeItemRef : null}
                className={cn("sidebar-item-row", isActive && "active")}
                onClick={() => goSurah(s.n)}
              >
                <div className="qc-sidebar-num">{s.n}</div>
                <div className="qc-sidebar-body">
                  <span className="qc-sidebar-en">{lang === "fr" ? s.fr : s.en}</span>
                  <span className="qc-sidebar-meta">
                    {s.ayahs} {lang === "ar" ? "آية" : "v."}&nbsp;·&nbsp;
                    <span className={`sb-type-pill sb-type-pill--${s.type.toLowerCase()}`}>
                      {s.type === "Meccan"
                        ? (lang === "ar" ? "مكية" : lang === "fr" ? "Mec." : "Mec.")
                        : (lang === "ar" ? "مدنية" : lang === "fr" ? "Méd." : "Med.")}
                    </span>
                  </span>
                </div>
                <div className="qc-sidebar-ar">{s.ar}</div>
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
                className={cn("sidebar-item-row", isActive && "active")}
                onClick={() => goJuz(j.juz)}
              >
                <div className="qc-sidebar-num">{lang === "ar" ? toAr(j.juz) : j.juz}</div>
                <div className="qc-sidebar-body">
                  <span className="qc-sidebar-en">{lang === "ar" ? `الجزء ${toAr(j.juz)}` : `Juz ${j.juz}`}</span>
                  {startSurah && (
                    <span className="qc-sidebar-meta">
                      {lang === "fr" ? startSurah.fr : lang === "ar" ? startSurah.ar : startSurah.en}
                    </span>
                  )}
                </div>
                <div className="qc-sidebar-ar">{j.name}</div>
              </div>
            );
          })}

          {tab === "page" && (
            <div className="page-nav-section">
              <div className="sidebar-page-input-row">
                <input
                  type="number"
                  min={1} max={604}
                  className="sidebar-search-input text-center h-10 px-2"
                  placeholder={isRtl ? "الصفحة" : "Page"}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPageJump()}
                />
                <button
                  className="sidebar-tab-trigger sidebar-page-go-btn active"
                  onClick={submitPageJump}
                >
                  <i className="fas fa-arrow-right" />
                </button>
              </div>
              <div className="sidebar-page-juz-grid">
                {JUZ_PAGE_RANGES.map(range => (
                  <button
                    key={range.juz}
                    className={cn(
                      "page-v4-cell page-v4-cell--juz",
                      selectedJuzForPages === range.juz && "active",
                    )}
                    onClick={() => setSelectedJuzForPages(range.juz)}
                  >
                    {isRtl ? toAr(range.juz) : range.juz}
                  </button>
                ))}
              </div>
              <div className="page-grid-v4">
                {(() => {
                  const range = JUZ_PAGE_RANGES.find(r => r.juz === selectedJuzForPages) || JUZ_PAGE_RANGES[0];
                  const pages = [];
                  for (let p = range.startPage; p <= range.endPage; p++) pages.push(p);
                  return pages.map(p => (
                    <button
                      key={p}
                      className={cn("page-v4-cell", p === currentPage && "active")}
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
        <div className="sidebar-footer">
          {readStats.totalRead > 0 && (
            <div className="sidebar-progress">
              <div className="sidebar-progress-header">
                <span className="sidebar-progress-label">
                  {lang === "fr" ? "Progression" : lang === "ar" ? "التقدم" : "Progress"}
                </span>
                <span className="sidebar-progress-pct">{readStats.percentage}%</span>
              </div>
              <div className="sidebar-progress-bar-bg">
                <div
                  ref={progressFillRef}
                  className="sidebar-progress-bar-fill"
                  aria-hidden="true"
                />
              </div>
              <div className="sidebar-progress-detail">
                {lang === "fr"
                  ? `${readStats.totalRead.toLocaleString()} / ${readStats.total.toLocaleString()} versets • ${readStats.completedSurahs} sourates complètes`
                  : `${readStats.totalRead.toLocaleString()} / ${readStats.total.toLocaleString()} ayahs • ${readStats.completedSurahs} surahs done`}
              </div>
            </div>
          )}
          <div className="sidebar-footer__meta">
            <span>{tab === "surah" ? `${filteredSurahs.length} Surahs` : tab === "juz" ? "30 Juz" : "604 Pages"}</span>
            <span className="sidebar-footer__riwaya">{riwaya === "warsh" ? "Riwaya Warsh" : "Riwaya Hafs"}</span>
          </div>


        </div>

      </aside>
    </>
  );
}
