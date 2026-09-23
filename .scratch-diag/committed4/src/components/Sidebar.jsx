import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import "../styles/sidebar-enhanced.css";
import { X, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS, { toAr } from "../data/surahs";
import { getSurahVerseCountByRiwaya } from "../constants/warshSource";
import { JUZ_DATA, JUZ_PAGE_RANGES } from "../data/juz";
import { cn } from "../lib/utils";
import VirtualizedItem from "./ui/VirtualizedItem";
import { filterSurahDirectory } from "../utils/searchIntelligence";

const localizedSurahName = (surah, lang) =>
  lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en;

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

  // From lg the shell shifts <main> beside the panel (see App.jsx
  // sidebarShiftClass): it is a docked rail, not a modal — no focus trap, no
  // dialog semantics. focusReading keeps the drawer behaviour at any width
  // because there the panel floats over unshifted content.
  const [isWideViewport, setIsWideViewport] = useState(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false,
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (event) => setIsWideViewport(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const sidebarIsModal = sidebarOpen && !(isWideViewport && !state.focusReading);

  const [filter, setFilter] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [selectedJuzForPages, setSelectedJuzForPages] = useState(1);
  const sidebarRef = useRef(null);
  const scrollRootRef = useRef(null);
  const closeButtonRef = useRef(null);
  const activeItemRef = useRef(null);
  const navigationRequestRef = useRef(0);
  const previouslyFocusedRef = useRef(null);
  const wasOpenRef = useRef(false);
  const currentSurahMeta = SURAHS[currentSurah - 1];
  const activeSummary =
    displayMode === "surah"
      ? currentSurahMeta
        ? lang === "ar"
          ? currentSurahMeta.ar
          : `${localizedSurahName(currentSurahMeta, lang)} · ${currentSurahMeta.ar}`
        : null
      : displayMode === "juz"
        ? lang === "ar"
          ? `الجزء ${toAr(currentJuz)}`
          : `Juz ${currentJuz}`
        : `${lang === "ar" ? "الصفحة" : "Page"} ${
            lang === "ar" ? toAr(currentPage) : currentPage
          }`;

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

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const closeFromOutside = (event) => {
      if (event.key !== "Escape") return;
      if (sidebarRef.current?.contains(event.target)) return;
      event.preventDefault();
      dispatch({ type: "TOGGLE_SIDEBAR" });
    };
    document.addEventListener("keydown", closeFromOutside);
    return () => document.removeEventListener("keydown", closeFromOutside);
  }, [dispatch, sidebarOpen]);

  const handleSidebarKeyDown = (event) => {
    if (!sidebarOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      dispatch({ type: "TOGGLE_SIDEBAR" });
      return;
    }

    if (event.key !== "Tab" || !sidebarIsModal) return;
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

  const filteredSurahs = useMemo(
    () => filterSurahDirectory(filter),
    [filter],
  );

  const warmTarget = useCallback(
    (mode, value) =>
      import("./QuranDisplay/useQuranDisplayData")
        .then(({ preloadQuranDisplayData }) =>
          preloadQuranDisplayData({
            currentSurah: mode === "surah" ? value : state.currentSurah,
            currentPage: mode === "page" ? value : state.currentPage,
            currentJuz: mode === "juz" ? value : state.currentJuz,
            displayMode: mode,
            lang,
            riwaya,
            warshStrictMode: state.warshStrictMode,
          }),
        )
        .catch(() => null),
    [
      lang,
      riwaya,
      state.currentJuz,
      state.currentPage,
      state.currentSurah,
      state.warshStrictMode,
    ],
  );

  const navigateTo = useCallback(
    async (mode, value) => {
      const requestId = navigationRequestRef.current + 1;
      navigationRequestRef.current = requestId;
      await warmTarget(mode, value);
      if (navigationRequestRef.current !== requestId) return;
      set({ displayMode: mode, showHome: false, showDuas: false });
      if (mode === "page") {
        dispatch({ type: "NAVIGATE_PAGE", payload: { page: value } });
      } else if (mode === "juz") {
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: value } });
      } else {
        dispatch({ type: "NAVIGATE_SURAH", payload: { surah: value, ayah: 1 } });
      }
    },
    [dispatch, set, warmTarget],
  );

  const goSurah = (n) => navigateTo("surah", n);
  const goPage = (p) => navigateTo("page", p);

  const submitPageJump = () => {
    const page = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(page)) return;
    goPage(Math.min(604, Math.max(1, page)));
  };

  const goJuz = (juz) => navigateTo("juz", juz);

  const isRtl = lang === "ar";

  // Roving tabindex for the tablist: one tab stop, arrows move the selection.
  // RTL lays the strip out right-to-left, so the arrow keys follow it.
  const handleTabKeyDown = (event) => {
    const currentIndex = availableTabs.findIndex((tabId) => tabId === tab);
    const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const previousKey = isRtl ? "ArrowRight" : "ArrowLeft";
    let nextIndex = -1;

    if (event.key === nextKey || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % availableTabs.length;
    } else if (event.key === previousKey || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + availableTabs.length) % availableTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = availableTabs.length - 1;
    }

    if (nextIndex < 0) return;
    event.preventDefault();
    const nextTab = availableTabs[nextIndex];
    setTab(nextTab);
    document.getElementById(`sidebar-tab-${nextTab}`)?.focus();
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        id="sidebar"
        className={cn(
          "sb-wrapper flex h-[100dvh] flex-col",
          // The off-canvas transform is owned by sidebar-enhanced.css, which
          // mirrors it for RTL. A Tailwind translate-* utility here would set the
          // separate `translate` property, which composes with that transform
          // instead of overriding it — cancelling the RTL slide-out entirely.
          sidebarOpen ? "open" : null,
        )}
        aria-label={
          lang === "fr"
            ? "Navigation Coran"
            : lang === "ar"
              ? "التنقل في القرآن"
              : "Quran Navigation"
        }
        aria-hidden={!sidebarOpen}
        aria-modal={sidebarIsModal ? "true" : undefined}
        inert={sidebarOpen ? undefined : ""}
        role={sidebarIsModal ? "dialog" : undefined}
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
                <span className="truncate text-[0.78rem] font-semibold text-text-primary">
                  {activeSummary}
                </span>
              )}
            </div>
            <span className="shrink-0 text-[0.6rem] font-bold text-text-muted uppercase tracking-wide">
              {t(riwaya === "warsh" ? "quran.warsh" : "quran.hafs", lang)}
            </span>
          </div>

          {/* Row 2: Tab bar */}
          <div
            role="tablist"
            aria-label={lang === "ar" ? "التنقل في القرآن" : lang === "fr" ? "Navigation dans le Coran" : "Quran navigation"}
            onKeyDown={handleTabKeyDown}
            className={cn(
              "sidebar-tab-list grid gap-0.5 rounded-lg bg-bg-secondary p-0.5 border border-border/40",
              availableTabs.length === 2 ? "grid-cols-2" : "grid-cols-3",
            )}
          >
            {availableTabs.map((tabId) => (
              <button
                key={tabId}
                id={`sidebar-tab-${tabId}`}
                role="tab"
                aria-selected={tab === tabId}
                aria-controls={`sidebar-panel-${tabId}`}
                tabIndex={tab === tabId ? 0 : -1}
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
                placeholder={t("sidebar.searchPlaceholder", lang)}
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
        <div
          ref={scrollRootRef}
          id={`sidebar-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`sidebar-tab-${tab}`}
          className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-0.5"
        >
          {/* ── Section sourates ── */}
          {tab === "surah" && filter && filteredSurahs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-3">
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
              const verseCount = getSurahVerseCountByRiwaya(s.n, riwaya) || s.ayahs;
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
                    "group flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-[background-color] hover:bg-bg-secondary text-start",
                    isActive && "bg-primary/8",
                  )}
                  onClick={() => goSurah(s.n)}
                  onPointerEnter={() => warmTarget("surah", s.n)}
                  onPointerDown={() => warmTarget("surah", s.n)}
                  onFocus={() => warmTarget("surah", s.n)}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-bg-secondary text-[0.68rem] font-bold text-text-muted group-hover:border-primary/30 group-hover:text-primary transition-colors">
                    {lang === "ar" ? toAr(s.n) : s.n}
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
                      {localizedSurahName(s, lang)}
                    </span>
                    <span className="flex items-center gap-1 truncate text-[0.64rem] text-text-muted">
                      <span className="inline-flex items-center text-[0.64rem] text-text-muted">
                        {s.type === "Meccan"
                          ? t("quran.meccan", lang)
                          : t("quran.medinan", lang)}
                      </span>
                      <span aria-hidden="true">·</span>
                      {lang === "ar" ? toAr(verseCount) : verseCount} {t("quran.ayahs", lang)}
                    </span>
                  </div>
                  {lang !== "ar" && (
                    <span
                      dir="rtl"
                      lang="ar"
                      className="sb-row-ar shrink-0 truncate"
                    >
                      {s.ar}
                    </span>
                  )}
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
                    "group flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-lg p-2 transition-[background-color] hover:bg-bg-secondary text-start",
                    isActive && "bg-primary/8",
                  )}
                  onClick={() => goJuz(j.juz)}
                  onPointerEnter={() => warmTarget("juz", j.juz)}
                  onPointerDown={() => warmTarget("juz", j.juz)}
                  onFocus={() => warmTarget("juz", j.juz)}
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
                        {localizedSurahName(startSurah, lang)}
                      </span>
                    )}
                  </div>
                  <div
                    className="sb-row-ar shrink-0 truncate"
                    dir="rtl"
                    lang="ar"
                  >
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
                      onPointerEnter={() => warmTarget("page", p)}
                      onPointerDown={() => warmTarget("page", p)}
                      onFocus={() => warmTarget("page", p)}
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
        <div className="flex shrink-0 items-center border-t border-border bg-bg-primary px-3 py-1.5 text-[0.65rem] font-medium text-text-muted">
          <span>
            {tab === "surah"
              ? `${lang === "ar" ? toAr(SURAHS.length) : SURAHS.length} ${lang === "ar" ? "سورة" : lang === "fr" ? "sourates" : "surahs"}`
              : tab === "juz"
                ? `${lang === "ar" ? toAr(30) : 30} ${lang === "ar" ? "جزء" : "Juz"}`
                : `${lang === "ar" ? toAr(604) : 604} ${lang === "ar" ? "صفحة" : lang === "fr" ? "pages" : "pages"}`}
          </span>
        </div>
      </aside>
    </>
  );
}
