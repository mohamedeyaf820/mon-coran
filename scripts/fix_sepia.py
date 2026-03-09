#!/usr/bin/env python3
# Fix sepia theme and add OLED theme to index.css
import re

path = r"e:\mon coran\src\styles\index.css"
with open(path, "r", encoding="utf-8") as f:
    css = f.read()

# ── 1. Fix the corrupt block inside the sepia theme ──────────────────────────
# The sepia theme has a "light-theme" palette block mistakenly inserted.
# We replace from "--primary: #2ca4ab;" to "--header-glass: #ffffff;" (inclusive).

OLD_SEPIA_BLOCK = """    --primary: #2ca4ab;
    --primary-rgb: 44, 164, 171;
    --primary-hover: #248b91;

    --bg-primary: #ffffff;
    --bg-secondary: #f8fafb;
    --bg-tertiary: #f1f4f5;

    --text: #1f2121;
    --text-muted: #6b7280;

    --border: #e5e7eb;
    --border-subtle: #f3f4f6;
    --border-strong: #d1d5db;

    --gold: #2ca4ab;
    /* Using primary for gold-labeled items for consistency */
    --gold-rgb: 44, 164, 171;"""

NEW_SEPIA_BLOCK = """    --primary: var(--emerald);
    --primary-rgb: 107, 58, 20;
    --primary-hover: var(--emerald-mid);

    --bg-primary: var(--parchment-1);
    --bg-secondary: var(--parchment-2);
    --bg-tertiary: var(--parchment-3);

    --text: var(--ink-1);
    --text-muted: var(--ink-3);

    --border: rgba(187, 150, 90, 0.4);
    --border-subtle: rgba(187, 150, 90, 0.18);
    --border-strong: rgba(187, 150, 90, 0.7);

    --gold: #9a6800;
    --gold-rgb: 154, 104, 0;"""

# Normalize line endings for matching
css_lf = css.replace("\r\n", "\n")
old_lf = OLD_SEPIA_BLOCK.replace("\r\n", "\n")
new_lf = NEW_SEPIA_BLOCK.replace("\r\n", "\n")

if old_lf in css_lf:
    css_lf = css_lf.replace(old_lf, new_lf, 1)
    print("✓ Sepia core palette fixed")
else:
    print("✗ Sepia core palette NOT found - check manually")

# Also fix the header vars (still has #ffffff)
OLD_HEADER = """    /* -- Header & Navigation -- */
    --header-h: 64px;
    --sidebar-w: 290px;
    --header-bg: #ffffff;
    --header-border: #e5e7eb;
    --header-glass: #ffffff;"""

# Use a simpler regex approach for the header block within sepia
import re
# Find and replace only within the sepia block
sepia_start = css_lf.find('[data-theme="sepia"]')
ocean_start = css_lf.find('[data-theme="ocean"]')
if sepia_start != -1 and ocean_start != -1:
    sepia_block = css_lf[sepia_start:ocean_start]
    old_hdr = '    --header-bg: #ffffff;\n    --header-border: #e5e7eb;\n    --header-glass: #ffffff;'
    new_hdr = '    --header-bg: var(--parchment-2);\n    --header-border: rgba(187, 150, 90, 0.4);\n    --header-glass: rgba(245, 233, 204, 0.95);'
    if old_hdr in sepia_block:
        sepia_block_new = sepia_block.replace(old_hdr, new_hdr, 1)
        css_lf = css_lf[:sepia_start] + sepia_block_new + css_lf[ocean_start:]
        print("✓ Sepia header vars fixed")
    else:
        print("⚠ Sepia header vars not found (may already be correct)")

# ── 2. Add grain texture to sepia (after the sepia block closing brace) ──────
SEPIA_TEXTURE = """
/* Sepia parchment grain texture */
[data-theme="sepia"] .app-root {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
}
[data-theme="sepia"] .app-main,
[data-theme="sepia"] .quran-display-scroll {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    background-attachment: local;
}
"""

