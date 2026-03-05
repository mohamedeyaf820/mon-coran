import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { getAllNotes, deleteNote, saveNote } from "../services/storageService";
import { getSurah, toAr } from "../data/surahs";
import { cn } from "../lib/utils";

/* ─────────────────────────────────────────────
   Drag position helpers
───────────────────────────────────────────── */
const NOTES_POS_KEY = "mushaf_notes_panel_pos";

function loadPos() {
  try {
    const raw = localStorage.getItem(NOTES_POS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function savePos(pos) {
  try {
    localStorage.setItem(NOTES_POS_KEY, JSON.stringify(pos));
  } catch {}
}

function clamp(x, y, w, h, margin = 8) {
  return {
    x: Math.max(margin, Math.min(window.innerWidth - w - margin, x)),
    y: Math.max(margin, Math.min(window.innerHeight - h - margin, y)),
  };
}

function defaultPos(w, h) {
  return {
    x: window.innerWidth - w - 20,
    y: Math.max(80, window.innerHeight - h - 100),
  };
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function NotesPanel() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const editRef = useRef(null);
  const searchRef = useRef(null);

  /* ── Mobile detection ── */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Drag state (desktop only) ── */
  const PANEL_W = 340;
  const panelRef = useRef(null);
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState(() => {
    const saved = loadPos();
    if (saved) return saved;
    return defaultPos(PANEL_W, 480);
  });

  /* Re-clamp on resize */
  useEffect(() => {
    const onResize = () => {
      if (!panelRef.current) return;
      const { offsetWidth: w, offsetHeight: h } = panelRef.current;
      setPos((prev) => {
        const next = clamp(prev.x, prev.y, w, h);
        savePos(next);
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      if (e.target.closest("button, input, textarea, a")) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
      };
      setIsDragging(true);
    },
    [pos],
  );

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const panel = panelRef.current;
    const w = panel ? panel.offsetWidth : PANEL_W;
    const h = panel ? panel.offsetHeight : 480;
    setPos(
      clamp(dragRef.current.originX + dx, dragRef.current.originY + dy, w, h),
    );
  }, []);

  const onPointerUp = useCallback(
    (e) => {
      if (!dragRef.current) return;
      const panel = panelRef.current;
      const w = panel ? panel.offsetWidth : PANEL_W;
      const h = panel ? panel.offsetHeight : 480;
      const next = clamp(pos.x, pos.y, w, h);
      setPos(next);
      savePos(next);
      dragRef.current = null;
      setIsDragging(false);
    },
    [pos],
  );

  /* ── Notes CRUD ── */
  const loadNotes = useCallback(async () => {
    const all = await getAllNotes();
    setNotes(all.sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);
  useEffect(() => {
    if (open) loadNotes();
  }, [open, loadNotes]);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(
        editRef.current.value.length,
        editRef.current.value.length,
      );
    }
  }, [editingId]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  const goTo = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    setOpen(false);
  };

  const handleDelete = async (id, surah, ayah) => {
    if (deletingId === id) {
      await deleteNote(surah, ayah);
      setDeletingId(null);
      loadNotes();
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 2500);
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSave = async (surah, ayah) => {
    if (!editText.trim()) return;
    setSaving(true);
    await saveNote(surah, ayah, editText.trim());
    setSaving(false);
    setEditingId(null);
    setEditText("");
    loadNotes();
  };

  const filteredNotes = notes.filter((note) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const s = getSurah(note.surah);
    return (
      note.text.toLowerCase().includes(q) ||
      s?.ar?.includes(q) ||
      s?.fr?.toLowerCase().includes(q) ||
      s?.en?.toLowerCase().includes(q) ||
      String(note.surah).includes(q) ||
      String(note.ayah).includes(q)
    );
  });

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString(
      lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US",
      { day: "numeric", month: "short", year: "numeric" },
    );
  };

  /* ─────────────────────────────────────────────
     Panel content (shared between mobile & desktop)
  ───────────────────────────────────────────── */
  const PanelContent = () => (
    <>
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between shrink-0",
          "px-4 py-2.5 border-b border-[var(--border-light)]",
          "bg-[var(--bg-secondary)]",
          !isMobile && "cursor-grab active:cursor-grabbing rounded-t-2xl",
        )}
        onPointerDown={!isMobile ? onPointerDown : undefined}
        onPointerMove={!isMobile ? onPointerMove : undefined}
        onPointerUp={!isMobile ? onPointerUp : undefined}
        onPointerCancel={!isMobile ? onPointerUp : undefined}
      >
        <div className="flex items-center gap-2.5">
          {/* drag hint on desktop */}
          {!isMobile && (
            <div className="flex flex-col gap-[3px] opacity-30 shrink-0 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-[3px]">
                  <div className="w-[3px] h-[3px] rounded-full bg-[var(--text-primary)]" />
                  <div className="w-[3px] h-[3px] rounded-full bg-[var(--text-primary)]" />
                </div>
              ))}
            </div>
          )}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(var(--primary-rgb,27,94,59),0.12)" }}
          >
            <i
              className="fas fa-sticky-note text-[0.75rem]"
              style={{ color: "var(--gold)" }}
            />
          </div>
          <div>
            <h3 className="text-[0.84rem] font-bold text-[var(--text-primary)] font-[var(--font-ui)] leading-tight">
              {t("notes.title", lang)}
            </h3>
            {notes.length > 0 && (
              <p className="text-[0.6rem] text-[var(--text-muted)] font-[var(--font-ui)] leading-tight">
                {lang === "fr"
                  ? `${notes.length} note${notes.length > 1 ? "s" : ""}`
                  : lang === "ar"
                    ? `${toAr(notes.length)} ملاحظات`
                    : `${notes.length} note${notes.length > 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setOpen(false)}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-lg",
            "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            "hover:bg-[var(--bg-tertiary)] transition-all duration-150",
            "cursor-pointer outline-none",
          )}
          aria-label={
            lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
          }
        >
          <i className="fas fa-times text-[0.7rem]" />
        </button>
      </div>

      {/* Search */}
      {notes.length > 0 && (
        <div className="shrink-0 px-3 py-2 border-b border-[var(--border-light)]">
          <div className="relative">
            <i className="fas fa-search absolute start-3 top-1/2 -translate-y-1/2 text-[0.6rem] text-[var(--text-muted)] pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === "fr"
                  ? "Rechercher…"
                  : lang === "ar"
                    ? "بحث…"
                    : "Search…"
              }
              className={cn(
                "w-full ps-7 pe-7 py-1.5 rounded-lg text-[0.75rem]",
                "bg-[var(--bg-secondary)] border border-[var(--border-light)]",
                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "font-[var(--font-ui)] outline-none",
                "transition-[border-color,box-shadow] duration-150",
                "focus:border-[var(--primary)] focus:shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.12)]",
              )}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute end-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <i className="fas fa-times text-[0.55rem]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-5 text-center gap-3 py-10">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <i className="fas fa-sticky-note text-[1.4rem] text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-[0.84rem] font-semibold text-[var(--text-primary)] font-[var(--font-ui)] mb-1">
                {lang === "fr"
                  ? "Aucune note"
                  : lang === "ar"
                    ? "لا توجد ملاحظات"
                    : "No notes yet"}
              </p>
              <p className="text-[0.72rem] text-[var(--text-muted)] font-[var(--font-ui)] leading-relaxed">
                {lang === "fr"
                  ? "Appuyez sur un verset puis sur 📝 pour ajouter."
                  : lang === "ar"
                    ? "انقر على آية ثم أيقونة الملاحظة."
                    : "Tap any verse, then the note icon."}
              </p>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-10 text-center gap-2">
            <i className="fas fa-search text-[1.2rem] text-[var(--text-muted)]" />
            <p className="text-[0.78rem] text-[var(--text-muted)] font-[var(--font-ui)]">
              {lang === "fr"
                ? `Aucun résultat pour « ${search} »`
                : lang === "ar"
                  ? `لا نتائج لـ « ${search} »`
                  : `No results for "${search}"`}
            </p>
            <button
              onClick={() => setSearch("")}
              className="text-[0.72rem] text-[var(--primary)] underline font-[var(--font-ui)] cursor-pointer"
            >
              {lang === "fr" ? "Effacer" : lang === "ar" ? "مسح" : "Clear"}
            </button>
          </div>
        ) : (
          <div className="p-2.5 flex flex-col gap-2">
            {filteredNotes.map((note) => {
              const s = getSurah(note.surah);
              const isEditing = editingId === note.id;
              const isDeleting = deletingId === note.id;
              return (
                <article
                  key={note.id}
                  className={cn(
                    "rounded-xl border transition-all duration-200",
                    "bg-[var(--bg-card)]",
                    isEditing
                      ? "border-[var(--primary)] shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.10)]"
                      : "border-[var(--border-light)] hover:border-[var(--border)] hover:shadow-[var(--shadow-sm)]",
                  )}
                >
                  {/* Card header */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-2.5 pt-2 pb-1.5 border-b",
                      isEditing
                        ? "border-[var(--primary)]/20"
                        : "border-[var(--border-light)]",
                    )}
                  >
                    <button
                      onClick={() => goTo(note.surah, note.ayah)}
                      className="flex items-center gap-1.5 min-w-0 cursor-pointer outline-none group"
                      title={
                        lang === "fr"
                          ? "Aller au verset"
                          : lang === "ar"
                            ? "الانتقال للآية"
                            : "Go to verse"
                      }
                    >
                      <span
                        className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md shrink-0 font-[var(--font-ui)]"
                        style={{
                          background: "rgba(var(--primary-rgb,27,94,59),0.1)",
                          color: "var(--primary)",
                        }}
                      >
                        {lang === "ar"
                          ? `${toAr(note.surah)}:${toAr(note.ayah)}`
                          : `${note.surah}:${note.ayah}`}
                      </span>
                      <span className="text-[0.74rem] font-semibold text-[var(--text-primary)] font-[var(--font-ui)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {s?.ar || ""}
                      </span>
                    </button>

                    <div className="flex items-center gap-0.5 shrink-0 ms-1">
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(note)}
                          className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-lg",
                            "text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10",
                            "transition-all duration-150 cursor-pointer outline-none",
                          )}
                          title={
                            lang === "fr"
                              ? "Modifier"
                              : lang === "ar"
                                ? "تعديل"
                                : "Edit"
                          }
                        >
                          <i className="fas fa-pen text-[0.58rem]" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDelete(note.id, note.surah, note.ayah)
                        }
                        className={cn(
                          "w-6 h-6 flex items-center justify-center rounded-lg",
                          "transition-all duration-150 cursor-pointer outline-none",
                          isDeleting
                            ? "bg-red-500/15 text-red-500 ring-1 ring-red-500/30"
                            : "text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10",
                        )}
                        title={
                          isDeleting
                            ? lang === "fr"
                              ? "Confirmer"
                              : lang === "ar"
                                ? "تأكيد"
                                : "Confirm"
                            : lang === "fr"
                              ? "Supprimer"
                              : lang === "ar"
                                ? "حذف"
                                : "Delete"
                        }
                      >
                        <i
                          className={cn(
                            "text-[0.58rem]",
                            isDeleting
                              ? "fas fa-trash-can"
                              : "fas fa-trash-alt",
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-2.5 py-2">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          ref={editRef}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className={cn(
                            "w-full px-2.5 py-1.5 rounded-lg text-[0.78rem] resize-none",
                            "bg-[var(--bg-secondary)] border border-[var(--primary)]/40",
                            "text-[var(--text-primary)] font-[var(--font-ui)] leading-relaxed",
                            "outline-none transition-[border-color,box-shadow] duration-150",
                            "focus:border-[var(--primary)] focus:shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.12)]",
                          )}
                          placeholder={t("notes.placeholder", lang)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") cancelEdit();
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                              handleSave(note.surah, note.ayah);
                          }}
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={cancelEdit}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[0.68rem] font-semibold font-[var(--font-ui)]",
                              "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
                              "border border-[var(--border)] cursor-pointer outline-none transition-all duration-150",
                            )}
                          >
                            {lang === "fr"
                              ? "Annuler"
                              : lang === "ar"
                                ? "إلغاء"
                                : "Cancel"}
                          </button>
                          <button
                            onClick={() => handleSave(note.surah, note.ayah)}
                            disabled={!editText.trim() || saving}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[0.68rem] font-semibold font-[var(--font-ui)]",
                              "bg-[var(--primary)] text-white cursor-pointer outline-none transition-all duration-150",
                              "hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                            )}
                          >
                            {saving ? (
                              <i className="fas fa-spinner fa-spin text-[0.6rem]" />
                            ) : lang === "fr" ? (
                              "Sauvegarder"
                            ) : lang === "ar" ? (
                              "حفظ"
                            ) : (
                              "Save"
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="text-[0.78rem] text-[var(--text-primary)] font-[var(--font-ui)] leading-relaxed whitespace-pre-wrap cursor-text"
                        onDoubleClick={() => startEdit(note)}
                        title={
                          lang === "fr"
                            ? "Double-clic pour modifier"
                            : lang === "ar"
                              ? "انقر مرتين للتعديل"
                              : "Double-click to edit"
                        }
                      >
                        {note.text}
                      </p>
                    )}
                  </div>

                  {/* Card footer */}
                  {!isEditing && (
                    <div className="flex items-center justify-between px-2.5 pb-2">
                      <span className="text-[0.58rem] text-[var(--text-muted)] font-[var(--font-ui)] flex items-center gap-1">
                        <i className="fas fa-clock text-[0.5rem]" />
                        {formatDate(note.updatedAt)}
                      </span>
                      <button
                        onClick={() => goTo(note.surah, note.ayah)}
                        className="flex items-center gap-1 text-[0.62rem] font-semibold font-[var(--font-ui)] text-[var(--primary)] hover:underline cursor-pointer outline-none"
                      >
                        {lang === "fr"
                          ? "Aller au verset"
                          : lang === "ar"
                            ? "الانتقال للآية"
                            : "Go to verse"}
                        <i className="fas fa-arrow-right text-[0.5rem]" />
                      </button>
                    </div>
                  )}

                  {/* Delete hint */}
                  {isDeleting && (
                    <div className="px-2.5 pb-2 flex items-center gap-1.5">
                      <i className="fas fa-triangle-exclamation text-red-500 text-[0.6rem]" />
                      <span className="text-[0.65rem] text-red-500 font-[var(--font-ui)]">
                        {lang === "fr"
                          ? "Cliquez à nouveau pour confirmer"
                          : lang === "ar"
                            ? "اضغط مرة أخرى للتأكيد"
                            : "Click again to confirm"}
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      {notes.length > 0 && (
        <div className="shrink-0 px-3 py-1.5 border-t border-[var(--border-light)] bg-[var(--bg-secondary)] rounded-b-2xl">
          <p className="text-[0.58rem] text-[var(--text-muted)] text-center font-[var(--font-ui)]">
            {lang === "fr"
              ? "Double-cliquez pour modifier"
              : lang === "ar"
                ? "انقر مرتين للتعديل"
                : "Double-click to edit"}
          </p>
        </div>
      )}
    </>
  );

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <>
      {/* ── FAB ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={t("notes.title", lang)}
        aria-label={t("notes.title", lang)}
        aria-expanded={open}
        className={cn(
          "fixed z-[250] flex items-center justify-center",
          "w-11 h-11 rounded-full cursor-pointer outline-none",
          "transition-all duration-200",
          "shadow-[0_4px_20px_rgba(212,168,32,0.35)]",
          open ? "scale-110" : "hover:scale-110 hover:-translate-y-0.5",
          "focus-visible:ring-2 focus-visible:ring-[var(--gold)]/50 focus-visible:ring-offset-2",
        )}
        style={{
          bottom: isMobile
            ? "calc(var(--player-h) + 1rem)"
            : "calc(var(--player-h) + 5rem)",
          [lang === "ar" ? "left" : "right"]: "1rem",
          background: open
            ? "var(--primary)"
            : "linear-gradient(135deg, var(--gold), var(--gold-bright,#d4a820))",
          color: "white",
        }}
      >
        <i
          className={cn(
            "text-[1rem] transition-transform duration-200",
            open ? "fas fa-times" : "fas fa-sticky-note",
          )}
        />
        {!open && notes.length > 0 && (
          <span
            className={cn(
              "absolute -top-1 min-w-[18px] h-[18px] px-1",
              "flex items-center justify-center rounded-full",
              "bg-[var(--primary)] text-white text-[0.55rem] font-bold",
              "border-2 border-white font-[var(--font-ui)]",
              lang === "ar" ? "-left-1" : "-right-1",
            )}
          >
            {notes.length > 99 ? "99+" : notes.length}
          </span>
        )}
      </button>

      {/* ── Panel ── */}
      {open && (
        <>
          {/* Mobile: backdrop */}
          {isMobile && (
            <div
              className="fixed inset-0 z-[195] bg-black/40 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
          )}

          {isMobile ? (
            /* ── MOBILE: bottom sheet ── */
            <aside
              className="fixed z-[200] flex flex-col left-0 right-0 w-full rounded-t-2xl border-t border-[var(--border)] max-h-[78dvh]"
              style={{
                bottom: "var(--player-h)",
                background: "var(--bg-card)",
                boxShadow:
                  "0 -4px 32px rgba(0,0,0,0.18), var(--shadow-xl,0 16px 48px rgba(0,0,0,0.15))",
                animation: "slideInUp 0.25s cubic-bezier(0.16,1,0.3,1)",
              }}
              role="complementary"
              aria-label={t("notes.title", lang)}
            >
              <PanelContent />
            </aside>
          ) : (
            /* ── DESKTOP: draggable sticky note ── */
            <aside
              ref={panelRef}
              className={cn(
                "fixed z-[200] flex flex-col rounded-2xl overflow-hidden",
                "select-none",
                isDragging
                  ? "cursor-grabbing shadow-2xl scale-[1.01]"
                  : "cursor-default",
              )}
              style={{
                left: pos.x,
                top: pos.y,
                width: PANEL_W,
                maxHeight: "min(520px, calc(100dvh - 80px))",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                boxShadow: isDragging
                  ? "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(var(--primary-rgb,27,94,59),0.15)"
                  : "0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(var(--primary-rgb,27,94,59),0.08)",
                transition: isDragging
                  ? "box-shadow 0.15s, transform 0.15s"
                  : "box-shadow 0.25s",
              }}
              role="complementary"
              aria-label={t("notes.title", lang)}
            >
              {/* Gold top accent line */}
              <div
                className="h-[3px] w-full shrink-0"
                style={{
                  background:
                    "linear-gradient(90deg, var(--gold), var(--gold-bright,#d4a820), var(--primary))",
                }}
              />
              <PanelContent />
            </aside>
          )}
        </>
      )}

      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
