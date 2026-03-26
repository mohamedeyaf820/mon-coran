import { statSync } from "node:fs";
import { resolve } from "node:path";

const SCREEN_BUDGETS = [
  { file: "src/components/HomePage.jsx", maxKB: 90 },
  { file: "src/components/QuranDisplay.jsx", maxKB: 95 },
  { file: "src/components/AudioPlayer.jsx", maxKB: 140 },
  { file: "src/components/SettingsModal.jsx", maxKB: 160 },
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
