import React from "react";
import { Keyboard, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { t } from "../i18n";

const SHORTCUTS = [
  {
    keys: ["Ctrl", "K"],
    descKey: "shortcuts.search",
  },
  {
    keys: ["/"],
    descKey: "shortcuts.search",
  },
  {
    keys: ["Ctrl", ","],
    descKey: "shortcuts.settings",
  },
  {
    keys: ["Ctrl", "B"],
    descKey: "shortcuts.bookmarks",
  },
  {
    keys: ["Alt", "←"],
    descKey: "shortcuts.prevSurah",
  },
  {
    keys: ["Alt", "→"],
    descKey: "shortcuts.nextSurah",
  },
  {
    keys: ["Alt", "↑"],
    descKey: "shortcuts.prevPageJuz",
  },
  {
    keys: ["Alt", "↓"],
    descKey: "shortcuts.nextPageJuz",
  },
  {
    keys: ["Espace"],
    descKey: "shortcuts.playPause",
  },
  {
    keys: ["H"],
    descKey: "shortcuts.home",
  },
  {
    keys: ["Échap"],
    descKey: "shortcuts.closePanel",
  },
  {
    keys: ["?"],
    descKey: "shortcuts.help",
  },
];

/**
 * KeyboardShortcutsModal
 *
 * Props :
 *   lang     {string}    "fr" | "ar" | "en"
 *   onClose  {function}  ferme la modale
 */
export default function KeyboardShortcutsModal({ lang, onClose }) {
  const isRtl = lang === "ar";

  const title = t("app.keyboardShortcuts", lang);

  return (
    <Dialog.Root
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <Dialog.Content
            className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border)] p-6 max-h-[90dvh] overflow-y-auto"
            aria-label={title}
            onEscapeKeyDown={onClose}
            onInteractOutside={onClose}
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            {/* En-tête */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[var(--text)] font-[var(--font-ui)] flex items-center gap-2">
                <Keyboard size={14} className="text-[var(--primary)]" />
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-colors"
                aria-label={t("common.close", lang)}
              >
                <X size={14} />
              </button>
            </div>

            {/* Tableau des raccourcis */}
            <div className="space-y-1">
              {SHORTCUTS.map((shortcut, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0"
                >
                  {/* Description */}
                  <span className="text-sm text-[var(--text-secondary)] font-[var(--font-ui)]">
                    {t(shortcut.descKey, lang)}
                  </span>

                  {/* Touches */}
                  <div
                    className={`flex items-center gap-1 ${isRtl ? "mr-3" : "ml-3"} shrink-0`}
                  >
                    {shortcut.keys.map((key, j) => (
                      <React.Fragment key={j}>
                        <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text)] shadow-sm leading-5">
                          {key}
                        </kbd>
                        {j < shortcut.keys.length - 1 && (
                          <span className="text-[var(--text-muted)] text-xs select-none">
                            +
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pied : conseil d'utilisation */}
            <p className="mt-5 text-xs text-[var(--text-muted)] font-[var(--font-ui)] text-center">
              {t("shortcuts.inputHint", lang)}
            </p>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
