#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rewrites CSS files for MushafPlus redesign v3"""
import os

BASE = "e:/mon coran/src/styles"

# ──────────────────────────────────────────────────────────────
# 1.  SIDEBAR — append refined styles
# ──────────────────────────────────────────────────────────────
SIDEBAR_OVERRIDE = """
/* ══════════════════════════════════════════════════════
   Sidebar — Premium Design v3 overrides
   ══════════════════════════════════════════════════════ */

/* Better surah item */
.sidebar-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.62rem 0.85rem;
    gap: 0.65rem;
    border: none;
    background: transparent;
    color: var(--text);
    cursor: pointer;
    text-align: start;
    font-family: var(--font-ui);
    transition:
        background 0.15s,
        border-color 0.15s,
        transform 0.12s;
    border-inline-start: 3px solid transparent;
    outline: none;
    position: relative;
}

.sidebar-item::after {
    content: "";
    position: absolute;
    inset: 2px 6px;
    border-radius: 10px;
    background: transparent;
    transition: background 0.15s;
    z-index: -1;
}

.sidebar-item:hover::after {
    background: rgba(var(--primary-rgb), 0.05);
}

.sidebar-item.active::after {
    background: rgba(var(--primary-rgb), 0.08);
}

.sidebar-item:hover {
    border-inline-start-color: rgba(var(--primary-rgb), 0.25);
}

.sidebar-item.active {
    border-inline-start-color: var(--primary);
}

/* Rounder number badge */
.sidebar-item-num {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: var(--primary-light);
    color: var(--primary);
    font-weight: 700;
    font-size: 0.72rem;
    flex-shrink: 0;
    border: 1.5px solid rgba(var(--primary-rgb), 0.12);
    transition:
        background 0.15s,
        color 0.15s,
        transform 0.15s,
        box-shadow 0.15s;
    font-family: var(--font-ui);
}

.sidebar-item:hover .sidebar-item-num {
    background: rgba(var(--primary-rgb), 0.12);
    transform: scale(1.06);
}

.sidebar-item.active .sidebar-item-num {
    background: var(--primary);
    color: white;
    box-shadow: 0 3px 10px rgba(var(--primary-rgb), 0.28);
    border-color: transparent;
    transform: scale(1.08);
}

/* Surah name — bigger, nicer */
.sidebar-item-name {
    display: block;
    font-size: 1.08rem;
    font-family: var(--font-ui), "Amiri", serif;
    letter-spacing: 0.01em;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.15s;
}

.sidebar-item.active .sidebar-item-name {
    color: var(--primary);
    font-weight: 600;
}

.sidebar-item-sub {
    display: block;
    font-size: 0.68rem;
    color: var(--text-muted);
    margin-top: 0.08rem;
    font-family: var(--font-ui);
}

/* Type pill redesigned */
.sidebar-item-type {
    font-size: 0.58rem;
    font-weight: 700;
    padding: 0.1rem 0.4rem;
    border-radius: 9999px;
    flex-shrink: 0;
    font-family: var(--font-ui);
    letter-spacing: 0.03em;
    border: none;
    background: var(--bg-tertiary);
    color: var(--text-muted);
    transition: background 0.15s, color 0.15s;
}

.sidebar-item.active .sidebar-item-type {
    background: rgba(var(--primary-rgb), 0.1);
    color: var(--primary);
}

/* Better sidebar tabs */
.sidebar-tab {
    flex: 1;
    padding: 0.45rem 0.5rem;
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-ui);
    font-size: 0.76rem;
    cursor: pointer;
    border-radius: 12px;
    transition:
        background 0.15s,
        color 0.15s,
        border-color 0.15s,
        box-shadow 0.15s;
    font-weight: 700;
    white-space: nowrap;
    outline: none;
}

.sidebar-tab:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
    border-color: var(--primary);
}

.sidebar-tab.active {
    background: var(--primary);
    color: white;
    border-color: transparent;
    box-shadow: 0 3px 12px rgba(var(--primary-rgb), 0.28);
}

/* Better search input */
.sidebar-search-input {
    width: 100%;
    padding: 0.58rem 2.4rem;
    border: 1.5px solid var(--border);
    border-radius: 14px;
    background: var(--bg-card);
    color: var(--text);
    font-family: var(--font-ui);
    font-size: 0.84rem;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s,
        background 0.15s;
    -webkit-appearance: none;
}

.sidebar-search-input:hover {
    border-color: var(--border-strong);
}

.sidebar-search-input:focus {
    border-color: var(--primary);
    background: var(--bg-card);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.08);
}

/* Juz header row inside sidebar */
.sidebar-juz-header {
    padding: 0.5rem 0.9rem 0.2rem;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    font-family: var(--font-ui);
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 0.15rem;
}

/* Smooth scroll in sidebar */
.sidebar-list {
    scroll-behavior: smooth;
}
"""

