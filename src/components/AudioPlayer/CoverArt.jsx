import React from "react";
import { cn } from "../../lib/utils";

const SIZE_MAP = {
  36: "w-9 h-9",
  40: "w-10 h-10",
  52: "w-13 h-13",
  64: "w-16 h-16",
  80: "w-20 h-20",
  100: "w-25 h-25",
};

export function CoverArt({ 
  isPlaying = false, 
  size = 52, 
  className = "",
  pulse = true 
}) {
  const sizeClass = SIZE_MAP[size] || "w-12 h-12";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-2xl transition-all duration-300",
        "bg-[linear-gradient(135deg,var(--gold-bright)_0%,var(--gold)_100%)]",
        "border border-white/20 shadow-lg",
        sizeClass,
        isPlaying && pulse ? "scale-105 shadow-[0_8px_24px_rgba(212,168,34,0.3)]" : "scale-100",
        className
      )}
    >
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4)_0%,transparent_70%)]" />
      
      {/* Ornamental Graphic */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 h-full w-full opacity-35"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="42" stroke="white" strokeWidth="0.8" strokeDasharray="4 4" />
        <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="0.5" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          return (
            <line 
              key={i} 
              x1="50" y1="20" x2="50" y2="35" 
              stroke="white" strokeWidth="0.6" 
              transform={`rotate(${angle} 50 50)`} 
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <i className={cn(
          "fas fa-quran text-white/90 drop-shadow-md",
          size < 50 ? "text-lg" : "text-2xl"
        )} />
      </div>

      {isPlaying && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
      )}
    </div>
  );
}

export default CoverArt;
