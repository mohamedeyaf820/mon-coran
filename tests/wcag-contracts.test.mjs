import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(pathname) {
  return fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
}

function luminance(hex) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4,
    );
  return (
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  );
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("WCAG: action sheets expose dialog semantics and focus management", () => {
  const content = source("src/components/AyahActions.jsx");
  assert.equal((content.match(/role="dialog"/g) || []).length, 4);
  assert.equal((content.match(/aria-modal="true"/g) || []).length, 4);
  assert.match(content, /SHEET_FOCUSABLE_SELECTOR/);
  assert.match(content, /sheetRestoreFocusRef/);
  assert.match(content, /role="tabpanel"/);
  assert.match(content, /aria-label=\{closeSheetLabel\}/);
});

test("WCAG: forms, tabs and audio status keep programmatic names", () => {
  const header = source("src/components/Header.jsx");
  const settings = source("src/components/SettingsModal.jsx");
  const sidebar = source("src/components/Sidebar.jsx");
  const audio = source("src/components/AudioPlayer.jsx");

  assert.match(header, /htmlFor="header-goto-input"/);
  assert.match(header, /id="header-goto-input"/);
  assert.match(settings, /htmlFor="settings-font-family"/);
  assert.match(settings, /htmlFor="settings-reciter-search"/);
  assert.match(settings, /aria-pressed=\{value === option\.id\}/);
  assert.match(sidebar, /aria-controls=\{`sidebar-panel-\$\{tabId\}`\}/);
  assert.match(sidebar, /role="tabpanel"/);
  assert.match(audio, /role="status"/);
  assert.match(audio, /<AlertCircle[^>]+aria-hidden="true"/);
});

test("WCAG: splash respects language, reduced motion and target size", () => {
  const content = source("src/components/SplashScreen.jsx");
  assert.match(content, /className="splash-subtitle" lang="ar" dir="rtl"/);
  assert.match(content, /className="splash-verse" lang="ar" dir="rtl"/);
  assert.match(content, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(content, /\.splash-skip \{[\s\S]*?min-height: 44px/);
});

test("WCAG: reinforced reading colors meet AA contrast on light surfaces", () => {
  const lightBackground = "#f7f9f8";
  for (const color of [
    "#596579",
    "#047857",
    "#0369a1",
    "#4338ca",
    "#8a2566",
    "#92400e",
    "#9d174d",
    "#991b1b",
  ]) {
    assert.ok(
      contrast(color, lightBackground) >= 4.5,
      `${color} must reach 4.5:1 on ${lightBackground}`,
    );
  }
  assert.ok(contrast("#8f5a13", "#f3e8cf") >= 3);
});
