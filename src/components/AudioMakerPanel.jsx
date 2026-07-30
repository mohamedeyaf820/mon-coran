/* ══════════════════════════════════════════════════════════════
   AudioMakerPanel — Create custom audio sessions
   Permet de combiner surahs et créer des sessions de lecture
   ══════════════════════════════════════════════════════════════ */
import React, { useState, useCallback, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import SURAHS from "../data/surahs";
import audioService from "../services/audioService";
import { ensureReciterForRiwaya, getReciter } from "../data/reciters";
import { buildAudioPlaylistForSurahs } from "../utils/audioPlaylist";
import { cn, toast } from "../lib/utils";
import { X, Search, Check, Trash2, Bookmark, Play, Loader2 } from "lucide-react";

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
      const safeReciterId = ensureReciterForRiwaya(reciter, riwaya);
      const reciterObj = getReciter(safeReciterId, riwaya);
      const cdnPath = reciterObj?.cdn || reciter;
      const cdnType = reciterObj?.cdnType || "islamic";

      /* Build playlist for audioService — include ayah numbers */
      const playlist = await buildAudioPlaylistForSurahs(
        selectedSurahs,
        riwaya,
      );

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
      toast(
        lang === "ar"
          ? "أدخل اسم الجلسة واختر سورة واحدة على الأقل."
          : lang === "en"
            ? "Enter a session name and select at least one surah."
            : "Saisissez un nom et sélectionnez au moins une sourate.",
        "warning",
      );
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
              lang === "fr" ? "Session sauvegardée ✓" : "Session saved ✓",
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
    <Dialog.Root
      open
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <Dialog.Portal>
        <div className="audio-maker-modal">
          <div className="audio-maker-overlay" onClick={close} />
          <Dialog.Content
            className="audio-maker-panel"
            onEscapeKeyDown={close}
            onInteractOutside={close}
          >
            <Dialog.Title className="sr-only">
              {lang === "ar" ? "صانع المقاطع الصوتية" : lang === "en" ? "Audio maker" : "Créateur audio"}
            </Dialog.Title>
            {/* Header */}
            <div className="audio-maker-header">
              <h2 className="audio-maker-title">
                {lang === "fr" ? "🎙️ Audio Maker" : "🎙️ Audio Maker"}
              </h2>
              <button
                className="audio-maker-close"
                onClick={close}
                aria-label={t("audio.close", lang)}
              >
                <X size={14} />
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
                    lang === "fr"
                      ? "Chercher une sourate..."
                      : "Search surah..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={13} />
              </div>

              {/* Session name input */}
              <div className="audio-maker-session">
                <input
                  type="text"
                  className="audio-maker-session-input"
                  placeholder={
                    lang === "fr" ? "Nom de la session..." : "Session name..."
                  }
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                />
                <span className="audio-maker-count">
                  {selectedSurahs.length} {lang === "fr" ? "surahs" : "surahs"}
                </span>
              </div>

              {/* Surahs list */}
              <div className="audio-maker-list">
                {filteredSurahs.length === 0 ? (
                  <div className="audio-maker-empty">
                    {lang === "fr"
                      ? "Aucune sourate trouvée"
                      : "No surahs found"}
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
                          <Check size={11} />
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
                      <div className="audio-maker-item-ar" dir="rtl">
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
                <Trash2 size={13} />{" "}
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
                  {isSaved ? <Check size={13} /> : <Bookmark size={13} />}{" "}
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
                  {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}{" "}
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
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
