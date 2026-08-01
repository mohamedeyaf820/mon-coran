import { cn } from "../../lib/utils";

export const modePaneShellClass =
  "rd-wrapper mx-auto flex max-w-[1040px] flex-col gap-[0.6rem] px-[0.9rem] pt-[0.72rem] pb-[calc(var(--player-h,88px)+2.4rem)] max-[640px]:gap-[0.48rem] max-[640px]:px-[0.56rem] max-[640px]:pt-[0.48rem] max-[640px]:pb-[calc(var(--player-h,88px)+1.9rem)] max-[560px]:landscape:gap-[0.42rem] max-[560px]:landscape:px-[0.62rem] max-[560px]:landscape:pt-[0.38rem] max-[560px]:landscape:pb-[calc(var(--player-h,88px)+1.25rem)]";

export function createDisplayClasses({ focusReading, riwaya }) {
  const readingChromeFrameClass = cn(
    "w-full max-w-full rounded-[1.35rem] border shadow-[var(--quran-platform-shadow)] backdrop-blur-[18px] [backdrop-filter:blur(18px)_saturate(135%)] max-[640px]:rounded-[1.05rem]",
    focusReading && "min-[901px]:mx-auto min-[901px]:max-w-[960px]",
  );
  const readingChromeSurfaceClass = cn(
    readingChromeFrameClass,
    "border-[var(--quran-platform-border)] bg-[var(--quran-platform-surface)]",
    focusReading && "border-[rgba(var(--primary-rgb),0.06)]",
  );

  return {
    ayahListClass:
      "surah-ayahs-list relative mb-[0.75rem] grid gap-[clamp(0.45rem,0.85vw,0.72rem)] overflow-hidden rounded-[var(--r-xl)] border border-[var(--border)] bg-[var(--mushaf-bg,var(--bg-card))] shadow-[0_4px_20px_rgba(28,25,23,0.08),0_1px_4px_rgba(28,25,23,0.05),inset_0_1px_0_rgba(255,255,255,0.65)] [overflow-wrap:break-word] [word-break:break-word] before:block before:h-[3px] before:bg-[linear-gradient(90deg,transparent_0%,rgba(184,134,11,0.4)_20%,rgba(184,134,11,0.75)_50%,rgba(184,134,11,0.4)_80%,transparent_100%)]",
    getMushafLayoutButtonClass: (active) =>
      cn(
        "relative inline-flex min-h-[2.45rem] shrink-0 items-center gap-[0.42rem] rounded-[0.88rem] border px-[0.78rem] py-[0.34rem] font-[var(--font-ui)] text-[0.75rem] font-bold tracking-[-0.01em] transition-all duration-300 ease-out [&_i]:text-[0.78rem] [&_i]:opacity-85 [&_i]:transition-transform [&_i]:duration-300 max-[480px]:min-h-[32px] max-[480px]:px-[0.58rem] max-[480px]:py-[0.24rem] max-[480px]:text-[0.69rem]",
        active
          ? "border-[var(--primary)] bg-[linear-gradient(135deg,var(--primary)_0%,color-mix(in_srgb,var(--primary)_85%,black)_100%)] text-white shadow-[0_12px_24px_rgba(var(--primary-rgb),0.18),0_1px_0_rgba(255,255,255,0.18)_inset] after:pointer-events-none after:absolute after:inset-[-2px] after:rounded-[inherit] after:border after:border-[rgba(var(--primary-rgb),0.45)] after:opacity-60 after:content-[''] [&_i]:scale-110 [&_i]:opacity-100"
          : "border-transparent bg-[linear-gradient(145deg,color-mix(in_srgb,var(--bg-secondary)_88%,#ffffff_12%),color-mix(in_srgb,var(--bg-secondary)_94%,#000000_6%))] text-[color:color-mix(in_srgb,var(--text-secondary)_92%,var(--text-primary)_8%)] hover:-translate-y-px hover:border-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]",
      ),
    mushafToggleBarClass: cn(
      readingChromeSurfaceClass,
      "flex items-center justify-center gap-[0.36rem] p-[0.3rem] max-[480px]:justify-start max-[480px]:overflow-x-auto max-[480px]:flex-nowrap max-[480px]:[scrollbar-width:none] max-[480px]:[-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
    ),
    mushafToggleSeparatorClass:
      "h-6 w-px shrink-0 bg-[linear-gradient(to_bottom,transparent,rgba(var(--primary-rgb),0.18),transparent)] max-[480px]:h-5",
    pageHeaderBarClass: cn(
      readingChromeSurfaceClass,
      "mb-4 flex flex-wrap items-center justify-between gap-[0.62rem] px-[0.92rem] py-[0.74rem] font-[var(--font-ui)] text-[0.8rem] font-bold tracking-[0.02em] text-[var(--text-secondary)]",
    ),
    readingChromeFrameClass,
    pageHeaderLeadIconClass: "opacity-70",
    pageHeaderPrimaryMetaClass:
      "inline-flex min-w-0 items-center gap-[0.45rem] text-[0.9rem] font-bold text-[var(--text-primary)]",
    pageHeaderSecondaryMetaClass:
      "inline-flex min-w-0 items-center gap-[0.35rem]",
    pageIndicatorClass: "reader-mode-nav__indicator",
    quranNavButtonClass: "",
    quranNavClass: "quran-nav",
    riwayaBadgeClassName: cn(
      "inline-flex min-h-[1.78rem] shrink-0 items-center gap-[0.35rem] rounded-full border px-[0.6rem] py-[0.22rem] text-[0.66rem] font-extrabold tracking-[0.04em] max-[640px]:w-full max-[640px]:justify-center",
      riwaya === "warsh"
        ? "border-[rgba(212,168,32,0.34)] bg-[rgba(212,168,32,0.14)] text-[var(--gold,#b8860b)]"
        : "border-[rgba(var(--primary-rgb),0.22)] bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)]",
    ),
    warshMushafLinkClass:
      "inline-flex items-center gap-[0.4rem] rounded-[var(--r-md)] bg-[linear-gradient(135deg,var(--gold),#9a7008)] px-[0.85rem] py-[0.4rem] font-[var(--font-ui)] text-[0.71rem] font-bold whitespace-nowrap text-white shadow-[0_2px_8px_rgba(184,134,11,0.25)] transition-[box-shadow,filter,transform] duration-150 ease-out hover:-translate-y-px hover:brightness-105 hover:shadow-[0_6px_18px_rgba(184,134,11,0.3)]",
  };
}
