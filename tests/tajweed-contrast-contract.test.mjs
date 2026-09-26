import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

/* The tajweed palette teaches a rule with a hue: every --tajwid-* ink must
   stay at least 3:1 (WCAG non-text floor) against its theme's reading paper
   (--brand-bg). The sepia theme regressed to 2.78-2.83:1 unnoticed because
   nothing measured it. This contract fails CI if any theme palette edit drops
   an ink below the floor. */

const FLOOR = 3.0;

function source(pathname) {
  return fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
}

function channelLuminance(hex) {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const [l1, l2] = [channelLuminance(a), channelLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (l1 + 0.05) / (l2 + 0.05);
}

function themeBlocks(css) {
  // Flat rule scan: theme blocks in themes4.css never nest braces.
  const merged = new Map();
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1];
    const body = match[2];
    if (!body.includes("--tajwid-")) continue;
    // One rule lists both selector forms for the same theme; count each name once.
    const names = new Set(
      [...selectors.matchAll(/\[data-theme="([^"]+)"\]/g)].map((m) => m[1]),
    );
    for (const name of names) {
      merged.set(name, `${merged.get(name) ?? ""}\n${body}`);
    }
  }
  return merged;
}

test("every tajweed ink keeps >= 3:1 against its theme paper", () => {
  const css = source("src/styles/domains/themes4.css");
  const blocks = themeBlocks(css);
  assert.ok(blocks.size >= 3, "expected light, sepia and dark tajweed blocks");

  for (const [theme, body] of blocks) {
    const paper = body.match(/--brand-bg:\s*(#[0-9a-fA-F]{6})/);
    assert.ok(paper, `theme "${theme}" defines tajweed inks but no --brand-bg`);
    const inks = [...body.matchAll(/--tajwid-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)];
    assert.equal(inks.length, 20, `theme "${theme}" must define 20 tajweed inks`);
    for (const [, rule, ink] of inks) {
      const ratio = contrastRatio(ink, paper[1]);
      assert.ok(
        ratio >= FLOOR,
        `--tajwid-${rule} ${ink} is ${ratio.toFixed(2)}:1 on ${theme} paper ${paper[1]} (floor ${FLOOR}:1)`,
      );
    }
  }
});
