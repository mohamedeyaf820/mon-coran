import React, { useEffect, useState } from "react";
import { Eraser, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  clearEncryptionSession,
  getProtectionUiLanguage,
  isProtectedStorageLocked,
  unlockEncryptionWithPassphrase,
} from "../services/cryptoUtil.js";
import { clearAllLocalAppData } from "../services/localDataService.js";
import { PRIVACY_LOCK_EVENT } from "../services/privacyEvents.js";

const COPY = {
  fr: {
    eyebrow: "Mode prot\u00e9g\u00e9",
    title: "D\u00e9verrouiller MushafPlus",
    body: "Saisissez votre phrase secr\u00e8te pour ouvrir les r\u00e9glages, la position de lecture, les notes et les favoris prot\u00e9g\u00e9s.",
    label: "Phrase secr\u00e8te",
    placeholder: "Votre phrase secr\u00e8te",
    submit: "D\u00e9verrouiller",
    busy: "V\u00e9rification\u2026",
    invalid: "Phrase secr\u00e8te incorrecte.",
    recovery: "Aucune r\u00e9initialisation n\u2019est possible : sans cette phrase, les donn\u00e9es prot\u00e9g\u00e9es sont irr\u00e9cup\u00e9rables.",
    eraseCta: "Effacer toutes mes donn\u00e9es locales",
    eraseTitle: "Effacer toutes les donn\u00e9es locales ?",
    eraseBody: "Sans votre phrase secr\u00e8te, ces donn\u00e9es restent inaccessibles. Cette action les supprime d\u00e9finitivement de ce navigateur \u2014 r\u00e9glages, position de lecture, notes, favoris, t\u00e9l\u00e9chargements et caches \u2014 puis red\u00e9marre l\u2019application.",
    eraseWord: "SUPPRIMER",
    eraseWordLabel: "Pour confirmer, tapez {word}",
    eraseWordPlaceholder: "Votre confirmation",
    eraseConfirm: "Effacer d\u00e9finitivement",
    cancel: "Annuler",
    erasing: "Suppression\u2026",
    erased: "Donn\u00e9es effac\u00e9es. Relance en cours\u2026",
    reload: "Recharger maintenant",
    eraseError: "L\u2019effacement a \u00e9chou\u00e9. Fermez les autres onglets MushafPlus ouverts, puis r\u00e9essayez.",
  },
  en: {
    eyebrow: "Protected mode",
    title: "Unlock MushafPlus",
    body: "Enter your passphrase to open protected settings, reading position, notes and bookmarks.",
    label: "Passphrase",
    placeholder: "Your passphrase",
    submit: "Unlock",
    busy: "Checking\u2026",
    invalid: "Incorrect passphrase.",
    recovery: "There is no reset option: without this passphrase, protected data cannot be recovered.",
    eraseCta: "Erase all my local data",
    eraseTitle: "Erase all local data?",
    eraseBody: "Without your passphrase this data stays inaccessible. This action deletes it permanently from this browser \u2014 settings, reading position, notes, bookmarks, downloads and caches \u2014 then restarts the app.",
    eraseWord: "DELETE",
    eraseWordLabel: "Type {word} to confirm",
    eraseWordPlaceholder: "Your confirmation",
    eraseConfirm: "Erase permanently",
    cancel: "Cancel",
    erasing: "Erasing\u2026",
    erased: "Data erased. Restarting\u2026",
    reload: "Reload now",
    eraseError: "Erasing failed. Close your other open MushafPlus tabs, then try again.",
  },
  ar: {
    eyebrow: "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062d\u0645\u064a",
    title: "\u0641\u062a\u062d MushafPlus",
    body: "\u0623\u062f\u062e\u0644 \u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0641\u062a\u062d \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0648\u0645\u0648\u0636\u0639 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0648\u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u062d\u0645\u064a\u0629.",
    label: "\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
    placeholder: "\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
    submit: "\u0641\u062a\u062d",
    busy: "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0642\u0642\u2026",
    invalid: "\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.",
    recovery: "\u0644\u0627 \u064a\u0648\u062c\u062f \u062e\u064a\u0627\u0631 \u0644\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0636\u0628\u0637: \u0628\u062f\u0648\u0646 \u0647\u0630\u0647 \u0627\u0644\u0639\u0628\u0627\u0631\u0629 \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u062d\u0645\u064a\u0629.",
    eraseCta: "\u062d\u0630\u0641 \u062c\u0645\u064a\u0639 \u0628\u064a\u0627\u0646\u0627\u062a\u064a \u0627\u0644\u0645\u062d\u0644\u064a\u0629",
    eraseTitle: "\u062d\u0630\u0641 \u062c\u0645\u064a\u0639 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u062d\u0644\u064a\u0629\u061f",
    eraseBody: "\u0628\u062f\u0648\u0646 \u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u062a\u0628\u0642\u0649 \u0647\u0630\u0647 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u063a\u064a\u0631 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0648\u0635\u0648\u0644. \u064a\u062d\u0630\u0641\u0647\u0627 \u0647\u0630\u0627 \u0627\u0644\u0625\u062c\u0631\u0627\u0621 \u0646\u0647\u0627\u0626\u064a\u0627\u064b \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u2014 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0648\u0645\u0648\u0636\u0639 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0648\u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a \u0648\u0627\u0644\u062a\u0646\u0632\u064a\u0644\u0627\u062a \u0648\u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0645\u0624\u0642\u062a\u0629 \u2014 \u062b\u0645 \u064a\u0639\u064a\u062f \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u062a\u0637\u0628\u064a\u0642.",
    eraseWord: "\u0627\u062d\u0630\u0641",
    eraseWordLabel: "\u0627\u0643\u062a\u0628 {word} \u0644\u0644\u062a\u0623\u0643\u064a\u062f",
    eraseWordPlaceholder: "\u062a\u0623\u0643\u064a\u062f\u0643",
    eraseConfirm: "\u062d\u0630\u0641 \u0646\u0647\u0627\u0626\u064a",
    cancel: "\u0625\u0644\u063a\u0627\u0621",
    erasing: "\u062c\u0627\u0631\u064d \u0627\u0644\u062d\u0630\u0641\u2026",
    erased: "\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a. \u062c\u0627\u0631\u064d \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u2026",
    reload: "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0622\u0646",
    eraseError: "\u0641\u0634\u0644 \u0627\u0644\u062d\u0630\u0641. \u0623\u063a\u0644\u0642 \u062a\u0628\u0648\u064a\u0628\u0627\u062a MushafPlus \u0627\u0644\u0623\u062e\u0631\u0649 \u0627\u0644\u0645\u0641\u062a\u0648\u062d\u0629 \u062b\u0645 \u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.",
  },
};

