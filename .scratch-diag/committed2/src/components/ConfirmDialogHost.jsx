import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { TriangleAlert, X } from "lucide-react";
import { useAppLocale } from "../context/AppContext";
import { APP_CONFIRM_EVENT } from "../services/interactionService";

const LABELS = {
  fr: { title: "Confirmer l’action", confirm: "Confirmer", cancel: "Annuler", close: "Fermer" },
  en: { title: "Confirm action", confirm: "Confirm", cancel: "Cancel", close: "Close" },
  ar: { title: "تأكيد الإجراء", confirm: "تأكيد", cancel: "إلغاء", close: "إغلاق" },
};

export default function ConfirmDialogHost() {
  const { lang } = useAppLocale();
  const [request, setRequest] = useState(null);
  const requestRef = useRef(null);
  const labels = LABELS[lang] || LABELS.fr;

  const finish = useCallback((approved) => {
    const active = requestRef.current;
    requestRef.current = null;
    setRequest(null);
    active?.resolve?.(Boolean(approved));
  }, []);

  useEffect(() => {
    const handleRequest = (event) => {
      if (requestRef.current) requestRef.current.resolve?.(false);
      requestRef.current = event.detail || null;
      setRequest(event.detail || null);
    };
    window.addEventListener(APP_CONFIRM_EVENT, handleRequest);
    return () => {
      window.removeEventListener(APP_CONFIRM_EVENT, handleRequest);
      requestRef.current?.resolve?.(false);
      requestRef.current = null;
    };
  }, []);

  return (
    <Dialog.Root open={Boolean(request)} onOpenChange={(open) => !open && finish(false)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[1190] bg-black/55 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[1200] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.6rem] border border-[var(--border)] bg-[var(--bg-card)] p-5 text-[var(--text-primary)] shadow-2xl outline-none sm:p-6"
          aria-describedby="app-confirm-description"
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${request?.tone === "danger" ? "bg-red-500/12 text-red-600" : "bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]"}`} aria-hidden="true">
              <TriangleAlert size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-black leading-tight">
                {request?.title || labels.title}
              </Dialog.Title>
              <Dialog.Description id="app-confirm-description" className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {request?.message}
              </Dialog.Description>
            </div>
            <button type="button" onClick={() => finish(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label={labels.close}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => finish(false)} className="min-h-11 rounded-xl border border-[var(--border)] px-4 text-sm font-bold hover:bg-[var(--bg-secondary)]">
              {request?.cancelLabel || labels.cancel}
            </button>
            <button type="button" onClick={() => finish(true)} className={`min-h-11 rounded-xl px-4 text-sm font-bold text-white shadow-sm ${request?.tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-[var(--primary)] hover:brightness-110"}`}>
              {request?.confirmLabel || labels.confirm}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
