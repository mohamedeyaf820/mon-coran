import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, BookOpenText, X } from "lucide-react";

function copyFor(lang, fr, en, ar) {
  if (lang === "ar") return ar || en || fr;
  if (lang === "en") return en || fr;
  return fr;
}

export default function FutureFeaturesHeader({
  activeTab,
  lang,
  onBack,
  onClose,
  onSelectTab,
  onTabKeyDown,
  tabs,
}) {
  return (
    <>
      <div className="modal-header !flex !items-start !justify-between !gap-4 !border-b !border-[var(--border)] !bg-[linear-gradient(135deg,rgba(var(--primary-rgb),0.1),transparent_58%)] !px-4 !py-4 sm:!px-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[rgba(var(--primary-rgb),0.2)] bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)]">
            <BookOpenText size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">MushafPlus</span>
            <Dialog.Title className="mt-0.5 text-[1.05rem] font-extrabold text-[var(--text-primary)] sm:text-lg">
              {copyFor(lang, "Bibliothèque personnelle", "Personal library", "المكتبة الشخصية")}
            </Dialog.Title>
            <Dialog.Description id="future-features-description" className="mt-1 line-clamp-2 text-[0.72rem] text-[var(--text-muted)] sm:text-xs">
              {copyFor(lang, "Hors connexion, données portables et parcours d’étude.", "Offline access, portable data and study journeys.", "الوصول دون اتصال، والبيانات القابلة للنقل، ومسارات الدراسة.")}
            </Dialog.Description>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className="hidden min-h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 text-[0.7rem] font-bold text-[var(--text-secondary)] transition-colors hover:border-[rgba(var(--primary-rgb),0.3)] hover:text-[var(--primary)] sm:inline-flex" onClick={onBack}>
            <ArrowLeft size={14} className="rtl:rotate-180" aria-hidden="true" />
            {copyFor(lang, "Tous les outils", "All tools", "كل الأدوات")}
          </button>
          <button type="button" className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors hover:border-[rgba(var(--primary-rgb),0.3)] hover:text-[var(--primary)]" onClick={onClose} aria-label={copyFor(lang, "Fermer", "Close", "إغلاق")}>
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="shrink-0 overflow-x-auto border-b border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={copyFor(lang, "Sections", "Sections", "الأقسام")}>
        <div className="flex min-w-max gap-1.5">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" role="tab" aria-selected={selected} aria-controls={`future-panel-${tab.id}`} id={`future-tab-${tab.id}`} tabIndex={selected ? 0 : -1} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-transparent px-3 text-xs font-bold text-[var(--text-muted)] transition-colors data-[active=true]:border-[rgba(var(--primary-rgb),0.18)] data-[active=true]:bg-[rgba(var(--primary-rgb),0.1)] data-[active=true]:text-[var(--primary)]" data-active={selected} onClick={() => onSelectTab(tab.id)} onKeyDown={onTabKeyDown}>
                <TabIcon size={15} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
