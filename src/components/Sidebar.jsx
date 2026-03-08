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

  const goJuz = (juz) => {
    set({ showHome: false, showDuas: false, displayMode: "juz" });
    dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
  };

  const isRtl = lang === "ar";

  return (
    <>
      <aside className={cn("sidebar", sidebarOpen && "open")} role="navigation">
        <div className="sidebar-tabs-container">
          <div className="sidebar-shell-header">
            <div>
              <div className="sidebar-shell-kicker">
                {lang === "fr" ? "Navigation" : lang === "ar" ? "التنقل" : "Navigation"}
              </div>
              <div className="sidebar-shell-title">
                {lang === "fr" ? "Explorer le Mushaf" : lang === "ar" ? "استكشاف المصحف" : "Explore the Mushaf"}
              </div>
            </div>

            <div className="sidebar-shell-chip">
              {riwaya === "warsh"
                ? (lang === "fr" ? "Warsh" : lang === "ar" ? "ورش" : "Warsh")
                : (lang === "fr" ? "Hafs" : lang === "ar" ? "حفص" : "Hafs")}
            </div>
          </div>

          {activeSummary && (
            <div className="sidebar-active-summary">
              <span className="sidebar-active-summary__label">
                {lang === "fr" ? "Position actuelle" : lang === "ar" ? "الموضع الحالي" : "Current location"}
              </span>
              <span className="sidebar-active-summary__value">{activeSummary}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 gap-3">
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

            <button
              className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-full hover:bg-[var(--bg-secondary)]"
              onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            >
              <i className="fas fa-times text-[1.1rem]" />
            </button>
          </div>

          <div className="text-[0.8rem] text-[var(--text-muted)] italic mb-4 opacity-80">
            {lang === "fr" ? "Astuce: naviguez avec" : lang === "ar" ? "نصيحة: جرب التنقل باستخدام" : "Tip: try navigating with"}
            <kbd className="font-sans text-[0.65rem] border border-[var(--border)] shadow-sm rounded px-1.5 py-0.5 bg-[var(--bg-primary)] text-[var(--text)] not-italic mx-1.5 font-bold tracking-wider">ctrl K</kbd>
          </div>

          {recentSurahs.length > 0 && tab === "surah" && !filter && (
            <div className="sidebar-recent-section">
              <div className="sidebar-recent-title">
                <i className="fas fa-clock-rotate-left" aria-hidden="true" />
                <span>{lang === "fr" ? "Récemment ouvertes" : lang === "ar" ? "السور الأخيرة" : "Recently opened"}</span>
              </div>
              {recentSurahs.map((surahNum) => {
                const s = SURAHS[surahNum - 1];
                if (!s) return null;
                const isActive = s.n === currentSurah && displayMode === "surah";
                return (
                  <div
                    key={`recent-${s.n}`}
                    className={cn("sidebar-item-row sidebar-item-row--recent", isActive && "active")}
                    onClick={() => goSurah(s.n)}
                  >
                    <div className="qc-sidebar-num">{s.n}</div>
                    <div className="qc-sidebar-en">{lang === "fr" ? s.fr : s.en}</div>
                    <div className="qc-sidebar-ar">{s.ar}</div>
                    {isActive && <div className="sidebar-item-indicator" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Search (Surah Tab) ── */}
        {tab === "surah" && (
          <div className="sidebar-search-container">
            <input
              type="text"
              placeholder={t("search.placeholder", lang)}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="sidebar-search-input"
            />
          </div>
        )}

        {/* ── List Area ── */}
        <div className="sidebar-content">
          {tab === "surah" && filteredSurahs.length === 0 && (
            <div className="sidebar-empty-state">
              <div className="sidebar-empty-state__title">
                {lang === "fr" ? "Aucune sourate trouvée" : lang === "ar" ? "لم يتم العثور على سورة" : "No surah found"}
              </div>
            </div>
          )}

          {tab === "surah" && filteredSurahs.map((s, idx) => {
            const isActive = s.n === currentSurah && displayMode === "surah";
            return (
              <div
                key={s.n}
                ref={isActive ? activeItemRef : null}
                className={cn("sidebar-item-row", isActive && "active")}
                style={{ animationDelay: `${idx * 15}ms` }}
                onClick={() => goSurah(s.n)}
              >
                <div className="qc-sidebar-num">{s.n}</div>
                <div className="qc-sidebar-en">{s.en}</div>
                <div className="qc-sidebar-ar">{s.ar}</div>
                {isActive && <div className="sidebar-item-indicator" />}
              </div>
            );
          })}

          {tab === "juz" && JUZ_DATA.map((j) => {
            const isActive = j.juz === currentJuz && displayMode === "juz";
            return (
              <div
                key={j.juz}
                ref={isActive ? activeItemRef : null}
                className={cn("sidebar-item-row", isActive && "active")}
                onClick={() => goJuz(j.juz)}
              >
                <div className="qc-sidebar-num">{j.juz}</div>
                <div className="qc-sidebar-label">
                  <div className="qc-sidebar-main">
                    <span className="qc-sidebar-en">Juz {j.juz}</span>
                    <span className="qc-sidebar-ar">{j.name}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {tab === "page" && (
            <div className="page-nav-section">
              {/* Direct input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="number"
                  min={1} max={604}
                  className="sidebar-search-input text-center h-10 px-2"
                  placeholder={isRtl ? "الصفحة" : "Page"}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && goPage(parseInt(pageInput))}
                />
                <button
                  className="sidebar-tab-trigger active w-12 h-10 shrink-0"
                  onClick={() => goPage(parseInt(pageInput))}
                >
                  <i className="fas fa-arrow-right" />
                </button>
              </div>

              {/* Juz selector */}
              <div className="grid grid-cols-6 gap-1 mb-4">
                {JUZ_PAGE_RANGES.map(range => (
                  <button
                    key={range.juz}
                    className={cn("page-v4-cell", selectedJuzForPages === range.juz && "active")}
                    style={{ aspectRatio: "auto", padding: "6px" }}
                    onClick={() => setSelectedJuzForPages(range.juz)}
                  >
                    {isRtl ? toAr(range.juz) : range.juz}
                  </button>
                ))}
              </div>

              {/* Pages grid */}
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

        {/* ── Reading progress ── */}
        {readStats.totalRead > 0 && (
          <div className="sidebar-progress">
            <div className="sidebar-progress-header">
              <span className="sidebar-progress-label">
                {lang === 'fr' ? 'Progression' : lang === 'ar' ? 'التقدم' : 'Progress'}
              </span>
              <span className="sidebar-progress-pct">{readStats.percentage}%</span>
            </div>
            <div className="sidebar-progress-bar-bg">
              <div
                className="sidebar-progress-bar-fill"
                style={{ width: `${readStats.percentage}%` }}
              />
            </div>
            <div className="sidebar-progress-detail">
              {lang === 'fr'
                ? `${readStats.totalRead.toLocaleString()} / ${readStats.total.toLocaleString()} versets • ${readStats.completedSurahs} sourates complètes`
                : `${readStats.totalRead.toLocaleString()} / ${readStats.total.toLocaleString()} ayahs • ${readStats.completedSurahs} surahs done`
              }
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="shrink-0 px-4 py-3 border-t border-[rgba(var(--primary-rgb),0.1)] bg-[rgba(var(--primary-rgb),0.02)]">
          <div className="flex items-center justify-between text-[0.65rem] text-[var(--text-muted)] font-bold uppercase tracking-wider">
            <span>{tab === "surah" ? `${filteredSurahs.length} Surahs` : tab === "juz" ? "30 Juz" : "604 Pages"}</span>
            <span style={{ color: "var(--primary)", opacity: 0.8 }}>{riwaya === "warsh" ? "Riwaya Warsh" : "Riwaya Hafs"}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
