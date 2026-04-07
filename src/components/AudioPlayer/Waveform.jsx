import React from "react";
import { cn } from "../../lib/utils";

const WAVE_HEIGHT_CLASSES = [
  "h-[22%]",
  "h-[26.62%]",
  "h-[31.23%]",
  "h-[35.85%]",
  "h-[40.46%]",
  "h-[45.08%]",
  "h-[49.69%]",
  "h-[54.31%]",
  "h-[58.92%]",
  "h-[63.54%]",
  "h-[68.15%]",
  "h-[72.77%]",
  "h-[77.38%]",
];

export function Waveform({ isPlaying, progress, count = 32 }) {
  return (
    <div className="flex h-8 w-full items-end justify-center gap-0.5 rounded-xl border border-white/5 bg-white/[0.04] px-2 py-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] backdrop-blur-md">
      {Array.from({ length: count }).map((_, i) => {
        const barPct = i / count;
        const filled = barPct <= progress;
        // Pseudo-randomizing heights while keeping them stable
        const seedIndex = (i * 7 + 3) % WAVE_HEIGHT_CLASSES.length;
        
        return (
          <div
            key={i}
            className={cn(
              "min-w-[2px] flex-1 rounded-full origin-bottom transition-all duration-300",
              WAVE_HEIGHT_CLASSES[seedIndex],
              filled
                ? "bg-gradient-to-t from-[var(--gold)] to-[var(--gold-bright)] shadow-[0_0_8px_rgba(212,168,32,0.15)]"
                : "bg-white/10 dark:bg-white/5",
              isPlaying && "animate-[pulse_1.2s_infinite] ease-in-out"
            )}
            style={{ 
              animationDelay: `${i * 0.05}s`,
              opacity: filled ? 1 : 0.6
            }}
          />
        );
      })}
    </div>
  );
}

export default Waveform;
