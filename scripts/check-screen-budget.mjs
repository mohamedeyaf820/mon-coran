import { statSync } from "node:fs";
import { resolve } from "node:path";

const SCREEN_BUDGETS = [
  { file: "src/components/HomePage.jsx", maxKB: 40 },
  { file: "src/components/QuranDisplay.jsx", maxKB: 24 },
  { file: "src/components/AudioPlayer.jsx", maxKB: 42 },
  { file: "src/components/SettingsModal.jsx", maxKB: 44 },
  { file: "src/components/FutureFeaturesModal.jsx", maxKB: 46 },
  { file: "src/components/AyahActions.jsx", maxKB: 90 },
  { file: "src/services/audioService.js", maxKB: 45 },
  { file: "src/context/AppContext.jsx", maxKB: 34 },
  { file: "src/services/quranAPI.js", maxKB: 29 },
  { file: "src/services/quranComAPI.js", maxKB: 20 },
];

let hasError = false;

for (const item of SCREEN_BUDGETS) {
  const abs = resolve(process.cwd(), item.file);
  const sizeKB = statSync(abs).size / 1024;
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
