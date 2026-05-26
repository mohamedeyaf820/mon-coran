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

  const availableTabs = ["surah", "juz", "page"];
  const [tab, setTab] = useState("surah");

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
        activeItemRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }, 350);
    }
  }, [sidebarOpen]);

  const filteredSurahs = useMemo(() => {
    if (!filter) return SURAHS;
    const q = filter.toLowerCase();
    return SURAHS.filter(
      (s) =>
        s.ar.includes(filter) ||
        s.en.toLowerCase().includes(q) ||
        s.fr.toLowerCase().includes(q) ||
        String(s.n) === q,
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
          "fixed top-0 left-0 z-[1000] flex h-[100dvh] w-[min(92vw,360px)] flex-col bg-bg-primary border-r border-border shadow-2xl transition-transform duration-300 rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full",
        )}
        role="navigation"
        data-tab={tab}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-border bg-bg-primary p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.67rem] font-bold tracking-widest text-primary uppercase">
                {lang === "fr"
                  ? "Navigation"
                  : lang === "ar"
                    ? "التنقل"
                    : "Navigation"}
              </span>
              <span className="font-ui text-[1.15rem] font-extrabold leading-[1.2] text-text-primary">
                {lang === "fr"
                  ? "Explorer le Mushaf"
                  : lang === "ar"
                    ? "استكشاف المصحف"
                    : "Explore the Mushaf"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border/50 bg-bg-secondary px-2.5 py-1 text-[0.7rem] font-bold text-text-secondary hidden sm:inline-flex">
                {riwaya === "warsh"
                  ? lang === "fr"
                    ? "Warsh"
                    : lang === "ar"
                      ? "ورش"
                      : "Warsh"
                  : lang === "fr"
                    ? "Hafs"
                    : lang === "ar"
                      ? "حفص"
                      : "Hafs"}
              </span>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-secondary text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                aria-label="Fermer"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {activeSummary && (
            <div className="flex min-h-[2rem] items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
              <i className="fas fa-location-dot text-[0.8rem] text-primary" />
              <span className="truncate text-[0.8rem] font-bold text-primary">
                {activeSummary}
              </span>
            </div>
          )}

          {/* Tab bar */}
          <div
            className={cn(
              "grid gap-1 rounded-xl bg-bg-secondary p-1 border border-border/50",
              availableTabs.length === 2 ? "grid-cols-2" : "grid-cols-3",
            )}
          >
            {availableTabs.map((t2) => (
              <button
                key={t2}
                className={cn(
                  "flex min-h-[2.2rem] items-center justify-center rounded-lg px-2 text-[0.76rem] font-bold text-text-secondary transition-all hover:text-text-primary",
                  tab === t2 && "bg-bg-primary text-primary shadow-sm",
                )}
                onClick={() => setTab(t2)}
              >
                {t2 === "surah"
                  ? t("sidebar.surahs", lang)
                  : t2 === "juz"
                    ? t("sidebar.juz", lang)
                    : t("quran.page", lang)}
              </button>
            ))}
          </div>

          {/* Search (Surah only) */}
          {tab === "surah" && (
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder={t("search.placeholder", lang)}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-bg-secondary px-4 pr-10 text-[0.85rem] text-text-primary outline-none transition-colors focus:border-primary focus:bg-bg-primary focus:ring-1 focus:ring-primary"
              />
              {filter && (
                <button
                  className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-full text-[0.75rem] text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                  onClick={() => setFilter("")}
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
          {/* ── Section sourates ── */}
          {tab === "surah" && filter && filteredSurahs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted opacity-60 gap-3">
              <i className="fas fa-magnifying-glass text-2xl" />
              <p className="text-[0.9rem] font-medium">
                {lang === "fr"
                  ? "Aucune sourate trouvée"
                  : lang === "ar"
                    ? "لم يتم العثور على سورة"
                    : "No surah found"}
              </p>
            </div>
          )}

          {tab === "surah" && (
            <div className="flex items-center justify-between px-2 py-3 text-[0.75rem] font-bold text-text-muted">
              <span>
                {lang === "fr"
                  ? "Toutes les sourates"
                  : lang === "ar"
                    ? "جميع السور"
                    : "All Surahs"}
              </span>
              <span>{filteredSurahs.length}</span>
            </div>
          )}

          {tab === "surah" &&
            filteredSurahs.map((s) => {
              const isActive = s.n === currentSurah && displayMode === "surah";
              const surahCalligraphyId = String(s.n).padStart(3, "0");
              return (
                <div
                  key={s.n}
                  ref={isActive ? activeItemRef : null}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-bg-secondary",
                    isActive && "bg-primary/10",
                  )}
                  onClick={() => goSurah(s.n)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-bg-primary text-[0.8rem] font-bold text-text-secondary group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    {s.n}
                  </div>
                  <div className="flex flex-1 flex-col items-start min-w-0">
                    <span
                      className={cn(
                        "truncate text-[0.9rem] font-bold transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-text-primary group-hover:text-primary",
                      )}
                    >
                      {lang === "fr" ? s.fr : s.en}
                    </span>
                    <span className="flex items-center gap-1.5 truncate text-[0.7rem] text-text-muted mt-0.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold",
                          s.type === "Meccan"
                            ? "bg-gold/10 text-gold"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {s.type === "Meccan"
                          ? lang === "ar"
                            ? "مكية"
                            : lang === "fr"
                              ? "Mecquoise"
                              : "Meccan"
                          : lang === "ar"
                            ? "مدنية"
                            : lang === "fr"
                              ? "Médinoise"
                              : "Medinan"}
                      </span>
                      {s.ayahs} {lang === "ar" ? "آية" : "v."}
                    </span>
                  </div>
                  <div
                    className="shrink-0 font-surah-names text-[1.6rem] opacity-60 transition-opacity group-hover:opacity-100"
                    aria-label={s.ar}
                  >
                    {surahCalligraphyId}
                  </div>
                </div>
              );
            })}

          {tab === "juz" &&
            JUZ_DATA.map((j) => {
              const isActive = j.juz === currentJuz && displayMode === "juz";
              const startSurah = SURAHS[j.start.s - 1];
              return (
                <div
                  key={j.juz}
                  ref={isActive ? activeItemRef : null}
                  className={cn(
                    "group flex w-full cursor-pointer items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-bg-secondary",
                    isActive && "bg-primary/10",
                  )}
                  onClick={() => goJuz(j.juz)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/50 bg-bg-primary text-[0.8rem] font-bold text-text-secondary group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    {lang === "ar" ? toAr(j.juz) : j.juz}
                  </div>
                  <div className="flex flex-1 flex-col items-start min-w-0">
                    <span
                      className={cn(
                        "truncate text-[0.9rem] font-bold transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-text-primary group-hover:text-primary",
                      )}
                    >
                      {lang === "ar" ? `الجزء ${toAr(j.juz)}` : `Juz ${j.juz}`}
                    </span>
                    {startSurah && (
                      <span className="flex items-center gap-1.5 truncate text-[0.7rem] text-text-muted mt-0.5">
                        {lang === "fr"
                          ? startSurah.fr
                          : lang === "ar"
                            ? startSurah.ar
                            : startSurah.en}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-[0.75rem] font-bold text-text-muted">
                    {j.name}
                  </div>
                </div>
              );
            })}

          {tab === "page" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={604}
                  className="h-10 w-full rounded-xl border border-border bg-bg-secondary px-4 text-[0.85rem] text-text-primary outline-none transition-colors focus:border-primary focus:bg-bg-primary focus:ring-1 focus:ring-primary"
                  placeholder={isRtl ? "الصفحة" : "Page"}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPageJump()}
                />
                <button
                  className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark"
                  onClick={submitPageJump}
                  aria-label={
                    lang === "fr"
                      ? "Aller a la page"
                      : lang === "ar"
                        ? "الانتقال الى الصفحة"
                        : "Go to page"
                  }
                >
                  <i className={`fas fa-arrow-${isRtl ? "left" : "right"}`} />
                </button>
              </div>
              <div className="flex items-center px-2 pt-2 pb-1 text-[0.75rem] font-bold text-text-muted">
                <span>
                  {lang === "fr"
                    ? "Sélection rapide Juz"
                    : lang === "ar"
                      ? "اختيار الجزء السريع"
                      : "Quick Juz Selection"}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {JUZ_PAGE_RANGES.map((range) => (
                  <button
                    key={range.juz}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-lg border border-border/50 bg-bg-secondary text-[0.75rem] font-bold text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary",
                      selectedJuzForPages === range.juz &&
                        "bg-primary/10 text-primary border-primary/30",
                    )}
                    onClick={() => setSelectedJuzForPages(range.juz)}
                  >
                    {isRtl ? toAr(range.juz) : range.juz}
                  </button>
                ))}
              </div>
              <div className="flex items-center px-2 pt-2 pb-1 text-[0.75rem] font-bold text-text-muted">
                <span>
                  {lang === "fr"
                    ? "Pages"
                    : lang === "ar"
                      ? "الصفحات"
                      : "Pages"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(() => {
                  const range =
                    JUZ_PAGE_RANGES.find(
                      (r) => r.juz === selectedJuzForPages,
                    ) || JUZ_PAGE_RANGES[0];
                  const pages = [];
                  for (let p = range.startPage; p <= range.endPage; p++)
                    pages.push(p);
                  return pages.map((p) => (
                    <button
                      key={p}
                      className={cn(
                        "flex h-9 items-center justify-center rounded-lg border border-border/50 bg-bg-secondary text-[0.8rem] font-semibold text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary",
                        p === currentPage &&
                          "bg-primary text-white border-primary",
                      )}
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
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-bg-primary px-5 py-3 text-[0.75rem] font-bold text-text-muted">
          <span>
            {tab === "surah"
              ? `${filteredSurahs.length} Surahs`
              : tab === "juz"
                ? "30 Juz"
                : "604 Pages"}
          </span>
          <span className="rounded-full bg-bg-secondary px-2 py-0.5">
            {riwaya === "warsh" ? "Riwaya Warsh" : "Riwaya Hafs"}
          </span>
        </div>
      </aside>
    </>
  );
}
