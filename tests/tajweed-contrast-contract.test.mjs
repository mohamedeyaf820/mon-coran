import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

/* The tajweed palette is Quran.com's, not a MushafPlus design: every reading
   ink (--tajwid-palette-*) must equal the published upstream swatch
   (--quran-com-tajwid-*) in every theme, and those swatches must stay the
   values published at the pinned revision (src/data/tajwidPalette.js).
   Contrast against the paper is reported, not enforced: matching Quran.com
   exactly was chosen over the former 3:1 darkening. */

const UPSTREAM = {
  light: { silent: "#a5a5a5", "madd-normal": "#ce9e00", "madd-separated": "#ff7b00", "madd-connected": "#f40000", "madd-necessary": "#b50000", nasal: "#09b000", qalqala: "#2fadff", tafkhim: "#3f48e6" },
  dark: { silent: "#999999", "madd-normal": "#ffc1e0", "madd-separated": "#ff8e3b", "madd-connected": "#ff5e8e", "madd-necessary": "#e30000", nasal: "#26b55d", qalqala: "#00deff", tafkhim: "#3c84d5" },
  sepia: { silent: "#ababab", "madd-normal": "#c09725", "madd-separated": "#e67b00", "madd-connected": "#ff0000", "madd-necessary": "#b7001c", nasal: "#09b000", qalqala: "#00b4e0", tafkhim: "#134fe1" },
};

function source(pathname) {
  return fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
}

function themeBlocks(css) {
  // Flat rule scan: theme blocks in themes4.css never nest braces.
  const merged = new Map();
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = match[2];
    if (!body.includes("--tajwid-")) continue;
    const names = new Set(
      [...match[1].matchAll(/\[data-theme="([^"]+)"\]/g)].map((m) => m[1]),
    );
    for (const name of names) merged.set(name, `${merged.get(name) ?? ""}\n${body}`);
  }
  return merged;
}

function inks(body, prefix) {
  return Object.fromEntries(
    [...body.matchAll(new RegExp(`--${prefix}-([a-z-]+):\\s*(#[0-9a-fA-F]{6})`, "g"))]
      .map(([, group, ink]) => [group, ink.toLowerCase()]),
  );
}

test("tajweed inks are Quran.com's published swatches in every theme", () => {
  const blocks = themeBlocks(source("src/styles/domains/themes4.css"));
  for (const theme of Object.keys(UPSTREAM)) {
    const body = blocks.get(theme);
    assert.ok(body, `missing tajweed block for ${theme}`);
    assert.deepEqual(inks(body, "quran-com-tajwid"), UPSTREAM[theme], `${theme} reference swatches`);
    assert.deepEqual(inks(body, "tajwid-palette"), UPSTREAM[theme], `${theme} reading inks differ from Quran.com`);
  }
});
