$path = "e:\mon coran\src\components\AudioPlayer.jsx"
$content = Get-Content -Raw -Path $path

# ProgressRail Replacement
$newProgressRail = 'function ProgressRail({ progress, className = "", showThumb = false }) {
  const pct = Math.max(0, Math.min(100, progress * 100));

  return (
    <div className={cn("h-full w-full group/progress", className)}>
      <svg
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient id="audio-progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--player-accent)" />
            <stop offset="100%" stopColor="var(--player-accent-strong)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="4" rx="2" className="fill-white/5 transition-colors group-hover/progress:fill-white/10" />
        <rect
          x="0"
          y="0"
          width={pct}
          height="4"
          rx="2"
          fill="url(#audio-progress-gradient)"
          className="transition-all duration-300"
        />
        {showThumb && (
          <circle
            cx={pct}
            cy="2"
            r="1.8"
            fill="#fff"
            className="drop-shadow-[0_0_4px_rgba(var(--player-accent-rgb),0.6)] opacity-0 group-hover/progress:opacity-100 transition-opacity"
            stroke="var(--player-accent)"
            strokeWidth="0.4"
          />
        )}
      </svg>
    </div>
  );
}'
$pattern1 = 'function ProgressRail\({ progress, className = "", showThumb = false }\) \{[\s\S]*?\}'
$content = [regex]::Replace($content, $pattern1, $newProgressRail)

# Waveform Replacement
$newWaveform = 'function Waveform({ isPlaying, progress }) {
  const COUNT = 36;
  return (
    <div className="flex h-10 w-full items-end justify-center gap-1.5 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden">
      {Array.from({ length: COUNT }).map((_, i) => {
        const pct = i / COUNT;
        const filled = pct <= progress;
        const seedIndex = (i * 7 + 3) % 13;
        return (
          <div
            key={i}
            className={cn(
              "min-w-[2.5px] flex-1 rounded-full origin-bottom transition-all duration-300",
              WAVE_HEIGHT_CLASSES[seedIndex],
              filled
                ? "bg-gradient-to-t from-[var(--player-accent)] to-[var(--player-accent-strong)] opacity-100"
                : "bg-white/10 opacity-30",
              isPlaying && "animate-waveform-bar",
            )}
            style={{ 
              animationDelay: `${i * 45}ms`,
              animationDuration: `${0.8 + Math.random() * 0.4}s`
            }}
          />
        );
      })}
    </div>
  );
}'
$pattern2 = 'function Waveform\({ isPlaying, progress }\) \{[\s\S]*?\}'
$content = [regex]::Replace($content, $pattern2, $newWaveform)

# CoverArt Replacement
$newCoverArt = 'function CoverArt({ isPlaying, size = 52, photo }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl shrink-0 group/art",
        COVER_SIZE_CLASSES[size] || COVER_SIZE_CLASSES[52],
        isPlaying
          ? "shadow-[0_12px_24px_rgba(var(--player-accent-rgb),0.25)]"
          : "shadow-[0_8px_20px_rgba(0,0,0,0.3)]",
        "transition-all duration-500 hover:scale-[1.03]"
      )}
    >
      <img src={photo} alt="" className={cn("h-full w-full object-cover transition-all duration-700", isPlaying ? "scale-110 saturate-110" : "scale-100 saturate-50 group-hover/art:saturate-100")} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-0 group-hover/art:opacity-100 transition-opacity" />
      {isPlaying && (
        <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80] animate-pulse" />
      )}
    </div>
  );
}'
$pattern3 = 'function CoverArt\(\{ isPlaying, size = 52 \}\) \{[\s\S]*?\}'
$content = [regex]::Replace($content, $pattern3, $newCoverArt)

# IconBtn Replacement
$newIconBtn = 'function IconBtn({ onClick, title, active, children, size = "md", className = "" }) {
  const base = size === "sm" ? "w-8 h-8 px-0" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  return (
    <button type="button" onClick={onClick} title={title} aria-label={title} className={cn(base, "group relative flex items-center justify-center rounded-2xl cursor-pointer outline-none transition-all duration-300", active ? "bg-[rgba(var(--player-accent-rgb),0.15)] text-white border border-[rgba(var(--player-accent-rgb),0.3)] shadow-[inset_0_0_8px_rgba(var(--player-accent-rgb),0.1)]" : "bg-white/[0.04] text-[rgba(255,255,255,0.65)] border border-white/5", "hover:bg-[rgba(var(--player-accent-rgb),0.2)] hover:text-white hover:border-[rgba(var(--player-accent-rgb),0.4)] hover:shadow-lg hover:scale-105 active:scale-95", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--player-accent-rgb),0.5)]", className)}>
      <div className="relative z-10">{children}</div>
      {active && <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--player-accent)] to-transparent opacity-5" />}
    </button>
  );
}'
$pattern4 = 'function IconBtn\(\{ onClick, title, active, children, size = "md", className = "" \}\) \{[\s\S]*?\}'
$content = [regex]::Replace($content, $pattern4, $newIconBtn)

Set-Content -Path $path -Value $content -NoNewline
