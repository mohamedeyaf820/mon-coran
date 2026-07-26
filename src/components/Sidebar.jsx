import React, { useState, useMemo, useEffect, useRef } from "react";
import "../styles/sidebar-enhanced.css";
import { X, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA, JUZ_PAGE_RANGES } from "../data/juz";
import { cn } from "../lib/utils";
import VirtualizedItem from "./ui/VirtualizedItem";

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
  const sidebarRef = useRef(null);
  const scrollRootRef = useRef(null);
  const closeButtonRef = useRef(null);
  const activeItemRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const wasOpenRef = useRef(false);
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
      const timeoutId = setTimeout(() => {
        activeItemRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }, 350);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [sidebarOpen]);

  // Keep the off-canvas navigation out of the tab order while closed, trap
  // focus while open, then return focus to the control that opened it.
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return undefined;

    if (sidebarOpen) {
      if (!wasOpenRef.current) {
        previouslyFocusedRef.current = document.activeElement;
      }
      sidebar.removeAttribute("inert");
      const frameId = requestAnimationFrame(() => {
        closeButtonRef.current?.focus({ preventScroll: true });
      });
      wasOpenRef.current = true;
      return () => cancelAnimationFrame(frameId);
    }

    sidebar.setAttribute("inert", "");
    if (wasOpenRef.current) {
      const previous = previouslyFocusedRef.current;
      requestAnimationFrame(() => {
        if (previous instanceof HTMLElement && previous.isConnected) {
          previous.focus({ preventScroll: true });
        }
      });
    }
    wasOpenRef.current = false;
    return undefined;
  }, [sidebarOpen]);

  const handleSidebarKeyDown = (event) => {
    if (!sidebarOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: "TOGGLE_SIDEBAR" });
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      sidebarRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) || [],
    ).filter((element) => !element.hasAttribute("inert") && element.getClientRects().length > 0);

    if (!focusable.length) {
      event.preventDefault();
      sidebarRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !sidebarRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

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
        ref={sidebarRef}
        id="sidebar"
        className={cn(
          "sb-wrapper fixed top-0 left-0 z-[1000] flex h-[100dvh] w-[min(92vw,360px)] flex-col bg-bg-primary border-r border-border shadow-2xl transition-transform duration-300 rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l",
          sidebarOpen
            ? "open translate-x-0"
            : "-translate-x-full rtl:translate-x-full",
        )}
        aria-label={
          lang === "fr"
            ? "Navigation Coran"
            : lang === "ar"
              ? "التنقل في القرآن"
              : "Quran Navigation"
        }
        aria-hidden={!sidebarOpen}
        aria-modal={sidebarOpen ? "true" : undefined}
        inert={sidebarOpen ? undefined : ""}
        role={sidebarOpen ? "dialog" : undefined}
        tabIndex={-1}
        data-tab={tab}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleSidebarKeyDown}
      >
        {/* ── HEADER — compact single-row close + tabs + search ── */}
        <div className="flex shrink-0 flex-col gap-1.5 border-b border-border bg-bg-primary px-2.5 py-2">
          {/* Row 1: Close + current position */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <button
                ref={closeButtonRef}
                className="sidebar-close-button flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                aria-label={
                  lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
                }
              >
                <X size={18} strokeWidth={2.4} />
              </button>
              {activeSummary && (
                <span className="truncate text-[0.72rem] font-semibold text-primary">
                  {activeSummary}
                </span>
              )}
            </div>
            <span className="shrink-0 text-[0.6rem] font-bold text-text-muted uppercase tracking-wide">
              {riwaya === "warsh" ? "Warsh" : "Hafs"}
            </span>
          </div>

          {/* Row 2: Tab bar */}
          <div
            role="tablist"
            aria-label={lang === "ar" ? "التنقل في القرآن" : lang === "fr" ? "Navigation dans le Coran" : "Quran navigation"}
            className={cn(
              "sidebar-tab-list grid gap-0.5 rounded-lg bg-bg-secondary p-0.5 border border-border/40",
              availableTabs.length === 2 ? "grid-cols-2" : "grid-cols-3",
            )}
          >
            {availableTabs.map((tabId) => (
              <button
                key={tabId}
                role="tab"
                aria-selected={tab === tabId}
                className={cn(
                  "sidebar-tab-trigger flex min-h-[44px] items-center justify-center rounded-md px-2 text-[0.72rem] font-bold text-text-secondary transition-all hover:text-text-primary",
                  tab === tabId && "bg-bg-primary text-primary shadow-sm",
                )}
                onClick={() => setTab(tabId)}
              >
                {tabId === "surah"
                  ? t("sidebar.surahs", lang)
                  : tabId === "juz"
                    ? t("sidebar.juz", lang)
                    : t("quran.page", lang)}
              </button>
            ))}
          </div>

          {/* Row 3: Search (Surah only) */}
          {tab === "surah" && (
            <div className="relative flex items-center">
              <input
                type="text"
                aria-label={
                  lang === "fr"
                    ? "Rechercher une sourate"
                    : lang === "ar"
                      ? "البحث عن سورة"
                      : "Search for a surah"
                }
                placeholder={t("search.placeholder", lang)}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-[44px] w-full rounded-lg border border-border bg-bg-secondary px-3 pr-12 text-[0.78rem] text-text-primary outline-none transition-colors focus:border-primary focus:bg-bg-primary"
              />
              {filter && (
                <button
                  className="absolute right-0 flex h-[44px] w-[44px] items-center justify-center rounded-lg text-[0.65rem] text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                  onClick={() => setFilter("")}
                  aria-label={
                    lang === "fr"
                      ? "Effacer la recherche"
                      : lang === "ar"
                        ? "مسح البحث"
                        : "Clear search"
                  }
                >
                  <X size={10} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div ref={scrollRootRef} className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-0.5">
          {/* ── Section sourates ── */}
          {tab === "surah" && filter && filteredSurahs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted opacity-60 gap-3">
              <Search size={24} />
              <p className="text-[0.9rem] font-medium">
                {lang === "fr"
                  ? "Aucune sourate trouvée"
                  : lang === "ar"
                    ? "لم يتم العثور على سورة"
                    : "No surah found"}
              </p>
            </div>
          )}

          {tab === "surah" &&
            filter &&
            filteredSurahs.length > 0 &&
            filteredSurahs.length < 114 && (
              <div className="flex items-center px-1.5 py-1 text-[0.62rem] font-medium text-text-muted">
                <span>
                  {filteredSurahs.length}{" "}
                  {lang === "ar" ? "نتائج" : lang === "fr" ? "résultats" : "results"}
                </span>
              </div>
            )}

          {tab === "surah" &&
            filteredSurahs.map((s) => {
              const isActive = s.n === currentSurah && displayMode === "surah";
              const surahCalligraphyId = String(s.n).padStart(3, "0");
              return (
                <VirtualizedItem
                  key={s.n}
                  cacheKey={`sidebar:surah:${filter || "all"}:${s.n}`}
                  eager={Boolean(filter) || s.n <= 16}
                  estimatedHeight={52}
                  pinned={isActive}
                  rootRef={scrollRootRef}
                  rootMargin="420px 0px"
                  className="sidebar-virtual-item"
                >
                  {() => (
                <button
                  ref={isActive ? activeItemRef : null}
                  type="button"
                  className={cn(
                    "group flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-all hover:bg-bg-secondary text-left",
                    isActive && "bg-primary/8",
                  )}
                  onClick={() => goSurah(s.n)}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-bg-secondary text-[0.68rem] font-bold text-text-muted group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    {s.n}
                  </div>
                  <div className="flex flex-1 flex-col items-start min-w-0">
                    <span
                      className={cn(
                        "truncate text-[0.82rem] font-semibold transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-text-primary group-hover:text-primary",
                      )}
                    >
                      {lang === "fr" ? s.fr : s.en}
                    </span>
                    <span className="flex items-center gap-1 truncate text-[0.64rem] text-text-muted">
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-1 py-0.5 text-[0.56rem] font-bold",
                          s.type === "Meccan"
                            ? "bg-gold/10 text-gold"
                            : "bg-primary/8 text-primary",
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
                    className="shrink-0 font-surah-names text-[1.3rem] opacity-70 transition-opacity group-hover:opacity-100"
                    aria-label={s.ar}
                  >
                    {surahCalligraphyId}
                  </div>
                </button>
                  )}
                </VirtualizedItem>
              );
            })}

          {tab === "juz" &&
            JUZ_DATA.map((j) => {
              const isActive = j.juz === currentJuz && displayMode === "juz";
              const startSurah = SURAHS[j.start.s - 1];
              return (
                <button
                  key={j.juz}
                  ref={isActive ? activeItemRef : null}
                  type="button"
                  className={cn(
                    "group flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-all hover:bg-bg-secondary text-left",
                    isActive && "bg-primary/8",
                  )}
                  onClick={() => goJuz(j.juz)}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-bg-secondary text-[0.68rem] font-bold text-text-muted group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    {lang === "ar" ? toAr(j.juz) : j.juz}
                  </div>
                  <div className="flex flex-1 flex-col items-start min-w-0">
                    <span
                      className={cn(
                        "truncate text-[0.82rem] font-semibold transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-text-primary group-hover:text-primary",
                      )}
                    >
                      {lang === "ar" ? `الجزء ${toAr(j.juz)}` : `Juz ${j.juz}`}
                    </span>
                    {startSurah && (
                      <span
                        className="flex items-center gap-1 truncate text-[0.64rem] text-text-muted"
                        lang={lang === "ar" ? "ar" : undefined}
                        dir={lang === "ar" ? "rtl" : undefined}
                      >
                        {lang === "fr"
                          ? startSurah.fr
                          : lang === "ar"
                            ? startSurah.ar
                            : startSurah.en}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-[0.65rem] font-bold text-text-muted">
                    {j.name}
                  </div>
                </button>
              );
            })}

          {tab === "page" && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  aria-label={
                    lang === "fr"
                      ? "Numéro de page"
                      : lang === "ar"
                        ? "رقم الصفحة"
                        : "Page number"
                  }
                  min={1}
                  max={604}
                  className="h-[44px] w-full rounded-lg border border-border bg-transparent px-3 text-[0.78rem] text-text-primary outline-none transition-colors focus:border-primary"
                  placeholder={isRtl ? "الصفحة" : "Page 1-604"}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPageJump()}
                />
                <button
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-primary text-white text-[0.75rem] transition-colors hover:bg-primary-dark"
                  onClick={submitPageJump}
                  aria-label={
                    lang === "fr"
                      ? "Aller à la page"
                      : lang === "ar"
                        ? "الانتقال الى الصفحة"
                        : "Go to page"
                  }
                >
                  {isRtl ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                </button>
              </div>
              <div className="flex items-center px-1 text-[0.65rem] font-bold text-text-muted uppercase tracking-wide">
                <span>
                  {lang === "fr" ? "Juz" : lang === "ar" ? "الجزء" : "Juz"}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {JUZ_PAGE_RANGES.map((range) => (
                  <button
                    key={range.juz}
                    className={cn(
                      "flex min-h-[44px] items-center justify-center rounded-md border text-[0.7rem] font-bold transition-colors",
                      selectedJuzForPages === range.juz
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-transparent text-text-secondary hover:bg-primary/5 hover:text-primary",
                    )}
                    onClick={() => setSelectedJuzForPages(range.juz)}
                  >
                    {isRtl ? toAr(range.juz) : range.juz}
                  </button>
                ))}
              </div>
              <div className="flex items-center px-1 pt-1 text-[0.65rem] font-bold text-text-muted uppercase tracking-wide">
                <span>
                  {lang === "fr"
                    ? "Pages"
                    : lang === "ar"
                      ? "الصفحات"
                      : "Pages"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
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
                        "flex min-h-[44px] items-center justify-center rounded-md border text-[0.72rem] font-semibold transition-colors",
                        p === currentPage
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-transparent text-text-secondary hover:bg-primary/5 hover:text-primary",
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
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-bg-primary px-3 py-1.5 text-[0.65rem] font-medium text-text-muted">
          <span>
            {tab === "surah"
              ? `${filteredSurahs.length} ${lang === "ar" ? "سورة" : lang === "fr" ? "Sourates" : "Surahs"}`
              : tab === "juz"
                ? `30 ${lang === "ar" ? "جزء" : "Juz"}`
                : `604 ${lang === "ar" ? "صفحة" : lang === "fr" ? "Pages" : "Pages"}`}
          </span>
          <span className="text-[0.6rem] font-bold uppercase tracking-wide">
            {riwaya === "warsh" ? "Warsh" : "Hafs"}
          </span>
        </div>
      </aside>
    </>
  );
}
