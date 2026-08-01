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
            className="modal !w-full !max-w-4xl !overflow-hidden !rounded-3xl !border !border-[var(--border)] !bg-[var(--bg-card)] !backdrop-blur-xl !shadow-[0_36px_90px_rgba(1,8,22,0.64)] animate-fadeInScale"
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
            <div className="modal-header !border-b !border-[var(--border)] !bg-[var(--bg-secondary)] flex items-center justify-between !py-4 !px-5">
              <div className="modal-title-stack">
                <div className="modal-kicker">
                  {tr({
                    fr: "Fonctionnalités",
                    en: "Features",
                    ar: "الخصائص والخدمات",
                  })}
                </div>
                <h2
                  className="modal-title flex items-center gap-2"
                  id="tools-modal-title"
                >
                  <Icon name="shapes" size={18} className="text-primary" />
                  {tr({
                    fr: "Espace outils spirituels",
                    en: "Spiritual Tools Hub",
                    ar: "مركز الأدوات الروحية",
                  })}
                </h2>
                <div className="modal-subtitle">
                  {tr({
                    fr: "Accédez à vos outils de suivi, mémorisation et écoute en un seul endroit.",
                    en: "Access all your tracking, memorization, and listening tools in one place.",
                    ar: "الوصول الى ادوات المتابعة والحفظ والاستماع في مكان واحد.",
                  })}
                </div>
              </div>
              <button
                className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.02] hover:!bg-white/[0.08] transition-colors"
                onClick={close}
                type="button"
                aria-label={tr({ fr: "Fermer", en: "Close", ar: "إغلاق" })}
              >
                <Icon name="xmark" size={18} />
              </button>
            </div>

            <div className="modal-list !max-h-[75vh] !overflow-y-auto !p-5 sm:!p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={tool.action}
                    className={cn(
                      "group relative flex flex-col items-start text-left p-5 rounded-2xl border border-[var(--border)] bg-bg-primary hover:bg-bg-secondary hover:border-[rgba(var(--primary-rgb),0.3)] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.55)] focus-visible:ring-offset-2",
                    )}
                    style={{
                      contentVisibility: "auto",
                      containIntrinsicSize: "135px",
                    }}
                  >
                    <div
                      className="absolute -right-4 -bottom-4 opacity-[0.02] transition-opacity duration-300 pointer-events-none group-hover:opacity-[0.04]"
                      aria-hidden="true"
                    >
                      <Icon name={tool.icon} size={96} />
                    </div>

                    <div
                      className={cn(
                        "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-110",
                        tool.color,
                      )}
                    >
                      <Icon name={tool.icon} size={21} />
                    </div>

                    <h3 className="mb-1.5 flex w-full items-center gap-1.5 text-[0.95rem] font-bold text-text-primary transition-colors group-hover:text-primary">
                      <span className="truncate">{tr(tool.title)}</span>
                      <Icon
                        name="arrow-right"
                        size={14}
                        className="ml-auto -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 rtl:rotate-180"
                      />
                    </h3>

                    <p className="line-clamp-2 text-[0.78rem] leading-relaxed text-text-muted">
                      {tr(tool.desc)}
                    </p>
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
