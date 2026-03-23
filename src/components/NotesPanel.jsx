import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
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
  const fabRef = useRef(null);

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

  useLayoutEffect(() => {
    if (!open || isMobile || !panelRef.current) return;
    panelRef.current.style.setProperty("--notes-panel-x", `${pos.x}px`);
    panelRef.current.style.setProperty("--notes-panel-y", `${pos.y}px`);
    panelRef.current.style.setProperty("--notes-panel-w", `${PANEL_W}px`);
  }, [open, isMobile, pos.x, pos.y]);

  const goTo = (surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
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
          "px-4 py-2.5 border-b border-(--border-light)",
          "bg-(--bg-secondary)",
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
            <div className="flex flex-col gap-0.75 opacity-30 shrink-0 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-0.75">
                  <div className="w-0.75 h-0.75 rounded-full bg-(--text-primary)" />
                  <div className="w-0.75 h-0.75 rounded-full bg-(--text-primary)" />
                </div>
              ))}
            </div>
          )}
          <div className="notes-panel-brand w-7 h-7 rounded-lg flex items-center justify-center">
            <i className="notes-panel-brand__icon fas fa-sticky-note text-[0.75rem]" />
          </div>
          <div>
            <h3 className="text-[0.84rem] font-bold text-(--text-primary) leading-tight">
              {t("notes.title", lang)}
            </h3>
            {notes.length > 0 && (
              <p className="text-[0.6rem] text-(--text-muted) font-(--font-ui) leading-tight">
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
            "text-(--text-muted) hover:text-(--text-primary)",
            "hover:bg-(--bg-tertiary) transition-all duration-150",
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
        <div className="shrink-0 px-3 py-2 border-b border-(--border-light)">
          <div className="relative">
            <i className="fas fa-search absolute inset-s-3 top-1/2 -translate-y-1/2 text-[0.6rem] text-(--text-muted) pointer-events-none" />
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
                "bg-(--bg-secondary) border border-(--border-light)",
                "text-(--text-primary) placeholder:text-(--text-muted)",
                "font-(--font-ui) outline-none",
                "transition-[border-color,box-shadow] duration-150",
                "focus:border-(--primary) focus:shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.12)]",
              )}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-e-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer"
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
            <div className="notes-empty-icon-shell w-14 h-14 rounded-2xl flex items-center justify-center">
              <i className="fas fa-sticky-note text-[1.4rem] text-(--text-muted)" />
            </div>
            <div>
              <p className="text-[0.84rem] font-semibold text-(--text-primary) mb-1">
                {lang === "fr"
                  ? "Aucune note"
                  : lang === "ar"
                    ? "لا توجد ملاحظات"
                    : "No notes yet"}
              </p>
              <p className="text-[0.72rem] text-(--text-muted) font-(--font-ui) leading-relaxed">
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
            <i className="fas fa-search text-[1.2rem] text-(--text-muted)" />
            <p className="text-[0.78rem] text-(--text-muted) font-(--font-ui)">
              {lang === "fr"
                ? `Aucun résultat pour « ${search} »`
                : lang === "ar"
                  ? `لا نتائج لـ « ${search} »`
                  : `No results for "${search}"`}
            </p>
            <button
              onClick={() => setSearch("")}
              className="text-[0.72rem] text-(--primary) underline font-(--font-ui) cursor-pointer"
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
                    "notes-card",
                    "rounded-xl border transition-all duration-200",
                    "bg-(--bg-card)",
                    isEditing
                      ? "border-(--primary) shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.10)]"
                      : "border-(--border-light) hover:border-(--border) hover:shadow-sm",
                  )}
                >
                  {/* Card header */}
                  <div
                    className={cn(
                      "notes-card-header",
                      "flex items-center justify-between px-2.5 pt-2 pb-1.5 border-b",
                      isEditing
                        ? "border-(--primary)/20"
                        : "border-(--border-light)",
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
                      <span className="notes-card-ref-badge text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                        {lang === "ar"
                          ? `${toAr(note.surah)}:${toAr(note.ayah)}`
                          : `${note.surah}:${note.ayah}`}
                      </span>
                      <span className="text-[0.74rem] font-semibold text-(--text-primary) truncate group-hover:text-(--primary) transition-colors">
                        {s?.ar || ""}
                      </span>
                    </button>

                    <div className="flex items-center gap-0.5 shrink-0 ms-1">
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(note)}
                          className={cn(
                            "notes-card-icon-btn",
                            "w-6 h-6 flex items-center justify-center rounded-lg",
                            "text-(--text-muted) hover:text-(--primary) hover:bg-(--primary)/10",
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
                          "notes-card-icon-btn",
                          "w-6 h-6 flex items-center justify-center rounded-lg",
                          "transition-all duration-150 cursor-pointer outline-none",
                          isDeleting
                            ? "bg-red-500/15 text-red-500 ring-1 ring-red-500/30"
                            : "text-(--text-muted) hover:text-red-500 hover:bg-red-500/10",
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
                      <div className="notes-card-edit flex flex-col gap-2">
                        <textarea
                          ref={editRef}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          className={cn(
                            "w-full px-2.5 py-1.5 rounded-lg text-[0.78rem] resize-none",
                            "bg-(--bg-secondary) border border-(--primary)/40",
                            "text-(--text-primary) font-(--font-ui) leading-relaxed",
                            "outline-none transition-[border-color,box-shadow] duration-150",
                            "focus:border-(--primary) focus:shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.12)]",
                          )}
                          placeholder={t("notes.placeholder", lang)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") cancelEdit();
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                              handleSave(note.surah, note.ayah);
                          }}
                        />
                        <div className="notes-card-edit-actions flex items-center justify-end gap-1.5">
                          <button
                            onClick={cancelEdit}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[0.68rem] font-semibold",
                              "bg-(--bg-secondary) text-(--text-secondary)",
                              "border border-(--border) cursor-pointer outline-none transition-all duration-150",
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
                              "px-2.5 py-1 rounded-lg text-[0.68rem] font-semibold",
                              "bg-(--primary) text-white cursor-pointer outline-none transition-all duration-150",
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
                        className="notes-card-body text-[0.78rem] text-(--text-primary) font-(--font-ui) leading-relaxed whitespace-pre-wrap cursor-text"
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
                    <div className="notes-card-footer flex items-center justify-between px-2.5 pb-2">
                      <span className="text-[0.58rem] text-(--text-muted) font-(--font-ui) flex items-center gap-1">
                        <i className="fas fa-clock text-[0.5rem]" />
                        {formatDate(note.updatedAt)}
                      </span>
                      <button
                        onClick={() => goTo(note.surah, note.ayah)}
                        className="flex items-center gap-1 text-[0.62rem] font-semibold text-(--primary) hover:underline cursor-pointer outline-none"
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
                      <span className="text-[0.65rem] text-red-500 font-(--font-ui)">
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
        <div className="shrink-0 px-3 py-1.5 border-t border-(--border-light) bg-(--bg-secondary) rounded-b-2xl">
          <p className="text-[0.58rem] text-(--text-muted) text-center font-(--font-ui)">
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
        ref={fabRef}
        onClick={() => setOpen((v) => !v)}
        title={t("notes.title", lang)}
        aria-label={t("notes.title", lang)}
        aria-expanded={open}
        className={cn(
          "notes-fab",
          "fixed z-250 flex items-center justify-center",
          "w-11 h-11 rounded-full cursor-pointer outline-none !border !border-amber-200/35 !bg-[radial-gradient(circle_at_30%_25%,rgba(212,168,32,0.28),rgba(212,168,32,0.16)_45%,rgba(7,17,35,0.92))] !text-white",
          "transition-all duration-200",
          "shadow-[0_4px_20px_rgba(212,168,32,0.35)]",
          isMobile ? "notes-fab--mobile" : "notes-fab--desktop",
          lang === "ar" ? "notes-fab--rtl" : "notes-fab--ltr",
          open ? "notes-fab--open" : "notes-fab--closed",
          open ? "scale-110" : "hover:scale-110 hover:-translate-y-0.5",
          "focus-visible:ring-2 focus-visible:ring-(--gold)/50 focus-visible:ring-offset-2",
        )}
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
              "absolute -top-1 min-w-4.5 h-4.5 px-1",
              "flex items-center justify-center rounded-full",
              "bg-(--primary) text-white text-[0.55rem] font-bold",
              "border-2 border-white font-(--font-ui)",
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
              className="fixed inset-0 z-195 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />
          )}

          {isMobile ? (
            /* ── MOBILE: bottom sheet ── */
            <aside
              className={cn(
                "notes-panel-sheet",
                "fixed z-200 flex flex-col left-0 right-0 w-full rounded-t-2xl border-t border-(--border) max-h-[78dvh] !border-t-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))]",
                "notes-panel-sheet--open",
              )}
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
                "notes-panel-desk",
                "fixed z-200 flex flex-col rounded-2xl overflow-hidden !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))]",
                "select-none",
                "notes-panel-desk--open",
                isDragging
                  ? "notes-panel-desk--dragging cursor-grabbing shadow-2xl scale-[1.01]"
                  : "cursor-default",
              )}
              role="complementary"
              aria-label={t("notes.title", lang)}
            >
              {/* Gold top accent line */}
              <div className="notes-panel-accent h-0.75 w-full shrink-0" />
              <PanelContent />
            </aside>
          )}
        </>
      )}
    </>
  );
}
