import React, { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA, JUZ_PAGE_RANGES } from "../data/juz";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Separator } from "./ui/separator";

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

  const availableTabs =
    riwaya === "warsh" ? ["surah", "juz"] : ["surah", "juz", "page"];

  const [tab, setTab] = useState("surah");

  useEffect(() => {
    if (riwaya === "warsh" && tab === "page") {
      setTab("surah");
    }
  }, [riwaya, tab]);

  const [filter, setFilter] = useState("");
  const [pageInput, setPageInput] = useState("");
  const [selectedJuzForPages, setSelectedJuzForPages] = useState(1);
  const activeItemRef = useRef(null);

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
        String(s.n) === filter,
    );
  }, [filter]);

  const goSurah = (n) => {
    set({ displayMode: "surah", showHome: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
  };

  const goPage = (p) => {
    set({ displayMode: "page", showHome: false });
    dispatch({ type: "NAVIGATE_PAGE", payload: { page: p } });
  };

  const goJuz = (juz) => {
    set({ showHome: false });
    dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
  };

  const isRtl = lang === "ar";

  return (
    <aside
      className={cn(
        "fixed top-0 bottom-0 z-[200] flex flex-col overflow-hidden",
        "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "border-[var(--border-strong)]",
        isRtl ? "rounded-s-2xl border-s" : "rounded-e-2xl border-e",
      )}
      style={{
        top: "var(--header-h)",
        width: "var(--sidebar-w)",
        maxWidth: "100vw",
        background:
          "linear-gradient(180deg, var(--bg-card) 0%, var(--bg-secondary) 100%)",
        boxShadow: sidebarOpen
          ? "4px 0 40px rgba(28,25,23,0.13), 2px 0 12px rgba(28,25,23,0.07)"
          : "none",
        transform: sidebarOpen
          ? "translateX(0)"
          : isRtl
            ? "translateX(100%)"
            : "translateX(-100%)",
        ...(isRtl ? { right: 0 } : { left: 0 }),
      }}
      role="navigation"
      aria-label={t("nav.surahList", lang)}
    >
      {/* ── Tabs ── */}
      <div className="shrink-0 px-3 pt-3.5 pb-2.5 border-b border-[var(--border)] backdrop-blur-xl">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList
            className="w-full grid grid-cols-auto gap-1 bg-[var(--bg-secondary)] border border-[var(--border-light)] p-1 rounded-xl"
            style={{
              gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)`,
            }}
          >
            {availableTabs.map((t2) => (
              <TabsTrigger
                key={t2}
                value={t2}
                className="text-[0.73rem] py-1.5 rounded-[10px] font-semibold"
              >
                {t2 === "surah" && (
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-align-justify text-[0.6rem] opacity-70" />
                    {t("sidebar.surahs", lang)}
                  </span>
                )}
                {t2 === "juz" && (
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-book-open text-[0.6rem] opacity-70" />
                    {t("sidebar.juz", lang)}
                  </span>
                )}
                {t2 === "page" && (
                  <span className="flex items-center gap-1.5">
                    <i className="fas fa-file-lines text-[0.6rem] opacity-70" />
                    {t("quran.page", lang)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* ── Search (surah tab only) ── */}
      {tab === "surah" && (
        <div className="shrink-0 px-3 pt-2.5 pb-2.5 border-b border-[var(--border-light)]">
          <div className="relative">
            <i
              className={cn(
                "fas fa-search absolute top-1/2 -translate-y-1/2 text-[0.72rem] pointer-events-none text-[var(--text-muted)]",
                isRtl ? "right-3" : "left-3",
              )}
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder={t("search.placeholder", lang)}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={cn(
                "h-9 text-[0.8rem] rounded-xl",
                isRtl ? "pr-9 pl-3" : "pl-9 pr-3",
              )}
              aria-label={t("search.placeholder", lang)}
            />
          </div>
        </div>
      )}

      {/* ── Content list ── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--scrollbar-thumb) transparent",
        }}
      >
        {/* ━━━━━━━━━━━━━━━━━━━━ Surah list ━━━━━━━━━━━━━━━━━━━━ */}
        {tab === "surah" && (
          <div className="py-1">
            {filteredSurahs.map((s) => {
              const isActive = s.n === currentSurah;
              return (
                <button
                  key={s.n}
                  ref={isActive ? activeItemRef : null}
                  className={cn(
                    "group flex items-center w-full gap-3 cursor-pointer text-start outline-none",
                    "transition-all duration-150 border-none",
                    "px-3 py-[0.6rem]",
                    isActive
                      ? "bg-[rgba(var(--primary-rgb),0.07)]"
                      : "bg-transparent hover:bg-[rgba(var(--primary-rgb),0.035)]",
                  )}
                  style={{
                    borderInlineStart: `3px solid ${isActive ? "var(--primary)" : "transparent"}`,
                    fontFamily: "var(--font-ui)",
                    color: "var(--text)",
                  }}
                  onClick={() => goSurah(s.n)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Number badge */}
                  <span
                    className={cn(
                      "w-8 h-8 shrink-0 flex items-center justify-center rounded-xl",
                      "font-bold text-[0.71rem] transition-all duration-150",
                      "font-[var(--font-ui)]",
                    )}
                    style={
                      isActive
                        ? {
                            background: "var(--primary)",
                            color: "#fff",
                            boxShadow:
                              "0 2px 10px rgba(var(--primary-rgb),0.28)",
                          }
                        : {
                            background: "var(--primary-light)",
                            color: "var(--primary)",
                          }
                    }
                  >
                    {lang === "ar" ? toAr(s.n) : s.n}
                  </span>

                  {/* Surah info */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="block text-[0.93rem] leading-[1.35] overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ fontFamily: "'Amiri', serif" }}
                    >
                      {s.ar}
                    </span>
                    <span className="block text-[0.65rem] mt-[2px] overflow-hidden text-ellipsis whitespace-nowrap text-[var(--text-muted)] font-[var(--font-ui)]">
                      {lang === "fr" ? s.fr : lang === "en" ? s.en : ""} ·{" "}
                      {s.ayahs} {t("quran.ayah", lang)}
                    </span>
                  </div>

                  {/* Type badge */}
                  <Badge
                    variant={s.type === "Meccan" ? "gold" : "success"}
                    size="sm"
                    className="shrink-0 text-[0.57rem] font-bold tracking-wide px-1.5"
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
                  </Badge>
                </button>
              );
            })}

            {filteredSurahs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <i className="fas fa-search text-2xl text-[var(--text-muted)] mb-3 opacity-40" />
                <p className="text-[0.82rem] text-[var(--text-muted)] font-[var(--font-ui)]">
                  {lang === "fr"
                    ? "Aucune sourate trouvée"
                    : lang === "ar"
                      ? "لم يتم العثور على سورة"
                      : "No surah found"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━ Juz list ━━━━━━━━━━━━━━━━━━━━ */}
        {tab === "juz" && (
          <div className="py-1">
            {JUZ_DATA.map((j) => {
              const startSurah = SURAHS.find((s) => s.n === j.start.s);
              const isActive = j.juz === currentJuz && displayMode === "juz";
              return (
                <button
                  key={j.juz}
                  ref={isActive ? activeItemRef : null}
                  className={cn(
                    "group flex items-center w-full gap-3 cursor-pointer text-start outline-none",
                    "transition-all duration-150 border-none",
                    "px-3 py-[0.6rem]",
                    isActive
                      ? "bg-[rgba(var(--primary-rgb),0.07)]"
                      : "bg-transparent hover:bg-[rgba(var(--primary-rgb),0.035)]",
                  )}
                  style={{
                    borderInlineStart: `3px solid ${isActive ? "var(--primary)" : "transparent"}`,
                    fontFamily: "var(--font-ui)",
                    color: "var(--text)",
                  }}
                  onClick={() => goJuz(j.juz)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Number badge */}
                  <span
                    className={cn(
                      "w-8 h-8 shrink-0 flex items-center justify-center rounded-xl",
                      "font-bold text-[0.71rem] transition-all duration-150",
                      "font-[var(--font-ui)]",
                    )}
                    style={
                      isActive
                        ? {
                            background: "var(--primary)",
                            color: "#fff",
                            boxShadow:
                              "0 2px 10px rgba(var(--primary-rgb),0.28)",
                          }
                        : {
                            background: "var(--primary-light)",
                            color: "var(--primary)",
                          }
                    }
                  >
                    {lang === "ar" ? toAr(j.juz) : j.juz}
                  </span>

                  {/* Juz info */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="block text-[0.93rem] leading-[1.35] overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ fontFamily: "'Amiri', serif" }}
                    >
                      {j.name}
                    </span>
                    <span className="block text-[0.65rem] mt-[2px] text-[var(--text-muted)] font-[var(--font-ui)]">
                      {t("sidebar.juz", lang)}{" "}
                      {lang === "ar" ? toAr(j.juz) : j.juz}
                      {startSurah && (
                        <>
                          {" · "}
                          {startSurah.ar} {t("quran.ayah", lang)}{" "}
                          {lang === "ar" ? toAr(j.start.a) : j.start.a}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 shadow-[0_0_6px_rgba(var(--primary-rgb),0.4)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━ Page navigation ━━━━━━━━━━━━━━━━━━━━ */}
        {tab === "page" && (
          <div>
            {/* Direct page input */}
            <div className="flex gap-2 px-3 py-3 border-b border-[var(--border-light)]">
              <Input
                type="number"
                min={1}
                max={604}
                placeholder={
                  lang === "ar"
                    ? "رقم الصفحة"
                    : lang === "fr"
                      ? "N° page"
                      : "Page #"
                }
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const p = parseInt(pageInput, 10);
                    if (p >= 1 && p <= 604) {
                      goPage(p);
                      setPageInput("");
                    }
                  }
                }}
                className="flex-1 h-9 text-center text-[0.82rem] rounded-xl"
                aria-label={
                  lang === "ar"
                    ? "رقم الصفحة"
                    : lang === "fr"
                      ? "N° page"
                      : "Page #"
                }
              />
              <Button
                size="sm"
                className="px-4 h-9"
                onClick={() => {
                  const p = parseInt(pageInput, 10);
                  if (p >= 1 && p <= 604) {
                    goPage(p);
                    setPageInput("");
                  }
                }}
                aria-label={
                  lang === "ar" ? "اذهب" : lang === "fr" ? "Aller" : "Go"
                }
              >
                <i
                  className="fas fa-arrow-right text-[0.75rem]"
                  aria-hidden="true"
                />
              </Button>
            </div>

            {/* Juz selector for pages */}
            <div className="px-3 py-3 border-b border-[var(--border-light)]">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] font-[var(--font-ui)] mb-2">
                {lang === "ar"
                  ? "اختر الجزء"
                  : lang === "fr"
                    ? "Sélectionner le Juz"
                    : "Select Juz"}
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {JUZ_PAGE_RANGES.map((range) => {
                  const isActive = selectedJuzForPages === range.juz;
                  return (
                    <button
                      key={range.juz}
                      className={cn(
                        "w-[30px] h-[30px] rounded-xl font-bold text-[0.65rem] cursor-pointer outline-none",
                        "transition-all duration-150 border-[1.5px] font-[var(--font-ui)]",
                        isActive
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_2px_6px_rgba(var(--primary-rgb),0.22)] scale-105"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)]",
                      )}
                      onClick={() => setSelectedJuzForPages(range.juz)}
                      aria-pressed={isActive}
                    >
                      {lang === "ar" ? toAr(range.juz) : range.juz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pages grid */}
            <div className="grid grid-cols-5 gap-1.5 px-3 py-3.5">
              {(() => {
                const range =
                  JUZ_PAGE_RANGES.find((r) => r.juz === selectedJuzForPages) ||
                  JUZ_PAGE_RANGES[0];
                const pages = [];
                for (let p = range.startPage; p <= range.endPage; p++)
                  pages.push(p);
                return pages.map((p) => {
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={p}
                      className={cn(
                        "py-[6px] rounded-xl cursor-pointer text-[0.7rem] text-center font-semibold outline-none",
                        "transition-all duration-150 border-[1.5px] font-[var(--font-ui)]",
                        isActive
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_2px_6px_rgba(var(--primary-rgb),0.2)] scale-[1.04]"
                          : "bg-[var(--bg-secondary)] text-[var(--text)] border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-tertiary)]",
                      )}
                      onClick={() => goPage(p)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {lang === "ar" ? toAr(p) : p}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer info ── */}
      <div
        className="shrink-0 px-3.5 py-2.5 border-t border-[var(--border)]"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="flex items-center justify-between text-[0.6rem] text-[var(--text-muted)] font-[var(--font-ui)]">
          <span>
            {tab === "surah"
              ? `${filteredSurahs.length} ${lang === "fr" ? "sourates" : lang === "ar" ? "سورة" : "surahs"}`
              : tab === "juz"
                ? `30 ${lang === "fr" ? "juz" : lang === "ar" ? "جزء" : "juz"}`
                : `604 ${lang === "fr" ? "pages" : lang === "ar" ? "صفحة" : "pages"}`}
          </span>
          <span className="flex items-center gap-1 opacity-60">
            <i className="fas fa-book-quran text-[0.6rem]" />
            {riwaya === "warsh" ? "ورش" : "حفص"}
          </span>
        </div>
      </div>
    </aside>
  );
}
