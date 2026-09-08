import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  Minus,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { confirmAction } from "../services/interactionService.js";
import {
  getKhatmaPlan,
  saveKhatmaPlan,
  deleteKhatmaPlan,
  calculateKhatmaStatus,
  TOTAL_QURAN_PAGES,
  DEFAULT_KHATMA_DAYS,
} from "../services/khatmaService";
import { cn } from "../lib/utils";
import { toAr } from "../data/surahs";

const KHATMA_LABELS = {
  fr: {
    title: "Planificateur de Khatma",
    subtitle: "Terminez la lecture du Noble Coran à votre rythme, en toute sérénité.",
    noPlanTitle: "Aucune Khatma en cours",
    noPlanDesc: "Définissez un objectif de durée pour générer votre programme de lecture personnalisé.",
    chooseDuration: "Durée de la Khatma",
    days15: "15 jours (intensif)",
    days30: "30 jours (1 mois / Ramadan)",
    days60: "60 jours (2 mois)",
    days90: "90 jours (3 mois)",
    startFromPage: "Commencer à la page",
    startPlanBtn: "Démarrer cette Khatma",
    progressTitle: "Votre progression",
    pagesRead: "pages lues",
    dailyTargetTitle: "Objectif aujourd'hui",
    reachPage: "Atteindre la page",
    dailyCadence: "Cadence quotidienne",
    pagesPerDay: "pages / jour",
    pagesPerPrayer: "pages par prière (5 prières)",
    statusOnTrack: "À jour",
    statusAhead: "En avance",
    statusBehind: "En retard",
    resumeReading: "Reprendre la lecture",
    markPageRead: "Page suivante (+1)",
    markPageUnread: "Page précédente (-1)",
    resetPlan: "Réinitialiser la Khatma",
    completedTitle: "Macha'Allah ! Khatma accomplie !",
    completedDesc: "Qu'Allah accepte votre lecture et vous accorde Sa bénédiction.",
    dayNumber: "Jour",
    of: "sur",
  },
  en: {
    title: "Khatma Planner",
    subtitle: "Complete the recitation of the Holy Quran at your own pace.",
    noPlanTitle: "No active Khatma",
    noPlanDesc: "Choose your target duration to generate a personalized reading schedule.",
    chooseDuration: "Khatma Duration",
    days15: "15 days (intensive)",
    days30: "30 days (1 month / Ramadan)",
    days60: "60 days (2 months)",
    days90: "90 days (3 months)",
    startFromPage: "Start from page",
    startPlanBtn: "Start this Khatma",
    progressTitle: "Your Progress",
    pagesRead: "pages read",
    dailyTargetTitle: "Today's Target",
    reachPage: "Reach page",
    dailyCadence: "Daily pacing",
    pagesPerDay: "pages / day",
    pagesPerPrayer: "pages after each prayer (5 prayers)",
    statusOnTrack: "On track",
    statusAhead: "Ahead",
    statusBehind: "Behind",
    resumeReading: "Resume reading",
    markPageRead: "Next page (+1)",
    markPageUnread: "Previous page (-1)",
    resetPlan: "Reset Khatma",
    completedTitle: "Masha'Allah! Khatma completed!",
    completedDesc: "May Allah accept your recitation and bestow His blessings upon you.",
    dayNumber: "Day",
    of: "of",
  },
  ar: {
    title: "مخطط الختمة",
    subtitle: "اختم القرآن الكريم بالوتيرة التي تناسبك وفي هدوء وسكينة.",
    noPlanTitle: "لا توجد ختمة نشطة حالياً",
    noPlanDesc: "اختر مدة الختمة لإنشاء جدول قراءة مخصص وميسر.",
    chooseDuration: "مدة الختمة",
    days15: "15 يوماً (مكثف)",
    days30: "30 يوماً (شهر / رمضان)",
    days60: "60 يوماً (شهران)",
    days90: "90 يوماً (3 أشهر)",
    startFromPage: "البدء من الصفحة",
    startPlanBtn: "بدء هذه الختمة",
    progressTitle: "تقدمك الحالي",
    pagesRead: "صفحة تمت قراءتها",
    dailyTargetTitle: "ورد اليوم",
    reachPage: "الوصول إلى الصفحة",
    dailyCadence: "المعدل اليومي",
    pagesPerDay: "صفحة / يوم",
    pagesPerPrayer: "صفحات بعد كل صلاة (5 صلوات)",
    statusOnTrack: "على المسار الصحيح",
    statusAhead: "متقدم",
    statusBehind: "متأخر",
    resumeReading: "متابعة القراءة",
    markPageRead: "الصفحة التالية (+1)",
    markPageUnread: "الصفحة السابقة (-1)",
    resetPlan: "إعادة ضبط الختمة",
    completedTitle: "ما شاء الله! تمت الختمة بنجاح!",
    completedDesc: "تقبل الله قراءتكم وجعلها في ميزان حسناتكم.",
    dayNumber: "اليوم",
    of: "من",
  },
};

