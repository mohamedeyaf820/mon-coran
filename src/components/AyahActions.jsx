import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
  saveNote,
  getNote,
} from "../services/storageService";
import audioService, { AudioService } from "../services/audioService";
import { ensureReciterForRiwaya, getReciter } from "../data/reciters";
import { getSurah } from "../data/surahs";
import {
  getAllPlaylists,
  addAyahToPlaylist,
} from "../services/playlistService";

/**
 * Actions bar shown when an ayah is tapped/clicked.
 * Play, bookmark, note, share, copy.
 */
export default function AyahActions({ surah, ayah, ayahData }) {
  const { state, dispatch } = useApp();
  const { lang, reciter, riwaya, warshStrictMode } = state;

  const [bookmarked, setBookmarked] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistAdded, setPlaylistAdded] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    isBookmarked(surah, ayah).then(setBookmarked);
    getNote(surah, ayah).then((n) => setNoteText(n?.text || ""));
  }, [surah, ayah]);

  const toggleBookmark = async () => {
    if (bookmarked) {
      await removeBookmark(surah, ayah);
      setBookmarked(false);
      window.dispatchEvent(
        new CustomEvent("quran-toast", {
          detail: {
            type: "info",
            message:
              lang === "ar"
                ? "تمت إزالة الإشارة"
                : lang === "fr"
                  ? "Favori retiré"
                  : "Bookmark removed",
          },
        }),
      );
    } else {
      await addBookmark(surah, ayah);
      setBookmarked(true);
      window.dispatchEvent(
        new CustomEvent("quran-toast", {
          detail: {
            type: "success",
            message:
              lang === "ar"
                ? "تمت إضافة إشارة ★"
                : lang === "fr"
                  ? "Verset mis en favori ★"
                  : "Verse bookmarked ★",
          },
        }),
      );
    }
  };

  const handleSaveNote = async () => {
    if (noteText.trim()) {
      await saveNote(surah, ayah, noteText.trim());
      window.dispatchEvent(
        new CustomEvent("quran-toast", {
          detail: {
            type: "success",
            message:
              lang === "ar"
                ? "تم حفظ الملاحظة!"
                : lang === "fr"
                  ? "Note sauvegardée !"
                  : "Note saved!",
          },
        }),
      );
    }
    setShowNote(false);
  };

  const playAyah = () => {
    if (ayahData) {
      setAudioError(false);
      const safeReciterId = ensureReciterForRiwaya(reciter, riwaya);
      const rec = getReciter(safeReciterId, riwaya);
      if (rec) {
        if (
          riwaya === "warsh" &&
          warshStrictMode &&
          !String(rec.cdn || "")
            .toLowerCase()
            .includes("warsh")
        ) {
          setAudioError(true);
          setTimeout(() => setAudioError(false), 3000);
          return;
        }
        const ayahInfo = {
          surah: surah,
          numberInSurah: ayah,
          number: ayahData.number,
        };
        const url = AudioService.buildUrl(
          rec.cdn || rec.id,
          ayahInfo,
          rec.cdnType || "islamic",
        );
        audioService.playSingle(url, { surah, ayah }).catch(() => {
          setAudioError(true);
          setTimeout(() => setAudioError(false), 3000);
        });
      }
    }
  };

  const copyText = async () => {
    if (ayahData?.text) {
      try {
        await navigator.clipboard.writeText(ayahData.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        console.warn("Copy failed:", err);
      }
    }
  };

  const getShareText = () => {
    const surahInfo = getSurah(surah);
    const surahName = surahInfo
      ? lang === "fr"
        ? surahInfo.fr
        : surahInfo.en
      : `Surah ${surah}`;
    return `${ayahData?.text || ""}\n\n\u2014 ${surahName} (${surah}:${ayah})\nMushafPlus`;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    setShowShare(false);
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(getShareText());
    window.open(
      `https://t.me/share/url?text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShowShare(false);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(getShareText().slice(0, 280));
    window.open(
      `https://x.com/intent/tweet?text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShowShare(false);
  };

  const shareEmail = () => {
    const surahInfo = getSurah(surah);
    const surahName = surahInfo
      ? lang === "fr"
        ? surahInfo.fr
        : surahInfo.en
      : `Surah ${surah}`;
    const subject = encodeURIComponent(
      `${surahName} (${surah}:${ayah}) - MushafPlus`,
    );
    const body = encodeURIComponent(getShareText());
    window.open(
      `mailto:?subject=${subject}&body=${body}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShowShare(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "MushafPlus", text: getShareText() });
      } catch {
        /* user cancelled */
      }
    }
    setShowShare(false);
  };

  const shareCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
    setShowShare(false);
  };

  const shareAsImage = async () => {
    if (!ayahData?.text) return;
    const W = 1080,
      H = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Green gradient background
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#1a6b3c");
    grd.addColorStop(1, "#0c3220");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Gold ornamental double border
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 46, W - 92, H - 92);

    // Await fonts
    await document.fonts.ready;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillStyle = "#ffffff";

    // Wrap Arabic text
    const text = ayahData.text;
    const fontSize = Math.max(
      36,
      Math.min(52, Math.floor(W / (text.length / 4))),
    );
    ctx.font = `${fontSize}px "Scheherazade New", "Amiri Quran", serif`;
    const maxW = W - 180;
    const lines = [];
    const words2 = text.split(" ");
    let line = "";
    for (const word of words2) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lh = fontSize * 1.9;
    const totalTextH = lines.length * lh;
    const startY = H / 2 - totalTextH / 2 + lh / 2 - 60;
    lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lh));

    // Surah reference
    const surahInfo = getSurah(surah);
    const surahLabel = surahInfo
      ? lang === "fr"
        ? surahInfo.fr
        : surahInfo.en
      : `Surah ${surah}`;
    ctx.direction = "ltr";
    ctx.font = '32px "Cairo", "Noto Naskh Arabic", sans-serif';
    ctx.fillStyle = "#c9a227";
    ctx.fillText(
      `\u2014 ${surahLabel}  \uFD3F${surah}:${ayah}\uFD3E`,
      W / 2,
      H - 180,
    );

    // Watermark
    ctx.font = '22px "Cairo", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillText("MushafPlus", W / 2, H - 100);

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], `mushafplus_${surah}_${ayah}.png`, {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "MushafPlus",
          text: getShareText(),
        });
      } catch {
        /* cancelled */
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mushafplus_${surah}_${ayah}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    setShowShare(false);
  };

  return (
    <div className="ayah-actions" onClick={(e) => e.stopPropagation()}>
      <div className="ayah-actions-bar">
        <button
          className={`action-btn btn-play ${audioError ? "error" : ""}`}
          onClick={playAyah}
          title={t("audio.play", lang)}
        >
          <i
            className={`fas ${audioError ? "fa-exclamation-triangle" : "fa-play"}`}
          ></i>
        </button>

        <div className="action-divider" />

        <button
          className={`action-btn btn-bookmark ${bookmarked ? "active" : ""}`}
          onClick={toggleBookmark}
          title={t("bookmarks.add", lang)}
        >
          <i className={`fas fa-bookmark`}></i>
        </button>

        <button
          className="action-btn btn-note"
          onClick={() => setShowNote(!showNote)}
          title={t("notes.add", lang)}
        >
          <i className="fas fa-sticky-note"></i>
        </button>

        <button
          className="action-btn btn-copy"
          onClick={copyText}
          title={t("actions.copy", lang)}
        >
          <i className={`fas ${copied ? "fa-check" : "fa-copy"}`}></i>
        </button>

        <div className="action-divider" />

        <button
          className={`action-btn btn-share ${showShare ? "active" : ""}`}
          onClick={() => setShowShare(!showShare)}
          title={t("actions.share", lang)}
        >
          <i className="fas fa-share-alt"></i>
        </button>

        <button
          className={`action-btn btn-playlist ${playlistAdded ? "active" : ""}`}
          onClick={async () => {
            if (!showPlaylistMenu) {
              const pls = await getAllPlaylists();
              setPlaylists(pls);
            }
            setShowPlaylistMenu(!showPlaylistMenu);
          }}
          title={lang === "fr" ? "Ajouter à une playlist" : "Add to playlist"}
        >
          <i className={`fas ${playlistAdded ? "fa-check" : "fa-list"}`}></i>
        </button>
      </div>

      {/* Share panel */}
      {showShare && (
        <div className="share-panel">
          <div className="share-panel-title">
            {t("actions.shareTitle", lang)}
          </div>
          <div className="share-options">
            <button className="share-btn whatsapp" onClick={shareWhatsApp}>
              <i className="fab fa-whatsapp"></i>{" "}
              {t("actions.shareWhatsapp", lang)}
            </button>
            <button className="share-btn telegram" onClick={shareTelegram}>
              <i className="fab fa-telegram-plane"></i>{" "}
              {t("actions.shareTelegram", lang)}
            </button>
            <button className="share-btn twitter" onClick={shareTwitter}>
              <i className="fab fa-x-twitter"></i>{" "}
              {t("actions.shareTwitter", lang)}
            </button>
            <button className="share-btn email" onClick={shareEmail}>
              <i className="fas fa-envelope"></i>{" "}
              {t("actions.shareEmail", lang)}
            </button>
            <button className="share-btn copy-share" onClick={shareCopyText}>
              <i className="fas fa-copy"></i> {t("actions.shareCopy", lang)}
            </button>
            <button className="share-btn image-share" onClick={shareAsImage}>
              <i className="fas fa-image"></i>
              {lang === "fr" ? "Image verte" : lang === "ar" ? "صورة" : "Image"}
            </button>
            <button
              className="share-btn image-share"
              onClick={() => {
                dispatch({ type: "SET", payload: { shareImageOpen: true } });
                setShowShare(false);
              }}
            >
              <i className="fas fa-wand-magic-sparkles"></i>
              {lang === "fr"
                ? "Image calligraphique"
                : lang === "ar"
                  ? "صورة خطية"
                  : "Calligraphic image"}
            </button>
            {navigator.share && (
              <button className="share-btn native" onClick={shareNative}>
                <i className="fas fa-share-nodes"></i>{" "}
                {t("actions.shareNative", lang)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Playlist dropdown */}
      {showPlaylistMenu && (
        <div className="share-panel">
          <div className="share-panel-title">
            {lang === "fr" ? "Ajouter à une playlist" : "Add to playlist"}
          </div>
          {playlists.length === 0 ? (
            <p
              style={{
                fontFamily: "'Cairo', sans-serif",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "0.5rem",
              }}
            >
              {lang === "fr"
                ? "Aucune playlist. Créez-en une depuis le menu Playlists."
                : "No playlists. Create one from the Playlists menu."}
            </p>
          ) : (
            <div
              className="share-options"
              style={{ gridTemplateColumns: "1fr" }}
            >
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  className="share-btn"
                  onClick={async () => {
                    await addAyahToPlaylist(
                      pl.id,
                      surah,
                      ayah,
                      ayahData?.text || "",
                    );
                    setPlaylistAdded(true);
                    setShowPlaylistMenu(false);
                    setTimeout(() => setPlaylistAdded(false), 2000);
                  }}
                >
                  <i className="fas fa-music"></i> {pl.name} ({pl.ayahs.length})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inline note editor */}
      {showNote && (
        <div className="inline-note">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={t("notes.placeholder", lang)}
            className="note-textarea"
            rows={3}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSaveNote}>
            {t("notes.save", lang)}
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }

        .ayah-actions {
          margin-top: 0.55rem;
          animation: fadeSlideUp 0.18s ease both;
        }

        /* ── Action bar ── */
        .ayah-actions-bar {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          padding: 0.24rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          flex-wrap: nowrap;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: 999px;
          cursor: pointer;
          font-size: 0.78rem;
          transition: background 0.15s, color 0.15s, transform 0.12s;
          flex-shrink: 0;
        }
        .action-btn:hover {
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
          transform: scale(1.08);
        }
        .action-btn:active { transform: scale(0.94); }

        /* Couleur contextuelle par bouton */
        .action-btn.btn-play:hover { background: rgba(var(--primary-rgb), 0.12); color: var(--primary); }
        .action-btn.btn-bookmark { color: var(--text-muted); }
        .action-btn.btn-bookmark.active { color: var(--gold, #b8860b); background: rgba(184,134,11,0.1); }
        .action-btn.btn-bookmark:hover { background: rgba(184,134,11,0.12); color: var(--gold, #b8860b); }
        .action-btn.btn-copy:hover { background: rgba(99,102,241,0.1); color: #6366f1; }
        .action-btn.btn-share:hover { background: rgba(var(--primary-rgb), 0.1); color: var(--primary); }
        .action-btn.btn-share.active { background: rgba(var(--primary-rgb), 0.12); color: var(--primary); }
        .action-btn.btn-playlist:hover { background: rgba(var(--primary-rgb), 0.1); color: var(--primary); }
        .action-btn.btn-playlist.active { color: var(--primary); background: rgba(var(--primary-rgb), 0.12); }

        .action-btn.error {
          color: #ef4444 !important;
          animation: shake 0.4s ease;
        }

        /* Séparateur visuel entre groupes */
        .action-divider {
          width: 1px;
          height: 18px;
          background: var(--border);
          margin: 0 0.1rem;
          flex-shrink: 0;
          opacity: 0.7;
        }

        /* ── Inline note ── */
        .inline-note {
          margin-top: 0.55rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0.65rem 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 0.85rem;
          animation: fadeSlideUp 0.15s ease both;
        }
        .note-textarea {
          width: 100%;
          padding: 0.5rem 0.65rem;
          border: 1px solid var(--border);
          border-radius: 0.6rem;
          background: var(--bg-primary);
          color: var(--text);
          font-family: var(--font-ui, 'Cairo', sans-serif);
          font-size: 0.83rem;
          resize: vertical;
          outline: none;
          transition: border-color 0.14s;
        }
        .note-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(var(--primary-rgb),0.1); }
        .btn-sm {
          padding: 0.3rem 0.85rem;
          font-size: 0.78rem;
          align-self: flex-end;
          border-radius: 999px;
          background: var(--primary);
          color: #fff;
          border: none;
          cursor: pointer;
          font-family: var(--font-ui, 'Cairo', sans-serif);
          font-weight: 600;
          transition: opacity 0.14s;
        }
        .btn-sm:hover { opacity: 0.88; }

        /* ── Share / Playlist panel ── */
        .share-panel {
          margin-top: 0.55rem;
          padding: 0.7rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 1rem;
          background: var(--bg-secondary);
          animation: fadeSlideUp 0.16s ease both;
        }
        .share-panel-title {
          font-family: var(--font-ui, 'Cairo', sans-serif);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
        }
        .share-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3rem;
        }
        .share-btn {
          display: flex;
          align-items: center;
          gap: 0.42rem;
          padding: 0.42rem 0.6rem;
          border: 1px solid var(--border);
          border-radius: 0.6rem;
          background: var(--bg-primary);
          color: var(--text-secondary);
          cursor: pointer;
          font-family: var(--font-ui, 'Cairo', sans-serif);
          font-size: 0.72rem;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .share-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.08); }
        .share-btn.whatsapp:hover  { background: #25D366; color: #fff; border-color: #25D366; }
        .share-btn.telegram:hover  { background: #0088CC; color: #fff; border-color: #0088CC; }
        .share-btn.twitter:hover   { background: #1DA1F2; color: #fff; border-color: #1DA1F2; }
        .share-btn.email:hover     { background: #EA4335; color: #fff; border-color: #EA4335; }
        .share-btn.copy-share:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
        .share-btn.image-share:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
        .share-btn.native:hover    { background: var(--gold); color: #fff; border-color: var(--gold); }
        .share-btn i { font-size: 0.9rem; width: 16px; text-align: center; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