# ──────────────────────────────────────────────────────────────
# 2.  QURAN DISPLAY addons
# ──────────────────────────────────────────────────────────────
QD_OVERRIDE = """
/* ══════════════════════════════════════════════════════
   QuranDisplay — Premium Design v3
   ══════════════════════════════════════════════════════ */

/* Better ayah block */
.ayah-block {
    position: relative;
    border-radius: var(--r-md);
    padding: 0.5rem 0.65rem 0.6rem;
    margin: 0 -0.65rem;
    transition:
        background 0.2s,
        box-shadow 0.2s;
    outline: none;
}

.ayah-block:hover {
    background: var(--ayah-hover);
}

.ayah-block.playing {
    background: var(--ayah-playing-bg);
    box-shadow: inset 3px 0 0 var(--gold);
}

[dir="rtl"] .ayah-block.playing {
    box-shadow: inset -3px 0 0 var(--gold);
}

.ayah-block:focus-visible {
    box-shadow: var(--focus-ring);
}

/* Surah name typography */
.surah-header-name {
    font-family: var(--font-quran), serif;
    font-size: clamp(1.25rem, 3.5vw, 2rem);
    color: rgba(255,255,255,0.97);
    line-height: 1.5;
    letter-spacing: 0.03em;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.surah-header-sub {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.65);
    font-family: var(--font-ui);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 0.3rem;
}

/* Bismillah */
.bismillah-text {
    font-family: var(--font-quran), serif;
    text-align: center;
    font-size: clamp(1.3rem, 3.5vw, 1.9rem);
    color: var(--bismillah-color);
    line-height: 2.2;
    padding: 0.25rem 0 0.75rem;
    display: block;
}

/* Quran text wrapper — slightly more generous spacing */
.quran-display {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    padding: 2rem 2.25rem 4rem;
    max-width: 880px;
    margin: 0 auto;
    width: 100%;
    scroll-behavior: auto;
    -webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
    .quran-display {
        padding: 1.25rem 1.1rem 3rem;
    }
}

/* Loading skeleton shimmer */
@keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
}

.loading-ayah {
    height: 1.5rem;
    border-radius: 6px;
    background: linear-gradient(
        90deg,
        var(--bg-secondary) 25%,
        var(--bg-tertiary) 50%,
        var(--bg-secondary) 75%
    );
    background-size: 800px 100%;
    animation: shimmer 1.6s ease-in-out infinite;
    margin-bottom: 0.6rem;
}

/* Page navigation footer */
.quran-nav-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.5rem 0 0.5rem;
}

.quran-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.25rem;
    border-radius: var(--r-pill);
    border: 1.5px solid var(--border);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 0.82rem;
    font-weight: 600;
    font-family: var(--font-ui);
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
    box-shadow: var(--shadow-xs);
}

.quran-nav-btn:hover {
    background: var(--primary-light);
    color: var(--primary);
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
}

/* Word translation tooltip */
.word-tooltip {
    background: var(--bg-card);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-md);
    padding: 0.55rem 0.8rem;
    box-shadow: var(--shadow-lg);
    font-family: var(--font-ui);
    font-size: 0.8rem;
    color: var(--text-primary);
    max-width: 200px;
    text-align: center;
    pointer-events: none;
    z-index: 500;
    line-height: 1.5;
}
"""

