import React, { useEffect, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import {
  getProtectionUiLanguage,
  isProtectedStorageLocked,
  unlockEncryptionWithPassphrase,
} from "../services/cryptoUtil.js";
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
  },
};

export default function PrivacyLockGate({ children }) {
  const [locked, setLocked] = useState(() => isProtectedStorageLocked());
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lang = getProtectionUiLanguage();
  const copy = COPY[lang] || COPY.fr;

  useEffect(() => {
    const handleLock = () => {
      setPassphrase("");
      setError("");
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
          {copy.title}
        </h1>
        <p className="mb-5 mt-3 leading-relaxed text-[var(--text-muted)]">{copy.body}</p>
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
      </section>
    </main>
  );
}
