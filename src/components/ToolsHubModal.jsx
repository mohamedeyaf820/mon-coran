import React from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { cn } from "../lib/utils";

export default function ToolsHubModal() {
  const { state, set } = useApp();
  const { lang, theme } = state;

  const close = () => set({ toolsHubOpen: false });

  const tr = (obj) => {
    return lang === "ar" ? obj.ar : lang === "fr" ? obj.fr : obj.en;
  };

  const tools = [
    {
      id: "wird",
      icon: "fa-calendar-check",
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-500/10",
      title: { fr: "Wird Quotidien", en: "Daily Wird", ar: "الورد اليومي" },
      desc: {
        fr: "Suivez votre objectif quotidien de lecture du Coran.",
        en: "Track your daily Quran reading goal.",
        ar: "تابع هدفك اليومي لقراءة القرآن الكريم.",
      },
      action: () => set({ toolsHubOpen: false, wirdOpen: true }),
    },
    {
      id: "khatma",
      icon: "fa-book-open",
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-500/10",
      title: { fr: "Suivi Khatma", en: "Khatma Tracker", ar: "متابعة الختمة" },
      desc: {
        fr: "Planifiez et suivez votre lecture complète du Coran.",
        en: "Plan and track your complete reading of the Quran.",
        ar: "خطط وتابع ختمتك الكاملة للقرآن الكريم.",
      },
      action: () => set({ toolsHubOpen: false, khatmaOpen: true }),
    },
    {
      id: "history",
      icon: "fa-clock-rotate-left",
      color: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-500/10",
      title: { fr: "Historique", en: "Reading History", ar: "سجل القراءة" },
      desc: {
        fr: "Consultez vos récentes sessions de lecture et versets lus.",
        en: "View your recent reading sessions and verses read.",
        ar: "عرض جلسات القراءة الأخيرة والآيات التي قرأتها.",
      },
      action: () => set({ toolsHubOpen: false, historyOpen: true }),
    },
    {
      id: "playlist",
      icon: "fa-list-music",
      color: "from-purple-500 to-fuchsia-600",
      bgLight: "bg-purple-500/10",
      title: { fr: "Playlists Audio", en: "Audio Playlists", ar: "قوائم التشغيل" },
      desc: {
        fr: "Créez et écoutez vos compilations de versets préférés.",
        en: "Create and listen to your custom verse playlists.",
        ar: "أنشئ واستمع إلى قوائم تشغيل الآيات المفضلة لديك.",
      },
      action: () => set({ toolsHubOpen: false, playlistOpen: true }),
    },
    {
      id: "stats",
      icon: "fa-chart-line",
      color: "from-cyan-500 to-blue-600",
      bgLight: "bg-cyan-500/10",
      title: { fr: "Statistiques", en: "Weekly Stats", ar: "الإحصائيات" },
      desc: {
        fr: "Visualisez vos progrès et temps d'écoute hebdomadaires.",
        en: "Visualize your weekly reading progress and listening time.",
        ar: "رؤية تقدمك الأسبوعي في القراءة ووقت الاستماع.",
      },
      action: () => set({ toolsHubOpen: false, weeklyStatsOpen: true }),
    },
    {
      id: "tajweed",
      icon: "fa-graduation-cap",
      color: "from-rose-500 to-red-600",
      bgLight: "bg-rose-500/10",
      title: { fr: "Quiz de Tajweed", en: "Tajweed Quiz", ar: "اختبار التجويد" },
      desc: {
        fr: "Testez vos connaissances sur les règles de récitation.",
        en: "Test your knowledge on the rules of recitation.",
        ar: "اختبر معرفتك بأحكام تجويد القرآن الكريم.",
      },
      action: () => set({ toolsHubOpen: false, tajweedQuizOpen: true }),
    },
    {
      id: "flashcards",
      icon: "fa-brain",
      color: "from-pink-500 to-rose-600",
      bgLight: "bg-pink-500/10",
      title: { fr: "Mémorisation", en: "Flashcards", ar: "الحفظ والمراجعة" },
      desc: {
        fr: "Mémorisez efficacement à l'aide de cartes mémoire.",
        en: "Memorize effectively using active recall flashcards.",
        ar: "احفظ الآيات بفعالية باستخدام البطاقات التعليمية.",
      },
      action: () => set({ toolsHubOpen: false, flashcardsOpen: true }),
    },
    {
      id: "comparator",
      icon: "fa-users-between-lines",
      color: "from-teal-500 to-emerald-600",
      bgLight: "bg-teal-500/10",
      title: { fr: "Comparateur", en: "Reciter Compare", ar: "مقارنة القراء" },
      desc: {
        fr: "Comparez les styles et rythmes de différents récitateurs.",
        en: "Compare the styles and tempos of different reciters.",
        ar: "قارن بين أساليب وتلاوات القراء المختلفين.",
      },
      action: () => set({ toolsHubOpen: false, comparatorOpen: true }),
    },
    {
      id: "audiomaker",
      icon: "fa-sliders",
      color: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-500/10",
      title: { fr: "Créateur Audio", en: "Audio Maker", ar: "صانع الصوتيات" },
      desc: {
        fr: "Générez des fichiers audio personnalisés pour l'écoute hors ligne.",
        en: "Generate custom audio files for offline listening loop.",
        ar: "إنشاء ملفات صوتية مخصصة للاستماع بدون اتصال.",
      },
      action: () => set({ toolsHubOpen: false, audioMakerOpen: true }),
    },
  ];

  return (
    <div
      className="modal-overlay !p-4 sm:!p-6"
      onClick={close}
      role="presentation"
    >
      <div
        className="modal !w-full !max-w-4xl !overflow-hidden !rounded-3xl !border !border-[var(--border)] !bg-[var(--bg-card)] !backdrop-blur-xl !shadow-[0_36px_90px_rgba(1,8,22,0.64)] animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tools-modal-title"
      >
        {/* En-tête */}
        <div className="modal-header !border-b !border-[var(--border)] !bg-[var(--bg-secondary)] flex items-center justify-between !py-4 !px-5">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {tr({ fr: "Fonctionnalités", en: "Features", ar: "الخصائص والخدمات" })}
            </div>
            <h2 className="modal-title flex items-center gap-2" id="tools-modal-title">
              <i className="fas fa-shapes text-primary"></i>
              {tr({ fr: "Espace Outils Spirituels", en: "Spiritual Tools Hub", ar: "مركز الأدوات الروحية" })}
            </h2>
            <div className="modal-subtitle">
              {tr({
                fr: "Accédez à tous vos outils de suivi, de mémorisation et d'écoute en un seul endroit.",
                en: "Access all your tracking, memorization, and listening tools in one place.",
                ar: "الوصول إلى جميع أدوات المتابعة والحفظ والاستماع في مكان واحد.",
              })}
            </div>
          </div>
          <button
            className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.02] hover:!bg-white/[0.08] transition-colors"
            onClick={close}
            type="button"
            aria-label={tr({ fr: "Fermer", en: "Close", ar: "إغلاق" })}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Contenu - Grille d'outils */}
        <div className="modal-list !max-h-[75vh] !overflow-y-auto !p-5 sm:!p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={tool.action}
                className={cn(
                  "group relative flex flex-col items-start text-left p-5 rounded-2xl border border-[var(--border)] bg-bg-primary hover:bg-bg-secondary hover:border-[rgba(var(--primary-rgb),0.3)] shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.55)] focus-visible:ring-offset-2"
                )}
                style={{ contentVisibility: "auto", containIntrinsicSize: "135px" }}
              >
                {/* Icône de fond décorative */}
                <div
                  className={cn(
                    "absolute -right-4 -bottom-4 text-8xl font-black opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none"
                  )}
                >
                  <i className={`fas ${tool.icon}`} />
                </div>

                {/* Badge Icône */}
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm mb-4 transition-transform duration-300 group-hover:scale-110",
                    tool.color
                  )}
                >
                  <i className={`fas ${tool.icon} text-lg`}></i>
                </div>

                {/* Titre */}
                <h3 className="text-[0.95rem] font-bold text-text-primary mb-1.5 group-hover:text-primary transition-colors flex items-center gap-1.5 w-full">
                  <span className="truncate">{tr(tool.title)}</span>
                  <i className="fas fa-arrow-right text-[0.7rem] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all ml-auto rtl:rotate-180"></i>
                </h3>

                {/* Description */}
                <p className="text-[0.78rem] text-text-muted leading-relaxed line-clamp-2">
                  {tr(tool.desc)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
