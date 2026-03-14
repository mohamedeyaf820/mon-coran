/* ══════════════════════════════════════════════════════════════
   AudioMakerPanel — Create custom audio sessions
   Permet de combiner surahs et créer des sessions de lecture
   ══════════════════════════════════════════════════════════════ */
import React, { useState, useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS from "../data/surahs";
import audioService from "../services/audioService";
import { getReciter } from "../data/reciters";
import { cn } from "../lib/utils";

export default function AudioMakerPanel() {
  const { state, dispatch, set } = useApp();
  const { lang, reciter, riwaya } = state;

  const [selectedSurahs, setSelectedSurahs] = useState([]);
  const [sessionName, setSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const close = () => set({ audioMakerOpen: false });

  /* --- Filter surahs by search --- */
  const filteredSurahs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return SURAHS.filter(
      (s) =>
        s.en.toLowerCase().includes(q) ||
        s.fr.toLowerCase().includes(q) ||
        s.ar.toLowerCase().includes(q) ||
        s.n.toString().includes(q),
    );
  }, [searchQuery]);

  /* --- Toggle surah selection --- */
  const toggleSurah = (surahNum) => {
    setSelectedSurahs((prev) =>
      prev.includes(surahNum)
        ? prev.filter((n) => n !== surahNum)
        : [...prev, surahNum],
    );
    setIsSaved(false);
  };

  /* --- Play selected surahs --- */
  const handlePlay = useCallback(async () => {
    if (selectedSurahs.length === 0) return;
    setIsCreating(true);

    try {
      const reciterObj = getReciter(reciter, riwaya);
      const cdnPath = reciterObj?.cdn || reciter;
      const cdnType = reciterObj?.cdnType || "islamic";

      /* Build playlist for audioService — include ayah numbers */
      const playlist = selectedSurahs.flatMap((surahNum) => {
        const surah = SURAHS.find((s) => s.n === surahNum);
        if (!surah) return [];
        /* For simplicity, add first ayah of each surah */
        return [{
          surah: surahNum,
          surahNumber: surahNum,
          ayah: 1,
          numberInSurah: 1,
          number: computeGlobalAyahNumber(surahNum, 1),
          text: surah.ar || "",
        }];
      });

      if (playlist.length === 0) {
        setIsCreating(false);
        return;
      }

      audioService.loadPlaylist(playlist, cdnPath, cdnType);
      audioService.play();

      /* Update app state to begin playing */
      dispatch({
        type: "SET_PLAYING",
        payload: {
          playing: true,
          surah: selectedSurahs[0],
          ayah: 1,
        },
      });

      close();
    } catch (err) {
      console.error("Play error:", err);
      window.dispatchEvent(
        new CustomEvent("quran-toast", {
          detail: {
            type: "error",
            message: lang === "fr" ? "Erreur lecture" : "Play error",
          },
        }),
      );
    } finally {
      setIsCreating(false);
    }
  }, [selectedSurahs, reciter, riwaya, dispatch, lang, close]);

  /* --- Save session to localStorage --- */
  const handleSave = () => {
    if (!sessionName.trim() || selectedSurahs.length === 0) {
      alert(lang === "fr" ? "Remplissez le nom" : "Enter session name");
      return;
    }

    try {
      const sessions = JSON.parse(
        localStorage.getItem("audio_maker_sessions") || "[]",
      );
      sessions.push({
        id: Date.now(),
        name: sessionName,
        surahs: selectedSurahs,
        date: new Date().toISOString(),
      });
      localStorage.setItem("audio_maker_sessions", JSON.stringify(sessions));
      setSessionName("");
      setIsSaved(true);

      /* Toast notification */
      window.dispatchEvent(
        new CustomEvent("quran-toast", {
          detail: {
            type: "success",
            message:
              lang === "fr"
                ? "Session sauvegardée ✓"
                : "Session saved ✓",
          },
        }),
      );

      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  /* --- UI text helper --- */
  const label = (key) => (lang === "fr" ? key.fr : key.en);

  return (
    <div className="audio-maker-modal">
      <div className="audio-maker-overlay" onClick={close} />

      <div className="audio-maker-panel">
        {/* Header */}
        <div className="audio-maker-header">
          <h2 className="audio-maker-title">
            {lang === "fr" ? "🎙️ Audio Maker" : "🎙️ Audio Maker"}
          </h2>
          <button
            className="audio-maker-close"
            onClick={close}
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Content */}
        <div className="audio-maker-content">
          {/* Search bar */}
          <div className="audio-maker-search-wrap">
            <input
              type="text"
              className="audio-maker-search"
              placeholder={
                lang === "fr" ? "Chercher une sourate..." : "Search surah..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search" />
          </div>

          {/* Session name input */}
          <div className="audio-maker-session">
            <input
              type="text"
              className="audio-maker-session-input"
              placeholder={
                lang === "fr"
                  ? "Nom de la session..."
                  : "Session name..."
              }
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
            <span className="audio-maker-count">
              {selectedSurahs.length}{" "}
              {lang === "fr" ? "surahs" : "surahs"}
            </span>
          </div>

          {/* Surahs list */}
          <div className="audio-maker-list">
            {filteredSurahs.length === 0 ? (
              <div className="audio-maker-empty">
                {lang === "fr" ? "Aucune sourate trouvée" : "No surahs found"}
              </div>
            ) : (
              filteredSurahs.map((surah) => (
                <button
                  key={surah.n}
                  className={cn(
                    "audio-maker-item",
                    selectedSurahs.includes(surah.n) &&
                      "audio-maker-item--selected",
                  )}
                  onClick={() => toggleSurah(surah.n)}
                >
                  <div className="audio-maker-item-checkbox">
                    {selectedSurahs.includes(surah.n) && (
                      <i className="fas fa-check" />
                    )}
                  </div>
                  <div className="audio-maker-item-num">{surah.n}</div>
                  <div className="audio-maker-item-content">
                    <div className="audio-maker-item-name">{surah.en}</div>
                    <div className="audio-maker-item-detail">
                      <span>{lang === "fr" ? surah.fr : surah.en}</span>
                      <span className="audio-maker-item-ayahs">
                        {surah.ayahs} {lang === "fr" ? "ayat" : "ayahs"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="audio-maker-item-ar"
                    dir="rtl"
                  >
                    {surah.ar}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="audio-maker-footer">
          <button
            className="audio-maker-btn audio-maker-btn--secondary"
            onClick={() => {
              setSelectedSurahs([]);
              setSessionName("");
              setIsSaved(false);
            }}
          >
            <i className="fas fa-trash-alt" />{" "}
            {lang === "fr" ? "Réinitialiser" : "Clear"}
          </button>

          <div className="audio-maker-btn-group">
            <button
              className={cn(
                "audio-maker-btn audio-maker-btn--save",
                isSaved && "audio-maker-btn--saved",
              )}
              onClick={handleSave}
              disabled={selectedSurahs.length === 0}
            >
              <i
                className={cn(
                  "fas",
                  isSaved ? "fa-check" : "fa-bookmark",
                )}
              />{" "}
              {isSaved
                ? lang === "fr"
                  ? "Sauvegardé"
                  : "Saved"
                : lang === "fr"
                  ? "Sauvegarder"
                  : "Save"}
            </button>

            <button
              className="audio-maker-btn audio-maker-btn--primary"
              onClick={handlePlay}
              disabled={selectedSurahs.length === 0 || isCreating}
            >
              <i
                className={cn(
                  "fas",
                  isCreating ? "fa-spinner fa-spin" : "fa-play",
                )}
              />{" "}
              {isCreating
                ? lang === "fr"
                  ? "Préparation..."
                  : "Loading..."
                : lang === "fr"
                  ? "Écouter"
                  : "Play"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Helper: compute global ayah number --- */
function computeGlobalAyahNumber(surahNum, surahAyahNum) {
  const offsets = [
    0, 7, 286, 468, 645, 864, 1038, 1230, 1505, 1763, 1986, 2192, 2368, 2606,
    2877, 3144, 3326, 3597, 3842, 4119, 4340, 4689, 4852, 5037, 5204, 5571,
    5683, 5900, 6118, 6325, 6632, 6948, 7191, 7487, 7686, 7942, 8285, 8578,
    8942, 9287, 9629, 9956, 10237, 10492, 10688, 11007, 11311, 11588, 11931,
    12182, 12545, 12800, 13055, 13315, 13612, 13992, 14257, 14504, 14896,
    15122, 15378, 15760, 16169, 16430, 16673, 16923, 17418, 17776, 18098,
    18435, 18674, 18953, 19260, 19542, 19812, 20097, 20407, 20667, 20931,
    21246, 21519, 21905, 22204, 22496, 22703, 23064, 23239, 23453, 23632,
    24035, 24237, 24524, 24793, 25108, 25457, 25761, 26200, 26532, 26841,
    27096, 27481, 27801, 28087, 28369, 28626, 28977, 29196, 29471, 29755,
    29968, 30331, 30556, 30866, 31109, 31405, 31632, 31932, 32285, 32543,
    32623,
  ];
  return (offsets[surahNum - 1] || 0) + surahAyahNum;
}
