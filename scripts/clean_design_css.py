#!/usr/bin/env python3
"""Replace the appended design CSS section in index.css with a clean version"""

path = r"e:\mon coran\src\styles\index.css"
with open(path, "r", encoding="utf-8") as f:
    css = f.read()

css_lf = css.replace("\r\n", "\n")

# Find and remove the appended section
marker = "\n/* ════════════════════════════════════════════════════════════\n   DESIGN IMPROVEMENTS"
idx = css_lf.find(marker)
if idx != -1:
    css_lf = css_lf[:idx]
    print(f"✓ Removed old appended section at index {idx}")
else:
    print("⚠ Marker not found, appending anyway")

NEW_CSS = """
/* ════════════════════════════════════════════════════════════
   DESIGN IMPROVEMENTS — Immersive mode, Transitions, Progress
   bar, Typography, OLED/Sepia fixes
   ════════════════════════════════════════════════════════════ */

/* ── Immersive reading mode (auto-hide header) ─────────────── */
.hdr {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.35s ease;
  will-change: transform;
}
.immersive-mode .hdr {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

/* ── Surah page transition (triggered by key remount) ──────── */
@keyframes surahFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.quran-display {
  animation: surahFadeIn 0.3s ease forwards;
}

/* ── Reading progress bar ──────────────────────────────────── */
.reading-progress-bar {
  position: fixed;
  top: 0;
  inset-inline-start: 0;
  width: 100%;
  height: 3px;
  z-index: 9999;
  background: linear-gradient(
    90deg,
    var(--primary) 0%,
    var(--gold, #b8860b) 100%
  );
  transform-origin: left center;
  transform: scaleX(var(--reading-progress, 0));
  transition: transform 0.1s linear;
  pointer-events: none;
  border-radius: 0 2px 2px 0;
}

/* ── Enhanced glow on playing ayah (amplifies existing styles) ─ */
@keyframes ayahGlowPulse {
  0%, 100% { box-shadow: 0 0 12px rgba(212, 168, 32, 0.12), inset 0 0 0 1px rgba(212, 168, 32, 0.15); }
  50%       { box-shadow: 0 0 22px rgba(212, 168, 32, 0.22), inset 0 0 0 1px rgba(212, 168, 32, 0.25); }
}
.qc-ayah-block.is-playing {
  animation: ayahGlowPulse 2.4s ease-in-out infinite;
  border-radius: 8px;
}

/* ── Typography adaptative (fluid scaling) ──────────────────── */
:root {
  --quran-font-clamp: clamp(1.3rem, calc(0.6rem + 3vw), 2.1rem);
}
/* Override the JS pixel sizing with CSS fluid value when user hasn't custom-set */
.qc-ayah-text-ar {
  font-size: var(--quran-font-size-override, var(--quran-font-clamp)) !important;
}

/* ── OLED theme component overrides ─────────────────────────── */
[data-theme="oled"] .hdr {
  background: #000 !important;
  border-bottom-color: #111 !important;
  box-shadow: 0 1px 0 #111 !important;
}
[data-theme="oled"] .sidebar-inner,
[data-theme="oled"] .sidebar {
  background: #000 !important;
  border-color: #111 !important;
}
[data-theme="oled"] .modal-overlay {
  background: rgba(0, 0, 0, 0.97) !important;
}
[data-theme="oled"] .modal-content,
[data-theme="oled"] .panel,
[data-theme="oled"] .modal-card {
  background: #050505 !important;
  border-color: #1a1a1a !important;
}

/* ── Sepia theme — reading area uses parchment bg ───────────── */
[data-theme="sepia"] .app-main {
  background: var(--parchment-1);
}
[data-theme="sepia"] .quran-display {
  background: var(--mushaf-bg, var(--parchment-1));
}

/* ── Responsive: ensure 2 columns on very small screens ─────── */
@media (max-width: 375px) {
  .hp2-items--grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.4rem !important;
    padding: 0.5rem !important;
    background: transparent !important;
  }
  .hpg-card {
    min-height: 90px;
    padding: 0.55rem 0.6rem;
  }
  .hpg-card__ar { font-size: 0.92rem; }
}
"""

css_lf = css_lf.rstrip() + "\n" + NEW_CSS

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(css_lf)

print("✓ Clean design CSS written to index.css")