# ── 3. Add OLED theme (after the night-blue theme) ───────────────────────────
OLED_THEME = """
/* ============================================
   OLED THEME — True Black
   Pure black for OLED screens, high contrast
   ============================================ */
[data-theme="oled"] {
    --parchment-1: #0a0a0a;
    --parchment-2: #111111;
    --parchment-3: #1a1a1a;
    --parchment-4: #222222;

    --ink-1: #f5f5f5;
    --ink-2: #d4d4d4;
    --ink-3: #a3a3a3;
    --ink-4: #737373;

    --emerald: #22c55e;
    --emerald-mid: #16a34a;
    --emerald-lit: #4ade80;
    --emerald-pale: #052e16;
    --emerald-tint: rgba(34, 197, 94, 0.08);

    --gold: #eab308;
    --gold-bright: #facc15;
    --gold-pale: #1f1a00;
    --gold-tint: rgba(234, 179, 8, 0.1);

    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.9);
    --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.9);
    --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.9);
    --shadow-lg: 0 8px 28px rgba(0, 0, 0, 0.9);
    --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.9);
    --shadow-gold: 0 4px 16px rgba(234, 179, 8, 0.3);
    --shadow-emerald: 0 4px 16px rgba(34, 197, 94, 0.25);

    --header-bg: #000000;
    --header-glass: #000000;
    --header-border: #1a1a1a;
    --sidebar-bg: #000000;
    --player-bg: linear-gradient(160deg, #000000 0%, #0a0f0a 100%);
    --player-glass: #000000;
    --surah-header-bg: linear-gradient(135deg, #000000 0%, #0a1a0a 60%, #000000 100%);
    --bismillah-color: var(--emerald);
    --text-quran: #f5f5f5;
    --mushaf-bg: #000000;
    --mushaf-border: #1a1a1a;
    --ayah-hover: rgba(34, 197, 94, 0.05);
    --ayah-playing-bg: rgba(234, 179, 8, 0.12);

    --glass-bg: rgba(0, 0, 0, 0.98);
    --glass-border: rgba(255, 255, 255, 0.06);

    --border: #1a1a1a;
    --border-subtle: #111111;
    --border-light: rgba(255, 255, 255, 0.04);
    --border-strong: #2a2a2a;
    --divider: #111111;

    --bg: #000000;
    --bg-primary: #000000;
    --bg-secondary: #0a0a0a;
    --bg-tertiary: #111111;
    --bg-card: #050505;
    --surface: #050505;
    --bg-overlay: rgba(0, 0, 0, 0.95);

    --text-primary: #f5f5f5;
    --text-secondary: #d4d4d4;
    --text-tertiary: #a3a3a3;
    --text-muted: #737373;
    --text-inverse: #000000;
    --text: #f0f0f0;

    --primary: var(--emerald);
    --primary-dark: #052e16;
    --primary-light: #052e16;
    --primary-rgb: 34, 197, 94;
    --color-emerald: var(--emerald);
    --color-gold: var(--gold);
    --color-gold-dark: #a16207;
    --gold-border: rgba(234, 179, 8, 0.3);
    --gold-alpha: rgba(234, 179, 8, 0.12);
    --gold-strong: rgba(234, 179, 8, 0.24);
    --gold-light: rgba(234, 179, 8, 0.06);
    --gold-rgb: 234, 179, 8;
    --primary-on: #000000;
    --primary-on-muted: rgba(0, 0, 0, 0.7);
    --primary-on-alpha: rgba(0, 0, 0, 0.08);
    --hover-bg: rgba(34, 197, 94, 0.06);
    --active-bg: rgba(34, 197, 94, 0.12);
    --highlight-bg: rgba(234, 179, 8, 0.1);
    --focus-ring: 0 0 0 3px rgba(34, 197, 94, 0.3);
    --scrollbar-thumb: rgba(34, 197, 94, 0.2);
    --mushaf-frame-outer: rgba(234, 179, 8, 0.1);
    --mushaf-frame-inner: rgba(234, 179, 8, 0.05);

    --header-h: 64px;
    --sidebar-w: 290px;
}

/* OLED theme overrides for dark-like components */
[data-theme="oled"] .hpg-card { background: rgba(255, 255, 255, 0.02); }
[data-theme="oled"] .hpg-card:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(var(--primary-rgb), 0.4); }
[data-theme="oled"] .hpl-row { background: transparent; border-bottom-color: #111; }
[data-theme="oled"] .hpl-row:hover { background: rgba(34, 197, 94, 0.04); }
[data-theme="oled"] .hp2-toolbar { background: #000; border-bottom-color: #1a1a1a; }
[data-theme="oled"] .hp2-vod { background: linear-gradient(145deg, #000000 0%, #0a1a0a 55%, #0d2010 100%); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9); }
[data-theme="oled"] .hp2-suggest-box { background: rgba(255,255,255,0.02); }
[data-theme="oled"] .hp2-suggest-chip { background: rgba(255,255,255,0.03); }
[data-theme="oled"] .hp2-suggest-chip:hover { background: rgba(34,197,94,0.1); }
"""

# Insert OLED theme: find the end of night-blue theme's closing brace
# and the OCEAN theme section
night_blue_end = css_lf.rfind('[data-theme="night-blue"]')
# find the section after night-blue (which is another theme or global section)
after_nb = css_lf.find('\n\n/* ', night_blue_end)
if after_nb == -1:
    after_nb = css_lf.find('\n/* ===', night_blue_end)
    
print(f"night-blue end section at: {after_nb}")

# Find the closing brace of night-blue
nb_close = css_lf.find('\n}', night_blue_end)
nb_close_end = nb_close + 2  # include the newline + brace

print(f"night-blue closing brace at: {nb_close_end}")
print(f"Characters after: {repr(css_lf[nb_close_end:nb_close_end+80])}")

# Insert OLED theme after the closing brace of night-blue
css_lf = css_lf[:nb_close_end] + "\n" + OLED_THEME + css_lf[nb_close_end:]
print("✓ OLED theme added")

# Insert grain texture: find sepia theme closing brace
sepia_start2 = css_lf.find('[data-theme="sepia"]')
ocean_start2 = css_lf.find('[data-theme="ocean"]')
sep_close = css_lf.rfind('\n}', sepia_start2, ocean_start2)
sep_close_end = sep_close + 2
css_lf = css_lf[:sep_close_end] + "\n" + SEPIA_TEXTURE + css_lf[sep_close_end:]
print("✓ Sepia grain texture added")

# Write back
with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(css_lf)

print("✓ index.css saved")
