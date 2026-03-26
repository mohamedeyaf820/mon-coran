import React, { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA, JUZ_PAGE_RANGES } from "../data/juz";
import { cn } from "../lib/utils";
import "../styles/sidebar.css";
import "../styles/zen-platform.css";

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
        className={cn(
          "sidebar sidebar--platform sidebar--themes4 w-[min(92vw,380px)] md:w-[23rem] !overflow-hidden !rounded-r-3xl !border-r !border-white/10 !bg-[linear-gradient(180deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_24px_60px_rgba(1,8,22,0.45)]",
          sidebarOpen && "open",
        )}
        role="navigation"
      >

        {/* ── HEADER FIXE compact ── */}
        <div className="sidebar-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))] !px-3 !py-3">
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
                className="sidebar-close-btn !inline-flex !h-9 !w-9 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]"
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
          <div
            className={cn(
              "sidebar-tabs-list !mt-2 !grid !gap-1 !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-1",
              availableTabs.length === 2 ? "!grid-cols-2" : "!grid-cols-3",
            )}
          >
            {availableTabs.map((t2) => (
              <button
                key={t2}
                className={cn("sidebar-tab-trigger !rounded-xl !px-2.5 !py-2 !text-xs !transition-all hover:!bg-white/[0.08]", tab === t2 && "active !bg-sky-500/25 !text-white")}
                onClick={() => setTab(t2)}
              >
                {t2 === "surah" ? t("sidebar.surahs", lang) : t2 === "juz" ? t("sidebar.juz", lang) : t("quran.page", lang)}
              </button>
            ))}
          </div>

          {/* Search (Surah only) */}
          {tab === "surah" && (
            <div className="sidebar-search-wrap !relative !mt-2">
              <input
                type="text"
                placeholder={t("search.placeholder", lang)}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="sidebar-search-input !min-h-11 !w-full !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-3"
              />
              {filter && (
                <button className="sidebar-search-clear !absolute !right-2 !top-1/2 !-translate-y-1/2 !inline-flex !h-7 !w-7 !items-center !justify-center !rounded-lg !border !border-white/10 !bg-white/[0.06] hover:!bg-white/[0.12]" onClick={() => setFilter("")}>
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div className="sidebar-content !space-y-2 !px-2.5 !py-2.5">

          {/* ── Section sourates ── */}
          {tab === "surah" && filter && filteredSurahs.length === 0 && (
            <div className="sidebar-empty-state !rounded-2xl !border !border-dashed !border-white/15 !bg-white/[0.03] !p-4 !text-center">
              <i className="fas fa-magnifying-glass sidebar-empty-state__icon" />
              <div className="sidebar-empty-state__title">
                {lang === "fr" ? "Aucune sourate trouvée" : lang === "ar" ? "لم يتم العثور على سورة" : "No surah found"}
              </div>
            </div>
          )}

          {tab === "surah" && (
            <div className="sb-section-title !mb-1 !flex !items-center !justify-between !px-1">
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
                className={cn("sidebar-item-row !rounded-xl !border !border-white/12 !bg-white/[0.03] !p-2.5 !transition-all hover:!border-sky-200/35 hover:!bg-white/[0.08]", isActive && "active !border-sky-200/35 !bg-sky-500/16")}
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
                className={cn("sidebar-item-row !rounded-xl !border !border-white/12 !bg-white/[0.03] !p-2.5 !transition-all hover:!border-sky-200/35 hover:!bg-white/[0.08]", isActive && "active !border-sky-200/35 !bg-sky-500/16")}
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
              <div className="sidebar-page-input-row !mb-2 !flex !items-center !gap-2">
                <input
                  type="number"
                  min={1} max={604}
                  className="sidebar-search-input !h-10 !flex-1 !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-2 !text-center"
                  placeholder={isRtl ? "الصفحة" : "Page"}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPageJump()}
                />
                <button
                  className="sidebar-tab-trigger sidebar-page-go-btn active !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-sky-200/30 !bg-sky-500/20 hover:!bg-sky-500/30"
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
          <div className="sidebar-footer__meta">
            <span>{tab === "surah" ? `${filteredSurahs.length} Surahs` : tab === "juz" ? "30 Juz" : "604 Pages"}</span>
            <span className="sidebar-footer__riwaya">{riwaya === "warsh" ? "Riwaya Warsh" : "Riwaya Hafs"}</span>
          </div>


        </div>

      </aside>
    </>
  );
}