export default function KhatmaPlannerPanel({ onClose }) {
  const { state, set, dispatch } = useApp();
  const { lang, currentPage: readerCurrentPage } = state;
  const isRtl = lang === "ar";
  const labels = KHATMA_LABELS[lang] || KHATMA_LABELS.fr;

  const [plan, setPlan] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_KHATMA_DAYS);
  const [startPageInput, setStartPageInput] = useState(1);

  // Load stored plan on mount
  useEffect(() => {
    const loaded = getKhatmaPlan();
    setPlan(loaded);
    if (!loaded && readerCurrentPage) {
      setStartPageInput(readerCurrentPage);
    }
  }, [readerCurrentPage]);

  // Dynamic calculated status
  const status = useMemo(() => {
    if (!plan) return null;
    return calculateKhatmaStatus(plan);
  }, [plan]);

  const handleStartPlan = useCallback(() => {
    const newPlan = saveKhatmaPlan({
      targetDays: selectedDuration,
      startPage: startPageInput,
      currentPage: startPageInput,
    });
    setPlan(newPlan);
  }, [selectedDuration, startPageInput]);

  const handleResumeReading = useCallback(() => {
    if (!status) return;
    set({
      currentPage: status.currentPage,
      displayMode: "page",
      showHome: false,
      showDuas: false,
      libraryOpen: false,
    });
    onClose?.();
  }, [status, set, onClose]);

  const handlePageDelta = useCallback(
    (delta) => {
      if (!plan) return;
      const nextCurrent = Math.max(
        1,
        Math.min(TOTAL_QURAN_PAGES, (plan.currentPage || 1) + delta),
      );
      const updated = saveKhatmaPlan({
        ...plan,
        currentPage: nextCurrent,
      });
      setPlan(updated);
    },
    [plan],
  );

  const handleReset = useCallback(async () => {
    const confirmMessage =
      lang === "ar"
        ? "هل أنت متأكد من إعادة ضبط الختمة؟"
        : lang === "fr"
          ? "Voulez-vous vraiment réinitialiser cette Khatma ?"
          : "Are you sure you want to reset this Khatma?";
    if (await confirmAction({ title: labels.resetPlan, message: confirmMessage })) {
      deleteKhatmaPlan();
      setPlan(null);
    }
  }, [lang, labels.resetPlan]);

  const formatNum = (n) => (lang === "ar" ? toAr(n) : String(n));

  return (
    <div className="khatma-planner-panel flex flex-col gap-4 py-1 text-text-primary">
      {!plan ? (
        /* Create New Khatma Screen */
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                {labels.noPlanTitle}
              </h3>
              <p className="text-xs text-text-secondary">{labels.noPlanDesc}</p>
            </div>
          </div>

          {/* Duration Selector */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-medium text-text-secondary">
              {labels.chooseDuration}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[15, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDuration(d)}
                  className={cn(
                    "flex min-h-[44px] flex-col items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                    selectedDuration === d
                      ? "border-primary bg-primary/15 text-primary shadow-sm"
                      : "border-border bg-card/40 text-text-secondary hover:border-primary/40 hover:text-text-primary",
                  )}
                >
                  <span className="text-sm font-bold">{formatNum(d)}</span>
                  <span className="text-[0.68rem] font-normal opacity-80">
                    {d === 15
                      ? labels.days15.split(" ")[1]
                      : d === 30
                        ? labels.days30.split(" ")[1]
                        : d === 60
                          ? labels.days60.split(" ")[1]
                          : labels.days90.split(" ")[1]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Start Page Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">
              {labels.startFromPage}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={TOTAL_QURAN_PAGES}
                value={startPageInput}
                onChange={(e) =>
                  setStartPageInput(
                    Math.max(
                      1,
                      Math.min(TOTAL_QURAN_PAGES, Number(e.target.value) || 1),
                    ),
                  )
                }
                className="h-11 w-24 rounded-xl border border-border bg-background px-3 text-center text-sm font-bold text-text-primary focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-text-secondary">
                {labels.of} {formatNum(TOTAL_QURAN_PAGES)}
              </span>
            </div>
          </div>

          {/* Cadence preview */}
          <div className="rounded-xl bg-primary/5 p-3 text-xs leading-relaxed text-text-secondary">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <Sparkles size={14} />
              <span>{labels.dailyCadence}</span>
            </div>
            <p className="mt-1">
              ~
              <strong className="text-text-primary">
                {formatNum(Math.ceil((TOTAL_QURAN_PAGES - startPageInput + 1) / selectedDuration))}
              </strong>{" "}
              {labels.pagesPerDay} (
              <strong className="text-text-primary">
                {formatNum(Math.ceil(Math.ceil((TOTAL_QURAN_PAGES - startPageInput + 1) / selectedDuration) / 5))}
              </strong>{" "}
              {labels.pagesPerPrayer})
            </p>
          </div>

          {/* Start button */}
          <button
            type="button"
            onClick={handleStartPlan}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-95 active:scale-[0.99]"
          >
            <BookOpen size={16} />
            <span>{labels.startPlanBtn}</span>
          </button>
        </div>
      ) : (
        /* Active Khatma Progress Screen */
        <div className="flex flex-col gap-4">
          {/* Main Progress Card */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
            {/* Header / Pacing Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {labels.dayNumber} {formatNum(status.currentDayNumber)} /{" "}
                {formatNum(status.targetDays)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold",
                  status.pace === "ahead"
                    ? "bg-blue-500/15 text-blue-500"
                    : status.pace === "behind"
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-emerald-500/15 text-emerald-500",
                )}
              >
                {status.pace === "ahead"
                  ? `${labels.statusAhead} (+${formatNum(status.diff)})`
                  : status.pace === "behind"
                    ? `${labels.statusBehind} (${formatNum(status.diff)})`
                    : labels.statusOnTrack}
              </span>
            </div>

            {/* Big Progress Display */}
            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-extrabold text-primary">
                  {formatNum(status.percentage)}%
                </span>
                <span className="ml-2 text-xs text-text-secondary">
                  ({formatNum(status.pagesRead)} /{" "}
                  {formatNum(status.totalPagesToRead)} {labels.pagesRead})
                </span>
              </div>
              <span className="text-xs font-semibold text-text-secondary">
                Page {formatNum(status.currentPage)} /{" "}
                {formatNum(TOTAL_QURAN_PAGES)}
              </span>
            </div>

            {/* Progress Bar Rail */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${status.percentage}%` }}
              />
            </div>

            {/* Today Target Banner */}
            <div className="mt-3.5 flex items-center justify-between rounded-xl bg-background/70 px-3 py-2 text-xs">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-primary" />
                <span className="text-text-secondary">
                  {labels.dailyTargetTitle} :
                </span>
                <strong className="text-text-primary">
                  {labels.reachPage} {formatNum(status.expectedPageToday)}
                </strong>
              </div>
              <span className="text-[0.68rem] font-medium text-text-secondary">
                {formatNum(status.dailyPages)} {labels.pagesPerDay}
              </span>
            </div>
          </div>

          {/* Quick Step / Progress Adjuster */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-3 py-2">
            <span className="text-xs text-text-secondary">
              Page actuelle :{" "}
              <strong className="text-text-primary">
                {formatNum(status.currentPage)}
              </strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageDelta(-1)}
                disabled={status.currentPage <= 1}
                aria-label={labels.markPageUnread}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-text-secondary transition hover:text-text-primary disabled:opacity-40"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                onClick={() => handlePageDelta(1)}
                disabled={status.currentPage >= TOTAL_QURAN_PAGES}
                aria-label={labels.markPageRead}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-text-secondary transition hover:text-text-primary disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={handleResumeReading}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-95 active:scale-[0.99]"
            >
              <BookOpen size={16} />
              <span>{labels.resumeReading}</span>
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card/40 px-3 py-2 text-xs font-medium text-text-secondary transition hover:border-rose-500/40 hover:text-rose-500 active:scale-[0.99]"
            >
              <RefreshCw size={13} />
              <span>{labels.resetPlan}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
