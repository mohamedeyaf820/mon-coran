import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCREEN_BUDGETS = [
  { file: "src/components/HomePage.jsx", maxKB: 40 },
  { file: "src/components/QuranDisplay.jsx", maxKB: 24 },
  { file: "src/components/AudioPlayer.jsx", maxKB: 42 },
  { file: "src/components/SettingsModal.jsx", maxKB: 44 },
  { file: "src/components/LibraryModal.jsx", maxKB: 24 },
  { file: "src/components/AyahActions.jsx", maxKB: 90 },
  // 46 after the A-B marking entry point and the provider-gap report (2026-09-22).
  { file: "src/services/audioService.js", maxKB: 46 },
  { file: "src/context/AppContext.jsx", maxKB: 34 },
  { file: "src/services/quranAPI.js", maxKB: 29 },
  { file: "src/services/quranComAPI.js", maxKB: 20 },
];

let hasError = false;

for (const item of SCREEN_BUDGETS) {
  const abs = resolve(process.cwd(), item.file);
  // Measure the text, not the checkout: a Windows working copy with
  // core.autocrlf adds a byte per line, which pushed two files past their cap
  // here while the LF bundle CI builds stayed under it.
  const sizeKB =
    Buffer.byteLength(readFileSync(abs, "utf8").replace(/\r\n/g, "\n")) / 1024;
  const ok = sizeKB <= item.maxKB;
  const status = ok ? "OK" : "EXCEEDED";
  console.log(
    `[screen-budget] ${item.file}: ${sizeKB.toFixed(1)} kB (limit ${item.maxKB} kB) -> ${status}`,
  );
  if (!ok) {
    hasError = true;
  }
}

if (hasError) {
  process.exitCode = 1;
}
