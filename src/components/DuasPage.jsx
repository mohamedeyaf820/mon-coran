import React, { useEffect, useRef } from "react";
import "../styles/domains/duas-page.css";
import "../styles/domains/duas-hub.css";
import { useApp } from "../context/AppContext";
import Footer from "./Footer";
import DuasHub from "./duas/DuasHub";
import HisnChapter from "./duas/HisnChapter";
import HisnChapterList from "./duas/HisnChapterList";
import KhatmView from "./duas/KhatmView";
import QuranDuasList from "./duas/QuranDuasList";
import RabbanaList from "./duas/RabbanaList";
import { parseDuasRoute } from "./duas/duasRoute";
import { useHisn } from "./duas/useHisn";

/**
 * Invocations & Adhkar. The hub (/duas) leads to the Hisn al-Muslim chapters
 * (/duas/hisn, /duas/hisn/27) and to the supplications quoted from the Quran
 * (/duas/coran, /duas/rabbana, /duas/khatm). The route lives in AppContext (`duasRoute`) and is mirrored
 * in the URL by useUrlSync, so Back, a reload and a shared address all work.
 */
export default function DuasPage() {
  const { state, dispatch, set } = useApp();
  const { lang, duasRoute } = state;
  const route = parseDuasRoute(duasRoute);
  const headingRef = useRef(null);
  const shownRoute = useRef(duasRoute);

  // The Quranic list reads local data only: the Hisn files are fetched where they are shown.
  const hisn = useHisn(lang, !["quran", "rabbana"].includes(route.view));

  // A new page starts at its top and its title takes focus.
  useEffect(() => {
    // Only a real page change moves the focus (also keeps development double-mounting quiet).
    if (shownRoute.current === duasRoute) return;
    shownRoute.current = duasRoute;
    document.querySelector(".app-main-shell")?.scrollTo?.({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [duasRoute]);

  let view;
  if (route.view === "chapter") {
    view = <HisnChapter lang={lang} hisn={hisn} chapterId={route.chapterId} headingRef={headingRef} />;
  } else if (route.view === "hisn") {
    view = <HisnChapterList lang={lang} hisn={hisn} headingRef={headingRef} />;
  } else if (route.view === "quran") {
    view = <QuranDuasList lang={lang} headingRef={headingRef} />;
  } else if (route.view === "rabbana") {
    view = <RabbanaList lang={lang} headingRef={headingRef} />;
  } else if (route.view === "khatm") {
    view = <KhatmView lang={lang} hisn={hisn} headingRef={headingRef} />;
  } else {
    view = <DuasHub lang={lang} hisn={hisn} headingRef={headingRef} />;
  }

  return (
    <div className="duas-page duas-page--platform" data-duas-view={route.view}>
      {view}
      <Footer
        goSurah={(n) => {
          set({ showDuas: false, showHome: false });
          dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
        }}
      />
    </div>
  );
}
