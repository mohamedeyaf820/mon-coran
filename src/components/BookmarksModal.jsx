import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { getAllBookmarks, removeBookmark } from "../services/storageService";
import { getSurah, toAr } from "../data/surahs";

export default function BookmarksModal() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    getAllBookmarks().then((bms) => {
      setBookmarks(bms.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, []);

  const goTo = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    dispatch({ type: "TOGGLE_BOOKMARKS" });
  };

  const handleRemove = async (surah, ayah) => {
    await removeBookmark(surah, ayah);
    setBookmarks((prev) => prev.filter((b) => b.id !== `${surah}:${ayah}`));
  };

  const close = () => dispatch({ type: "TOGGLE_BOOKMARKS" });

  return (
    <div
      className="modal-overlay !p-3 sm:!p-5"
      onClick={close}
      role="presentation"
    >
      <div
        className="modal !w-full !max-w-3xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmarks-modal-title"
      >
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === "fr"
                ? "Bibliothèque"
                : lang === "ar"
                  ? "المكتبة"
                  : "Library"}
            </div>
            <h2 className="modal-title" id="bookmarks-modal-title">
              <i className="fas fa-bookmark"></i>
              {t("bookmarks.title", lang)}
            </h2>
            <div className="modal-subtitle">
              {lang === "fr"
                ? "Retrouvez rapidement vos versets enregistrés."
                : lang === "ar"
                  ? "استرجع الآيات المحفوظة بسرعة."
                  : "Quick access to your saved verses."}
            </div>
          </div>
          <button
            className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]"
            onClick={close}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-list !max-h-[70vh] !space-y-2 !overflow-auto !p-3 sm:!p-4">
          {bookmarks.length === 0 ? (
            <div className="modal-empty !rounded-2xl !border !border-dashed !border-white/15 !bg-white/[0.03] !p-6 !text-center">
              <i className="fas fa-bookmark modal-empty-icon" />
              <p style={{ margin: "0 0 0.3rem", fontWeight: 600 }}>
                {t("bookmarks.empty", lang)}
              </p>
              <small style={{ opacity: 0.6, fontSize: "0.78rem" }}>
                {lang === "fr"
                  ? "Appuyez sur ★ sur un verset pour l'enregistrer ici."
                  : lang === "ar"
                    ? "اضغط على ★ على أي آية لحفظها هنا."
                    : "Press ★ on any verse to save it here."}
              </small>
            </div>
          ) : (
            bookmarks.map((bm) => {
              const s = getSurah(bm.surah);
              return (
                <div
                  key={bm.id}
                  className="modal-item-card !rounded-2xl !border !border-white/10 !bg-white/[0.03] !p-2.5"
                >
                  <button
                    className="modal-item-main !flex-1 !rounded-xl !px-2 !py-2 !text-left hover:!bg-white/[0.06]"
                    onClick={() => goTo(bm.surah, bm.ayah)}
                  >
                    <span className="modal-item-ar">{s?.ar}</span>
                    <span
                      className="modal-item-name !block !text-[0.8rem] !opacity-70"
                    >
                      {lang === "fr" ? s?.fr || s?.en : s?.en} —{" "}
                      {lang === "fr"
                        ? "Sourate"
                        : lang === "ar"
                          ? "سورة"
                          : "Surah"}{" "}
                      {lang === "ar" ? toAr(bm.surah) : bm.surah}
                    </span>
                    <span
                      className="modal-item-meta !mb-0 !mt-1 !block"
                    >
                      {t("quran.ayah", lang)}{" "}
                      {lang === "ar" ? toAr(bm.ayah) : bm.ayah}
                    </span>
                  </button>
                  <button
                    className="modal-action-btn modal-delete-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-red-300/20 !bg-red-500/10 !text-red-200 hover:!bg-red-500/20"
                    onClick={() => handleRemove(bm.surah, bm.ayah)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