export default function PrivacyLockGate({ children }) {
  const [locked, setLocked] = useState(() => isProtectedStorageLocked());
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("unlock");
  const [confirmation, setConfirmation] = useState("");
  const [erasing, setErasing] = useState(false);
  const [erased, setErased] = useState(false);
  const [eraseError, setEraseError] = useState("");
  const lang = getProtectionUiLanguage();
  const copy = COPY[lang] || COPY.fr;
  const requiredConfirmation = copy.eraseWord.toUpperCase();
  const confirmationMatches =
    confirmation.trim().toUpperCase() === requiredConfirmation;

  useEffect(() => {
    const handleLock = () => {
      setPassphrase("");
      setError("");
      setMode("unlock");
      setConfirmation("");
      setEraseError("");
      setErasing(false);
      setErased(false);
      setLocked(true);
    };
    window.addEventListener(PRIVACY_LOCK_EVENT, handleLock);
    return () => window.removeEventListener(PRIVACY_LOCK_EVENT, handleLock);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy || !passphrase) return;
    setBusy(true);
    setError("");
    const unlocked = await unlockEncryptionWithPassphrase(passphrase);
    setBusy(false);
    if (!unlocked) {
      setError(copy.invalid);
      return;
    }
    setPassphrase("");
    setLocked(false);
  };

  const resetErase = () => {
    setMode("unlock");
    setConfirmation("");
    setEraseError("");
  };

  const openErase = () => {
    setMode("erase");
    setConfirmation("");
    setEraseError("");
  };

  const reloadApp = () => window.location.replace("/");

  // The documented escape for a lost passphrase: protected data stays
  // unrecoverable, so the only honest exit is destroying it. Nothing is
  // decrypted, exported or unlocked in clear text here.
  const handleErase = async (event) => {
    event.preventDefault();
    if (erasing || !confirmationMatches) return;
    setErasing(true);
    setEraseError("");
    try {
      await clearAllLocalAppData();
      clearEncryptionSession();
      setErased(true);
      window.setTimeout(reloadApp, 900);
    } catch {
      setErasing(false);
      setEraseError(copy.eraseError);
    }
  };

  if (!locked) return children;

  return (
    <main
      className="app-root privacy-lock grid min-h-screen place-items-center bg-[var(--bg-primary)] p-5 text-[var(--text-primary)]"
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <section
        className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-2xl sm:p-9"
        aria-labelledby="privacy-lock-title"
      >
        <div
          className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary)] text-white shadow-lg"
          aria-hidden="true"
        >
          <LockKeyhole size={30} />
        </div>
        <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[var(--primary)]">
          <ShieldCheck size={15} aria-hidden="true" />
          {copy.eyebrow}
        </p>
        <h1 id="privacy-lock-title" className="m-0 text-3xl font-extrabold leading-tight">
          {mode === "erase" ? copy.eraseTitle : copy.title}
        </h1>
        <p className="mb-5 mt-3 leading-relaxed text-[var(--text-muted)]">
          {mode === "erase" ? copy.eraseBody : copy.body}
        </p>
        {mode === "erase" ? (
          erased ? (
            <div className="grid gap-3">
              <p className="m-0 text-sm leading-relaxed" role="status" aria-live="polite">
                {copy.erased}
              </p>
              <button
                type="button"
                onClick={reloadApp}
                className="min-h-12 rounded-xl border border-[var(--border)] font-bold"
              >
                {copy.reload}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleErase}
              onKeyDown={(event) => {
                if (event.key === "Escape" && !erasing) resetErase();
              }}
              className="grid gap-2"
            >
              <label htmlFor="privacy-erase-confirm" className="text-sm font-bold">
                {copy.eraseWordLabel.replace("{word}", copy.eraseWord)}
              </label>
              <input
                id="privacy-erase-confirm"
                type="text"
                autoComplete="off"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder={copy.eraseWordPlaceholder}
                maxLength={32}
                autoFocus
                aria-describedby="privacy-erase-error"
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
              />
              <p
                id="privacy-erase-error"
                className="m-0 min-h-5 text-xs text-red-700"
                role="alert"
                aria-live="polite"
              >
                {eraseError}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={resetErase}
                  disabled={erasing}
                  className="min-h-12 flex-1 rounded-xl border border-[var(--border)] font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copy.cancel}
                </button>
                <button
                  type="submit"
                  disabled={erasing || !confirmationMatches}
                  className="min-h-12 flex-1 rounded-xl bg-red-600 font-extrabold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {erasing ? copy.erasing : copy.eraseConfirm}
                </button>
              </div>
            </form>
          )
        ) : (
          <>
            <form onSubmit={handleSubmit} className="grid gap-2">
              <label htmlFor="privacy-unlock-passphrase" className="text-sm font-bold">
                {copy.label}
              </label>
              <input
                id="privacy-unlock-passphrase"
                type="password"
                autoComplete="current-password"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                placeholder={copy.placeholder}
                maxLength={256}
                autoFocus
                className="min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
              />
              <p className="m-0 min-h-5 text-xs text-red-700" role="alert" aria-live="polite">
                {error}
              </p>
              <button
                type="submit"
                disabled={busy || !passphrase}
                className="min-h-12 rounded-xl bg-[var(--primary)] font-extrabold text-white disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? copy.busy : copy.submit}
              </button>
            </form>
            <p className="mb-0 mt-5 border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--text-muted)]">
              {copy.recovery}
            </p>
            <button
              type="button"
              onClick={openErase}
              className="mt-3 inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-red-700"
            >
              <Eraser size={15} aria-hidden="true" />
              {copy.eraseCta}
            </button>
          </>
        )}
      </section>
    </main>
  );
}