# ──────────────────────────────────────────────────────────────
# 3.  GLOBAL  premium-design.css — refined header & global tokens
# ──────────────────────────────────────────────────────────────
PREMIUM_ADDITION = """
/* ══════════════════════════════════════════════════════
   Premium Design v3 additions — global UI polish
   ══════════════════════════════════════════════════════ */

/* ── Better scrollbar everywhere ── */
:root {
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--primary-rgb, 27,94,59), 0.22) transparent;
}

::-webkit-scrollbar {
    width: 5px;
    height: 5px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: rgba(var(--primary-rgb, 27,94,59), 0.22);
    border-radius: 9999px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--primary-rgb, 27,94,59), 0.38);
}

/* ── Smoother selection ── */
::selection {
    background: rgba(var(--primary-rgb, 27,94,59), 0.22);
    color: var(--text-primary);
}

/* ── Button micro-interaction helper ── */
.btn-press {
    transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s;
}

.btn-press:active {
    transform: scale(0.95);
}

/* ── Modal overlays ── */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 400;
    animation: fadeIn 0.18s ease;
}

/* ── Modal container base ── */
.modal-container {
    background: var(--bg-card);
    border-radius: var(--r-xl);
    border: 1px solid var(--border-strong);
    box-shadow: var(--shadow-xl);
    overflow: hidden;
    animation: slideUp 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
}

/* ── Modal header ── */
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.25rem 0.9rem;
    border-bottom: 1px solid var(--border-light);
    background: var(--bg-secondary);
}

.modal-title {
    font-family: var(--font-ui);
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.55rem;
}

.modal-title i {
    color: var(--primary);
    font-size: 0.95rem;
}

.modal-close {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
    font-size: 0.78rem;
}

.modal-close:hover {
    background: rgba(185, 28, 28, 0.08);
    border-color: rgba(185, 28, 28, 0.25);
    color: #b91c1c;
    transform: scale(1.08);
}

/* ── Generic chip / pill ── */
.chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.32rem 0.9rem;
    border: 1.5px solid var(--border);
    border-radius: var(--r-pill);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 0.78rem;
    font-weight: 600;
    font-family: var(--font-ui);
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
    white-space: nowrap;
}

.chip:hover {
    background: var(--hover-bg);
    border-color: var(--primary);
    color: var(--primary);
}

.chip.active {
    background: var(--primary-light);
    border-color: var(--primary);
    color: var(--primary);
    box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
}

/* ── Toggle switch ── */
.toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
    cursor: pointer;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
}

.toggle-switch-track {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: var(--bg-tertiary);
    border: 1.5px solid var(--border);
    transition: background 0.2s, border-color 0.2s;
}

.toggle-switch input:checked + .toggle-switch-track {
    background: var(--primary);
    border-color: var(--primary);
}

.toggle-switch-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
}

.toggle-switch input:checked ~ .toggle-switch-thumb {
    transform: translateX(20px);
}

/* ── Tooltip ── */
[data-tooltip] {
    position: relative;
}

[data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%) scale(0.9);
    background: rgba(0,0,0,0.78);
    color: #fff;
    font-size: 0.68rem;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s, transform 0.15s;
    z-index: 9999;
    font-family: var(--font-ui);
}

[data-tooltip]:hover::after,
[data-tooltip]:focus::after {
    opacity: 1;
    transform: translateX(-50%) scale(1);
}

/* ── Focus ring improvement for dark themes ── */
[data-theme="dark"] :focus-visible {
    box-shadow: 0 0 0 2px rgba(42,158,94,0.4) !important;
}

/* ── Fade-in animation ── */
@keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* ── Heading ornament for section dividers ── */
.gold-divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1rem 0;
}

.gold-divider::before,
.gold-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-border), transparent);
}

.gold-divider-icon {
    color: var(--gold);
    font-size: 0.8rem;
}

/* ── Better looking empty states ── */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 3rem 1.5rem;
    color: var(--text-muted);
    text-align: center;
}

.empty-state-icon {
    font-size: 2.5rem;
    opacity: 0.4;
    margin-bottom: 0.25rem;
}

.empty-state-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-secondary);
    font-family: var(--font-ui);
}

.empty-state-sub {
    font-size: 0.78rem;
    font-family: var(--font-ui);
    max-width: 240px;
    line-height: 1.5;
}

/* ── Interactive list item ── */
.list-item-btn {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: start;
    transition: background 0.14s;
    outline: none;
    border-radius: var(--r-md);
}

.list-item-btn:hover {
    background: var(--hover-bg);
}

.list-item-btn:focus-visible {
    box-shadow: var(--focus-ring);
}

/* ── Header: active pill navigation ── */
.header-nav-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.38rem 0.95rem;
    border-radius: var(--r-pill);
    font-size: 0.76rem;
    font-weight: 700;
    font-family: var(--font-ui);
    color: rgba(255,255,255,0.55);
    background: transparent;
    border: 1px solid rgba(255,255,255,0.06);
    cursor: pointer;
    transition: all 0.15s;
    outline: none;
    white-space: nowrap;
}

.header-nav-pill:hover {
    background: rgba(255,255,255,0.09);
    color: rgba(255,255,255,0.85);
    border-color: rgba(255,255,255,0.13);
}

.header-nav-pill.active {
    background: rgba(255,255,255,0.15);
    color: #ffffff;
    border-color: rgba(255,255,255,0.2);
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
"""

# ── Write sidebar additions ──
sidebar_path = os.path.join(BASE, "sidebar.css")
with open(sidebar_path, "a", encoding="utf-8") as f:
    f.write(SIDEBAR_OVERRIDE)
print(f"sidebar.css — appended {len(SIDEBAR_OVERRIDE.splitlines())} lines")

# ── Write quran-display additions ──
qd_path = os.path.join(BASE, "quran-display.css")
with open(qd_path, "a", encoding="utf-8") as f:
    f.write(QD_OVERRIDE)
print(f"quran-display.css — appended {len(QD_OVERRIDE.splitlines())} lines")

# ── Write premium-design additions ──
pd_path = os.path.join(BASE, "premium-design.css")
with open(pd_path, "a", encoding="utf-8") as f:
    f.write(PREMIUM_ADDITION)
print(f"premium-design.css — appended {len(PREMIUM_ADDITION.splitlines())} lines")

print("All CSS files updated!")
