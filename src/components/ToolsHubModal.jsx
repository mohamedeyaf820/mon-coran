import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useAppActions, useAppSelector } from "../context/AppContext";
import { cn } from "../lib/utils";
import { Icon } from "./ui/icon";

export default function ToolsHubModal() {
  const lang = useAppSelector((state) => state.lang);
  const { set } = useAppActions();

  const close = () => set({ toolsHubOpen: false });

  const tr = (copy) => {
    if (lang === "ar") return copy.ar;
    if (lang === "fr") return copy.fr;
    return copy.en;
  };

  const openLabel = tr({ fr: "Ouvrir", en: "Open", ar: "\u0641\u062a\u062d" });

  const openTool = (key) => () => set({ toolsHubOpen: false, [key]: true });
  const openFutureTool = (tab) => () =>
    set({ toolsHubOpen: false, futureHubOpen: tab });

  const tools = [
    {
      id: "offline-library",
      icon: "download",
      color: "from-emerald-600 to-cyan-600",
      title: { fr: "Bibliothèque offline", en: "Offline library", ar: "\u0645\u0643\u062a\u0628\u0629 \u0628\u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644" },
      desc: {
        fr: "Téléchargez, suivez et supprimez les récitations disponibles hors connexion.",
        en: "Download, track and remove recitations available offline.",
        ar: "\u0646\u0632\u0651\u0644 \u0627\u0644\u062a\u0644\u0627\u0648\u0627\u062a \u0648\u062a\u0627\u0628\u0639\u0647\u0627 \u0648\u0623\u062f\u0631\u0647\u0627 \u062f\u0648\u0646 \u0627\u062a\u0635\u0627\u0644.",
      },
      action: openFutureTool("offline"),
    },
    {
      id: "memorization-journey",
      icon: "brain",
      color: "from-amber-500 to-orange-600",
      title: { fr: "Parcours de mémorisation", en: "Memorization journey", ar: "\u0645\u0633\u0627\u0631 \u0627\u0644\u062d\u0641\u0638" },
      desc: {
        fr: "Un périmètre, un objectif quotidien et une séance priorisée.",
        en: "A defined scope, daily goal and prioritized session.",
        ar: "\u0646\u0637\u0627\u0642 \u0645\u062d\u062f\u062f \u0648\u0647\u062f\u0641 \u064a\u0648\u0645\u064a \u0648\u062c\u0644\u0633\u0629 \u0645\u0631\u062a\u0628\u0629 \u062d\u0633\u0628 \u0627\u0644\u0623\u0648\u0644\u0648\u064a\u0629.",
      },
      action: openFutureTool("memorization"),
    },
    {
      id: "thematic-index",
      icon: "book-open",
      color: "from-sky-600 to-indigo-600",
      title: { fr: "Index thématique", en: "Thematic index", ar: "\u0627\u0644\u0641\u0647\u0631\u0633 \u0627\u0644\u0645\u0648\u0636\u0648\u0639\u064a" },
      desc: {
        fr: "Explorez des repères de lecture et ouvrez directement leurs versets.",
        en: "Explore reading landmarks and open their verses directly.",
        ar: "\u0627\u0633\u062a\u0643\u0634\u0641 \u0645\u0639\u0627\u0644\u0645 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0641\u062a\u062d \u0622\u064a\u0627\u062a\u0647\u0627 \u0645\u0628\u0627\u0634\u0631\u0629.",
      },
      action: openFutureTool("themes"),
    },
    {
      id: "portable-data",
      icon: "file",
      color: "from-slate-600 to-teal-700",
      title: { fr: "Données portables", en: "Portable data", ar: "\u0628\u064a\u0627\u0646\u0627\u062a \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u0646\u0642\u0644" },
      desc: {
        fr: "Exportez notes et favoris ou confiez-les manuellement à votre cloud.",
        en: "Export notes and bookmarks or manually hand them to your cloud.",
        ar: "\u0635\u062f\u0651\u0631 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0648\u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0623\u0648 \u0627\u0646\u0642\u0644\u0647\u0627 \u064a\u062f\u0648\u064a\u064b\u0627 \u0625\u0644\u0649 \u0633\u062d\u0627\u0628\u062a\u0643.",
      },
      action: openFutureTool("export"),
    },
    {
      id: "wird",
      icon: "calendar-check",
      color: "from-emerald-500 to-teal-600",
      title: { fr: "Wird quotidien", en: "Daily Wird", ar: "الورد اليومي" },
      desc: {
        fr: "Suivez votre objectif quotidien de lecture du Coran.",
        en: "Track your daily Quran reading goal.",
        ar: "تابع هدفك اليومي لقراءة القرآن الكريم.",
      },
      action: openTool("wirdOpen"),
    },
    {
      id: "khatma",
      icon: "book-open",
      color: "from-amber-500 to-orange-600",
      title: { fr: "Suivi Khatma", en: "Khatma Tracker", ar: "متابعة الختمة" },
      desc: {
        fr: "Planifiez et suivez votre lecture complète du Coran.",
        en: "Plan and track your complete reading of the Quran.",
        ar: "خطط وتابع ختمتك الكاملة للقرآن الكريم.",
      },
      action: openTool("khatmaOpen"),
    },
    {
      id: "history",
      icon: "clock-rotate-left",
      color: "from-blue-500 to-indigo-600",
      title: { fr: "Historique", en: "Reading History", ar: "سجل القراءة" },
      desc: {
        fr: "Consultez vos sessions récentes et les versets lus.",
        en: "View your recent reading sessions and verses read.",
        ar: "اعرض جلسات القراءة الاخيرة والآيات التي قرأتها.",
      },
      action: openTool("historyOpen"),
    },
    {
      id: "playlist",
      icon: "list-music",
      color: "from-purple-500 to-fuchsia-600",
      title: { fr: "Playlists audio", en: "Audio Playlists", ar: "قوائم التشغيل" },
      desc: {
        fr: "Créez et écoutez vos compilations de versets préférés.",
        en: "Create and listen to your custom verse playlists.",
        ar: "انشئ واستمع الى قوائم تشغيل الآيات المفضلة لديك.",
      },
      action: openTool("playlistOpen"),
    },
    {
      id: "stats",
      icon: "chart-line",
      color: "from-cyan-500 to-blue-600",
      title: { fr: "Statistiques", en: "Weekly Stats", ar: "الإحصائيات" },
      desc: {
        fr: "Visualisez vos progrès et temps d'écoute hebdomadaires.",
        en: "Visualize your weekly reading progress and listening time.",
        ar: "شاهد تقدمك الاسبوعي ووقت الاستماع.",
      },
      action: openTool("weeklyStatsOpen"),
    },
    {
      id: "tajweed",
      icon: "graduation-cap",
      color: "from-rose-500 to-red-600",
      title: { fr: "Quiz Tajweed", en: "Tajweed Quiz", ar: "اختبار التجويد" },
      desc: {
        fr: "Testez vos connaissances des règles de récitation.",
        en: "Test your knowledge on the rules of recitation.",
        ar: "اختبر معرفتك باحكام التجويد.",
      },
      action: openTool("tajweedQuizOpen"),
    },
    {
      id: "flashcards",
      icon: "brain",
      color: "from-pink-500 to-rose-600",
      title: { fr: "Mémorisation", en: "Flashcards", ar: "الحفظ والمراجعة" },
      desc: {
        fr: "Mémorisez avec des cartes de rappel actif.",
        en: "Memorize effectively using active recall flashcards.",
        ar: "احفظ الآيات بفعالية باستخدام بطاقات المراجعة.",
      },
      action: openTool("flashcardsOpen"),
    },
    {
      id: "comparator",
      icon: "users-between-lines",
      color: "from-teal-500 to-emerald-600",
      title: { fr: "Comparateur", en: "Reciter Compare", ar: "مقارنة القراء" },
      desc: {
        fr: "Comparez les styles et rythmes de différents récitateurs.",
        en: "Compare the styles and tempos of different reciters.",
        ar: "قارن بين اساليب وتلاوات القراء المختلفين.",
      },
      action: openTool("comparatorOpen"),
    },
    {
      id: "audiomaker",
      icon: "sliders",
      color: "from-violet-500 to-purple-600",
      title: { fr: "Créateur audio", en: "Audio Maker", ar: "صانع الصوتيات" },
      desc: {
        fr: "Générez des fichiers audio personnalisés hors ligne.",
        en: "Generate custom audio files for offline listening loops.",
        ar: "انشئ ملفات صوتية مخصصة للاستماع دون اتصال.",
      },
      action: openTool("audioMakerOpen"),
    },
  ];

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <div className="modal-overlay !p-4 sm:!p-6" onClick={close}>
          <Dialog.Content
            className="tools-hub-modal modal !w-full !max-w-5xl !overflow-hidden !rounded-[1.75rem] !border !border-[var(--border)] !bg-[var(--bg-card)] !backdrop-blur-xl !shadow-[0_32px_84px_rgba(1,8,22,0.5)] animate-fadeInScale"
            aria-labelledby="tools-modal-title"
            onClick={(event) => event.stopPropagation()}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              close();
            }}
            onInteractOutside={close}
          >
            <Dialog.Title className="sr-only">
              {tr({ fr: "Outils", en: "Tools", ar: "الأدوات" })}
            </Dialog.Title>
            <div className="modal-header !flex !items-start !justify-between !gap-4 !border-b !border-[var(--border)] !bg-[linear-gradient(135deg,rgba(var(--primary-rgb),0.1),transparent_58%)] !px-4 !py-4 sm:!px-6 sm:!py-5">
              <div className="flex min-w-0 items-start gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[rgba(var(--primary-rgb),0.2)] bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] shadow-sm">
                  <Icon name="shapes" size={19} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="modal-kicker">
                    {tr({ fr: "Fonctionnalités", en: "Features", ar: "الخصائص والخدمات" })}
                  </div>
                  <h2 className="modal-title !mt-0.5 !text-[1.05rem] sm:!text-[1.18rem]" id="tools-modal-title">
                    {tr({
                      fr: "Espace outils spirituels",
                      en: "Spiritual Tools Hub",
                      ar: "مركز الأدوات الروحية",
                    })}
                  </h2>
                  <div className="modal-subtitle !mt-1 !max-w-2xl !text-[0.75rem] sm:!text-[0.8rem]">
                    {tr({
                      fr: "Suivi, mémorisation et écoute réunis dans un espace simple.",
                      en: "Tracking, memorization and listening in one calm space.",
                      ar: "المتابعة والحفظ والاستماع في مساحة هادئة.",
                    })}
                  </div>
                </div>
              </div>
              <button
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)] shadow-sm transition-colors hover:border-[rgba(var(--primary-rgb),0.35)] hover:text-[var(--primary)]"
                onClick={close}
                type="button"
                aria-label={tr({ fr: "Fermer", en: "Close", ar: "إغلاق" })}
              >
                <Icon name="xmark" size={15} />
              </button>
            </div>

            <div className="modal-list !max-h-[76vh] !overflow-y-auto !bg-[color-mix(in_srgb,var(--bg-secondary)_48%,var(--bg-card))] !p-3 sm:!p-4">
              <div className="mb-3 flex items-center justify-between px-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                <span>{tr({ fr: "Choisir un outil", en: "Choose a tool", ar: "اختر أداة" })}</span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 tabular-nums">{tools.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool, index) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={tool.action}
                    className={cn(
                      "group relative flex min-h-[9.5rem] flex-col items-start overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left shadow-[0_8px_24px_rgba(4,18,12,0.035)] transition-[transform,border-color,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:border-[rgba(var(--primary-rgb),0.34)] hover:bg-[color-mix(in_srgb,var(--bg-card)_92%,var(--primary)_8%)] hover:shadow-[0_14px_30px_rgba(4,18,12,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.5)] focus-visible:ring-offset-2",
                    )}
                    style={{
                      contentVisibility: "auto",
                      containIntrinsicSize: "152px",
                    }}
                  >
                    <span className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-80", tool.color)} aria-hidden="true" />
                    <div className="mb-3 flex w-full items-center justify-between">
                      <span className={cn("grid h-10 w-10 place-items-center rounded-[0.9rem] bg-gradient-to-br text-white shadow-[0_7px_16px_rgba(3,18,12,0.14)] transition-transform duration-200 group-hover:scale-[1.04]", tool.color)}>
                        <Icon name={tool.icon} size={17} aria-hidden="true" />
                      </span>
                      <span className="text-[0.65rem] font-extrabold tabular-nums tracking-[0.12em] text-[var(--text-muted)] opacity-65">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className="mb-1.5 flex w-full items-center gap-1.5 text-[0.88rem] font-extrabold leading-tight text-text-primary transition-colors group-hover:text-primary">
                      <span className="truncate">{tr(tool.title)}</span>
                    </h3>

                    <p className="line-clamp-2 text-[0.73rem] leading-[1.55] text-text-muted">
                      {tr(tool.desc)}
                    </p>
                    <span className="mt-auto flex w-full items-center justify-between pt-3 text-[0.68rem] font-bold text-[var(--primary)]">
                      {openLabel}
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-[rgba(var(--primary-rgb),0.16)] bg-[rgba(var(--primary-rgb),0.07)] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                        <Icon name="arrow-right" size={11} className="rtl:rotate-180" aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
